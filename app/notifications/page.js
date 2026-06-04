"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { getClientAuthToken } from "@/lib/clientStorage";
import { cacheNotifications, getCachedNotifications, updateCachedNotification } from "@/lib/localDB";
import { toMarathiNumerals } from "@/lib/marathiUtils";
import { getPushPermissionState, pushNotificationsSupported, requestAndRegisterPushSubscription } from "@/lib/pushClient";
import { supabase } from "@/lib/supabase";

const typeLabels = {
  information: "माहिती",
  success: "चांगली बातमी",
  warning: "सूचना",
  critical: "महत्त्वाची",
  promotion: "ऑफर",
  system_update: "अपडेट",
  subscription_reminder: "Subscription",
  trial_expiry_reminder: "Trial",
  maintenance_notice: "देखभाल",
  ai_feature_announcement: "AI सुविधा"
};

const typeTone = {
  information: "border-blue-200 bg-blue-50 text-blue-950",
  success: "border-green-200 bg-green-50 text-green-950",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-950",
  critical: "border-red-200 bg-red-50 text-red-950",
  promotion: "border-purple-200 bg-purple-50 text-purple-950",
  system_update: "border-sky-200 bg-sky-50 text-sky-950",
  subscription_reminder: "border-orange-200 bg-orange-50 text-orange-950",
  trial_expiry_reminder: "border-amber-200 bg-amber-50 text-amber-950",
  maintenance_notice: "border-slate-200 bg-slate-50 text-slate-950",
  ai_feature_announcement: "border-emerald-200 bg-emerald-50 text-emerald-950"
};

function getAuthToken() {
  return getClientAuthToken();
}

function getTokenClaims() {
  try {
    const token = getAuthToken();
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "";
  return toMarathiNumerals(new Date(value).toLocaleString("mr-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }));
}

function NotificationCard({ notification, onRead, onDelete, onClickAction }) {
  const tone = typeTone[notification.type] || typeTone.information;

  return (
    <article className={`dashboard-card rounded-lg border p-4 shadow-soft ${tone} ${notification.unread ? "ring-2 ring-green-300" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-black shadow-sm">
              {typeLabels[notification.type] || "सूचना"}
            </span>
            {notification.unread ? <span className="rounded-full bg-red-600 px-2 py-1 text-[12px] font-black text-white">नवीन</span> : null}
          </div>
          <h2 className="mt-3 text-[22px] font-black leading-tight">{notification.title}</h2>
          <p className="mt-2 text-[17px] font-bold leading-relaxed opacity-80">{notification.message}</p>
          <p className="mt-3 text-[14px] font-bold opacity-60">{formatDate(notification.deliveredAt || notification.sent_at || notification.created_at)}</p>
        </div>
        <span className="text-[30px]" aria-hidden="true">🔔</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {notification.action_text && notification.action_url ? (
          <Link
            href={notification.action_url}
            onClick={() => onClickAction(notification)}
            className="min-h-[46px] rounded-lg bg-slate-950 px-4 py-2 text-[16px] font-extrabold text-white"
          >
            {notification.action_text}
          </Link>
        ) : null}
        {notification.unread ? (
          <button type="button" onClick={() => onRead(notification)} className="min-h-[46px] rounded-lg bg-white px-4 text-[16px] font-extrabold shadow-sm ring-1 ring-white/70">
            वाचले
          </button>
        ) : null}
        <button type="button" onClick={() => onDelete(notification)} className="min-h-[46px] rounded-lg bg-white/80 px-4 text-[16px] font-extrabold text-red-700 shadow-sm ring-1 ring-white/70">
          काढा
        </button>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushStatus, setPushStatus] = useState(null);
  const [testingPush, setTestingPush] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await getCachedNotifications();
        setNotifications(cached);
        setUnreadCount(cached.filter((item) => !item.readAt && !item.deletedAt).length);
        return;
      }

      const response = await fetch(`/api/notifications?filter=${filter}&type=${type}&search=${encodeURIComponent(search)}&limit=50`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सूचना मिळाल्या नाहीत.");
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
      await cacheNotifications(result.notifications || []);
    } catch (loadError) {
      const cached = await getCachedNotifications();
      setNotifications(cached);
      setUnreadCount(cached.filter((item) => !item.readAt && !item.deletedAt).length);
      setError(cached.length ? "" : loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filter, search, type]);

  useEffect(() => {
    load();
  }, [load]);

  const loadPushStatus = useCallback(async () => {
    if (!pushNotificationsSupported()) {
      setPushStatus({ supported: false, permission: "unsupported", activeSubscriptions: 0 });
      return;
    }

    const permission = getPushPermissionState();
    const token = getAuthToken();
    if (!token) {
      setPushStatus({ supported: true, permission, activeSubscriptions: 0 });
      return;
    }

    try {
      const response = await fetch("/api/notifications/push-status", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));
      setPushStatus({
        supported: true,
        permission,
        activeSubscriptions: result.activeSubscriptions || 0,
        vapidPublicKeyConfigured: Boolean(result.vapidPublicKeyConfigured),
        vapidPrivateKeyConfigured: Boolean(result.vapidPrivateKeyConfigured),
        latestSubscriptionSeenAt: result.latestSubscriptionSeenAt || null
      });
    } catch {
      setPushStatus({ supported: true, permission, activeSubscriptions: 0, statusError: true });
    }
  }, []);

  useEffect(() => {
    loadPushStatus();
  }, [loadPushStatus]);

  useEffect(() => {
    const claims = getTokenClaims();
    if (!supabase || !claims?.userId) {
      return undefined;
    }

    const channel = supabase
      .channel(`notifications-page-${claims.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_delivery_logs",
          filter: `user_id=eq.${claims.userId}`
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const visibleNotifications = useMemo(() => notifications.filter((item) => !item.deletedAt), [notifications]);

  async function patchNotification(notification, action) {
    const patch = action === "delete"
      ? { deletedAt: new Date().toISOString(), unread: false }
      : { readAt: new Date().toISOString(), unread: false };

    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, ...patch } : item));
    await updateCachedNotification(notification.id, patch);
    window.dispatchEvent(new CustomEvent("notification-updated"));

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    await fetch(`/api/notifications/${notification.id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
      body: action === "delete" ? undefined : JSON.stringify({ action })
    });
    load();
  }

  async function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString(), unread: false })));
    setUnreadCount(0);
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    window.dispatchEvent(new CustomEvent("notification-updated"));
    load();
  }

  async function testMobilePush() {
    setTestingPush(true);
    setPushMessage("");
    try {
      const subscription = await requestAndRegisterPushSubscription({ requestPermission: true });
      if (!subscription.success) {
        setPushMessage(subscription.message || "मोबाइल notification चालू झाले नाही.");
        return;
      }

      const response = await fetch("/api/notifications/test-push", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Test notification पाठवता आली नाही.");
      }
      setPushMessage(result.message || "Test notification पाठवली.");
      loadPushStatus();
    } catch (pushError) {
      setPushMessage(pushError.message || "Test notification मध्ये अडचण आली.");
    } finally {
      setTestingPush(false);
    }
  }

  function getPushStatusText() {
    if (!pushStatus) return "Mobile notification स्थिती तपासत आहे...";
    if (!pushStatus.supported) return "या browser मध्ये mobile push notification support नाही.";
    if (pushStatus.permission === "denied") return "Notification permission blocked आहे. Browser settings मधून allow करा.";
    if (pushStatus.permission !== "granted") return "Notification permission अजून दिलेली नाही.";
    if (!pushStatus.vapidPublicKeyConfigured || !pushStatus.vapidPrivateKeyConfigured) return "Push keys server वर configure नाहीत.";
    if ((pushStatus.activeSubscriptions || 0) < 1) return "Permission आहे, पण हा phone server मध्ये जोडलेला नाही. Mobile test दाबा.";
    return `Mobile notification active आहे. जोडलेले device: ${toMarathiNumerals(pushStatus.activeSubscriptions)}`;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="🔔 सूचना" subtitle="Admin कडून आलेल्या सूचना, updates आणि reminders" />

      <section className="dashboard-card rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-green-50 p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-extrabold text-slate-700">न वाचलेल्या सूचना</p>
            <p className="mt-1 text-[34px] font-black text-slate-950">{toMarathiNumerals(unreadCount)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={testMobilePush} disabled={testingPush} className="min-h-[52px] rounded-lg bg-yellow-500 px-4 text-[17px] font-extrabold text-white disabled:bg-slate-300">
              {testingPush ? "Test..." : "📱 Mobile test"}
            </button>
            <button type="button" onClick={markAllRead} disabled={!unreadCount} className="min-h-[52px] rounded-lg bg-sheti px-4 text-[17px] font-extrabold text-white disabled:bg-slate-300">
              सर्व वाचले
            </button>
          </div>
        </div>
        {pushMessage ? <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[16px] font-bold text-slate-700">{pushMessage}</p> : null}
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-[15px] font-bold text-slate-700">
          {getPushStatusText()}
        </p>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft sm:grid-cols-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="सूचना शोधा" className="min-h-[50px] rounded-lg border border-slate-200 px-3 text-[17px] font-bold sm:col-span-1" />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-[50px] rounded-lg border border-slate-200 px-3 text-[17px] font-bold">
          <option value="all">सर्व</option>
          <option value="unread">न वाचलेल्या</option>
          <option value="read">वाचलेल्या</option>
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-[50px] rounded-lg border border-slate-200 px-3 text-[17px] font-bold">
          <option value="all">सर्व प्रकार</option>
          {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </section>

      {loading ? <div className="text-[19px] font-extrabold text-slate-600">सूचना लोड होत आहेत...</div> : null}
      {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}

      <div className="space-y-3">
        {visibleNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRead={(item) => patchNotification(item, "read")}
            onDelete={(item) => patchNotification(item, "delete")}
            onClickAction={(item) => patchNotification(item, "click")}
          />
        ))}
      </div>

      {!loading && !visibleNotifications.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
          <p className="text-[44px]">📭</p>
          <p className="mt-2 text-[22px] font-black text-slate-800">अजून सूचना नाहीत</p>
        </div>
      ) : null}
    </div>
  );
}
