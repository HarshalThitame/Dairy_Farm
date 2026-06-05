import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MARATHI_MONTHS = [
  "जानेवारी",
  "फेब्रुवारी",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "ऑक्टोबर",
  "नोव्हेंबर",
  "डिसेंबर"
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function isoDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addMonths(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function getMonthLength(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function compareISO(first, second) {
  return String(first || "").localeCompare(String(second || ""));
}

function getPeriodLabel(period) {
  const monthName = MARATHI_MONTHS[period.month - 1] || "";
  return `${period.startDay}-${period.endDay} ${monthName}`;
}

function buildYearPeriods(year) {
  const periods = [];

  for (let month = 1; month <= 12; month += 1) {
    const lastDay = getMonthLength(year, month);
    const nextMonth = addMonths(year, month, 1);

    periods.push({
      key: `${year}-${pad(month)}-first`,
      year,
      month,
      half: "first",
      startDay: 1,
      endDay: 15,
      start: isoDate(year, month, 1),
      end: isoDate(year, month, 15),
      dueDate: isoDate(year, month, 16)
    });

    periods.push({
      key: `${year}-${pad(month)}-second`,
      year,
      month,
      half: "second",
      startDay: 16,
      endDay: lastDay,
      start: isoDate(year, month, 16),
      end: isoDate(year, month, lastDay),
      dueDate: isoDate(nextMonth.year, nextMonth.month, 1)
    });
  }

  return periods;
}

function settlementCoversPeriod(settlement, period) {
  if (!settlement?.period_start || !settlement?.period_end) {
    return false;
  }

  const start = String(settlement.period_start).slice(0, 10);
  const end = String(settlement.period_end).slice(0, 10);
  const previousDay = new Date(`${period.start}T00:00:00Z`);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const previousDayISO = previousDay.toISOString().slice(0, 10);

  if (start === period.start && end === period.end) {
    return true;
  }

  if (compareISO(start, period.start) <= 0 && compareISO(end, period.end) >= 0) {
    return true;
  }

  return end === period.end && (start === period.start || start === previousDayISO);
}

function getSettlementSource(settlement) {
  if (settlement?.ai_extracted || settlement?.settlement_image_url) {
    return "स्कॅन";
  }

  return "हाताने";
}

function buildPeriodStatus(period, settlement, { today, farmStartDate }) {
  const base = {
    key: period.key,
    half: period.half,
    period_label: getPeriodLabel(period),
    start_date: period.start,
    end_date: period.end,
    due_date: period.dueDate,
    start_day: period.startDay,
    end_day: period.endDay
  };

  if (farmStartDate && compareISO(period.end, farmStartDate) < 0) {
    return {
      ...base,
      status: "not_applicable",
      status_label: "लागू नाही",
      message: "या काळात फार्म सुरू नव्हता.",
      settlement: null
    };
  }

  if (settlement) {
    return {
      ...base,
      status: "uploaded",
      status_label: "अपलोड झाली",
      message: "ही १५ दिवसांची payment slip जतन झाली आहे.",
      source: getSettlementSource(settlement),
      settlement: {
        id: settlement.id,
        settlement_date: settlement.settlement_date,
        period_start: settlement.period_start,
        period_end: settlement.period_end,
        total_liters: Number(settlement.total_liters || 0),
        total_milk_income: Number(settlement.total_milk_income || 0),
        cattle_feed_deduction: Number(settlement.cattle_feed_deduction || 0),
        other_deductions: Number(settlement.other_deductions || 0),
        settlement_image_url: settlement.settlement_image_url || null,
        ai_extracted: Boolean(settlement.ai_extracted)
      }
    };
  }

  if (compareISO(period.dueDate, today) > 0) {
    return {
      ...base,
      status: "not_due",
      status_label: "अजून वेळ आहे",
      message: "ही payment slip अजून due झालेली नाही.",
      settlement: null
    };
  }

  return {
    ...base,
    status: "missing",
    status_label: "अपलोड केलेली नाही",
    message: "ही १५ दिवसांची payment slip अजून upload/save केलेली नाही.",
    upload_href: "/accounting/slip-scan",
    settlement: null
  };
}

function groupByMonth(statusRows, year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const periods = statusRows.filter((row) => row.month === month);
    const first = periods.find((row) => row.half === "first") || null;
    const second = periods.find((row) => row.half === "second") || null;

    return {
      month,
      month_key: `${year}-${pad(month)}`,
      month_label: `${MARATHI_MONTHS[index]} ${year}`,
      first,
      second,
      uploaded_count: periods.filter((row) => row.status === "uploaded").length,
      missing_count: periods.filter((row) => row.status === "missing").length
    };
  });
}

function summarize(statusRows) {
  return {
    totalPeriods: statusRows.length,
    uploaded: statusRows.filter((row) => row.status === "uploaded").length,
    missing: statusRows.filter((row) => row.status === "missing").length,
    notDue: statusRows.filter((row) => row.status === "not_due").length,
    notApplicable: statusRows.filter((row) => row.status === "not_applicable").length
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const today = getTodayISODate();
    const currentYear = Number(today.slice(0, 4));
    const requestedYear = Number(searchParams.get("year") || currentYear);
    const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentYear + 1
      ? requestedYear
      : currentYear;
    const supabase = getSupabaseServerClient();

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("created_at")
      .eq("id", farmId)
      .maybeSingle();

    if (farmError) {
      throw farmError;
    }

    const periods = buildYearPeriods(year);
    const firstDate = periods[0].start;
    const lastDate = periods[periods.length - 1].end;

    const { data: settlements, error: settlementsError } = await supabase
      .from("dairy_settlements")
      .select("id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, settlement_image_url, ai_extracted, created_at")
      .eq("farm_id", farmId)
      .gte("period_end", firstDate)
      .lte("period_start", lastDate)
      .order("period_start", { ascending: true })
      .order("created_at", { ascending: false });

    if (settlementsError) {
      throw settlementsError;
    }

    const farmStartDate = farm?.created_at ? String(farm.created_at).slice(0, 10) : null;
    const statusRows = periods.map((period) => {
      const settlement = (settlements || []).find((item) => settlementCoversPeriod(item, period));
      return {
        ...buildPeriodStatus(period, settlement, { today, farmStartDate }),
        year: period.year,
        month: period.month
      };
    });

    return NextResponse.json({
      data: {
        year,
        today,
        summary: summarize(statusRows),
        months: groupByMonth(statusRows, year),
        periods: statusRows,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
