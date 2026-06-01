import OpenAI from "openai";
import { getCurrentDateContext } from "@/lib/aiAssistantDate";

export const AI_ASSISTANT_MODEL = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini";

const dateRangeParameters = {
  type: "object",
  properties: {
    startDate: {
      type: "string",
      description: "Start date in YYYY-MM-DD format"
    },
    endDate: {
      type: "string",
      description: "End date in YYYY-MM-DD format"
    }
  },
  required: ["startDate", "endDate"],
  additionalProperties: false
};

export const aiAssistantTools = [
  {
    type: "function",
    name: "getTodayMilkCollection",
    description: "Get today's morning, evening, and total milk collection for the farm.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "getHighestMilkDay",
    description: "Get the date with the highest total milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getLowestMilkDay",
    description: "Get the date with the lowest non-zero total milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getAverageMilk",
    description: "Get average daily milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getTotalMilk",
    description: "Get total milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getRevenue",
    description: "Get milk revenue in a date range from dairy settlements and dairy slips.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getAverageFat",
    description: "Get weighted average fat percentage in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getAverageSNF",
    description: "Get weighted average SNF percentage in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getMorningMilk",
    description: "Get total morning milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  },
  {
    type: "function",
    name: "getEveningMilk",
    description: "Get total evening milk collection in a date range.",
    parameters: dateRangeParameters,
    strict: true
  }
];

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY सेट केलेली नाही.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function buildAssistantInstructions() {
  const dates = getCurrentDateContext();

  return `You are "माझी डेअरी AI सहाय्यक", a Marathi dairy farm analytics assistant.

Current India date: ${dates.today}.
Current month range: ${dates.currentMonthStart} to ${dates.currentMonthEnd}.
Yesterday: ${dates.yesterday}.

Hard rules:
1. Answer in pure Marathi only.
2. Never invent numbers. Never guess.
3. For dairy analytics, milk, income, fat, SNF, morning milk, evening milk, highest/lowest day, or date-range questions, call one of the provided tools.
4. Never write SQL. Never ask for direct database access. Tools are the only data source.
5. If tool output says noData, say "या कालावधीसाठी माहिती उपलब्ध नाही." and do not create a number.
6. Use Marathi numerals and farmer-friendly wording.
7. Format milk as "१२३.४५ लिटर", money as "₹ १,२३,४५६", and dates as Marathi date text.
8. If the user asks a follow-up like "त्या दिवशी", use the previous conversation context to choose the same date or range and call the correct tool.

Date interpretation:
- "आज" = ${dates.today}
- "काल" = ${dates.yesterday}
- "या महिन्यात", "ह्या महिन्यात", "चालू महिन्यात", "current month" = ${dates.currentMonthStart} to ${dates.currentMonthEnd}
- "गेल्या ७ दिवसात" = last 7 calendar days ending ${dates.today}
- "गेल्या ३० दिवसात" = last 30 calendar days ending ${dates.today}
- Convert Marathi numerals to normal ISO date arguments before tool calls.

Keep answers short, clear, and useful for a rural Marathi dairy farmer.`;
}

export function normalizeChatHistory(messages = []) {
  return (messages || [])
    .filter((message) => ["user", "assistant"].includes(message?.role) && String(message?.content || "").trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 1000)
    }));
}
