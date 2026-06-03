import webpush from "web-push";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const BATCH_SIZE = 500;
const STORED_SCHEDULE_TYPES = ["once", "daily", "weekly", "monthly", "custom_cron"];
const notificationCategoryMap = {
  information: "system_updates",
  success: "system_updates",
  warning: "system_updates",
  critical: "support_messages",
  promotion: "promotional_notifications",
  system_update: "system_updates",
  subscription_reminder: "subscription_reminder",
  trial_expiry_reminder: "subscription_reminder",
  maintenance_notice: "system_updates",
  ai_feature_announcement: "ai_assistant_updates"
};

export const notificationTypes = [
  "information",
  "success",
  "warning",
  "critical",
  "promotion",
  "system_update",
  "subscription_reminder",
  "trial_expiry_reminder",
  "maintenance_notice",
  "ai_feature_announcement"
];

export const notificationPriorities = ["low", "normal", "high", "urgent"];

export const targetAudiences = [
  "all_farms",
  "selected_farms",
  "districts",
  "trial_farms",
  "active_subscriptions",
  "expired_subscriptions",
  "suspended_farms",
  "specific_users",
  "owners_only",
  "workers_only"
];

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function nullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) {
      return [];
    }
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to comma-separated parsing.
    }
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function asBoolean(value) {
  return value === true || value === "true";
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDateDaysAgo(days) {
  return addDays(new Date(), -Number(days || 0)).toISOString();
}

function isValidDateTime(value) {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function uniqueById(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.id) {
      map.set(row.id, row);
    }
  });
  return Array.from(map.values());
}

async function insertInBatches(supabase, table, rows, options = {}) {
  const inserted = [];

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const chunk = rows.slice(index, index + BATCH_SIZE);
    if (!chunk.length) {
      continue;
    }

    let query = supabase.from(table).insert(chunk);
    if (options.select) {
      query = query.select(options.select);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    if (data) {
      inserted.push(...data);
    }
  }

  return inserted;
}

async function upsertInBatches(supabase, table, rows, options = {}) {
  const inserted = [];

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const chunk = rows.slice(index, index + BATCH_SIZE);
    if (!chunk.length) {
      continue;
    }

    let query = supabase.from(table).upsert(chunk, { onConflict: options.onConflict });
    if (options.select) {
      query = query.select(options.select);
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    if (data) {
      inserted.push(...data);
    }
  }

  return inserted;
}

function getWebPushConfigured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

function isQuietNow(preferences) {
  if (!preferences?.quiet_hours_enabled) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = String(preferences.quiet_hours_start || "22:00").split(":").map(Number);
  const [endHour, endMinute] = String(preferences.quiet_hours_end || "06:00").split(":").map(Number);
  const start = (startHour || 0) * 60 + (startMinute || 0);
  const end = (endHour || 0) * 60 + (endMinute || 0);

  if (start === end) return false;
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

async function filterRecipientsByPreferences(supabase, notification, recipients, channel) {
  if (!recipients.length || notification.priority === "urgent" || notification.type === "critical") {
    return recipients;
  }

  const userIds = recipients.map((recipient) => recipient.user_id).filter(Boolean);
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_id, categories, channels, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
    .in("user_id", userIds);

  if (error) {
    return recipients;
  }

  const prefsByUser = new Map((data || []).map((row) => [row.user_id, row]));
  const category = notificationCategoryMap[notification.type] || "system_updates";

  return recipients.filter((recipient) => {
    const prefs = prefsByUser.get(recipient.user_id);
    if (!prefs) return true;
    if (prefs.channels && prefs.channels[channel] === false) return false;
    if (prefs.categories && prefs.categories[category] === false) return false;
    if (channel === "push" && isQuietNow(prefs)) return false;
    return true;
  });
}

export function getStoredScheduleConfig(source = {}) {
  const rawScheduleType = source.scheduleType || source.schedule_type || "once";
  const recurrence = source.recurrence || source.schedule_type || "daily";
  const cronExpression = nullableText(source.cronExpression || source.cron_expression);

  let scheduleType = "once";
  if (rawScheduleType === "recurring") {
    scheduleType = STORED_SCHEDULE_TYPES.includes(recurrence) && recurrence !== "once" ? recurrence : "daily";
  } else if (rawScheduleType === "later" || rawScheduleType === "once") {
    scheduleType = "once";
  } else if (STORED_SCHEDULE_TYPES.includes(rawScheduleType)) {
    scheduleType = rawScheduleType;
  }

  if (scheduleType === "custom_cron" && !cronExpression) {
    throw new Error("Custom cron expression is required.");
  }

  return {
    schedule_type: scheduleType,
    cron_expression: scheduleType === "custom_cron" ? cronExpression : null
  };
}

export function normalizeNotificationPayload(body = {}) {
  const title = cleanText(body.title);
  const message = cleanText(body.message);

  if (!title) {
    throw new Error("Title is required.");
  }
  if (!message) {
    throw new Error("Message is required.");
  }

  const type = notificationTypes.includes(body.type) ? body.type : "information";
  const priority = notificationPriorities.includes(body.priority) ? body.priority : "normal";
  const targetAudience = targetAudiences.includes(body.targetAudience || body.target_audience)
    ? body.targetAudience || body.target_audience
    : "all_farms";
  const scheduleType = ["now", "later", "recurring"].includes(body.scheduleType) ? body.scheduleType : "now";
  const channels = parseJsonArray(body.channels).length ? parseJsonArray(body.channels) : ["in_app"];
  const scheduledAt = body.scheduledAt || body.scheduled_at || null;
  const expiresAt = body.expiresAt || body.expires_at || null;
  const farmIds = parseJsonArray(body.farmIds);
  const userIds = parseJsonArray(body.userIds);
  const districts = parseJsonArray(body.districts);
  const saveAsDraft = asBoolean(body.saveAsDraft);

  if (!channels.some((channel) => ["in_app", "push"].includes(channel))) {
    throw new Error("At least one delivery channel is required.");
  }

  if (!saveAsDraft && scheduleType !== "now" && !scheduledAt) {
    throw new Error("Schedule date and time are required.");
  }

  if (scheduledAt && !isValidDateTime(scheduledAt)) {
    throw new Error("Schedule date and time are invalid.");
  }

  if (!saveAsDraft && scheduleType !== "now" && scheduledAt && new Date(scheduledAt).getTime() < Date.now() - 60000) {
    throw new Error("Schedule date and time cannot be in the past.");
  }

  if (expiresAt && !isValidDateTime(expiresAt)) {
    throw new Error("Expiry date is invalid.");
  }

  if (expiresAt && scheduledAt && new Date(expiresAt).getTime() <= new Date(scheduledAt).getTime()) {
    throw new Error("Expiry date must be after the scheduled date.");
  }

  const selectedAudienceRequirements = {
    selected_farms: [farmIds, "Select at least one farm."],
    specific_users: [userIds, "Select at least one user."],
    districts: [districts, "Select at least one district."]
  };
  const requirement = selectedAudienceRequirements[targetAudience];
  if (requirement && !requirement[0].length) {
    throw new Error(requirement[1]);
  }

  return {
    title,
    message,
    type,
    priority,
    image_url: nullableText(body.imageUrl || body.image_url),
    action_text: nullableText(body.actionText || body.action_text),
    action_url: nullableText(body.actionUrl || body.action_url),
    target_audience: targetAudience,
    target_filter: {
      farmIds,
      userIds,
      districts,
      filters: body.filters && typeof body.filters === "object" ? body.filters : {}
    },
    channels,
    scheduled_at: scheduledAt,
    expires_at: expiresAt,
    scheduleType,
    recurrence: body.recurrence || null,
    cronExpression: nullableText(body.cronExpression || body.cron_expression),
    sendNow: scheduleType === "now" || asBoolean(body.sendNow),
    saveAsDraft
  };
}

async function getFarmIdsWithMilkSince(supabase, sinceISO) {
  const { data, error } = await supabase
    .from("milk_records")
    .select("farm_id")
    .gte("date", sinceISO.slice(0, 10));

  if (error) {
    throw error;
  }

  return new Set((data || []).map((row) => row.farm_id).filter(Boolean));
}

async function getFarmIdsWithAI(supabase) {
  const { data, error } = await supabase.from("ai_records").select("farm_id");

  if (error) {
    throw error;
  }

  return new Set((data || []).map((row) => row.farm_id).filter(Boolean));
}

async function applyAdvancedFarmFilters(supabase, farms, filters = {}) {
  let rows = farms || [];

  if (filters.cowCountGt !== undefined && filters.cowCountGt !== "") {
    rows = rows.filter((farm) => Number(farm.total_cows || 0) > Number(filters.cowCountGt));
  }

  if (filters.cowCountLt !== undefined && filters.cowCountLt !== "") {
    rows = rows.filter((farm) => Number(farm.total_cows || 0) < Number(filters.cowCountLt));
  }

  if (asBoolean(filters.inactive14Days)) {
    const cutoff = isoDateDaysAgo(14);
    rows = rows.filter((farm) => !farm.last_activity_at || new Date(farm.last_activity_at).getTime() < new Date(cutoff).getTime());
  }

  if (asBoolean(filters.recentlyRegistered)) {
    const cutoff = isoDateDaysAgo(30);
    rows = rows.filter((farm) => farm.created_at && new Date(farm.created_at).getTime() >= new Date(cutoff).getTime());
  }

  if (asBoolean(filters.subscriptionExpiringSoon)) {
    const now = new Date();
    const soon = addDays(now, 7);
    rows = rows.filter((farm) => {
      const expiry = farm.subscription_ends_at || farm.trial_ends_at;
      if (!expiry) return false;
      const time = new Date(expiry).getTime();
      return time >= now.getTime() && time <= soon.getTime();
    });
  }

  if (asBoolean(filters.milkEntriesLast7Days)) {
    const milkFarmIds = await getFarmIdsWithMilkSince(supabase, isoDateDaysAgo(7));
    rows = rows.filter((farm) => milkFarmIds.has(farm.id));
  }

  if (asBoolean(filters.noMilkEntry30Days)) {
    const milkFarmIds = await getFarmIdsWithMilkSince(supabase, isoDateDaysAgo(30));
    rows = rows.filter((farm) => !milkFarmIds.has(farm.id));
  }

  if (asBoolean(filters.aiUsers) || asBoolean(filters.nonAiUsers)) {
    const aiFarmIds = await getFarmIdsWithAI(supabase);
    if (asBoolean(filters.aiUsers)) {
      rows = rows.filter((farm) => aiFarmIds.has(farm.id));
    }
    if (asBoolean(filters.nonAiUsers)) {
      rows = rows.filter((farm) => !aiFarmIds.has(farm.id));
    }
  }

  return rows;
}

async function resolveTargetFarms(supabase, payload) {
  const { target_audience: targetAudience, target_filter: targetFilter } = payload;
  const farmIds = targetFilter?.farmIds || [];
  const districts = targetFilter?.districts || [];
  const filters = targetFilter?.filters || {};

  let query = supabase
    .from("farms")
    .select("id, farm_name, district_name, total_cows, subscription_status, is_active, trial_ends_at, subscription_ends_at, last_activity_at, created_at");

  if (targetAudience === "selected_farms") {
    if (!farmIds.length) return [];
    query = query.in("id", farmIds);
  } else if (targetAudience === "districts") {
    if (!districts.length) return [];
    query = query.in("district_name", districts).eq("is_active", true);
  } else if (targetAudience === "trial_farms") {
    query = query.eq("subscription_status", "trial").eq("is_active", true);
  } else if (targetAudience === "active_subscriptions") {
    query = query.eq("subscription_status", "active").eq("is_active", true);
  } else if (targetAudience === "expired_subscriptions") {
    query = query.eq("subscription_status", "expired").eq("is_active", true);
  } else if (targetAudience === "suspended_farms") {
    query = query.eq("is_active", false);
  } else {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.limit(100000);
  if (error) {
    throw error;
  }

  return applyAdvancedFarmFilters(supabase, data || [], filters);
}

async function resolveUsersFromFarms(supabase, farms, payload) {
  const farmIds = (farms || []).map((farm) => farm.id);
  if (!farmIds.length) {
    return [];
  }

  let query = supabase
    .from("users")
    .select("id, farm_id, name, role, is_farm_owner, is_active")
    .in("farm_id", farmIds)
    .eq("is_active", true);

  if (payload.target_audience === "owners_only") {
    query = query.eq("is_farm_owner", true);
  } else if (payload.target_audience === "workers_only") {
    query = query.eq("role", "worker").eq("is_farm_owner", false);
  }

  const { data, error } = await query.limit(100000);
  if (error) {
    throw error;
  }

  return uniqueById(data || []);
}

async function resolveSpecificUsers(supabase, userIds) {
  if (!userIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, farm_id, name, role, is_farm_owner, is_active")
    .in("id", userIds)
    .eq("is_active", true)
    .limit(100000);

  if (error) {
    throw error;
  }

  return uniqueById(data || []);
}

export async function resolveNotificationRecipients(supabase, payload) {
  if (payload.target_audience === "specific_users") {
    const users = await resolveSpecificUsers(supabase, payload.target_filter?.userIds || []);
    return {
      farms: [],
      users,
      recipients: users.map((user) => ({ user_id: user.id, farm_id: user.farm_id }))
    };
  }

  const farms = await resolveTargetFarms(supabase, payload);
  const users = await resolveUsersFromFarms(supabase, farms, payload);

  return {
    farms,
    users,
    recipients: users.map((user) => ({ user_id: user.id, farm_id: user.farm_id }))
  };
}

export async function createNotificationTargets(supabase, notificationId, payload, resolved) {
  const rows = [];
  const filter = payload.target_filter || {};

  if (payload.target_audience === "selected_farms") {
    (resolved.farms || []).forEach((farm) => {
      rows.push({ notification_id: notificationId, farm_id: farm.id, target_type: "selected_farm" });
    });
  } else if (payload.target_audience === "districts") {
    (filter.districts || []).forEach((district) => {
      rows.push({ notification_id: notificationId, district, target_type: "district" });
    });
  } else if (payload.target_audience === "specific_users") {
    (resolved.users || []).forEach((user) => {
      rows.push({ notification_id: notificationId, farm_id: user.farm_id, user_id: user.id, target_type: "specific_user" });
    });
  } else {
    rows.push({ notification_id: notificationId, target_type: payload.target_audience });
  }

  if (rows.length) {
    await insertInBatches(supabase, "notification_targets", rows);
  }
}

export async function createAdminNotification(supabase, adminId, body) {
  const payload = normalizeNotificationPayload(body);
  const status = payload.saveAsDraft ? "draft" : payload.scheduleType === "later" || payload.scheduleType === "recurring" ? "scheduled" : "draft";
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority,
      image_url: payload.image_url,
      action_text: payload.action_text,
      action_url: payload.action_url,
      target_audience: payload.target_audience,
      target_filter: payload.target_filter,
      channels: payload.channels,
      created_by: adminId,
      scheduled_at: payload.scheduled_at,
      expires_at: payload.expires_at,
      status
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  let resolved;
  try {
    resolved = await resolveNotificationRecipients(supabase, payload);
    await createNotificationTargets(supabase, notification.id, payload, resolved);
  } catch (targetError) {
    await supabase
      .from("notifications")
      .update({
        status: "failed",
        failure_reason: targetError.message || "Recipient targeting failed."
      })
      .eq("id", notification.id);
    throw targetError;
  }

  if (status === "scheduled") {
    const scheduleConfig = getStoredScheduleConfig(payload);
    const { error: scheduleError } = await supabase.from("scheduled_notifications").insert({
      notification_id: notification.id,
      schedule_type: scheduleConfig.schedule_type,
      cron_expression: scheduleConfig.cron_expression,
      next_run_at: payload.scheduled_at,
      status: "active"
    });
    if (scheduleError) {
      await supabase
        .from("notifications")
        .update({
          status: "failed",
          failure_reason: scheduleError.message || "Schedule creation failed."
        })
        .eq("id", notification.id);
      throw scheduleError;
    }
  }

  return {
    notification,
    payload,
    resolved,
    recipientCount: resolved.recipients.length
  };
}

async function sendPushForNotification(supabase, notification, recipients) {
  const configured = getWebPushConfigured();
  const allowedRecipients = await filterRecipientsByPreferences(supabase, notification, recipients, "push");
  if (!configured || !allowedRecipients.length) {
    return {
      attempted: 0,
      delivered: 0,
      failed: 0,
      configured,
      missingSubscriptions: configured ? allowedRecipients.length : 0,
      attemptedSubscriptions: 0,
      deliveredSubscriptions: 0,
      failedSubscriptions: 0
    };
  }

  const userIds = allowedRecipients.map((recipient) => recipient.user_id).filter(Boolean);
  const { data: subscriptions, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .in("user_id", userIds)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const subscriptionsByUser = new Map();
  (subscriptions || []).forEach((subscription) => {
    if (!subscription.user_id) return;
    const rows = subscriptionsByUser.get(subscription.user_id) || [];
    rows.push(subscription);
    subscriptionsByUser.set(subscription.user_id, rows);
  });

  const payload = JSON.stringify({
    id: notification.id,
    title: notification.title,
    body: notification.message,
    url: notification.action_url || "/notifications",
    tag: `notification:${notification.id}`,
    icon: notification.image_url || "/icons/icon-192x192.png"
  });

  let deliveredUsers = 0;
  let failedUsers = 0;
  let attemptedSubscriptions = 0;
  let deliveredSubscriptions = 0;
  let failedSubscriptions = 0;

  for (const recipient of allowedRecipients) {
    const userSubscriptions = subscriptionsByUser.get(recipient.user_id) || [];
    if (!userSubscriptions.length) {
      continue;
    }

    let userDelivered = false;
    let lastError = null;

    for (const subscription of userSubscriptions) {
      attemptedSubscriptions += 1;
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        );
        userDelivered = true;
        deliveredSubscriptions += 1;
      } catch (error) {
        failedSubscriptions += 1;
        lastError = error;
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", subscription.id);
        }
      }
    }

    if (userDelivered) {
      deliveredUsers += 1;
      await supabase.from("notification_delivery_logs").upsert({
        notification_id: notification.id,
        farm_id: recipient.farm_id,
        user_id: recipient.user_id,
        channel: "push",
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
        error_message: null
      }, { onConflict: "notification_id,user_id,channel" });
    } else {
      failedUsers += 1;
      await supabase.from("notification_delivery_logs").upsert({
        notification_id: notification.id,
        farm_id: recipient.farm_id,
        user_id: recipient.user_id,
        channel: "push",
        delivery_status: "failed",
        error_message: lastError?.message || "Push delivery failed",
        retry_count: 1
      }, { onConflict: "notification_id,user_id,channel" });
    }
  }

  const activeSubscriptionUsers = subscriptionsByUser.size;

  return {
    attempted: activeSubscriptionUsers,
    delivered: deliveredUsers,
    failed: failedUsers,
    configured: true,
    missingSubscriptions: Math.max(0, allowedRecipients.length - activeSubscriptionUsers),
    attemptedSubscriptions,
    deliveredSubscriptions,
    failedSubscriptions
  };
}

export async function sendDirectPushToUser(supabase, userId, payload = {}) {
  if (!getWebPushConfigured()) {
    throw new Error("Push notification keys configure केलेले नाहीत.");
  }

  const { data: subscriptions, error } = await supabase
    .from("user_push_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }
  if (!subscriptions?.length) {
    throw new Error("या user ची push subscription सापडली नाही. आधी mobile notification चालू करा.");
  }

  const body = JSON.stringify({
    id: payload.id || `test:${Date.now()}`,
    title: payload.title || "🐄 माझी डेअरी",
    body: payload.body || "Test notification आली आहे.",
    url: payload.url || "/notifications",
    tag: payload.tag || "majhi-dairy-test",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png"
  });

  let delivered = 0;
  let failed = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        body
      );
      delivered += 1;
    } catch (error) {
      failed += 1;
      if (error.statusCode === 404 || error.statusCode === 410) {
        await supabase.from("user_push_subscriptions").update({ is_active: false }).eq("id", subscription.id);
      }
    }
  }

  return { attempted: subscriptions.length, delivered, failed };
}

export async function sendNotificationNow(supabase, notificationId) {
  const { data: notification, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .single();

  if (error || !notification) {
    throw error || new Error("Notification not found.");
  }

  if (notification.status === "cancelled") {
    throw new Error("Cancelled notification cannot be sent.");
  }
  if (notification.status === "sent") {
    throw new Error("Notification is already sent.");
  }
  if (notification.expires_at && new Date(notification.expires_at).getTime() < Date.now()) {
    throw new Error("Expired notification cannot be sent.");
  }

  const { data: lockedNotification, error: sendingError } = await supabase
    .from("notifications")
    .update({ status: "sending", failure_reason: null })
    .eq("id", notificationId)
    .eq("status", notification.status)
    .select("id")
    .maybeSingle();
  if (sendingError) {
    throw sendingError;
  }
  if (!lockedNotification) {
    throw new Error("Notification is already being processed.");
  }

  try {
    const payload = {
      ...notification,
      target_audience: notification.target_audience,
      target_filter: notification.target_filter || {},
      channels: Array.isArray(notification.channels) ? notification.channels : ["in_app"]
    };
    const channels = payload.channels || ["in_app"];
    const inAppRequested = channels.includes("in_app");
    const pushRequested = channels.includes("push");
    const resolved = await resolveNotificationRecipients(supabase, payload);
    if (!resolved.recipients.length) {
      throw new Error("No active users found for selected audience.");
    }
    const inAppRecipients = inAppRequested
      ? await filterRecipientsByPreferences(supabase, notification, resolved.recipients, "in_app")
      : [];

    const inAppRows = inAppRequested
      ? inAppRecipients.map((recipient) => ({
          notification_id: notificationId,
          farm_id: recipient.farm_id,
          user_id: recipient.user_id,
          channel: "in_app",
          delivery_status: "delivered",
          delivered_at: new Date().toISOString()
        }))
      : [];

    if (inAppRows.length) {
      await upsertInBatches(supabase, "notification_delivery_logs", inAppRows, {
        onConflict: "notification_id,user_id,channel"
      });
    }

    let pushStats = { attempted: 0, delivered: 0, failed: 0, configured: false };
    if (pushRequested) {
      pushStats = await sendPushForNotification(supabase, notification, resolved.recipients);
    }

    const now = new Date().toISOString();
    const failureReason = pushStats.failed
      ? `${pushStats.failed} push deliveries failed.`
      : pushRequested && !pushStats.configured
        ? "Push keys are not configured."
        : pushRequested && pushStats.attempted === 0
          ? "No active push subscriptions found for selected users."
          : pushRequested && pushStats.missingSubscriptions > 0
            ? `${pushStats.missingSubscriptions} selected users have no active push subscription.`
            : null;
    const deliveredCount = inAppRequested ? inAppRows.length : pushStats.delivered;
    const update = {
      status: "sent",
      sent_at: now,
      total_recipients: resolved.recipients.length,
      delivered_count: deliveredCount,
      failure_reason: failureReason
    };
    const { data: updated, error: updateError } = await supabase
      .from("notifications")
      .update(update)
      .eq("id", notificationId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      notification: updated,
      recipientCount: resolved.recipients.length,
      inAppDelivered: inAppRows.length,
      push: pushStats
    };
  } catch (sendError) {
    await supabase
      .from("notifications")
      .update({
        status: "failed",
        failure_reason: sendError.message || "Notification delivery failed."
      })
      .eq("id", notificationId);
    throw sendError;
  }
}

export async function refreshNotificationStats(supabase, notificationId) {
  const { data: logs, error } = await supabase
    .from("notification_delivery_logs")
    .select("user_id, channel, delivery_status, opened_at, clicked_at")
    .eq("notification_id", notificationId)
    .eq("channel", "in_app");

  if (error) {
    throw error;
  }

  const delivered = (logs || []).filter((log) => log.delivery_status !== "failed").length;
  const opened = (logs || []).filter((log) => log.opened_at).length;
  const clicked = (logs || []).filter((log) => log.clicked_at).length;

  const { error: updateError } = await supabase
    .from("notifications")
    .update({
      delivered_count: delivered,
      opened_count: opened,
      clicked_count: clicked
    })
    .eq("id", notificationId);

  if (updateError) {
    throw updateError;
  }

  return { delivered, opened, clicked };
}

export async function getAdminNotificationAnalytics(supabase) {
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, title, type, priority, status, total_recipients, delivered_count, opened_count, clicked_count, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  const rows = notifications || [];
  const totalSent = rows.filter((row) => row.status === "sent").length;
  const totalRecipients = rows.reduce((sum, row) => sum + Number(row.total_recipients || 0), 0);
  const delivered = rows.reduce((sum, row) => sum + Number(row.delivered_count || 0), 0);
  const opened = rows.reduce((sum, row) => sum + Number(row.opened_count || 0), 0);
  const clicked = rows.reduce((sum, row) => sum + Number(row.clicked_count || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  const { data: unreadLogs, error: unreadError } = await supabase
    .from("notification_delivery_logs")
    .select("id, notifications(status, expires_at)")
    .eq("channel", "in_app")
    .is("opened_at", null)
    .is("deleted_at", null)
    .limit(10000);

  if (unreadError) {
    throw unreadError;
  }
  const unreadCount = (unreadLogs || []).filter((log) => (
    log.notifications?.status === "sent" &&
    (!log.notifications?.expires_at || new Date(log.notifications.expires_at).getTime() >= Date.now())
  )).length;

  const { count: failedCount } = await supabase
    .from("notification_delivery_logs")
    .select("id", { count: "exact", head: true })
    .eq("delivery_status", "failed");

  return {
    totals: {
      totalSent,
      sentToday: rows.filter((row) => row.status === "sent" && String(row.sent_at || "").startsWith(today)).length,
      unread: unreadCount || 0,
      read: opened,
      failed: failedCount || 0,
      totalRecipients,
      delivered,
      opened,
      clicked,
      openRate: delivered ? Number(((opened / delivered) * 100).toFixed(1)) : 0,
      clickRate: delivered ? Number(((clicked / delivered) * 100).toFixed(1)) : 0
    },
    recent: rows.slice(0, 12),
    mostOpened: [...rows].sort((a, b) => Number(b.opened_count || 0) - Number(a.opened_count || 0)).slice(0, 8),
    mostClicked: [...rows].sort((a, b) => Number(b.clicked_count || 0) - Number(a.clicked_count || 0)).slice(0, 8)
  };
}

export function getPagination(searchParams) {
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
    : DEFAULT_PAGE_SIZE;
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}
