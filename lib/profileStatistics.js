import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import {
  getAverageFat,
  getAverageSNF,
  getHighestMilkDay,
  getMilkTrend,
  getMonthlySummary
} from "@/lib/aiAssistantTools";
import { getSettlementAccountingLiters } from "@/lib/accountingUtils";
import { getIndiaTodayISODate } from "@/lib/aiAssistantDate";

const MORNING = "सकाळ";
const EVENING = "संध्याकाळ";

function numberOrZero(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function round(value, decimals = 2) {
  return Number(numberOrZero(value).toFixed(decimals));
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function monthStart(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function monthEnd(year, month) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function monthPartsFromDate(dateString) {
  const [year, month] = String(dateString).split("-").map(Number);
  return { year, month };
}

function addMonths(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function rangeForMonth(year, month) {
  return {
    startDate: monthStart(year, month),
    endDate: monthEnd(year, month)
  };
}

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("mr-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}

async function safeQuery(query) {
  const { data, error, count } = await query;
  if (error) {
    if (["42P01", "42703"].includes(error.code)) return { data: [], count: 0 };
    throw error;
  }
  return { data: data || [], count: count || 0 };
}

async function countRows(supabase, table, farmId, filters = {}) {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("farm_id", farmId);
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const result = await safeQuery(query);
  return result.count || 0;
}

async function countDairySlipsInRange(supabase, farmId, startDate, endDate) {
  let query = supabase
    .from("dairy_slips")
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farmId);

  if (startDate) query = query.gte("slip_date", startDate);
  if (endDate) query = query.lte("slip_date", endDate);

  const result = await safeQuery(query);
  return result.count || 0;
}

async function fetchDairySlips(supabase, farmId, startDate, endDate) {
  let query = supabase
    .from("dairy_slips")
    .select("id, slip_date, session, liters, fat_percentage, snf_percentage, rate_per_liter, total_amount")
    .eq("farm_id", farmId);

  if (startDate) query = query.gte("slip_date", startDate);
  if (endDate) query = query.lte("slip_date", endDate);

  const result = await safeQuery(query.order("slip_date", { ascending: true }));
  return result.data;
}

async function fetchMilkRecords(supabase, farmId, startDate, endDate) {
  let query = supabase
    .from("milk_records")
    .select("id, date, cow_id, morning_litres, evening_litres, total_litres, price_per_litre, morning_price_per_litre, evening_price_per_litre, total_amount, fat_percentage, morning_fat_percentage, evening_fat_percentage, snf_value, morning_snf_value, evening_snf_value")
    .eq("farm_id", farmId)
    .is("cow_id", null);

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const result = await safeQuery(query.order("date", { ascending: true }));
  return result.data;
}

function calculateMilkRecordSessionIncome(record, morningLiters, eveningLiters) {
  const selectedMilk = numberOrZero(morningLiters) + numberOrZero(eveningLiters);
  if (selectedMilk <= 0) return 0;

  const recordMorning = numberOrZero(record.morning_litres);
  const recordEvening = numberOrZero(record.evening_litres);
  const recordMilk = numberOrZero(record.total_litres) || recordMorning + recordEvening;
  const totalAmount = numberOrZero(record.total_amount);

  if (recordMilk > 0 && selectedMilk >= recordMilk && totalAmount > 0) {
    return totalAmount;
  }

  const morningRate = numberOrZero(record.morning_price_per_litre ?? record.price_per_litre);
  const eveningRate = numberOrZero(record.evening_price_per_litre ?? record.price_per_litre);
  const sessionAmount = numberOrZero(morningLiters) * morningRate + numberOrZero(eveningLiters) * eveningRate;

  if (sessionAmount > 0) {
    return sessionAmount;
  }

  if (recordMilk > 0 && totalAmount > 0) {
    return (totalAmount * selectedMilk) / recordMilk;
  }

  return totalAmount;
}

async function fetchSettlements(supabase, farmId, startDate, endDate) {
  let query = supabase
    .from("dairy_settlements")
    .select("id, period_start, period_end, total_liters, total_milk_income, morning_total_liters, evening_total_liters, session_totals, ai_raw_data")
    .eq("farm_id", farmId);

  if (startDate) query = query.gte("period_end", startDate);
  if (endDate) query = query.lte("period_end", endDate);

  const result = await safeQuery(query.order("period_end", { ascending: true }));
  return result.data;
}

function settlementCoversDate(settlements, date) {
  return settlements.some((settlement) =>
    settlement.period_start &&
    settlement.period_end &&
    date >= settlement.period_start &&
    date <= settlement.period_end
  );
}

function addQuality(bucket, liters, fat, snf) {
  const weight = numberOrZero(liters);
  if (weight <= 0) return;
  const fatValue = Number(fat);
  const snfValue = Number(snf);
  if (Number.isFinite(fatValue) && fatValue > 0) {
    bucket.fatTotal += fatValue * weight;
    bucket.fatWeight += weight;
  }
  if (Number.isFinite(snfValue) && snfValue > 0) {
    bucket.snfTotal += snfValue * weight;
    bucket.snfWeight += weight;
  }
}

function ensureDay(map, date) {
  if (!map.has(date)) {
    map.set(date, {
      date,
      milk: 0,
      income: 0,
      morningMilk: 0,
      eveningMilk: 0,
      fatTotal: 0,
      fatWeight: 0,
      snfTotal: 0,
      snfWeight: 0
    });
  }
  return map.get(date);
}

async function buildDailyPerformance(supabase, farmId, startDate, endDate) {
  const [slips, milkRecords] = await Promise.all([
    fetchDairySlips(supabase, farmId, startDate, endDate),
    fetchMilkRecords(supabase, farmId, startDate, endDate)
  ]);
  const byDate = new Map();
  const slipSessions = new Set();

  slips.forEach((slip) => {
    const day = ensureDay(byDate, slip.slip_date);
    const liters = numberOrZero(slip.liters);
    const income = numberOrZero(slip.total_amount) || liters * numberOrZero(slip.rate_per_liter);
    day.milk += liters;
    day.income += income;
    if (slip.session === MORNING) day.morningMilk += liters;
    if (slip.session === EVENING) day.eveningMilk += liters;
    addQuality(day, liters, slip.fat_percentage, slip.snf_percentage);
    slipSessions.add(`${slip.slip_date}|${slip.session}`);
  });

  milkRecords.forEach((record) => {
    const day = ensureDay(byDate, record.date);
    const hasMorningSlip = slipSessions.has(`${record.date}|${MORNING}`);
    const hasEveningSlip = slipSessions.has(`${record.date}|${EVENING}`);
    const morning = hasMorningSlip ? 0 : numberOrZero(record.morning_litres);
    const evening = hasEveningSlip ? 0 : numberOrZero(record.evening_litres);
    const milk = morning + evening;
    const fullRecordMilk = numberOrZero(record.total_litres);
    const income = calculateMilkRecordSessionIncome(record, morning, evening);

    if (milk > 0) {
      day.milk += milk;
      day.income += income;
      day.morningMilk += morning;
      day.eveningMilk += evening;
      addQuality(day, morning, record.morning_fat_percentage ?? record.fat_percentage, record.morning_snf_value ?? record.snf_value);
      addQuality(day, evening, record.evening_fat_percentage ?? record.fat_percentage, record.evening_snf_value ?? record.snf_value);
    } else if (!hasMorningSlip && !hasEveningSlip && day.milk <= 0 && fullRecordMilk > 0) {
      day.milk += fullRecordMilk;
      day.income += income;
      addQuality(day, fullRecordMilk, record.fat_percentage, record.snf_value);
    }
  });

  return Array.from(byDate.values())
    .filter((day) => day.milk > 0 || day.income > 0)
    .map((day) => ({
      ...day,
      milk: round(day.milk),
      income: round(day.income),
      morningMilk: round(day.morningMilk),
      eveningMilk: round(day.eveningMilk),
      averageFat: day.fatWeight > 0 ? round(day.fatTotal / day.fatWeight, 2) : null,
      averageSNF: day.snfWeight > 0 ? round(day.snfTotal / day.snfWeight, 2) : null
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

async function buildOverview(supabase, farmId, userId) {
  const [settlements, slips, milkRecords, slipsCount, aiCount, cowsCount, calvesCount] = await Promise.all([
    fetchSettlements(supabase, farmId),
    fetchDairySlips(supabase, farmId),
    fetchMilkRecords(supabase, farmId),
    countRows(supabase, "slip_uploads", farmId),
    countRows(supabase, "ai_assistant_logs", farmId, { user_id: userId }),
    countRows(supabase, "cows", farmId),
    countRows(supabase, "calves", farmId)
  ]);

  const settlementMilk = settlements.reduce((sum, row) => sum + getSettlementAccountingLiters(row), 0);
  const settlementIncome = settlements.reduce((sum, row) => sum + numberOrZero(row.total_milk_income), 0);
  const uncoveredSlips = slips.filter((slip) => !settlementCoversDate(settlements, slip.slip_date));
  const slipMilk = uncoveredSlips.reduce((sum, row) => sum + numberOrZero(row.liters), 0);
  const slipIncome = uncoveredSlips.reduce(
    (sum, row) => sum + (numberOrZero(row.total_amount) || numberOrZero(row.liters) * numberOrZero(row.rate_per_liter)),
    0
  );
  const fallbackMilk = milkRecords.reduce((sum, row) => sum + numberOrZero(row.total_litres), 0);
  const fallbackIncome = milkRecords.reduce((sum, row) => sum + numberOrZero(row.total_amount), 0);
  const qualitySlips = slips.filter((slip) => numberOrZero(slip.liters) > 0);
  const qualityWeight = qualitySlips.reduce((sum, slip) => sum + numberOrZero(slip.liters), 0);
  const fatTotal = qualitySlips.reduce((sum, slip) => sum + numberOrZero(slip.fat_percentage) * numberOrZero(slip.liters), 0);
  const snfTotal = qualitySlips.reduce((sum, slip) => sum + numberOrZero(slip.snf_percentage) * numberOrZero(slip.liters), 0);

  return {
    totalMilk: round(settlementMilk + slipMilk || fallbackMilk),
    totalIncome: round(settlementIncome + slipIncome || fallbackIncome),
    averageFat: qualityWeight > 0 ? round(fatTotal / qualityWeight, 2) : 0,
    averageSNF: qualityWeight > 0 ? round(snfTotal / qualityWeight, 2) : 0,
    totalSlips: slipsCount,
    aiQuestions: aiCount,
    animalsCount: cowsCount + calvesCount,
    cowsCount,
    calvesCount
  };
}

function growthPercent(current, previous) {
  const currentValue = numberOrZero(current);
  const previousValue = numberOrZero(previous);
  if (previousValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return round(((currentValue - previousValue) / previousValue) * 100, 1);
}

function trendDirection(value) {
  if (value > 0) return "increase";
  if (value < 0) return "decrease";
  return "same";
}

async function monthSummary(supabase, farmId, range) {
  const summary = await getMonthlySummary({
    supabase,
    farmId,
    args: range
  });
  const [fat, snf] = await Promise.all([
    getAverageFat({ supabase, farmId, args: range }),
    getAverageSNF({ supabase, farmId, args: range })
  ]);

  return {
    ...range,
    totalMilk: numberOrZero(summary.totalMilk),
    totalIncome: numberOrZero(summary.totalIncome),
    revenue: numberOrZero(summary.revenue),
    netProfit: numberOrZero(summary.netProfit),
    averageFat: numberOrZero(fat.averageFat),
    averageSNF: numberOrZero(snf.averageSNF),
    dataDays: numberOrZero(summary.dataDays)
  };
}

async function buildGrowth(supabase, farmId, currentRange, previousRange) {
  const [current, previous] = await Promise.all([
    monthSummary(supabase, farmId, currentRange),
    monthSummary(supabase, farmId, previousRange)
  ]);

  const metrics = [
    ["milk", "दूध", current.totalMilk, previous.totalMilk, "लिटर"],
    ["income", "उत्पन्न", current.totalIncome, previous.totalIncome, "₹"],
    ["fat", "फॅट", current.averageFat, previous.averageFat, "%"],
    ["snf", "SNF", current.averageSNF, previous.averageSNF, ""]
  ].map(([id, label, currentValue, previousValue, unit]) => {
    const percent = growthPercent(currentValue, previousValue);
    return {
      id,
      label,
      currentValue: round(currentValue),
      previousValue: round(previousValue),
      changePercent: percent,
      direction: trendDirection(percent),
      unit
    };
  });

  return { current, previous, metrics };
}

async function buildTrends(supabase, farmId, currentRange, currentYear, currentMonth) {
  const [dailyMilk, currentDaily] = await Promise.all([
    getMilkTrend({ supabase, farmId, args: currentRange }),
    buildDailyPerformance(supabase, farmId, currentRange.startDate, currentRange.endDate)
  ]);

  const monthlyRanges = Array.from({ length: 6 }, (_, index) => addMonths(currentYear, currentMonth, index - 5));
  const monthly = [];

  for (const item of monthlyRanges) {
    const range = rangeForMonth(item.year, item.month);
    const summary = await monthSummary(supabase, farmId, range);
    monthly.push({
      label: monthLabel(item.year, item.month),
      month: `${item.year}-${String(item.month).padStart(2, "0")}`,
      totalMilk: round(summary.totalMilk),
      income: round(summary.totalIncome),
      averageFat: round(summary.averageFat),
      averageSNF: round(summary.averageSNF)
    });
  }

  return {
    dailyMilk: (dailyMilk.points || []).map((point) => ({
      date: point.date,
      day: Number(point.date.slice(-2)),
      totalMilk: point.totalMilk,
      morningMilk: point.morningMilk,
      eveningMilk: point.eveningMilk
    })),
    monthlyMilk: monthly.map((item) => ({ label: item.label, value: item.totalMilk })),
    income: monthly.map((item) => ({ label: item.label, value: item.income })),
    fat: currentDaily.map((day) => ({ date: day.date, day: Number(day.date.slice(-2)), value: day.averageFat || 0 })),
    snf: currentDaily.map((day) => ({ date: day.date, day: Number(day.date.slice(-2)), value: day.averageSNF || 0 }))
  };
}

function bestBy(rows, key) {
  const valid = rows.filter((row) => Number(row[key]) > 0);
  if (!valid.length) return null;
  return valid.reduce((best, row) => (Number(row[key]) > Number(best[key]) ? row : best), valid[0]);
}

async function buildBestPerformance(supabase, farmId, currentRange) {
  const [highestMilk, daily] = await Promise.all([
    getHighestMilkDay({ supabase, farmId, args: currentRange }),
    buildDailyPerformance(supabase, farmId, currentRange.startDate, currentRange.endDate)
  ]);
  const income = bestBy(daily, "income");
  const fat = bestBy(daily, "averageFat");
  const snf = bestBy(daily, "averageSNF");

  return {
    highestMilkDay: highestMilk.noData ? null : {
      date: highestMilk.date,
      value: highestMilk.totalMilk,
      unit: "लिटर"
    },
    highestIncomeDay: income ? { date: income.date, value: income.income, unit: "₹" } : null,
    bestFatDay: fat ? { date: fat.date, value: fat.averageFat, unit: "%" } : null,
    bestSNFDay: snf ? { date: snf.date, value: snf.averageSNF, unit: "" } : null
  };
}

function standardDeviation(values) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length <= 1) return 0;
  const average = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.reduce((sum, value) => sum + (value - average) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

function consistencyScore(values) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) return 0;
  const average = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  if (average <= 0) return 0;
  const cv = standardDeviation(valid) / average;
  return Math.max(0, Math.min(100, round(100 - cv * 120, 1)));
}

function buildHealthScore(daily, currentRange, slipsCount) {
  const totalDays = Math.max(1, Math.round((new Date(`${currentRange.endDate}T00:00:00Z`) - new Date(`${currentRange.startDate}T00:00:00Z`)) / 86400000) + 1);
  const recordCompletion = Math.min(100, round((daily.length / totalDays) * 100, 1));
  const milkConsistency = consistencyScore(daily.map((day) => day.milk));
  const fatConsistency = consistencyScore(daily.map((day) => day.averageFat));
  const qualityRows = daily.filter((day) => day.averageFat > 0 && day.averageSNF > 0).length;
  const qualityScore = daily.length ? round((qualityRows / daily.length) * 100, 1) : 0;
  const slipQuality = daily.length ? Math.min(100, round((slipsCount / Math.max(1, daily.length * 2)) * 100, 1)) : 0;
  const dataQuality = round((qualityScore * 0.7) + (slipQuality * 0.3), 1);
  const score = round(
    milkConsistency * 0.3 +
      fatConsistency * 0.2 +
      recordCompletion * 0.25 +
      dataQuality * 0.25,
    0
  );

  return {
    score,
    milkConsistency,
    fatConsistency,
    recordCompletion,
    dataQuality,
    label: score >= 85 ? "उत्कृष्ट" : score >= 70 ? "चांगले" : score >= 50 ? "सुधारणा हवी" : "डेटा अपूर्ण"
  };
}

function buildAiSummary(growth) {
  const milk = growth.metrics.find((item) => item.id === "milk");
  if (!milk) return "या महिन्याची माहिती उपलब्ध नाही.";
  if (milk.direction === "increase") {
    return `या महिन्यात तुमचे दूध उत्पादन मागील महिन्यापेक्षा ${milk.changePercent}% वाढले आहे.`;
  }
  if (milk.direction === "decrease") {
    return `या महिन्यात दूध उत्पादन मागील महिन्यापेक्षा ${Math.abs(milk.changePercent)}% कमी आहे. नोंदी आणि चारा व्यवस्थापन तपासा.`;
  }
  return "या महिन्यात दूध उत्पादन मागील महिन्याइतकेच स्थिर आहे.";
}

function buildMilestones(totalMilk) {
  const milestones = [1000, 5000, 10000, 50000, 100000];
  return milestones.map((target) => ({
    target,
    completed: numberOrZero(totalMilk) >= target,
    percentage: target > 0 ? Math.min(100, round((numberOrZero(totalMilk) / target) * 100, 1)) : 0,
    remaining: Math.max(0, round(target - numberOrZero(totalMilk)))
  }));
}

function fontPath() {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"),
    "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"
  ];
  const selected = candidates.find((candidate) => fs.existsSync(candidate));

  if (!selected) {
    throw new Error("PDF साठी Marathi font सापडला नाही.");
  }

  return selected;
}

export async function buildProfileStatistics(supabase, farmId, userId) {
  const today = getIndiaTodayISODate();
  const currentParts = monthPartsFromDate(today);
  const previousParts = addMonths(currentParts.year, currentParts.month, -1);
  const currentRange = rangeForMonth(currentParts.year, currentParts.month);
  const previousRange = rangeForMonth(previousParts.year, previousParts.month);
  const [overview, growth, daily] = await Promise.all([
    buildOverview(supabase, farmId, userId),
    buildGrowth(supabase, farmId, currentRange, previousRange),
    buildDailyPerformance(supabase, farmId, currentRange.startDate, today)
  ]);
  const [trends, bestPerformance, currentMonthSlipCount] = await Promise.all([
    buildTrends(supabase, farmId, currentRange, currentParts.year, currentParts.month),
    buildBestPerformance(supabase, farmId, currentRange),
    countDairySlipsInRange(supabase, farmId, currentRange.startDate, today)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    today,
    currentRange,
    previousRange,
    overview,
    growth,
    trends,
    bestPerformance,
    farmHealthScore: buildHealthScore(daily, { ...currentRange, endDate: today }, currentMonthSlipCount),
    aiSummary: buildAiSummary(growth),
    milestones: buildMilestones(overview.totalMilk)
  };
}

export function buildStatisticsPdf(stats, user, farm) {
  return new Promise((resolve, reject) => {
    const devanagariFont = fontPath();
    const document = new PDFDocument({
      size: "A4",
      margin: 42,
      autoFirstPage: false,
      font: devanagariFont
    });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.registerFont("NotoDevanagari", devanagariFont);
    document.addPage();
    document.font("NotoDevanagari");

    document.fontSize(20).text("माझी डेअरी - वैयक्तिक आकडेवारी", { align: "center" });
    document.moveDown(0.8);
    document.fontSize(11).text(`शेतकरी: ${user?.name || "-"}`);
    document.text(`डेअरी: ${farm?.farmName || farm?.farm_name || "-"}`);
    document.text(`कालावधी: ${stats.currentRange.startDate} ते ${stats.currentRange.endDate}`);
    document.moveDown();

    document.fontSize(15).text("सारांश", { underline: true });
    const overviewRows = [
      ["एकूण दूध", `${stats.overview.totalMilk} लिटर`],
      ["एकूण उत्पन्न", `₹ ${stats.overview.totalIncome}`],
      ["सरासरी फॅट", `${stats.overview.averageFat}%`],
      ["सरासरी SNF", `${stats.overview.averageSNF}`],
      ["एकूण स्लिप", stats.overview.totalSlips],
      ["AI प्रश्न", stats.overview.aiQuestions],
      ["जनावरे", stats.overview.animalsCount]
    ];
    overviewRows.forEach(([label, value]) => document.fontSize(10).text(`${label}: ${value}`));

    document.moveDown();
    document.fontSize(15).text("AI Summary", { underline: true });
    document.fontSize(11).text(stats.aiSummary);
    document.moveDown();

    document.fontSize(15).text("Farm Health Score", { underline: true });
    document.fontSize(12).text(`${stats.farmHealthScore.score}/100 - ${stats.farmHealthScore.label}`);
    document.moveDown();

    document.fontSize(15).text("Best Performance", { underline: true });
    Object.entries(stats.bestPerformance).forEach(([key, item]) => {
      if (item) document.fontSize(10).text(`${key}: ${item.date} - ${item.value} ${item.unit}`);
    });

    document.end();
  });
}
