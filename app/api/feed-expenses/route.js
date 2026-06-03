import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getFeedExpenseAccountingPeriod } from "@/lib/accountingPeriods";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import {
  displayFeedSectionName,
  FEED_SECTION_CATTLE_FEED
} from "@/lib/feedExpenseSections";
import { getMonthInput, getMonthRange } from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const allowedSections = new Set(["मुरघास", FEED_SECTION_CATTLE_FEED, "भुसा", "इतर"]);

function isFeedExpenseSchemaError(error) {
  const message = String(error?.message || "");

  return (
    error?.code === "23514" && message.includes("feed_expenses_section_check")
  ) || (error?.code === "PGRST204" && (message.includes("murghas_") || message.includes("accounting_period")));
}

function isFinanceCategorySchemaError(error) {
  return error?.code === "23514" && String(error?.message || "").includes("finance_records_category_check");
}

function getSupabaseProjectRef() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname.split(".")[0];
  } catch {
    return "";
  }
}

function feedExpenseSchemaError() {
  const projectRef = getSupabaseProjectRef();
  const projectHint = projectRef ? ` Project: ${projectRef}.` : "";
  const error = new Error(
    `चारा खर्चासाठी live डेटाबेस अजून update झालेला नाही.${projectHint} Supabase SQL Editor मध्ये supabase/fix_feed_expense_accounting_periods.sql पूर्ण file run करा.`
  );
  error.status = 409;
  return error;
}

function financeCategorySchemaError() {
  const projectRef = getSupabaseProjectRef();
  const projectHint = projectRef ? ` Project: ${projectRef}.` : "";
  const error = new Error(
    `हिशोब category constraint जुना आहे.${projectHint} Supabase SQL Editor मध्ये supabase/fix_finance_records_category_check.sql पूर्ण file run करा.`
  );
  error.status = 409;
  return error;
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toOptionalInteger(value) {
  const numberValue = toOptionalNumber(value);

  if (numberValue === null) {
    return null;
  }

  return Math.max(0, Math.round(numberValue));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function firstValue(body, keys) {
  for (const key of keys) {
    if (body[key] !== "" && body[key] !== null && body[key] !== undefined) {
      return body[key];
    }
  }

  return null;
}

function getCattleFeedBags(body) {
  if (body.bags_count !== "" && body.bags_count !== null && body.bags_count !== undefined) {
    return toOptionalInteger(body.bags_count);
  }

  return toOptionalInteger(body.quantity);
}

function getMurghasDetails(body) {
  const newBagsCount = toOptionalInteger(firstValue(body, ["murghas_new_bags_count", "new_bags_count"]));
  const newBagRate = toOptionalNumber(firstValue(body, ["murghas_new_bag_rate", "new_bag_rate"]));
  const innerCount = toOptionalInteger(firstValue(body, ["murghas_inner_count", "plastic_inner_count"]));
  const innerRate = toOptionalNumber(firstValue(body, ["murghas_inner_rate", "plastic_inner_rate"]));
  const filledBagsCount = toOptionalInteger(
    firstValue(body, ["murghas_filled_bags_count", "filled_bags_count", "bags_count"])
  );
  const fillingLaborRate = toOptionalNumber(
    firstValue(body, ["murghas_filling_labor_rate", "filling_labor_rate"])
  );
  const newBagCost = toNumber(newBagsCount) * toNumber(newBagRate);
  const innerMaterialCost = toNumber(innerCount) * toNumber(innerRate);
  const fillingLaborCost = toNumber(filledBagsCount) * toNumber(fillingLaborRate);

  return {
    newBagsCount,
    newBagRate,
    innerCount,
    innerRate,
    filledBagsCount,
    fillingLaborRate,
    newBagCost,
    innerMaterialCost,
    fillingLaborCost,
    totalCost: newBagCost + innerMaterialCost + fillingLaborCost + toNumber(body.other_cost)
  };
}

function calculateTotal(body) {
  const quantityTotal = toNumber(body.quantity) * toNumber(body.rate);
  const cattleFeedBagTotal = toNumber(getCattleFeedBags(body)) * toNumber(body.rate);
  const itemAmount = toNumber(body.amount);
  const extraCosts =
    toNumber(body.inner_material_cost) +
    toNumber(body.labor_cost) +
    toNumber(body.transport_cost) +
    toNumber(body.other_cost);
  const murghasLegacyCosts =
    toNumber(body.inner_material_cost) + toNumber(body.labor_cost) + toNumber(body.other_cost);

  if (body.section === "मुरघास") {
    const murghasTotal = getMurghasDetails(body).totalCost;
    return murghasTotal || murghasLegacyCosts || itemAmount;
  }

  if (body.section === "भुसा") {
    return (toNumber(body.quantity) || 1) * toNumber(body.rate) + toNumber(body.other_cost);
  }

  if (body.section === FEED_SECTION_CATTLE_FEED) {
    return cattleFeedBagTotal;
  }

  if (body.section === "इतर") {
    return itemAmount;
  }

  if (quantityTotal > 0) {
    return quantityTotal + extraCosts;
  }

  return itemAmount + extraCosts;
}

function buildDescription(payload) {
  const parts = [displayFeedSectionName(payload.section), payload.item_name];

  if (payload.section === "मुरघास") {
    if (payload.murghas_new_bags_count) {
      parts.push(`${payload.murghas_new_bags_count} नवीन बॅग`);
    }

    if (payload.murghas_inner_count) {
      parts.push(`${payload.murghas_inner_count} इनर`);
    }

    if (payload.murghas_filled_bags_count || payload.bags_count) {
      parts.push(`${payload.murghas_filled_bags_count || payload.bags_count} भरलेल्या बॅग`);
    }
  } else {
    if (payload.quantity) {
      parts.push(`${payload.quantity} ${payload.unit || ""}`.trim());
    }

    if (payload.bags_count) {
      parts.push(`${payload.bags_count} बॅग`);
    }
  }

  if (payload.supplier_name) {
    parts.push(`पुरवठादार: ${payload.supplier_name}`);
  }

  if (payload.notes) {
    parts.push(payload.notes);
  }

  return parts.filter(Boolean).join(" | ");
}

function getFinanceCategory(section) {
  if (section === FEED_SECTION_CATTLE_FEED) {
    return "खाद्य";
  }

  if (section === "इतर") {
    return "इतर";
  }

  return "चारा";
}

function getYearRange(year) {
  return {
    start: `${year}-01-01`,
    end: `${Number(year) + 1}-01-01`
  };
}

function normalizeRecord(record) {
  return {
    ...record,
    accounting_period: record.accounting_period || getFeedExpenseAccountingPeriod(record.section)
  };
}

function summarize(records) {
  const bySection = new Map();
  let monthlyTotal = 0;
  let annualTotal = 0;
  let monthlyCount = 0;
  let annualCount = 0;

  records.forEach((record) => {
    const amount = Number(record.total_cost || 0);
    const period = record.accounting_period || getFeedExpenseAccountingPeriod(record.section);

    if (period === "annual") {
      annualTotal += amount;
      annualCount += 1;
    } else {
      monthlyTotal += amount;
      monthlyCount += 1;
    }

    bySection.set(record.section, (bySection.get(record.section) || 0) + amount);
  });

  return {
    total: Number(monthlyTotal.toFixed(2)),
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
    annualTotal: Number(annualTotal.toFixed(2)),
    allTotal: Number((monthlyTotal + annualTotal).toFixed(2)),
    count: records.length,
    monthlyCount,
    annualCount,
    bySection: Array.from(bySection.entries()).map(([section, amount]) => ({
      section,
      amount: Number(amount.toFixed(2))
    }))
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);
    const section = searchParams.get("section");

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const monthRange = getMonthRange(monthInput.month, monthInput.year);
    const yearRange = getYearRange(monthInput.year);
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("feed_expenses")
      .select("*")
      .eq("farm_id", farmId)
      .or(
        `and(accounting_period.eq.monthly,date.gte.${monthRange.start},date.lt.${monthRange.end}),and(accounting_period.eq.annual,date.gte.${yearRange.start},date.lt.${yearRange.end})`
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (section && allowedSections.has(section)) {
      query = query.eq("section", section);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const records = (data || []).map(normalizeRecord);

    return NextResponse.json({
      data: records,
      summary: summarize(records),
      month: monthInput.month,
      year: monthInput.year
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  let financeRecord = null;

  try {
    const body = await readJsonBody(request);
    const { farmId } = await verifyFarmAccess(request);
    const section = normalizeText(body.section);
    const murghasDetails = section === "मुरघास" ? getMurghasDetails(body) : null;
    const totalCost = Number(calculateTotal({ ...body, section }).toFixed(2));
    const accountingPeriod = getFeedExpenseAccountingPeriod(section);

    if (!body.date || !allowedSections.has(section)) {
      return NextResponse.json({ error: "तारीख आणि विभाग आवश्यक आहे." }, { status: 400 });
    }

    if (totalCost <= 0) {
      return NextResponse.json({ error: "खर्चाची रक्कम भरा." }, { status: 400 });
    }

    const payload = {
      farm_id: farmId,
      date: body.date,
      section,
      item_name: normalizeText(body.item_name) || section,
      quantity:
        section === FEED_SECTION_CATTLE_FEED || section === "मुरघास" || section === "इतर"
          ? null
          : toOptionalNumber(body.quantity),
      unit:
        section === FEED_SECTION_CATTLE_FEED
          ? "बॅग"
          : section === "मुरघास"
            ? "बॅग"
            : section === "इतर"
              ? null
              : normalizeText(body.unit) || null,
      rate: section === "मुरघास" || section === "इतर" ? null : toOptionalNumber(body.rate),
      bags_count:
        section === FEED_SECTION_CATTLE_FEED
          ? getCattleFeedBags(body)
          : section === "मुरघास"
            ? murghasDetails.filledBagsCount
            : section === "इतर"
              ? null
              : toOptionalInteger(body.bags_count),
      inner_material_cost:
        section === FEED_SECTION_CATTLE_FEED || section === "इतर" ? 0 : section === "मुरघास" ? murghasDetails.innerMaterialCost : toNumber(body.inner_material_cost),
      labor_cost:
        section === FEED_SECTION_CATTLE_FEED || section === "इतर" ? 0 : section === "मुरघास" ? murghasDetails.fillingLaborCost : toNumber(body.labor_cost),
      transport_cost: section === FEED_SECTION_CATTLE_FEED || section === "मुरघास" || section === "इतर" ? 0 : toNumber(body.transport_cost),
      other_cost: section === FEED_SECTION_CATTLE_FEED || section === "इतर" ? 0 : toNumber(body.other_cost),
      total_cost: totalCost,
      accounting_period: accountingPeriod,
      supplier_name: section === "इतर" ? null : normalizeText(body.supplier_name) || null,
      notes: section === "इतर" ? null : normalizeText(body.notes) || null
    };

    if (section === "मुरघास") {
      Object.assign(payload, {
        murghas_new_bags_count: murghasDetails.newBagsCount,
        murghas_new_bag_rate: murghasDetails.newBagRate,
        murghas_inner_count: murghasDetails.innerCount,
        murghas_inner_rate: murghasDetails.innerRate,
        murghas_filled_bags_count: murghasDetails.filledBagsCount,
        murghas_filling_labor_rate: murghasDetails.fillingLaborRate
      });
    }
    const supabase = getSupabaseServerClient();

    const financeResult = await supabase
      .from("finance_records")
      .insert({
        farm_id: farmId,
        date: payload.date,
        type: "खर्च",
        category: getFinanceCategory(section),
        amount: totalCost,
        accounting_period: accountingPeriod,
        description: buildDescription(payload)
      })
      .select()
      .single();

    if (financeResult.error) {
      if (isFinanceCategorySchemaError(financeResult.error)) {
        throw financeCategorySchemaError();
      }
      throw financeResult.error;
    }

    financeRecord = financeResult.data;

    const { data, error } = await supabase
      .from("feed_expenses")
      .insert({
        ...payload,
        finance_record_id: financeRecord.id
      })
      .select()
      .single();

    if (error) {
      await supabase.from("finance_records").delete().eq("id", financeRecord.id).eq("farm_id", farmId);
      if (isFeedExpenseSchemaError(error)) {
        throw feedExpenseSchemaError();
      }
      throw error;
    }

    if (accountingPeriod === "monthly") {
      await refreshSummaryForDate(supabase, farmId, payload.date);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (isFinanceCategorySchemaError(error)) {
      return farmErrorResponse(financeCategorySchemaError());
    }
    if (isFeedExpenseSchemaError(error)) {
      return farmErrorResponse(feedExpenseSchemaError());
    }
    return farmErrorResponse(error);
  }
}
