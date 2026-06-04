"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";
import { getClientAuthToken } from "@/lib/clientStorage";
import { toMarathiNumerals } from "@/lib/marathiUtils";
import { getPushPermissionState, pushNotificationsSupported, requestAndRegisterPushSubscription } from "@/lib/pushClient";

const categoryLabels = [
  ["daily_reminder", "दैनंदिन आठवण", "रोजच्या कामांसाठी सूचना"],
  ["milk_entry_reminder", "दूध नोंद आठवण", "सकाळ/संध्याकाळ दूध नोंद"],
  ["slip_upload_reminder", "स्लिप अपलोड आठवण", "15 दिवसांची देयक स्लिप बाकी"],
  ["subscription_reminder", "Subscription आठवण", "Plan expiry आणि payment सूचना"],
  ["system_updates", "System Updates", "App update, maintenance आणि महत्वाच्या सूचना"],
  ["ai_assistant_updates", "AI सहाय्यक Updates", "AI सुविधा आणि सुधारणा"],
  ["promotional_notifications", "ऑफर्स", "Marketing आणि promotional messages"],
  ["support_messages", "Support Messages", "मदत, मार्गदर्शन आणि support"]
];

const channelLabels = [
  ["in_app", "App मध्ये सूचना", "Inbox आणि bell मध्ये दिसेल", true],
  ["push", "Mobile Notification", "Phone notification panel मध्ये येईल", true],
  ["email", "Email", "लवकरच उपलब्ध होईल", false],
  ["whatsapp", "WhatsApp", "लवकरच उपलब्ध होईल", false],
  ["sms", "SMS", "लवकरच उपलब्ध होईल", false]
];

const frequencyOptions = [
  ["instant", "ताबडतोब"],
  ["daily", "दैनिक सारांश"],
  ["weekly", "साप्ताहिक सारांश"]
];

function getToken() {
  return getClientAuthToken();
}

function ToggleRow({ title, subtitle, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex min-h-[78px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm ${
        checked ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span className="min-w-0">
        <span className="block text-[18px] font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-600">{subtitle}</span>
      </span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-green-600" : "bg-slate-300"}`}>
        <span className={`h-6 w-6 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : ""}`} />
      </span>
    </button>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return toMarathiNumerals(date.toLocaleString("mr-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }));
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState(null);
  const [history, setHistory] = useState([]);
  const [pushStatus, setPushStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingTone, setTestingTone] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const {
    settings: toneSettings,
    supported: toneSupported,
    updateSettings: updateToneSettings,
    testVoice: testNotificationTone
  } = useSpeechNotification();

  function showMessage(text, tone = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  const loadPushStatus = useCallback(async () => {
    if (!pushNotificationsSupported()) {
      setPushStatus({ supported: false, permission: "unsupported", activeSubscriptions: 0 });
      return;
    }

    const permission = getPushPermissionState();
    const token = getToken();
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/notifications", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सूचना सेटिंग्ज मिळाल्या नाहीत.");
      setPreferences(result.preferences);
      setHistory(result.history || []);
      loadPushStatus();
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [loadPushStatus]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPushStatus();
    window.addEventListener("notification-push-subscribed", loadPushStatus);
    window.addEventListener("notification-permission-changed", loadPushStatus);
    window.addEventListener("online", loadPushStatus);

    return () => {
      window.removeEventListener("notification-push-subscribed", loadPushStatus);
      window.removeEventListener("notification-permission-changed", loadPushStatus);
      window.removeEventListener("online", loadPushStatus);
    };
  }, [loadPushStatus]);

  function updateCategory(key, value) {
    setPreferences((current) => ({
      ...current,
      categories: { ...(current?.categories || {}), [key]: value }
    }));
  }

  async function updateChannel(key, value) {
    if (!channelLabels.find(([channelKey]) => channelKey === key)?.[3]) {
      return;
    }

    if (key === "push" && value) {
      try {
        showMessage("");
        const result = await requestAndRegisterPushSubscription({ requestPermission: true });
        if (!result.success) {
          showMessage(result.message || "Mobile notification चालू झाले नाही.", "warning");
          setPreferences((current) => ({
            ...current,
            channels: { ...(current?.channels || {}), push: false }
          }));
          await loadPushStatus();
          return;
        }
        showMessage("Mobile notification चालू झाले.", "success");
        await loadPushStatus();
      } catch (error) {
        showMessage(error.message || "Mobile notification चालू करताना अडचण आली.", "error");
        setPreferences((current) => ({
          ...current,
          channels: { ...(current?.channels || {}), push: false }
        }));
        await loadPushStatus();
        return;
      }
    }

    setPreferences((current) => ({
      ...current,
      channels: { ...(current?.channels || {}), [key]: value }
    }));
  }

  async function save() {
    if (saving || testing || testingTone || !preferences) return;
    setSaving(true);
    showMessage("");
    try {
      let pushWarning = "";
      const payload = {
        ...(preferences || {}),
        channels: {
          ...(preferences?.channels || {}),
          email: false,
          whatsapp: false,
          sms: false
        }
      };

      if (payload.channels?.push) {
        const result = await requestAndRegisterPushSubscription({ requestPermission: true });
        if (!result.success) {
          payload.channels.push = false;
          pushWarning = result.message || "Mobile notification बंद ठेवले. बाकी settings जतन झाली.";
        }
      }

      const response = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सूचना सेटिंग्ज जतन झाल्या नाहीत.");
      setPreferences(result.preferences);
      showMessage(pushWarning || "सूचना सेटिंग्ज जतन झाल्या.", pushWarning ? "warning" : "success");
      await loadPushStatus();
    } catch (saveError) {
      showMessage(saveError.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function sendTestNotification() {
    if (testing || saving || testingTone) return;
    setTesting(true);
    showMessage("");
    try {
      if (preferences?.channels?.push) {
        const registration = await requestAndRegisterPushSubscription({ requestPermission: true });
        if (!registration.success) {
          showMessage(registration.message || "Mobile notification चालू झाले नाही.", "warning");
        }
      }

      const response = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "चाचणी सूचना पाठवता आली नाही.");
      showMessage(result.message || "चाचणी सूचना पाठवली.", result.warning ? "warning" : "success");
      load();
    } catch (testError) {
      showMessage(testError.message, "error");
    } finally {
      setTesting(false);
      loadPushStatus();
    }
  }

  async function testTone() {
    if (testingTone || testing || saving) return;
    setTestingTone(true);
    showMessage("");

    try {
      const played = await Promise.resolve(testNotificationTone());
      showMessage(
        played
          ? "Unique notification tone वाजला."
          : "या browser मध्ये tone support नाही किंवा audio block झाला. Screen वर एकदा tap करून पुन्हा प्रयत्न करा.",
        played ? "success" : "warning"
      );
    } catch (toneError) {
      showMessage(toneError.message || "Tone तपासताना अडचण आली.", "error");
    } finally {
      setTestingTone(false);
    }
  }

  function getPushStatusText() {
    if (!pushStatus) return "Mobile notification स्थिती तपासत आहे...";
    if (!pushStatus.supported) return "या browser मध्ये mobile push notification support नाही.";
    if (pushStatus.permission === "denied") return "Permission blocked आहे. Browser settings मधून allow करा.";
    if (pushStatus.permission !== "granted") return "Permission अजून दिलेली नाही.";
    if (!pushStatus.vapidPublicKeyConfigured || !pushStatus.vapidPrivateKeyConfigured) return "Server push keys configure नाहीत.";
    if ((pushStatus.activeSubscriptions || 0) < 1) return "Permission आहे, पण हा phone अजून server मध्ये जोडलेला नाही.";
    return `Mobile notification active आहे. Device: ${toMarathiNumerals(pushStatus.activeSubscriptions)}`;
  }

  if (loading) return <LoadingState text="सूचना सेटिंग्ज लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader title="🔔 सूचना सेटिंग्ज" subtitle="कुठल्या सूचना कशा मिळाव्यात ते ठरवा." />

      {message ? (
        <div className={`rounded-xl border p-4 text-[18px] font-extrabold shadow-sm ${
          messageTone === "error"
            ? "border-red-200 bg-red-50 text-red-900"
            : messageTone === "warning"
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-green-200 bg-green-50 text-green-900"
        }`}>
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">📂 सूचना प्रकार</h2>
        <div className="mt-4 grid gap-3">
          {categoryLabels.map(([key, title, subtitle]) => (
            <ToggleRow
              key={key}
              title={title}
              subtitle={subtitle}
              checked={Boolean(preferences?.categories?.[key])}
              onChange={(value) => updateCategory(key, value)}
              disabled={saving || testing || testingTone}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">📡 सूचना कुठे याव्यात</h2>
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[15px] font-bold text-slate-700">
          {getPushStatusText()}
        </p>
        <div className="mt-4 grid gap-3">
          {channelLabels.map(([key, title, subtitle, implemented]) => (
            <ToggleRow
              key={key}
              title={`${title}${implemented ? "" : " · लवकरच"}`}
              subtitle={subtitle}
              checked={implemented ? Boolean(preferences?.channels?.[key]) : false}
              onChange={(value) => updateChannel(key, value)}
              disabled={!implemented || saving || testing || testingTone}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-100 bg-white/90 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">🎵 Unique Notification Tone</h2>
            <p className="mt-1 text-[16px] font-bold text-slate-600">
              Voice वाचून दाखवण्याऐवजी app मध्ये छोटा खास tone वाजेल.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-black text-emerald-800">
            App Tone
          </span>
        </div>

        {!toneSupported ? (
          <p className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-[15px] font-bold text-yellow-900">
            या browser मध्ये custom tone support नाही. तरी mobile notification panel मध्ये system sound येऊ शकतो.
          </p>
        ) : null}

        <div className="mt-4">
          <ToggleRow
            title="Notification tone चालू ठेवा"
            subtitle="नवीन सूचना आली की माझी डेअरीचा छोटा tone वाजेल"
            checked={Boolean(toneSettings.enabled)}
            onChange={(value) => updateToneSettings({ enabled: value })}
            disabled={!toneSupported || saving || testing || testingTone}
          />
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="notification-tone-volume" className="text-[17px] font-black text-slate-800">
              Tone आवाज
            </label>
            <span className="rounded-full bg-white px-3 py-1 text-[15px] font-black text-slate-700 shadow-sm">
              {toMarathiNumerals(Math.round((toneSettings.volume ?? 0.85) * 100))}%
            </span>
          </div>
          <input
            id="notification-tone-volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round((toneSettings.volume ?? 0.85) * 100)}
            disabled={!toneSupported || !toneSettings.enabled || saving || testing || testingTone}
            onChange={(event) => updateToneSettings({ volume: Number(event.target.value) / 100 })}
            className="mt-4 h-2 w-full accent-green-600 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={testTone}
            disabled={!toneSupported || !toneSettings.enabled || saving || testing || testingTone}
            className="mt-4 min-h-[52px] w-full rounded-xl bg-slate-950 px-4 text-[17px] font-black text-white shadow-sm disabled:opacity-60"
          >
            {testingTone ? "Tone तपासत आहे..." : "🔊 Tone तपासा"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🌙 शांत वेळ</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-600">या वेळेत साध्या सूचना थांबतील. खूप महत्वाच्या सूचना थांबणार नाहीत.</p>
        <div className="mt-4">
          <ToggleRow
            title="शांत वेळ सुरू करा"
            subtitle="रात्री notification आवाज/alert कमी करण्यासाठी"
            checked={Boolean(preferences?.quiet_hours_enabled)}
            onChange={(value) => setPreferences((current) => ({ ...current, quiet_hours_enabled: value }))}
            disabled={saving || testing || testingTone}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[16px] font-black text-slate-700">सुरू</span>
            <input type="time" value={preferences?.quiet_hours_start || "22:00"} disabled={saving || testing || testingTone} onChange={(event) => setPreferences((current) => ({ ...current, quiet_hours_start: event.target.value }))} className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[18px] font-bold disabled:opacity-60" />
          </label>
          <label className="block">
            <span className="text-[16px] font-black text-slate-700">शेवट</span>
            <input type="time" value={preferences?.quiet_hours_end || "06:00"} disabled={saving || testing || testingTone} onChange={(event) => setPreferences((current) => ({ ...current, quiet_hours_end: event.target.value }))} className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[18px] font-bold disabled:opacity-60" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">⏱️ वारंवारता</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {frequencyOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={saving || testing || testingTone}
              onClick={() => setPreferences((current) => ({ ...current, frequency: value }))}
              className={`min-h-[54px] rounded-xl border px-2 text-[15px] font-black disabled:opacity-60 ${
                preferences?.frequency === value ? "border-green-500 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={save} disabled={saving || testing || testingTone} className="min-h-[58px] rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
          {saving ? "जतन करत आहे..." : "✅ सेटिंग्ज जतन करा"}
        </button>
        <button type="button" onClick={sendTestNotification} disabled={testing || saving || testingTone} className="min-h-[58px] rounded-xl bg-yellow-500 px-5 text-[19px] font-black text-slate-950 shadow-sm disabled:opacity-60">
          {testing ? "पाठवत आहे..." : "📢 चाचणी सूचना पाठवा"}
        </button>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🧾 सूचना इतिहास</h2>
        <div className="mt-4 grid gap-3">
          {history.length ? history.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[18px] font-black text-slate-950">{item.notifications?.title || "सूचना"}</p>
                  <p className="mt-1 text-[15px] font-bold leading-snug text-slate-600">{item.notifications?.message || ""}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[12px] font-black ${item.opened_at ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {item.opened_at ? "वाचले" : "नवीन"}
                </span>
              </div>
              <p className="mt-2 text-[14px] font-bold text-slate-500">{formatDate(item.delivered_at)}</p>
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">सूचना इतिहास उपलब्ध नाही.</p>
          )}
        </div>
      </section>
    </div>
  );
}
