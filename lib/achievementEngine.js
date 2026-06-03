import { sendDirectPushToUser } from "@/lib/notificationCenter";

const MILK_RANKS = [
  { code: "beginner_farmer", label: "Beginner Farmer", minScore: 0, icon: "🌱" },
  { code: "active_farmer", label: "Active Farmer", minScore: 20, icon: "🌿" },
  { code: "smart_farmer", label: "Smart Farmer", minScore: 35, icon: "🧠" },
  { code: "advanced_farmer", label: "Advanced Farmer", minScore: 50, icon: "🚀" },
  { code: "expert_farmer", label: "Expert Farmer", minScore: 65, icon: "🏅" },
  { code: "dairy_champion", label: "Dairy Champion", minScore: 80, icon: "🏆" },
  { code: "dairy_master", label: "Dairy Master", minScore: 92, icon: "👑" }
];

const categoryLabels = {
  milk_production: "दूध उत्पादन",
  income: "उत्पन्न",
  data_entry: "Data Entry",
  ocr_usage: "Slip/OCR वापर",
  ai_usage: "AI वापर",
  consistency: "सातत्य",
  farm_growth: "Farm Growth",
  subscription_loyalty: "Subscription Loyalty",
  community: "Community",
  hidden: "गुप्त"
};

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(numberValue(value) * factor) / factor;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, numberValue(value)));
}

function sumRows(rows, key) {
  return (rows || []).reduce((sum, row) => sum + numberValue(row?.[key]), 0);
}

function isoDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateStreaks(dateValues = []) {
  const dates = Array.from(new Set(dateValues.map(isoDateOnly).filter(Boolean))).sort();
  if (!dates.length) {
    return { currentStreakDays: 0, longestStreakDays: 0, recordDays: 0 };
  }

  let longest = 1;
  let currentRun = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const expected = addDays(dates[index - 1], 1);
    if (dates[index] === expected) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 1;
    }
  }

  const dateSet = new Set(dates);
  let cursor = dates.includes(todayISO()) ? todayISO() : dates[dates.length - 1];
  let current = 0;
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    currentStreakDays: current,
    longestStreakDays: longest,
    recordDays: dates.length
  };
}

function rankForScore(score) {
  return [...MILK_RANKS].reverse().find((rank) => score >= rank.minScore) || MILK_RANKS[0];
}

function nextRankForScore(score) {
  return MILK_RANKS.find((rank) => rank.minScore > score) || null;
}

function profileCompletion({ user, farm, profile }) {
  const checks = [
    user?.name,
    user?.mobile || user?.email,
    user?.profilePhotoUrl || user?.profile_photo_url,
    farm?.farm_name,
    farm?.owner_mobile,
    farm?.district_name || profile?.district_name,
    farm?.village_name || profile?.village_name,
    profile?.state_name || farm?.state_name
  ];
  return round((checks.filter(Boolean).length / checks.length) * 100, 2);
}

function averageQualityRows(slips = [], milkRecords = []) {
  const slipQuality = slips.filter((row) => numberValue(row.fat_percentage) > 0 || numberValue(row.snf_percentage) > 0).length;
  const milkQuality = milkRecords.filter((row) =>
    numberValue(row.fat_percentage) > 0 ||
    numberValue(row.morning_fat_percentage) > 0 ||
    numberValue(row.evening_fat_percentage) > 0 ||
    numberValue(row.snf_value) > 0 ||
    numberValue(row.morning_snf_value) > 0 ||
    numberValue(row.evening_snf_value) > 0
  ).length;
  const totalRows = Math.max(slips.length, milkRecords.length, 1);
  return clamp(((slipQuality + milkQuality) / Math.max(totalRows, 1)) * 100);
}

async function safeQuery(queryPromise, fallback = []) {
  const result = await queryPromise;
  if (result.error) {
    return fallback;
  }
  return result.data || fallback;
}

async function createAchievementAppNotification(supabase, auth, content) {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        title: content.title,
        message: content.message,
        type: "success",
        priority: "normal",
        target_audience: "specific_users",
        target_filter: { farmIds: [auth.farmId], userIds: [auth.userId] },
        channels: ["in_app", "push"],
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: 1,
        delivered_count: 1,
        action_text: "Achievement बघा",
        action_url: content.url || "/achievements"
      })
      .select("id")
      .single();

    if (error || !notification?.id) return;

    await supabase.from("notification_delivery_logs").upsert({
      notification_id: notification.id,
      farm_id: auth.farmId,
      user_id: auth.userId,
      channel: "in_app",
      delivery_status: "delivered",
      delivered_at: new Date().toISOString(),
      metadata: { source: "achievements" }
    }, { onConflict: "notification_id,user_id,channel" });

    await sendDirectPushToUser(supabase, auth.userId, {
      id: notification.id,
      title: content.title,
      body: content.message,
      url: content.url || "/achievements",
      tag: `achievement:${notification.id}`
    });
  } catch {
    // Achievement notification should never block scoring.
  }
}

export async function getAchievementMetrics(supabase, auth) {
  const farmId = auth.farmId;
  const userId = auth.userId;

  const [
    farm,
    profile,
    dairySlips,
    settlements,
    milkRecords,
    slipUploads,
    aiLogs,
    cows,
    featureVotes,
    supportTickets
  ] = await Promise.all([
    safeQuery(supabase.from("farms").select("*").eq("id", farmId).maybeSingle(), null),
    safeQuery(supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(), null),
    safeQuery(supabase.from("dairy_slips").select("id, slip_date, liters, total_amount, fat_percentage, snf_percentage, created_at").eq("farm_id", farmId), []),
    safeQuery(supabase.from("dairy_settlements").select("id, total_liters, total_milk_income, period_start, period_end, created_at").eq("farm_id", farmId), []),
    safeQuery(supabase.from("milk_records").select("id, date, morning_litres, evening_litres, total_litres, total_amount, fat_percentage, morning_fat_percentage, evening_fat_percentage, snf_value, morning_snf_value, evening_snf_value, created_at").eq("farm_id", farmId), []),
    safeQuery(supabase.from("slip_uploads").select("id, extraction_status, created_at").eq("farm_id", farmId), []),
    safeQuery(supabase.from("ai_assistant_logs").select("id, created_at").eq("farm_id", farmId).is("deleted_at", null), []),
    safeQuery(supabase.from("cows").select("id, created_at").eq("farm_id", farmId).eq("is_active", true), []),
    safeQuery(supabase.from("feature_votes").select("id, created_at").eq("farm_id", farmId), []),
    safeQuery(supabase.from("support_tickets").select("id, created_at").eq("farm_id", farmId), [])
  ]);

  const settlementMilk = sumRows(settlements, "total_liters");
  const slipMilk = sumRows(dairySlips, "liters");
  const recordMilk = sumRows(milkRecords, "total_litres");
  const totalMilk = Math.max(settlementMilk, slipMilk, recordMilk);

  const settlementIncome = sumRows(settlements, "total_milk_income");
  const slipIncome = sumRows(dairySlips, "total_amount");
  const recordIncome = sumRows(milkRecords, "total_amount");
  const totalIncome = Math.max(settlementIncome, slipIncome, recordIncome);

  const dateValues = [
    ...dairySlips.map((row) => row.slip_date),
    ...milkRecords.filter((row) => numberValue(row.total_litres) > 0).map((row) => row.date)
  ];
  const streaks = calculateStreaks(dateValues);
  const milkRecordCount = Math.max(dairySlips.length, milkRecords.length);
  const slipsUploaded = slipUploads.filter((row) => ["success", "saved"].includes(row.extraction_status)).length;
  const aiQuestions = aiLogs.length;
  const activeCows = cows.length;
  const communityActions = featureVotes.length + supportTickets.length;
  const daysActive = farm?.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(farm.created_at).getTime()) / (24 * 60 * 60 * 1000)))
    : 0;
  const recentCutoff = addDays(todayISO(), -30);
  const recentActivity = dateValues.filter((date) => isoDateOnly(date) >= recentCutoff).length;
  const profileScore = profileCompletion({ user: auth.user, farm, profile });
  const dataQualityScore = averageQualityRows(dairySlips, milkRecords);
  const balancedUsageScore = [
    totalMilk > 0,
    slipsUploaded > 0,
    aiQuestions > 0,
    activeCows > 0,
    streaks.currentStreakDays >= 7,
    profileScore >= 80
  ].filter(Boolean).length;

  return {
    farm,
    profile,
    total_milk_liters: round(totalMilk),
    settlement_milk_liters: round(settlementMilk),
    dairy_slip_milk_liters: round(slipMilk),
    milk_record_liters: round(recordMilk),
    total_income: round(totalIncome),
    slips_uploaded: slipsUploaded,
    ai_questions: aiQuestions,
    current_streak_days: streaks.currentStreakDays,
    longest_streak_days: streaks.longestStreakDays,
    record_days: streaks.recordDays,
    milk_record_count: milkRecordCount,
    active_cows: activeCows,
    days_active: daysActive,
    community_actions: communityActions,
    recent_activity_days: recentActivity,
    profile_completion: profileScore,
    data_quality_score: dataQualityScore,
    balanced_usage_score: balancedUsageScore
  };
}

export function calculateDairyScore(metrics) {
  const milkScore = clamp((metrics.total_milk_liters / 10000) * 100);
  const consistencyScore = clamp((metrics.current_streak_days / 30) * 100);
  const ocrScore = clamp((metrics.slips_uploaded / 50) * 100);
  const aiScore = clamp((metrics.ai_questions / 50) * 100);
  const activityScore = clamp((metrics.recent_activity_days / 25) * 100);
  const profileScore = clamp(metrics.profile_completion);
  const dataQualityScore = clamp(metrics.data_quality_score);

  const dairyScore = round(
    milkScore * 0.20 +
    consistencyScore * 0.18 +
    ocrScore * 0.12 +
    aiScore * 0.12 +
    activityScore * 0.14 +
    profileScore * 0.14 +
    dataQualityScore * 0.10
  );

  return {
    dairyScore,
    components: {
      milkScore: round(milkScore),
      consistencyScore: round(consistencyScore),
      ocrScore: round(ocrScore),
      aiScore: round(aiScore),
      activityScore: round(activityScore),
      profileScore: round(profileScore),
      dataQualityScore: round(dataQualityScore)
    },
    rank: rankForScore(dairyScore),
    nextRank: nextRankForScore(dairyScore)
  };
}

function achievementCurrentValue(achievement, metrics) {
  return round(metrics[achievement.metric_key] || 0);
}

function normalizeAchievement(achievement, progress, unlockedIds) {
  const isUnlocked = unlockedIds.has(achievement.id) || progress?.is_unlocked;
  const isHiddenLocked = achievement.is_secret && !isUnlocked;

  return {
    id: achievement.id,
    code: achievement.code,
    category: achievement.category,
    categoryLabel: categoryLabels[achievement.category] || achievement.category,
    title: isHiddenLocked ? "Secret Achievement" : achievement.title,
    description: isHiddenLocked ? "गुप्त achievement. Progress केल्यावर unlock होईल." : achievement.description,
    icon: isHiddenLocked ? "🔒" : achievement.icon,
    metricKey: achievement.metric_key,
    targetValue: numberValue(achievement.target_value),
    points: Number(achievement.points || 0),
    rarity: achievement.rarity,
    rewardType: achievement.reward_type,
    rewardValue: isHiddenLocked ? null : achievement.reward_value,
    isSecret: Boolean(achievement.is_secret),
    currentValue: round(progress?.current_value || 0),
    progressPercent: clamp(progress?.progress_percent || 0),
    remainingValue: Math.max(0, round(progress?.remaining_value || 0)),
    isUnlocked: Boolean(isUnlocked),
    unlockedAt: progress?.unlocked_at || null
  };
}

async function loadDefinitions(supabase) {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function sendUnlockNotifications(supabase, auth, newlyUnlocked = [], rankChanged = null) {
  const notifications = [];

  for (const achievement of newlyUnlocked.slice(0, 8)) {
    const title = "🎉 अभिनंदन!";
    const message = `तुम्ही "${achievement.title}" Achievement पूर्ण केले आहे.`;
    const { data, error } = await supabase
      .from("achievement_notifications")
      .insert({
        farm_id: auth.farmId,
        user_id: auth.userId,
        achievement_id: achievement.id,
        title,
        message,
        notification_type: "achievement_unlocked"
      })
      .select("*")
      .single();
    if (!error && data) {
      notifications.push({ ...data, achievement });
      await createAchievementAppNotification(supabase, auth, { title, message, url: "/achievements" });
    }
  }

  if (rankChanged) {
    const title = "🏆 Rank वाढला";
    const message = `तुमचा Dairy Rank आता "${rankChanged.newRank.label}" झाला आहे.`;
    const { data, error } = await supabase
      .from("achievement_notifications")
      .insert({
        farm_id: auth.farmId,
        user_id: auth.userId,
        title,
        message,
        notification_type: "rank_increased"
      })
      .select("*")
      .single();
    if (!error && data) {
      notifications.push(data);
      await createAchievementAppNotification(supabase, auth, { title, message, url: "/profile/score" });
    }
  }

  return notifications;
}

async function updateLeaderboardRows(supabase, auth, metrics, scoreData, farm) {
  const rows = [
    ["farm", scoreData.dairyScore],
    ["milk", metrics.total_milk_liters],
    ["ai_usage", metrics.ai_questions],
    ["ocr_usage", metrics.slips_uploaded],
    ["activity", metrics.recent_activity_days],
    ["district", scoreData.dairyScore]
  ].map(([type, score]) => ({
    leaderboard_type: type,
    period_key: "all_time",
    farm_id: auth.farmId,
    user_id: auth.userId,
    farm_name: farm?.farm_name || auth.decoded?.farmName || "माझी डेअरी",
    district_name: farm?.district_name || "",
    score: round(score),
    metrics,
    calculated_at: new Date().toISOString()
  }));

  await supabase.from("leaderboards").upsert(rows, { onConflict: "leaderboard_type,period_key,farm_id" });
}

export async function evaluateAchievements(supabase, auth, options = {}) {
  const notify = options.notify !== false;
  const [definitions, existingUnlocked, existingScore] = await Promise.all([
    loadDefinitions(supabase),
    safeQuery(supabase.from("user_achievements").select("achievement_id").eq("farm_id", auth.farmId), []),
    safeQuery(supabase.from("user_scores").select("*").eq("farm_id", auth.farmId).maybeSingle(), null)
  ]);

  const metrics = await getAchievementMetrics(supabase, auth);
  const scoreData = calculateDairyScore(metrics);
  const unlockedIds = new Set(existingUnlocked.map((row) => row.achievement_id));
  const progressRows = [];
  const newlyUnlocked = [];

  for (const achievement of definitions) {
    const currentValue = achievementCurrentValue(achievement, metrics);
    const targetValue = numberValue(achievement.target_value);
    const progressPercent = targetValue > 0 ? clamp((currentValue / targetValue) * 100) : 0;
    const isUnlocked = currentValue >= targetValue;

    progressRows.push({
      farm_id: auth.farmId,
      user_id: auth.userId,
      achievement_id: achievement.id,
      current_value: currentValue,
      target_value: targetValue,
      progress_percent: round(progressPercent),
      remaining_value: Math.max(0, round(targetValue - currentValue)),
      is_unlocked: isUnlocked,
      last_evaluated_at: new Date().toISOString()
    });

    if (isUnlocked && !unlockedIds.has(achievement.id)) {
      newlyUnlocked.push(achievement);
      unlockedIds.add(achievement.id);
    }
  }

  if (progressRows.length) {
    const { error } = await supabase.from("achievement_progress").upsert(progressRows, {
      onConflict: "farm_id,achievement_id"
    });
    if (error) throw error;
  }

  if (newlyUnlocked.length) {
    const { error } = await supabase.from("user_achievements").insert(
      newlyUnlocked.map((achievement) => ({
        farm_id: auth.farmId,
        user_id: auth.userId,
        achievement_id: achievement.id,
        points_awarded: achievement.points
      }))
    );
    if (error && error.code !== "23505") throw error;

    await supabase.from("achievement_audit_logs").insert(newlyUnlocked.map((achievement) => ({
      farm_id: auth.farmId,
      user_id: auth.userId,
      achievement_id: achievement.id,
      action: "achievement_earned",
      details: { code: achievement.code, title: achievement.title, points: achievement.points }
    })));
  }

  const totalPoints = await safeQuery(
    supabase
      .from("user_achievements")
      .select("points_awarded")
      .eq("farm_id", auth.farmId),
    []
  );
  const achievementPoints = totalPoints.reduce((sum, row) => sum + Number(row.points_awarded || 0), 0);
  const totalUnlockedCount = totalPoints.length;
  const currentRank = scoreData.rank;
  const rankChanged = existingScore?.rank_code && existingScore.rank_code !== currentRank.code
    ? { oldRank: { code: existingScore.rank_code, label: existingScore.rank_label }, newRank: currentRank }
    : null;

  await supabase.from("user_scores").upsert({
    farm_id: auth.farmId,
    user_id: auth.userId,
    farm_name: metrics.farm?.farm_name || auth.decoded?.farmName || "माझी डेअरी",
    district_name: metrics.farm?.district_name || "",
    dairy_score: scoreData.dairyScore,
    achievement_points: achievementPoints,
    achievements_unlocked: totalUnlockedCount,
    total_achievements: definitions.filter((item) => !item.is_secret || unlockedIds.has(item.id)).length,
    rank_code: currentRank.code,
    rank_label: currentRank.label,
    milk_score: scoreData.components.milkScore,
    ai_score: scoreData.components.aiScore,
    ocr_score: scoreData.components.ocrScore,
    activity_score: scoreData.components.activityScore,
    consistency_score: scoreData.components.consistencyScore,
    profile_score: scoreData.components.profileScore,
    data_quality_score: scoreData.components.dataQualityScore,
    total_milk_liters: metrics.total_milk_liters,
    total_income: metrics.total_income,
    ai_questions: metrics.ai_questions,
    slips_uploaded: metrics.slips_uploaded,
    recent_activity_days: metrics.recent_activity_days,
    metrics,
    updated_at: new Date().toISOString()
  }, { onConflict: "farm_id" });

  if (rankChanged) {
    await supabase.from("user_ranks").insert({
      farm_id: auth.farmId,
      user_id: auth.userId,
      old_rank_code: rankChanged.oldRank.code,
      new_rank_code: currentRank.code,
      old_score: existingScore?.dairy_score || null,
      new_score: scoreData.dairyScore
    });
    await supabase.from("achievement_audit_logs").insert({
      farm_id: auth.farmId,
      user_id: auth.userId,
      action: "rank_changed",
      details: { oldRank: rankChanged.oldRank, newRank: currentRank, score: scoreData.dairyScore }
    });
  }

  await updateLeaderboardRows(supabase, auth, metrics, scoreData, metrics.farm);

  const notifications = notify
    ? await sendUnlockNotifications(supabase, auth, newlyUnlocked, rankChanged)
    : [];

  const latestProgress = await safeQuery(
    supabase
      .from("achievement_progress")
      .select("*, achievements(*)")
      .eq("farm_id", auth.farmId)
      .order("progress_percent", { ascending: false }),
    []
  );

  const achievements = latestProgress
    .filter((row) => row.achievements)
    .map((row) => normalizeAchievement(row.achievements, {
      ...row,
      unlocked_at: newlyUnlocked.find((item) => item.id === row.achievement_id)?.unlocked_at || null
    }, unlockedIds));

  const visibleAchievements = achievements.filter((achievement) => !achievement.isSecret || achievement.isUnlocked);
  const nextReward = achievements
    .filter((achievement) => !achievement.isUnlocked)
    .sort((a, b) => b.progressPercent - a.progressPercent)[0] || null;

  return {
    metrics,
    score: {
      dairyScore: scoreData.dairyScore,
      rank: currentRank,
      nextRank: scoreData.nextRank,
      components: scoreData.components,
      achievementPoints
    },
    stats: {
      totalAchievements: visibleAchievements.length,
      unlockedAchievements: achievements.filter((item) => item.isUnlocked).length,
      lockedAchievements: visibleAchievements.filter((item) => !item.isUnlocked).length,
      progressPercent: visibleAchievements.length
        ? round((visibleAchievements.filter((item) => item.isUnlocked).length / visibleAchievements.length) * 100)
        : 0,
      nextReward
    },
    categories: categoryLabels,
    achievements: visibleAchievements,
    hiddenLockedCount: achievements.filter((item) => item.isSecret && !item.isUnlocked).length,
    newlyUnlocked: newlyUnlocked.map((achievement) => ({
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      icon: achievement.icon,
      points: achievement.points
    })),
    notifications
  };
}

export async function getLeaderboard(supabase, auth, type = "farm", scope = "all") {
  await evaluateAchievements(supabase, auth, { notify: false });
  const scoreColumn = {
    farm: "dairy_score",
    milk: "total_milk_liters",
    ai_usage: "ai_questions",
    ocr_usage: "slips_uploaded",
    activity: "recent_activity_days",
    district: "dairy_score"
  }[type] || "dairy_score";

  let query = supabase
    .from("user_scores")
    .select("*")
    .order(scoreColumn, { ascending: false })
    .limit(100);

  if (type === "district" || scope === "district") {
    const { data: currentScore } = await supabase
      .from("user_scores")
      .select("district_name")
      .eq("farm_id", auth.farmId)
      .maybeSingle();
    if (currentScore?.district_name) {
      query = query.eq("district_name", currentScore.district_name);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map((row, index) => ({
    rank: index + 1,
    farmId: row.farm_id,
    farmName: row.farm_name || "माझी डेअरी",
    districtName: row.district_name,
    dairyScore: round(row.dairy_score),
    achievementPoints: Number(row.achievement_points || 0),
    rankLabel: row.rank_label,
    metrics: row.metrics || {},
    isCurrentFarm: row.farm_id === auth.farmId
  }));

  let currentFarm = rows.find((row) => row.isCurrentFarm) || null;
  if (!currentFarm) {
    const { data: currentScore } = await supabase
      .from("user_scores")
      .select("*")
      .eq("farm_id", auth.farmId)
      .maybeSingle();

    if (currentScore) {
      let rankQuery = supabase
        .from("user_scores")
        .select("id", { count: "exact", head: true })
        .gt(scoreColumn, currentScore[scoreColumn] || 0);

      if (type === "district" || scope === "district") {
        if (currentScore.district_name) {
          rankQuery = rankQuery.eq("district_name", currentScore.district_name);
        }
      }

      const { count } = await rankQuery;
      currentFarm = {
        rank: Number(count || 0) + 1,
        farmId: currentScore.farm_id,
        farmName: currentScore.farm_name || "माझी डेअरी",
        districtName: currentScore.district_name,
        dairyScore: round(currentScore.dairy_score),
        achievementPoints: Number(currentScore.achievement_points || 0),
        rankLabel: currentScore.rank_label,
        metrics: currentScore.metrics || {},
        isCurrentFarm: true
      };
    }
  }

  return {
    type,
    scope,
    rows,
    currentFarm
  };
}

export function rankList() {
  return MILK_RANKS;
}
