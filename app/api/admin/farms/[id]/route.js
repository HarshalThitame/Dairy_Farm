import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  logAdminAction,
  superAdminErrorResponse,
  verifySuperAdmin
} from "@/lib/superAdminGuard";
import { createAdminNotification, sendNotificationNow } from "@/lib/notificationCenter";
import { badRequest, isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_TIME_ZONE = "Asia/Kolkata";

const editableFarmFields = [
  "farm_name",
  "owner_name",
  "owner_mobile",
  "owner_email",
  "village_name",
  "taluka_name",
  "district_name",
  "state_name",
  "farm_address",
  "dairy_name",
  "dairy_member_number",
  "vet_name",
  "vet_mobile",
  "subscription_status",
  "trial_ends_at",
  "subscription_started_at",
  "subscription_ends_at",
  "total_cows",
  "milk_rate_default",
  "morning_session_time",
  "evening_session_time",
  "show_marathi_numbers",
  "low_milk_alert_litres",
  "admin_notes"
];
const allowedSubscriptionStatuses = new Set(["trial", "active", "expired", "cancelled"]);

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeFarmUpdatePayload(payload) {
  const next = { ...payload };

  if (next.subscription_status !== undefined && !allowedSubscriptionStatuses.has(String(next.subscription_status))) {
    const error = new Error("Invalid subscription status.");
    error.status = 400;
    throw error;
  }

  for (const field of ["total_cows", "milk_rate_default", "low_milk_alert_litres"]) {
    if (next[field] !== undefined && next[field] !== null && next[field] !== "") {
      const numberValue = Number(next[field]);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        const error = new Error(`${field} must be a valid positive number.`);
        error.status = 400;
        throw error;
      }
      next[field] = numberValue;
    }
  }

  for (const field of ["trial_ends_at", "subscription_started_at", "subscription_ends_at"]) {
    if (next[field] !== undefined) {
      next[field] = normalizeDateTime(next[field], field, field !== "subscription_started_at");
    }
  }

  return next;
}

function normalizeDateTime(value, field, endOfDay = false) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`)
    : new Date(text);

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${field} must be a valid date.`);
    error.status = 400;
    throw error;
  }

  return date.toISOString();
}

function normalizeBoolean(value, fallback = true) {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return fallback;
}

function buildSubscriptionPayload(body = {}) {
  const status = String(body.subscription_status || body.subscriptionStatus || "").trim();

  if (!allowedSubscriptionStatuses.has(status)) {
    const error = new Error("Invalid subscription status.");
    error.status = 400;
    throw error;
  }

  const payload = {
    is_active: normalizeBoolean(body.is_active ?? body.isActive, true),
    subscription_status: status,
    trial_ends_at: normalizeDateTime(body.trial_ends_at ?? body.trialEndsAt, "trial_ends_at", true),
    subscription_started_at: normalizeDateTime(body.subscription_started_at ?? body.subscriptionStartedAt, "subscription_started_at", false),
    subscription_ends_at: normalizeDateTime(body.subscription_ends_at ?? body.subscriptionEndsAt, "subscription_ends_at", true),
    updated_at: new Date().toISOString()
  };

  if (payload.subscription_started_at && payload.subscription_ends_at) {
    const start = new Date(payload.subscription_started_at).getTime();
    const end = new Date(payload.subscription_ends_at).getTime();
    if (end < start) {
      const error = new Error("Subscription end date must be after start date.");
      error.status = 400;
      throw error;
    }
  }

  if (payload.subscription_status === "trial" && !payload.trial_ends_at) {
    const error = new Error("Trial end date is required for trial status.");
    error.status = 400;
    throw error;
  }

  if (payload.subscription_status === "active" && !payload.subscription_ends_at) {
    const error = new Error("Subscription end date is required for active status.");
    error.status = 400;
    throw error;
  }

  if (!payload.is_active) {
    payload.suspended_reason = String(body.suspended_reason || body.reason || "Subscription controlled by admin").trim();
    payload.suspended_at = new Date().toISOString();
  } else {
    payload.suspended_reason = null;
    payload.suspended_at = null;
  }

  return payload;
}

async function safeArray(query, label = "Query", warnings = []) {
  const { data, error } = await query;
  if (error) {
    console.warn("Admin farm analytics query skipped:", error.message);
    warnings.push({
      section: label,
      message: error.message
    });
    return [];
  }
  return data || [];
}

async function safeMaybe(query, label = "Query", warnings = []) {
  const { data, error } = await query;
  if (error) {
    console.warn("Admin farm analytics maybe query skipped:", error.message);
    warnings.push({
      section: label,
      message: error.message
    });
    return null;
  }
  return data || null;
}

async function safeCount(query, label = "Count", warnings = []) {
  const { count, error } = await query;
  if (error) {
    console.warn("Admin farm analytics count skipped:", error.message);
    warnings.push({
      section: label,
      message: error.message
    });
    return 0;
  }
  return count || 0;
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

function isExpenseRecord(row) {
  return ["खर्च", "expense", "expenses", "debit"].includes(normalizeType(row?.type));
}

function isIncomeRecord(row) {
  return ["उत्पन्न", "income", "revenue", "credit"].includes(normalizeType(row?.type));
}

function isDairyDeductionExpense(row) {
  const category = normalizeType(row?.category);
  return [
    "देयक खाद्य कपात",
    "खाद्य कपात",
    "dairy feed deduction",
    "feed deduction"
  ].includes(category);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(toNumber(value) * factor) / factor;
}

function getDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function dateKey(date = new Date()) {
  const parts = getDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date = new Date()) {
  const parts = getDateParts(date);
  return new Date(`${parts.year}-${parts.month}-01T00:00:00.000+05:30`);
}

function endOfMonth(date = new Date()) {
  const parts = getDateParts(date);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return new Date(new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000+05:30`).getTime() - 1);
}

function monthKey(date = new Date()) {
  return dateKey(date).slice(0, 7);
}

function daysBetween(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((to.getTime() - start) / (24 * 60 * 60 * 1000)));
}

function daysUntilDate(value) {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (24 * 60 * 60 * 1000));
}

function sumBy(rows, getter) {
  return rows.reduce((total, row) => total + toNumber(getter(row)), 0);
}

function average(values) {
  const clean = values.map(toNumber).filter((value) => value > 0);
  return clean.length ? round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : 0;
}

function inRange(rowDate, start, end) {
  const value = String(rowDate || "");
  return value >= start && value <= end;
}

function buildDailyMilkChart(milkRows, days = 30) {
  const today = new Date();
  const buckets = new Map();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = dateKey(addDays(today, -offset));
    buckets.set(key, {
      label: key.slice(5),
      date: key,
      milk: 0,
      income: 0,
      fat: 0,
      snf: 0,
      qualityCount: 0
    });
  }

  for (const row of milkRows) {
    const key = String(row.date || "");
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key);
    bucket.milk += toNumber(row.total_litres);
    bucket.income += toNumber(row.total_amount);
    const fat = toNumber(row.fat_percentage || row.morning_fat_percentage || row.evening_fat_percentage);
    const snf = toNumber(row.snf_value || row.morning_snf_value || row.evening_snf_value);
    if (fat > 0 || snf > 0) {
      bucket.fat += fat;
      bucket.snf += snf;
      bucket.qualityCount += 1;
    }
  }

  return Array.from(buckets.values()).map((item) => ({
    ...item,
    milk: round(item.milk),
    income: round(item.income),
    fat: item.qualityCount ? round(item.fat / item.qualityCount) : 0,
    snf: item.qualityCount ? round(item.snf / item.qualityCount) : 0
  }));
}

function buildMonthlyTrend(milkRows, financeRows, settlementRows) {
  const buckets = new Map();
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - index, 1);
    const key = monthKey(date);
    buckets.set(key, {
      label: key,
      milkRecordLiters: 0,
      milkRecordIncome: 0,
      settlementLiters: 0,
      settlementIncome: 0,
      manualIncome: 0,
      expenses: 0,
      profit: 0
    });
  }

  for (const row of milkRows) {
    const key = String(row.date || "").slice(0, 7);
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key);
    bucket.milkRecordLiters += toNumber(row.total_litres);
    bucket.milkRecordIncome += toNumber(row.total_amount);
  }

  for (const row of settlementRows) {
    const key = String(row.period_end || row.settlement_date || "").slice(0, 7);
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key);
    bucket.settlementLiters += toNumber(row.total_liters);
    bucket.settlementIncome += toNumber(row.total_milk_income);
    bucket.expenses += toNumber(row.cattle_feed_deduction) + toNumber(row.other_deductions);
  }

  for (const row of financeRows) {
    const key = String(row.date || "").slice(0, 7);
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key);
    if (isExpenseRecord(row) && !isDairyDeductionExpense(row)) bucket.expenses += toNumber(row.amount);
    if (isIncomeRecord(row)) bucket.manualIncome += toNumber(row.amount);
  }

  return Array.from(buckets.values()).map((item) => {
    const milk = item.settlementLiters > 0 ? item.settlementLiters : item.milkRecordLiters;
    const milkIncome = item.settlementIncome > 0 ? item.settlementIncome : item.milkRecordIncome;
    const income = milkIncome + item.manualIncome;

    return {
      label: item.label,
      milk: round(milk),
      income: round(income),
      expenses: round(item.expenses),
      profit: round(income - item.expenses)
    };
  });
}

function latestDate(...values) {
  return values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() || null;
}

function scoreFromDays(days, excellent, good, averageScore = 45) {
  if (days === null) return 0;
  if (days <= excellent) return 100;
  if (days <= good) return 75;
  if (days <= 14) return averageScore;
  return 15;
}

function buildHealthScore({ farm, users, milkRows, financeRows, reminderRows, aiAssistantRows, dataQuality, subscription }) {
  const lastMilk = milkRows[0]?.date || null;
  const lastLogin = users
    .filter((user) => user.last_login)
    .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))[0]?.last_login || null;
  const lastActivityDays = daysBetween(latestDate(lastMilk, lastLogin));
  const currentMonthStart = dateKey(startOfMonth(new Date()));
  const today = dateKey();
  const monthMilkEntries = milkRows.filter((row) => inRange(row.date, currentMonthStart, today)).length;
  const monthExpenseEntries = financeRows.filter((row) => isExpenseRecord(row) && inRange(row.date, currentMonthStart, today)).length;
  const reminderDone = reminderRows.filter((row) => row.is_done).length;
  const activeUsers = users.filter((user) => user.is_active !== false).length;

  const categories = {
    dailyUsage: scoreFromDays(lastActivityDays, 1, 7),
    milkEntries: Math.min(100, monthMilkEntries * 7),
    expenseTracking: monthExpenseEntries > 0 ? 100 : 35,
    reminderUsage: reminderRows.length ? round((reminderDone / reminderRows.length) * 100, 0) : 30,
    aiUsage: aiAssistantRows.length ? 100 : 25,
    userActivity: users.length ? round((activeUsers / users.length) * 100, 0) : 0,
    dataCompleteness: dataQuality.score,
    subscriptionHealth: subscription.status === "suspended" ? 0 : subscription.daysRemaining === null ? 55 : subscription.daysRemaining > 30 ? 100 : subscription.daysRemaining > 7 ? 70 : 35
  };

  const score = round(Object.values(categories).reduce((sum, item) => sum + item, 0) / Object.values(categories).length, 0);
  const label = score >= 81 ? "Excellent" : score >= 61 ? "Good" : score >= 41 ? "Average" : "Poor";
  const tone = score >= 81 ? "green" : score >= 61 ? "blue" : score >= 41 ? "yellow" : "red";

  return {
    score,
    label,
    tone,
    categories,
    explanation: [
      monthMilkEntries > 0 ? "Milk entries are available for the current month." : "No milk entries found for the current month.",
      users.length ? `${activeUsers}/${users.length} users are active.` : "No user records found.",
      subscription.daysRemaining !== null ? `Subscription/trial has ${subscription.daysRemaining} days remaining.` : "Subscription expiry date is not configured."
    ]
  };
}

function buildDataQuality(farm, cowRows, milkRows, financeRows, uploadRows, users, counts = {}) {
  const checks = [
    { key: "farmProfile", ok: Boolean(farm.farm_name && farm.owner_name && farm.owner_mobile && farm.village_name), label: "Farm profile" },
    { key: "cowData", ok: (counts.cows || 0) > 0 || cowRows.length > 0, label: "Cow records" },
    { key: "milkRecords", ok: (counts.milkRecords || 0) > 0 || milkRows.length > 0, label: "Milk records" },
    { key: "expenseRecords", ok: (counts.expenseRecords || 0) > 0 || financeRows.some(isExpenseRecord), label: "Expense records" },
    { key: "userInfo", ok: users.length > 0 && users.every((user) => user.name && user.mobile), label: "User information" },
    { key: "ocrRecords", ok: (counts.slipUploads || 0) > 0 || uploadRows.length > 0, label: "Slip/OCR records" }
  ];
  const passed = checks.filter((item) => item.ok).length;
  const recommendations = checks
    .filter((item) => !item.ok)
    .map((item) => `${item.label} complete करा.`);

  return {
    score: round((passed / checks.length) * 100, 0),
    checks,
    recommendations
  };
}

function buildAlerts({ farm, subscription, milk, ocr, users, healthScore }) {
  const alerts = [];
  if (!farm.is_active) {
    alerts.push({ priority: "critical", title: "Farm suspended", message: farm.suspended_reason || "Farm account is currently suspended." });
  }
  if (subscription.daysRemaining !== null && subscription.daysRemaining < 0) {
    alerts.push({ priority: "critical", title: "Subscription expired", message: `${Math.abs(subscription.daysRemaining)} days overdue.` });
  } else if (subscription.daysRemaining !== null && subscription.daysRemaining <= 7) {
    alerts.push({ priority: "critical", title: "Subscription expiring soon", message: `${subscription.daysRemaining} days remaining.` });
  }
  if (milk.daysSinceLastEntry !== null && milk.daysSinceLastEntry >= 7) {
    alerts.push({ priority: "critical", title: "No milk entry recently", message: `${milk.daysSinceLastEntry} days since last milk record.` });
  }
  if (ocr.totalUploads >= 5 && ocr.failureRate >= 30) {
    alerts.push({ priority: "warning", title: "OCR failures increased", message: `${ocr.failureRate}% OCR uploads failed.` });
  }
  const inactiveUsers = users.filter((user) => user.is_active === false).length;
  if (inactiveUsers) {
    alerts.push({ priority: "warning", title: "Inactive users found", message: `${inactiveUsers} user account(s) are inactive.` });
  }
  if (healthScore.score < 60) {
    alerts.push({ priority: "warning", title: "Farm health needs attention", message: `Health score is ${healthScore.score}/100.` });
  }
  if (!alerts.length) {
    alerts.push({ priority: "success", title: "No major issues", message: "No high-priority operational risks detected from available data." });
  }
  return alerts;
}

async function getFarmDetails(supabase, farmId) {
  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("*")
    .eq("id", farmId)
    .single();

  if (farmError || !farm) {
    const error = new Error("Farm not found");
    error.status = 404;
    throw error;
  }

  const now = new Date();
  const today = dateKey(now);
  const yesterday = dateKey(addDays(now, -1));
  const ninetyDaysAgo = dateKey(addDays(now, -90));
  const sixMonthStart = new Date(now);
  sixMonthStart.setMonth(sixMonthStart.getMonth() - 5, 1);
  const sixMonthsAgo = dateKey(sixMonthStart);
  const currentMonthStart = dateKey(startOfMonth(now));
  const currentMonthEnd = dateKey(endOfMonth(now));
  const currentMonth = monthKey(now);
  const analyticsWarnings = [];

  const [
    cowRows,
    calfRows,
    milkRows,
    financeRows,
    reminderRows,
    aiRows,
    aiAssistantRows,
    settlementRows,
    uploadRows,
    userResult,
    activityResult,
    sessionRows,
    loginRows,
    supportTicketRows,
    latestMilkRow,
    highestMilkRow,
    lowestMilkRow,
    latestExpenseRow,
    totalCowCount,
    totalCalfCount,
    totalMilkRecordCount,
    totalFinanceRecordCount,
    totalExpenseRecordCount,
    totalReminderCount,
    totalAiRecordCount,
    totalAiAssistantCount,
    totalUserCount,
    totalSlipUploadCount,
    totalOcrSuccessCount,
    totalOcrFailedCount,
    totalOcrPendingCount
  ] = await Promise.all([
    safeArray(supabase
      .from("cows")
      .select("id, name, breed, status, date_of_birth, is_active, created_at")
      .eq("farm_id", farmId), "Cows", analyticsWarnings),
    safeArray(supabase
      .from("calves")
      .select("id, name, gender, status, birth_date, created_at")
      .eq("farm_id", farmId), "Calves", analyticsWarnings),
    safeArray(supabase
      .from("milk_records")
      .select("id, date, morning_litres, evening_litres, total_litres, total_amount, fat_percentage, morning_fat_percentage, evening_fat_percentage, snf_value, morning_snf_value, evening_snf_value, created_at")
      .eq("farm_id", farmId)
      .gte("date", ninetyDaysAgo)
      .order("date", { ascending: false })
      .limit(500), "Milk records", analyticsWarnings),
    safeArray(supabase
      .from("finance_records")
      .select("id, date, type, category, amount, accounting_period, created_at")
      .eq("farm_id", farmId)
      .gte("date", sixMonthsAgo)
      .order("date", { ascending: false })
      .limit(500), "Finance records", analyticsWarnings),
    safeArray(supabase
      .from("reminders")
      .select("id, reminder_date, type, is_done, done_at, skipped, created_at")
      .eq("farm_id", farmId)
      .order("reminder_date", { ascending: false })
      .limit(300), "Reminders", analyticsWarnings),
    safeArray(supabase
      .from("ai_records")
      .select("id, ai_date, pregnancy_result, cost, created_at")
      .eq("farm_id", farmId)
      .order("ai_date", { ascending: false })
      .limit(300), "AI records", analyticsWarnings),
    safeArray(supabase
      .from("ai_assistant_logs")
      .select("id, question, tools_used, execution_ms, error, created_at")
      .eq("farm_id", farmId)
      .gte("created_at", sixMonthsAgo)
      .order("created_at", { ascending: false })
      .limit(300), "AI assistant logs", analyticsWarnings),
    safeArray(supabase
      .from("dairy_settlements")
      .select("id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, net_payable, payment_received, ai_extracted, ai_confidence, created_at")
      .eq("farm_id", farmId)
      .gte("period_end", sixMonthsAgo)
      .order("period_end", { ascending: false })
      .limit(100), "Dairy settlements", analyticsWarnings),
    safeArray(supabase
      .from("slip_uploads")
      .select("id, slip_type, extraction_status, ai_confidence, ai_tokens_used, ai_cost_estimate, compressed_size, created_at, updated_at")
      .eq("farm_id", farmId)
      .gte("created_at", sixMonthsAgo)
      .order("created_at", { ascending: false })
      .limit(500), "Slip uploads", analyticsWarnings),
    supabase
      .from("users")
      .select("id, mobile, name, role, is_active, is_farm_owner, last_login, created_at, email")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_activity_log")
      .select("id, action, details, created_at, super_admins(name, email)")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(20),
    safeArray(supabase
      .from("user_sessions")
      .select("id, user_id, device_name, browser, os, device_brand, device_model, device_type, platform_version, browser_version, ip_address, login_at, last_active_at, logout_at, is_active, client_hints")
      .eq("farm_id", farmId)
      .order("last_active_at", { ascending: false })
      .limit(20), "User sessions", analyticsWarnings),
    safeArray(supabase
      .from("user_login_history")
      .select("id, user_id, mobile, status, failure_reason, device_name, browser, os, device_brand, device_model, device_type, platform_version, browser_version, ip_address, created_at, client_hints")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(20), "Login history", analyticsWarnings),
    safeArray(supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, category, priority, status, created_at, updated_at, resolved_at, closed_at")
      .eq("farm_id", farmId)
      .order("updated_at", { ascending: false })
      .limit(20), "Support tickets", analyticsWarnings),
    safeMaybe(supabase
      .from("milk_records")
      .select("id, date, total_litres, total_amount, created_at")
      .eq("farm_id", farmId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(), "Latest milk entry", analyticsWarnings),
    safeMaybe(supabase
      .from("milk_records")
      .select("date, total_litres, total_amount")
      .eq("farm_id", farmId)
      .gt("total_litres", 0)
      .order("total_litres", { ascending: false })
      .limit(1)
      .maybeSingle(), "Highest milk day", analyticsWarnings),
    safeMaybe(supabase
      .from("milk_records")
      .select("date, total_litres, total_amount")
      .eq("farm_id", farmId)
      .gt("total_litres", 0)
      .order("total_litres", { ascending: true })
      .limit(1)
      .maybeSingle(), "Lowest milk day", analyticsWarnings),
    safeMaybe(supabase
      .from("finance_records")
      .select("id, date, type, category, amount, created_at")
      .eq("farm_id", farmId)
      .or("type.eq.खर्च,type.eq.expense,type.eq.expenses,type.eq.debit,type.eq.Expense,type.eq.EXPENSE")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(), "Latest expense", analyticsWarnings),
    safeCount(supabase.from("cows").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total cows count", analyticsWarnings),
    safeCount(supabase.from("calves").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total calves count", analyticsWarnings),
    safeCount(supabase.from("milk_records").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total milk records count", analyticsWarnings),
    safeCount(supabase.from("finance_records").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total finance records count", analyticsWarnings),
    safeCount(supabase.from("finance_records").select("id", { count: "exact", head: true }).eq("farm_id", farmId).or("type.eq.खर्च,type.eq.expense,type.eq.expenses,type.eq.debit,type.eq.Expense,type.eq.EXPENSE"), "Expense records count", analyticsWarnings),
    safeCount(supabase.from("reminders").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total reminders count", analyticsWarnings),
    safeCount(supabase.from("ai_records").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total AI records count", analyticsWarnings),
    safeCount(supabase.from("ai_assistant_logs").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total AI assistant logs count", analyticsWarnings),
    safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total users count", analyticsWarnings),
    safeCount(supabase.from("slip_uploads").select("id", { count: "exact", head: true }).eq("farm_id", farmId), "Total slip uploads count", analyticsWarnings),
    safeCount(supabase.from("slip_uploads").select("id", { count: "exact", head: true }).eq("farm_id", farmId).in("extraction_status", ["success", "saved"]), "Successful OCR count", analyticsWarnings),
    safeCount(supabase.from("slip_uploads").select("id", { count: "exact", head: true }).eq("farm_id", farmId).eq("extraction_status", "failed"), "Failed OCR count", analyticsWarnings),
    safeCount(supabase.from("slip_uploads").select("id", { count: "exact", head: true }).eq("farm_id", farmId).in("extraction_status", ["pending", "processing"]), "Pending OCR count", analyticsWarnings)
  ]);

  if (userResult.error) {
    throw userResult.error;
  }
  if (activityResult.error) {
    throw activityResult.error;
  }

  const users = userResult.data || [];
  const lastLoginUser = users
    .filter((user) => user.last_login)
    .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))[0];
  const latestMilk = latestMilkRow || milkRows[0] || null;
  const latestSession = sessionRows[0] || null;
  const latestUpload = uploadRows[0] || null;
  const latestFinance = latestExpenseRow || financeRows.find(isExpenseRecord) || null;

  const currentMonthMilkRows = milkRows.filter((row) => inRange(row.date, currentMonthStart, currentMonthEnd));
  const currentMonthFinanceRows = financeRows.filter((row) => inRange(row.date, currentMonthStart, currentMonthEnd));
  const currentMonthSettlementRows = settlementRows.filter((row) => inRange(row.period_end || row.settlement_date, currentMonthStart, currentMonthEnd));
  const currentMonthAiAssistantRows = aiAssistantRows.filter((row) => String(row.created_at || "").slice(0, 7) === currentMonth);

  const dailyChart30 = buildDailyMilkChart(milkRows, 30);
  const monthlyTrend = buildMonthlyTrend(milkRows, financeRows, settlementRows);
  const todayMilk = milkRows.find((row) => row.date === today);
  const yesterdayMilk = milkRows.find((row) => row.date === yesterday);
  const milkRecordMonthLiters = sumBy(currentMonthMilkRows, (row) => row.total_litres);
  const milkRecordMonthIncome = sumBy(currentMonthMilkRows, (row) => row.total_amount);
  const settlementMonthLiters = sumBy(currentMonthSettlementRows, (row) => row.total_liters);
  const settlementMonthIncome = sumBy(currentMonthSettlementRows, (row) => row.total_milk_income);
  const settlementMonthDeductions = sumBy(currentMonthSettlementRows, (row) => toNumber(row.cattle_feed_deduction) + toNumber(row.other_deductions));
  const manualIncome = sumBy(currentMonthFinanceRows.filter(isIncomeRecord), (row) => row.amount);
  const manualExpenses = sumBy(currentMonthFinanceRows.filter((row) => isExpenseRecord(row) && !isDairyDeductionExpense(row)), (row) => row.amount);
  const monthMilk = settlementMonthLiters > 0 ? settlementMonthLiters : milkRecordMonthLiters;
  const monthMilkIncome = settlementMonthIncome > 0 ? settlementMonthIncome : milkRecordMonthIncome;
  const monthIncome = monthMilkIncome + manualIncome;
  const monthExpenses = manualExpenses + settlementMonthDeductions;
  const monthProfit = monthIncome - monthExpenses;
  const expenseCategoryTotals = currentMonthFinanceRows
    .filter((row) => isExpenseRecord(row) && !isDairyDeductionExpense(row))
    .reduce((groups, row) => {
      const key = row.category || "Uncategorized";
      groups[key] = (groups[key] || 0) + toNumber(row.amount);
      return groups;
    }, {});
  const settlementFeedDeduction = sumBy(currentMonthSettlementRows, (row) => row.cattle_feed_deduction);
  const settlementOtherDeduction = sumBy(currentMonthSettlementRows, (row) => row.other_deductions);
  if (settlementFeedDeduction > 0) {
    expenseCategoryTotals["देयक खाद्य कपात"] = round((expenseCategoryTotals["देयक खाद्य कपात"] || 0) + settlementFeedDeduction);
  }
  if (settlementOtherDeduction > 0) {
    expenseCategoryTotals["सेटलमेंट इतर कपात"] = round((expenseCategoryTotals["सेटलमेंट इतर कपात"] || 0) + settlementOtherDeduction);
  }
  const topExpenseCategory = Object.entries(expenseCategoryTotals)
    .sort((a, b) => b[1] - a[1])[0] || null;

  const sortedByMilk = [...milkRows].sort((a, b) => toNumber(b.total_litres) - toNumber(a.total_litres));
  const sortedByIncome = [...milkRows].sort((a, b) => toNumber(b.total_amount) - toNumber(a.total_amount));
  const successfulOcr = totalOcrSuccessCount;
  const failedOcr = totalOcrFailedCount;
  const avgOcrAccuracy = average(uploadRows.map((row) => {
    const confidence = toNumber(row.ai_confidence);
    return confidence > 1 ? confidence : confidence * 100;
  }));
  const dataQuality = buildDataQuality(farm, cowRows, milkRows, financeRows, uploadRows, users, {
    cows: totalCowCount,
    milkRecords: totalMilkRecordCount,
    expenseRecords: totalExpenseRecordCount,
    slipUploads: totalSlipUploadCount
  });
  const subscription = {
    status: farm.is_active ? (farm.subscription_status || "trial") : "suspended",
    planName: farm.subscription_status === "active" ? "Premium" : farm.subscription_status === "trial" ? "Trial" : "Not Active",
    planType: farm.subscription_status === "active" ? "Yearly/Manual" : farm.subscription_status === "trial" ? "Trial" : "Manual",
    startDate: farm.subscription_started_at || farm.created_at || null,
    expiryDate: farm.subscription_ends_at || farm.trial_ends_at || null,
    daysRemaining: daysUntilDate(farm.subscription_ends_at || farm.trial_ends_at),
    paymentStatus: farm.subscription_status === "active" ? "Paid/Active" : farm.subscription_status === "trial" ? "Trial" : "Not paid",
    lastPaymentDate: farm.subscription_started_at || null,
    nextRenewalDate: farm.subscription_ends_at || farm.trial_ends_at || null,
    renewalCount: 0,
    trialStatus: farm.subscription_status === "trial" ? "Trial running" : "Not trial"
  };
  const healthScore = buildHealthScore({
    farm,
    users,
    milkRows,
    financeRows,
    reminderRows,
    aiAssistantRows,
    dataQuality,
    subscription
  });
  const milk = {
    todayMilk: round(toNumber(todayMilk?.total_litres)),
    yesterdayMilk: round(toNumber(yesterdayMilk?.total_litres)),
    monthlyMilk: round(monthMilk),
    averageDailyMilk: round(currentMonthMilkRows.length ? sumBy(currentMonthMilkRows, (row) => row.total_litres) / currentMonthMilkRows.length : 0),
    highestProductionDay: highestMilkRow ? { date: highestMilkRow.date, totalMilk: round(highestMilkRow.total_litres) } : sortedByMilk[0] ? { date: sortedByMilk[0].date, totalMilk: round(sortedByMilk[0].total_litres) } : null,
    lowestProductionDay: lowestMilkRow ? { date: lowestMilkRow.date, totalMilk: round(lowestMilkRow.total_litres) } : sortedByMilk.length ? { date: sortedByMilk[sortedByMilk.length - 1].date, totalMilk: round(sortedByMilk[sortedByMilk.length - 1].total_litres) } : null,
    highestIncomeDay: sortedByIncome[0] ? { date: sortedByIncome[0].date, income: round(sortedByIncome[0].total_amount) } : null,
    averageFat: average(milkRows.flatMap((row) => [row.fat_percentage, row.morning_fat_percentage, row.evening_fat_percentage])),
    averageSnf: average(milkRows.flatMap((row) => [row.snf_value, row.morning_snf_value, row.evening_snf_value])),
    lastMilkEntry: latestMilk,
    daysSinceLastEntry: latestMilk?.date ? daysBetween(latestMilk.date) : null,
    trend: dailyChart30,
    monthlyTrend
  };
  const ocr = {
    totalUploads: totalSlipUploadCount,
    successfulReads: successfulOcr,
    failedReads: failedOcr,
    pendingReads: totalOcrPendingCount,
    successRate: totalSlipUploadCount ? round((successfulOcr / totalSlipUploadCount) * 100, 0) : 0,
    failureRate: totalSlipUploadCount ? round((failedOcr / totalSlipUploadCount) * 100, 0) : 0,
    averageAccuracy: avgOcrAccuracy,
    lastUploadedSlip: latestUpload,
    mostActiveMonth: Object.entries(uploadRows.reduce((groups, row) => {
      const key = String(row.created_at || "").slice(0, 7) || "unknown";
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {})).sort((a, b) => b[1] - a[1])[0] || null,
    monthlyTrend: monthlyTrend.map((item) => ({
      label: item.label,
      uploads: uploadRows.filter((row) => String(row.created_at || "").slice(0, 7) === item.label).length
    }))
  };
  const financial = {
    thisMonthIncome: round(monthIncome),
    thisMonthExpenses: round(monthExpenses),
    netProfit: round(monthProfit),
    profitMargin: monthIncome > 0 ? round((monthProfit / monthIncome) * 100, 1) : 0,
    lastExpenseDate: latestExpenseRow?.date || financeRows.find(isExpenseRecord)?.date || null,
    expenseCategories: expenseCategoryTotals,
    topExpenseCategory: topExpenseCategory ? { category: topExpenseCategory[0], amount: round(topExpenseCategory[1]) } : null,
    trend: monthlyTrend
  };
  const aiUsage = {
    totalQueries: totalAiAssistantCount,
    queriesThisMonth: currentMonthAiAssistantRows.length,
    lastUsage: aiAssistantRows[0]?.created_at || null,
    averageQuestionsPerDay: round(aiAssistantRows.length / 180, 2),
    averageResponseTimeMs: round(average(aiAssistantRows.map((row) => row.execution_ms)), 0),
    estimatedTokens: sumBy(aiAssistantRows, (row) => Array.isArray(row.tools_used) ? row.tools_used.length * 200 : 0),
    estimatedCostUsd: null,
    mostAskedQuestions: aiAssistantRows.slice(0, 5).map((row) => row.question),
    topFeatures: Object.entries(aiAssistantRows.reduce((groups, row) => {
      const tools = Array.isArray(row.tools_used) ? row.tools_used : [];
      for (const tool of tools) {
        const key = typeof tool === "string" ? tool : tool?.name || "AI query";
        groups[key] = (groups[key] || 0) + 1;
      }
      return groups;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  };
  const alerts = buildAlerts({ farm, subscription, milk, ocr, users, healthScore });
  const farmSummary = [
    `${farm.farm_name} health score ${healthScore.score}/100 आहे (${healthScore.label}).`,
    milk.lastMilkEntry ? `Last milk entry ${milk.lastMilkEntry.date} रोजी आहे.` : "Milk entry अजून उपलब्ध नाही.",
    ocr.totalUploads ? `OCR uploads ${ocr.totalUploads}, success rate ${ocr.successRate}% आहे.` : "OCR usage अजून सुरू झालेला नाही.",
    subscription.daysRemaining !== null ? `Subscription/trial मध्ये ${subscription.daysRemaining} दिवस उरले आहेत.` : "Subscription expiry date सेट नाही.",
    alerts[0]?.priority === "success" ? "No major operational issue detected." : `${alerts.length} alert(s) need admin attention.`
  ].join(" ");
  const activityItems = [
    ...(activityResult.data || []).map((item) => ({
      ...item,
      action: `Admin: ${item.action}`
    })),
    ...milkRows.slice(0, 20).map((row) => ({
      id: `milk-${row.id}`,
      action: "Milk entry added",
      created_at: row.created_at || row.date,
      details: {
        date: row.date,
        milk_liters: round(row.total_litres),
        amount: round(row.total_amount)
      }
    })),
    ...financeRows.slice(0, 20).map((row) => ({
      id: `finance-${row.id}`,
      action: isExpenseRecord(row) ? "Expense added" : isIncomeRecord(row) ? "Income added" : "Finance record added",
      created_at: row.created_at || row.date,
      details: {
        date: row.date,
        type: row.type,
        category: row.category,
        amount: round(row.amount)
      }
    })),
    ...uploadRows.slice(0, 20).map((row) => ({
      id: `slip-${row.id}`,
      action: "Slip uploaded",
      created_at: row.created_at,
      details: {
        type: row.slip_type,
        status: row.extraction_status,
        confidence: row.ai_confidence
      }
    })),
    ...reminderRows.slice(0, 20).map((row) => ({
      id: `reminder-${row.id}`,
      action: row.is_done ? "Reminder completed" : "Reminder created",
      created_at: row.done_at || row.created_at || row.reminder_date,
      details: {
        reminder_date: row.reminder_date,
        type: row.type,
        done: row.is_done
      }
    })),
    ...cowRows.slice(0, 20).map((row) => ({
      id: `cow-${row.id}`,
      action: "Cow added",
      created_at: row.created_at,
      details: {
        name: row.name,
        breed: row.breed,
        status: row.status
      }
    })),
    ...aiAssistantRows.slice(0, 20).map((row) => ({
      id: `ai-${row.id}`,
      action: "AI question asked",
      created_at: row.created_at,
      details: {
        question: row.question,
        execution_ms: row.execution_ms,
        error: row.error
      }
    })),
    ...loginRows.slice(0, 20).map((row) => ({
      id: `login-${row.id}`,
      action: row.status === "success" ? "User login" : "Failed login",
      created_at: row.created_at,
      details: {
        mobile: row.mobile,
        status: row.status,
        device: row.device_name,
        browser: row.browser
      }
    }))
  ]
    .filter((item) => item.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  return {
    farm,
    analytics: {
      generatedAt: new Date().toISOString(),
      overview: {
        farmCode: farm.id,
        accountAgeDays: daysBetween(farm.created_at),
        lastActiveAt: latestDate(latestSession?.last_active_at, latestMilk?.created_at, latestUpload?.updated_at),
        createdBy: users.find((user) => user.is_farm_owner)?.name || farm.owner_name || null
      },
      subscription,
      healthScore,
      milk,
      financial,
      ocr,
      aiUsage,
      devices: {
        sessions: sessionRows,
        latestSession,
        loginHistory: loginRows,
        lastLoginDevice: loginRows.find((row) => row.status === "success") || null,
        pwaInstalled: null,
        lastSyncTime: latestSession?.last_active_at || null
      },
      support: {
        tickets: supportTicketRows,
        openTickets: supportTicketRows.filter((ticket) => ["open", "in_progress", "waiting_for_user"].includes(normalizeType(ticket.status))).length,
        criticalTickets: supportTicketRows.filter((ticket) => normalizeType(ticket.priority) === "critical").length
      },
      dataQuality,
      alerts,
      summary: farmSummary,
      warnings: analyticsWarnings
    },
    stats: {
      cowCount: totalCowCount,
      pregnantCowCount: cowRows.filter((cow) => cow.status === "गाभण").length,
      calfCount: totalCalfCount,
      milkCount: totalMilkRecordCount,
      expenseCount: totalExpenseRecordCount,
      financeRecordCount: totalFinanceRecordCount,
      aiCount: totalAiRecordCount,
      aiAssistantCount: totalAiAssistantCount,
      reminderCount: totalReminderCount,
      userCount: totalUserCount,
      activeUserCount: users.filter((user) => user.is_active !== false).length,
      inactiveUserCount: users.filter((user) => user.is_active === false).length,
      totalSlipUploads: totalSlipUploadCount,
      ocrSuccessRate: ocr.successRate,
      lastMilkEntry: latestMilk,
      lastExpense: latestFinance,
      lastLogin: lastLoginUser
        ? { date: lastLoginUser.last_login, userName: lastLoginUser.name }
        : null
    },
    users,
    activity: activityItems
  };
}

function formatDateForMessage(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function buildFarmActionNotification(action, farm, context = {}) {
  const farmName = farm?.farm_name || "तुमची डेअरी";

  if (action === "extend_trial") {
    return {
      type: "trial_expiry_reminder",
      priority: "high",
      title: "ट्रायल कालावधी वाढवला आहे",
      message: `${farmName} साठी trial ${context.days || 30} दिवसांनी वाढवला आहे. नवीन शेवटची तारीख: ${formatDateForMessage(farm.trial_ends_at)}.`,
      actionText: "तपशील बघा",
      actionUrl: "/profile"
    };
  }

  if (action === "activate") {
    return {
      type: "subscription_reminder",
      priority: "high",
      title: "Subscription सक्रिय झाले",
      message: `${farmName} चे subscription सक्रिय झाले आहे. App वापरणे सुरू ठेवू शकता. शेवटची तारीख: ${formatDateForMessage(farm.subscription_ends_at)}.`,
      actionText: "App उघडा",
      actionUrl: "/"
    };
  }

  if (action === "suspend") {
    return {
      type: "critical",
      priority: "urgent",
      title: "खाते स्थगित केले आहे",
      message: `${farmName} चे app खाते तात्पुरते स्थगित केले आहे. कारण: ${context.reason || farm.suspended_reason || "Support review"}.`,
      actionText: "माहिती बघा",
      actionUrl: "/profile"
    };
  }

  if (action === "unsuspend") {
    return {
      type: "success",
      priority: "high",
      title: "खाते पुन्हा सक्रिय झाले",
      message: `${farmName} चे app खाते पुन्हा सक्रिय केले आहे. आता app वापरू शकता.`,
      actionText: "App उघडा",
      actionUrl: "/"
    };
  }

  if (action === "update_subscription") {
    const statusLabel = {
      trial: "Trial",
      active: "Subscription",
      expired: "Subscription",
      cancelled: "Subscription"
    }[farm.subscription_status] || "Subscription";

    return {
      type: farm.is_active ? "subscription_reminder" : "critical",
      priority: "high",
      title: "Subscription माहिती अपडेट झाली",
      message: `${farmName} चे ${statusLabel} तपशील admin ने update केले आहेत. Status: ${farm.is_active ? farm.subscription_status : "suspended"}. Trial शेवट: ${formatDateForMessage(farm.trial_ends_at) || "-"}. Subscription शेवट: ${formatDateForMessage(farm.subscription_ends_at) || "-"}.`,
      actionText: "तपशील बघा",
      actionUrl: "/profile"
    };
  }

  return null;
}

async function notifyFarmUsersForAdminAction(supabase, adminId, farmId, action, farm, context = {}) {
  const notification = buildFarmActionNotification(action, farm, context);
  if (!notification) {
    return null;
  }

  const created = await createAdminNotification(supabase, adminId, {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    actionText: notification.actionText,
    actionUrl: notification.actionUrl,
    targetAudience: "selected_farms",
    farmIds: [farmId],
    channels: ["in_app", "push"],
    scheduleType: "now",
    sendNow: true
  });
  const sent = await sendNotificationNow(supabase, created.notification.id);

  return {
    notificationId: sent.notification.id,
    recipientCount: sent.recipientCount,
    push: sent.push,
    failureReason: sent.notification.failure_reason || null
  };
}

export async function GET(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Farm ID चुकीचा आहे.");
    }
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const data = await getFarmDetails(supabase, params.id);
    await logAdminAction(request, adminId, "viewed_farm", params.id, { farmName: data.farm.farm_name });
    return NextResponse.json(data);
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Farm ID चुकीचा आहे.");
    }
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    let payload = editableFarmFields.reduce((current, field) => {
      if (body[field] !== undefined) {
        current[field] = body[field];
      }
      return current;
    }, {});

    if (!Object.keys(payload).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    payload = normalizeFarmUpdatePayload(payload);
    payload.updated_at = new Date().toISOString();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logAdminAction(request, adminId, "edited_farm", params.id, { fields: Object.keys(payload) });
    return NextResponse.json({ farm: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Farm ID चुकीचा आहे.");
    }
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const action = body.action;
    const supabase = getSupabaseServerClient();
    let payload = {};

    if (action === "suspend") {
      payload = {
        is_active: false,
        suspended_reason: body.reason || "Suspended by super admin",
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (action === "unsuspend") {
      payload = {
        is_active: true,
        suspended_reason: null,
        suspended_at: null,
        updated_at: new Date().toISOString()
      };
    } else if (action === "extend_trial") {
      const days = parsePositiveInteger(body.days, 30);
      const { data: farm, error: farmError } = await supabase
        .from("farms")
        .select("trial_ends_at")
        .eq("id", params.id)
        .single();
      if (farmError) {
        throw farmError;
      }
      const base = farm?.trial_ends_at && new Date(farm.trial_ends_at) > new Date()
        ? new Date(farm.trial_ends_at)
        : new Date();
      base.setDate(base.getDate() + days);
      payload = {
        subscription_status: "trial",
        trial_ends_at: base.toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (action === "activate") {
      const ends = new Date();
      ends.setFullYear(ends.getFullYear() + 1);
      payload = {
        is_active: true,
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: ends.toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (action === "update_subscription") {
      payload = buildSubscriptionPayload(body);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    let notification = null;
    let notificationWarning = null;
    try {
      notification = await notifyFarmUsersForAdminAction(supabase, adminId, params.id, action, data, {
        days: body.days,
        reason: body.reason
      });
    } catch (notifyError) {
      notificationWarning = notifyError.message || "Notification delivery failed.";
    }

    await logAdminAction(request, adminId, action, params.id, { payload, notification, notificationWarning });
    return NextResponse.json({ farm: data, notification, notificationWarning });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
