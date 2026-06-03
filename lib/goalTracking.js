import {
  getAverageFat,
  getAverageSNF,
  getTodayMilkCollection,
  getTotalMilk
} from "@/lib/aiAssistantTools";
import { sendDirectPushToUser } from "@/lib/notificationCenter";

const DEFAULT_GOALS = {
  daily_milk_goal: 300,
  weekly_milk_goal: 2100,
  monthly_milk_goal: 9000,
  fat_goal: 4.5,
  snf_goal: 8.8,
  enabled: true
};

const goalMeta = {
  daily_milk: { label: "दैनिक दूध", unit: "लिटर", targetKey: "daily_milk_goal" },
  weekly_milk: { label: "साप्ताहिक दूध", unit: "लिटर", targetKey: "weekly_milk_goal" },
  monthly_milk: { label: "मासिक दूध", unit: "लिटर", targetKey: "monthly_milk_goal" },
  fat: { label: "फॅट", unit: "%", targetKey: "fat_goal" },
  snf: { label: "SNF", unit: "", targetKey: "snf_goal" }
};

function round(value, decimals = 2) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Number(numberValue.toFixed(decimals));
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function startOfIndiaToday() {
  const indiaDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  indiaDate.setHours(0, 0, 0, 0);
  return indiaDate;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function previousMonth(date, offset = 1) {
  return new Date(date.getFullYear(), date.getMonth() - offset, 1);
}

function countDays(startDate, endDate) {
  return Math.max(1, Math.round((new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / 86400000) + 1);
}

function normalizeGoals(row = {}) {
  return {
    ...DEFAULT_GOALS,
    ...row,
    daily_milk_goal: round(row.daily_milk_goal ?? DEFAULT_GOALS.daily_milk_goal),
    weekly_milk_goal: round(row.weekly_milk_goal ?? DEFAULT_GOALS.weekly_milk_goal),
    monthly_milk_goal: round(row.monthly_milk_goal ?? DEFAULT_GOALS.monthly_milk_goal),
    fat_goal: round(row.fat_goal ?? DEFAULT_GOALS.fat_goal, 1),
    snf_goal: round(row.snf_goal ?? DEFAULT_GOALS.snf_goal, 1),
    enabled: row.enabled !== false
  };
}

export async function getOrCreateGoalSettings(supabase, farmId, userId) {
  const { data, error } = await supabase
    .from("farm_goal_settings")
    .select("*")
    .eq("farm_id", farmId)
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizeGoals(data);

  const { data: created, error: createError } = await supabase
    .from("farm_goal_settings")
    .insert({
      farm_id: farmId,
      updated_by: userId,
      ...DEFAULT_GOALS
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return normalizeGoals(created);
}

export function sanitizeGoalSettings(body = {}, current = {}) {
  const merged = normalizeGoals(current);
  const numberFields = ["daily_milk_goal", "weekly_milk_goal", "monthly_milk_goal", "fat_goal", "snf_goal"];

  for (const field of numberFields) {
    if (body[field] !== undefined) {
      const value = Number(body[field]);
      merged[field] = Number.isFinite(value) && value >= 0 ? round(value, field.includes("milk") ? 2 : 1) : 0;
    }
  }

  if (body.enabled !== undefined) {
    merged.enabled = Boolean(body.enabled);
  }

  return merged;
}

async function getMilkTotal(supabase, farmId, startDate, endDate) {
  const result = await getTotalMilk({
    supabase,
    farmId,
    args: { startDate, endDate }
  });
  return round(result?.totalMilk || 0);
}

async function getFatAverage(supabase, farmId, startDate, endDate) {
  const result = await getAverageFat({
    supabase,
    farmId,
    args: { startDate, endDate }
  });
  return round(result?.averageFat || 0, 2);
}

async function getSnfAverage(supabase, farmId, startDate, endDate) {
  const result = await getAverageSNF({
    supabase,
    farmId,
    args: { startDate, endDate }
  });
  return round(result?.averageSNF || 0, 2);
}

function makeProgress({ goalType, currentValue, targetValue, periodStart, periodEnd, current = true }) {
  const target = round(targetValue);
  const actual = round(currentValue);
  const percentage = target > 0 ? Math.min(999, round((actual / target) * 100, 1)) : 0;
  const remaining = target > 0 ? Math.max(0, round(target - actual)) : 0;
  const completed = target > 0 && actual >= target;
  const periodEnded = !current && iso(startOfIndiaToday()) > periodEnd;
  const status = target <= 0 ? "no_goal" : completed ? "completed" : periodEnded ? "missed" : "in_progress";

  return {
    goalType,
    label: goalMeta[goalType].label,
    unit: goalMeta[goalType].unit,
    currentValue: actual,
    target,
    remaining,
    percentage,
    status,
    periodStart,
    periodEnd
  };
}

export async function calculateGoalProgress(supabase, farmId, goals) {
  const todayDate = startOfIndiaToday();
  const today = iso(todayDate);
  const weekStart = iso(startOfWeek(todayDate));
  const weekEnd = iso(endOfWeek(todayDate));
  const monthStart = iso(startOfMonth(todayDate));
  const monthEnd = iso(endOfMonth(todayDate));
  const todayMilk = await getTodayMilkCollection({ supabase, farmId });
  const [weeklyMilk, monthlyMilk, fatAverage, snfAverage] = await Promise.all([
    getMilkTotal(supabase, farmId, weekStart, today),
    getMilkTotal(supabase, farmId, monthStart, today),
    getFatAverage(supabase, farmId, monthStart, today),
    getSnfAverage(supabase, farmId, monthStart, today)
  ]);

  return [
    makeProgress({
      goalType: "daily_milk",
      currentValue: todayMilk.totalMilk || 0,
      targetValue: goals.daily_milk_goal,
      periodStart: today,
      periodEnd: today
    }),
    makeProgress({
      goalType: "weekly_milk",
      currentValue: weeklyMilk,
      targetValue: goals.weekly_milk_goal,
      periodStart: weekStart,
      periodEnd: weekEnd
    }),
    makeProgress({
      goalType: "monthly_milk",
      currentValue: monthlyMilk,
      targetValue: goals.monthly_milk_goal,
      periodStart: monthStart,
      periodEnd: monthEnd
    }),
    makeProgress({
      goalType: "fat",
      currentValue: fatAverage,
      targetValue: goals.fat_goal,
      periodStart: monthStart,
      periodEnd: monthEnd
    }),
    makeProgress({
      goalType: "snf",
      currentValue: snfAverage,
      targetValue: goals.snf_goal,
      periodStart: monthStart,
      periodEnd: monthEnd
    })
  ];
}

async function progressForPeriod(supabase, farmId, goals, goalType, startDate, endDate) {
  const targetValue = goals[goalMeta[goalType].targetKey];
  let currentValue = 0;

  if (goalType.includes("milk")) {
    currentValue = await getMilkTotal(supabase, farmId, startDate, endDate);
  } else if (goalType === "fat") {
    currentValue = await getFatAverage(supabase, farmId, startDate, endDate);
  } else {
    currentValue = await getSnfAverage(supabase, farmId, startDate, endDate);
  }

  return makeProgress({
    goalType,
    currentValue,
    targetValue,
    periodStart: startDate,
    periodEnd: endDate,
    current: false
  });
}

export async function calculateGoalHistory(supabase, farmId, goals) {
  const todayDate = startOfIndiaToday();
  const yesterday = addDays(todayDate, -1);
  const lastWeekStart = addDays(startOfWeek(todayDate), -7);
  const lastWeekEnd = addDays(lastWeekStart, 6);
  const lastMonth = previousMonth(todayDate, 1);
  const twoMonthsAgo = previousMonth(todayDate, 2);

  const rows = [
    await progressForPeriod(supabase, farmId, goals, "daily_milk", iso(yesterday), iso(yesterday)),
    await progressForPeriod(supabase, farmId, goals, "weekly_milk", iso(lastWeekStart), iso(lastWeekEnd)),
    await progressForPeriod(supabase, farmId, goals, "monthly_milk", iso(lastMonth), iso(endOfMonth(lastMonth))),
    await progressForPeriod(supabase, farmId, goals, "fat", iso(lastMonth), iso(endOfMonth(lastMonth))),
    await progressForPeriod(supabase, farmId, goals, "snf", iso(lastMonth), iso(endOfMonth(lastMonth))),
    await progressForPeriod(supabase, farmId, goals, "monthly_milk", iso(twoMonthsAgo), iso(endOfMonth(twoMonthsAgo)))
  ];

  return rows;
}

export function buildGoalRecommendation(progress = []) {
  const monthly = progress.find((item) => item.goalType === "monthly_milk");
  const daily = progress.find((item) => item.goalType === "daily_milk");
  const fat = progress.find((item) => item.goalType === "fat");

  if (monthly?.target > 0) {
    if (monthly.status === "completed") {
      return `तुम्ही मासिक लक्ष्य पूर्ण केले आहे. पुढील महिन्यासाठी लक्ष्य थोडे वाढवू शकता.`;
    }
    return `तुम्ही मासिक लक्ष्याच्या ${monthly.percentage}% पूर्ण केले आहे. अजून ${monthly.remaining} लिटर बाकी आहे.`;
  }

  if (daily?.target > 0) {
    return `आजच्या लक्ष्याच्या ${daily.percentage}% दूध जमा झाले आहे.`;
  }

  if (fat?.target > 0) {
    return `या महिन्याचा सरासरी फॅट ${fat.currentValue}% आहे. लक्ष्य ${fat.target}% आहे.`;
  }

  return "लक्ष्य सेट केल्यावर AI शिफारस येथे दिसेल.";
}

export async function upsertGoalHistory(supabase, farmId, progressRows = []) {
  const rows = progressRows
    .filter((row) => row.target > 0)
    .map((row) => ({
      farm_id: farmId,
      goal_type: row.goalType,
      period_start: row.periodStart,
      period_end: row.periodEnd,
      target_value: row.target,
      actual_value: row.currentValue,
      percentage: row.percentage,
      status: row.status,
      unit: row.unit,
      generated_at: new Date().toISOString()
    }));

  if (!rows.length) return;

  await supabase
    .from("goal_progress_history")
    .upsert(rows, { onConflict: "farm_id,goal_type,period_start,period_end" });
}

function notificationContent(progress) {
  if (progress.goalType === "daily_milk") {
    return {
      title: "🎉 दैनिक दूध लक्ष्य पूर्ण",
      message: `आजचे दूध लक्ष्य पूर्ण झाले. ${progress.currentValue} ${progress.unit} दूध जमा झाले.`
    };
  }
  if (progress.goalType === "monthly_milk") {
    return {
      title: "🎉 मासिक दूध लक्ष्य पूर्ण",
      message: `या महिन्याचे दूध लक्ष्य पूर्ण झाले. ${progress.currentValue} ${progress.unit} दूध जमा झाले.`
    };
  }
  return {
    title: `🎉 ${progress.label} लक्ष्य पूर्ण`,
    message: `${progress.label} लक्ष्य पूर्ण झाले. सध्याचे मूल्य ${progress.currentValue}${progress.unit ? ` ${progress.unit}` : ""}.`
  };
}

export async function notifyGoalAchievements(supabase, farmId, userId, progressRows = []) {
  const completed = progressRows.filter((row) => row.status === "completed" && row.target > 0);
  const notifications = [];

  for (const progress of completed) {
    const content = notificationContent(progress);
    const key = {
      farm_id: farmId,
      user_id: userId,
      goal_type: progress.goalType,
      period_start: progress.periodStart,
      period_end: progress.periodEnd
    };
    const { data: achievement, error } = await supabase
      .from("goal_achievement_notifications")
      .insert({
        ...key,
        title: content.title,
        message: content.message
      })
      .select("*")
      .maybeSingle();

    if (error || !achievement) {
      continue;
    }

    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        title: content.title,
        message: content.message,
        type: "success",
        priority: "normal",
        target_audience: "specific_users",
        target_filter: { farmIds: [farmId], userIds: [userId] },
        channels: ["in_app", "push"],
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: 1,
        delivered_count: 1,
        action_text: "लक्ष्य बघा",
        action_url: "/settings/goals"
      })
      .select("id")
      .single();

    if (!notificationError && notification?.id) {
      await supabase
        .from("notification_delivery_logs")
        .upsert({
          notification_id: notification.id,
          farm_id: farmId,
          user_id: userId,
          channel: "in_app",
          delivery_status: "delivered",
          delivered_at: new Date().toISOString(),
          metadata: { source: "goal_tracking", goalType: progress.goalType }
        }, { onConflict: "notification_id,user_id,channel" });
    }

    try {
      await sendDirectPushToUser(supabase, userId, {
        title: content.title,
        body: content.message,
        url: "/settings/goals",
        tag: `goal:${farmId}:${userId}:${progress.goalType}:${progress.periodStart}`
      });
    } catch {
      // Push is optional; in-app notification is already created.
    }

    notifications.push({ ...achievement, ...content });
  }

  return notifications;
}

export async function checkGoalAchievementsForFarm(supabase, farmId, userId) {
  try {
    const goals = await getOrCreateGoalSettings(supabase, farmId, userId);
    if (!goals.enabled) {
      return [];
    }
    const progress = await calculateGoalProgress(supabase, farmId, goals);
    await upsertGoalHistory(supabase, farmId, progress);
    return await notifyGoalAchievements(supabase, farmId, userId, progress);
  } catch {
    return [];
  }
}
