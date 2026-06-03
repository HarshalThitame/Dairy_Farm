import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { checkGoalAchievementsForFarm } from "@/lib/goalTracking";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  analyzeSettlementSessionCoverage,
  refreshSummaryForDate,
  summarizeDairySlips,
  summarizeMilkSessionsForMonth
} from "@/lib/accountingUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { getMonthInput, getMonthRange } from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const slipFields = [
  "slip_date",
  "slip_time",
  "session",
  "milk_type",
  "dairy_name",
  "dairy_member_number",
  "dairy_member_code",
  "liters",
  "fat_percentage",
  "snf_percentage",
  "clr_degree",
  "clr_score",
  "rate_per_liter",
  "notes",
  "slip_image_url"
];

async function readJsonBody(request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

function cleanOptional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(
    String(value)
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeMilkType(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "buffalo" || text.includes("म्हैस")) {
    return "buffalo";
  }

  return "cow";
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return text;
  const [, hour, minute, second = "00"] = match;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
}

function pickSlipFields(body) {
  return slipFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function validateSlip(body) {
  const liters = optionalNumber(body.liters);
  const rate = optionalNumber(body.rate_per_liter);

  if (!body.slip_date) {
    return "तारीख आवश्यक आहे.";
  }

  if (![DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING].includes(body.session)) {
    return "सत्र निवडा.";
  }

  if (body.milk_type && !["cow", "buffalo"].includes(normalizeMilkType(body.milk_type))) {
    return "दुधाचा प्रकार गाय किंवा म्हैस असावा.";
  }

  if (liters === null || liters <= 0) {
    return "दूधाचे लिटर शून्यापेक्षा जास्त असावे.";
  }

  if (rate === null || rate <= 0) {
    return "दर शून्यापेक्षा जास्त असावा.";
  }

  const clr = optionalNumber(body.clr_score ?? body.clr_degree);
  if (clr !== null && (clr < 0 || clr > 100)) {
    return "CLR स्कोर 0 ते 100 मध्ये असावा.";
  }

  return "";
}

async function getFarmDairyInfo(supabase, farmId) {
  const { data } = await supabase
    .from("farms")
    .select("dairy_name, dairy_member_number")
    .eq("id", farmId)
    .maybeSingle();

  return data || {};
}

function duplicateSlipResponse() {
  return NextResponse.json(
    { error: "या तारीख आणि सत्राची दूध नोंद आधीच आहे. कृपया संपादित करा." },
    { status: 409 }
  );
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const range = getMonthRange(monthInput.month, monthInput.year);
    const supabase = getSupabaseServerClient();
    const [slipsResult, settlementsResult] = await Promise.all([
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", range.start)
        .lt("slip_date", range.end)
        .order("slip_date", { ascending: false })
        .order("session", { ascending: true }),
      supabase
        .from("dairy_settlements")
        .select("id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, ai_raw_data")
        .eq("farm_id", farmId)
        .gte("period_end", range.start)
        .lt("period_end", range.end)
    ]);

    if (slipsResult.error) {
      throw slipsResult.error;
    }

    if (settlementsResult.error) {
      throw settlementsResult.error;
    }

    const summary = summarizeDairySlips(slipsResult.data || []);
    const accountingSummary = summarizeMilkSessionsForMonth(slipsResult.data || [], settlementsResult.data || []);
    const settlementSessionAudits = (settlementsResult.data || [])
      .map(analyzeSettlementSessionCoverage)
      .filter((audit) => audit.missingMorning.length || audit.missingEvening.length || audit.hasPrintedSessionTotals);

    return NextResponse.json({
      data: {
        slips: slipsResult.data || [],
        settlements: settlementsResult.data || [],
        dailyTotals: summary.dailyTotals,
        monthlyTotal: accountingSummary.monthlyTotal,
        rowMonthlyTotal: summary.monthlyTotal,
        settlementSessionAudits
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "माहिती योग्य format मध्ये पाठवा." }, { status: 400 });
    }

    const validationError = validateSlip(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { farmId, userId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const farmInfo = await getFarmDairyInfo(supabase, farmId);
    const payload = {
      ...pickSlipFields(body),
      farm_id: farmId,
      slip_time: normalizeTime(body.slip_time),
      milk_type: normalizeMilkType(body.milk_type),
      dairy_name: cleanOptional(body.dairy_name) || farmInfo.dairy_name || null,
      dairy_member_number: cleanOptional(body.dairy_member_number || body.dairy_member_code) || farmInfo.dairy_member_number || null,
      dairy_member_code: cleanOptional(body.dairy_member_code || body.dairy_member_number) || farmInfo.dairy_member_number || null,
      liters: optionalNumber(body.liters),
      fat_percentage: optionalNumber(body.fat_percentage),
      snf_percentage: optionalNumber(body.snf_percentage),
      clr_degree: optionalNumber(body.clr_score ?? body.clr_degree),
      clr_score: optionalNumber(body.clr_score ?? body.clr_degree),
      rate_per_liter: optionalNumber(body.rate_per_liter),
      notes: cleanOptional(body.notes),
      slip_image_url: cleanOptional(body.slip_image_url)
    };

    const { data, error } = await supabase
      .from("dairy_slips")
      .insert(payload)
      .select()
      .single();

    if (error?.code === "23505") {
      return duplicateSlipResponse();
    }

    if (error) {
      throw error;
    }

    await recomputeMilkRecordFromDairySlips(supabase, farmId, data.slip_date);
    const summary = await refreshSummaryForDate(supabase, farmId, data.slip_date);
    await checkGoalAchievementsForFarm(supabase, farmId, userId);

    return NextResponse.json({ data: { success: true, slip: data, summary } }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
