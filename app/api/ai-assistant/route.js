import { NextResponse } from "next/server";
import {
  getOrCreateAiAssistantPreferences,
  getToolPermissionError,
  normalizeAiAssistantPreferences
} from "@/lib/aiAssistantSettings";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  AI_ASSISTANT_MODEL,
  aiAssistantTools,
  buildAssistantInstructions,
  getOpenAIClient,
  normalizeChatHistory
} from "@/lib/aiAssistantOpenAI";
import { aiAssistantToolHandlers } from "@/lib/aiAssistantTools";
import { toMarathiNumerals } from "@/lib/marathiUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeJsonParse(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getFunctionCalls(response) {
  return (response?.output || []).filter((item) => item?.type === "function_call");
}

async function executeToolCall({ call, supabase, farmId, preferences }) {
  const handler = aiAssistantToolHandlers[call.name];

  if (!handler) {
    return {
      name: call.name,
      error: "हे tool उपलब्ध नाही."
    };
  }

  const args = safeJsonParse(call.arguments, {});
  const permissionError = getToolPermissionError(call.name, preferences);
  if (permissionError) {
    return {
      name: call.name,
      arguments: args,
      executionMs: 0,
      data: permissionError
    };
  }

  const startedAt = Date.now();
  const data = await handler({ supabase, farmId, args });

  return {
    name: call.name,
    arguments: args,
    executionMs: Date.now() - startedAt,
    data
  };
}

function buildInputMessages(history, message) {
  return [
    ...normalizeChatHistory(history),
    {
      role: "user",
      content: String(message || "").trim()
    }
  ];
}

function looksLikeAnalyticsQuestion(message) {
  return /दूध|लिटर|फॅट|fat|snf|एसएनएफ|उत्पन्न|income|revenue|दर|rate|सकाळ|संध्याकाळ|सरासरी|average|सर्वाधिक|कमी|महिना|आठवडा|दिवस|नफा|खर्च|expense|profit|trend|ट्रेंड|सारांश|स्थिती|नोंद|अहवाल/i.test(
    String(message || "")
  );
}

async function writeAssistantLog(supabase, payload) {
  try {
    const { data } = await supabase
      .from("ai_assistant_logs")
      .insert(payload)
      .select("id")
      .maybeSingle();
    return data?.id || null;
  } catch {
    // Logging must never break the user-facing assistant.
    return null;
  }
}

export async function POST(request) {
  const startedAt = Date.now();
  let logPayload = null;

  try {
    const { farmId, userId } = await verifyFarmAccess(request);
    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "प्रश्न लिहा." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const preferencesRow = await getOrCreateAiAssistantPreferences(supabase, userId, farmId);
    const preferences = normalizeAiAssistantPreferences(preferencesRow);

    if (!preferences.enabled) {
      return NextResponse.json(
        { error: "दुग्धमित्र AI सध्या बंद आहे. Settings > AI मधून सुरू करा." },
        { status: 403 }
      );
    }

    const client = getOpenAIClient();
    const instructions = buildAssistantInstructions({ responseStyle: preferences.response_style });
    let input = buildInputMessages(body.messages || [], message);
    let response = await client.responses.create({
      model: AI_ASSISTANT_MODEL,
      instructions,
      input,
      tools: aiAssistantTools,
      tool_choice: "auto",
      temperature: 0.2,
      max_output_tokens: 800
    });
    const toolResults = [];

    for (let step = 0; step < 3; step += 1) {
      const functionCalls = getFunctionCalls(response);

      if (!functionCalls.length) {
        break;
      }

      const outputs = [];

      for (const call of functionCalls) {
        const result = await executeToolCall({ call, supabase, farmId, preferences });
        toolResults.push(result);
        outputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result.data ?? { error: result.error || "Tool failed" })
        });
      }

      input = [...input, ...(response.output || []), ...outputs];
      response = await client.responses.create({
        model: AI_ASSISTANT_MODEL,
        instructions,
        input,
        tools: aiAssistantTools,
        tool_choice: "auto",
        temperature: 0.2,
        max_output_tokens: 800
      });
    }

    let answer = String(response.output_text || "").trim() || "सध्या सहाय्यक उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.";

    if (!toolResults.length && looksLikeAnalyticsQuestion(message)) {
      answer = "या प्रश्नासाठी डेटाबेसमधून माहिती तपासणे आवश्यक आहे, पण योग्य tool call झाला नाही. कृपया प्रश्न पुन्हा थोडक्यात विचारा.";
    }

    answer = toMarathiNumerals(answer);
    const executionMs = Date.now() - startedAt;
    logPayload = {
      farm_id: farmId,
      user_id: userId,
      question: message,
      tools_used: toolResults.map((result) => ({
        name: result.name,
        arguments: result.arguments || {},
        executionMs: result.executionMs || 0
      })),
      execution_ms: executionMs,
      response: answer,
      error: null
    };
    const logId = await writeAssistantLog(supabase, logPayload);

    return NextResponse.json({
      data: {
        answer,
        logId,
        toolsUsed: logPayload.tools_used,
        executionMs
      }
    });
  } catch (error) {
    try {
      const supabase = getSupabaseServerClient();
      await writeAssistantLog(supabase, {
        ...(logPayload || {}),
        question: logPayload?.question || "",
        tools_used: logPayload?.tools_used || [],
        execution_ms: Date.now() - startedAt,
        response: null,
        error: error.message || "AI error"
      });
    } catch {
      // Ignore secondary logging failures.
    }

    if (String(error.message || "").includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "सध्या सहाय्यक उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा." },
        { status: 503 }
      );
    }

    if (String(error.message || "").includes("database") || error.code) {
      return NextResponse.json(
        { error: "डेटाबेसमधून माहिती मिळू शकली नाही." },
        { status: 500 }
      );
    }

    return farmErrorResponse(error);
  }
}
