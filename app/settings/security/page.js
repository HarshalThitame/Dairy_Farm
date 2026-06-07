"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { getClientAuthHeaders, getClientAuthToken } from "@/lib/clientStorage";
import { toMarathiNumerals } from "@/lib/marathiUtils";

function getToken() {
  return getClientAuthToken();
}

function getSessionIdFromToken() {
  try {
    const token = getToken();
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(window.atob(normalized)).sessionId || "";
  } catch {
    return "";
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  return toMarathiNumerals(new Date(value).toLocaleString("mr-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }));
}

function passwordStrength(password) {
  const value = String(password || "");
  let score = 0;
  if (value.length >= 8) score += 25;
  if (/[A-Z]/.test(value)) score += 20;
  if (/[a-z]/.test(value)) score += 20;
  if (/\d/.test(value)) score += 15;
  if (/[^A-Za-z0-9]/.test(value)) score += 20;
  if (score >= 85) return { score, label: "मजबूत", color: "bg-green-600" };
  if (score >= 55) return { score, label: "मध्यम", color: "bg-yellow-500" };
  return { score, label: "कमकुवत", color: "bg-red-500" };
}

const weakPins = new Set(["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321"]);

function validatePinForm(form) {
  if (!/^\d{4}$/.test(form.currentPin) || !/^\d{4}$/.test(form.newPin) || !/^\d{4}$/.test(form.confirmPin)) {
    return "कृपया ४ अंकी PIN लिहा.";
  }
  if (form.newPin !== form.confirmPin) {
    return "नवीन PIN दोन्ही ठिकाणी सारखा नाही.";
  }
  if (form.currentPin === form.newPin) {
    return "नवीन PIN सध्याच्या PIN पेक्षा वेगळा असावा.";
  }
  if (weakPins.has(form.newPin)) {
    return "हा PIN खूप सोपा आहे. कठीण PIN निवडा.";
  }
  return "";
}

function validatePasswordForm(form, hasPassword) {
  if (hasPassword && !form.currentPassword) {
    return "सध्याचा password लिहा.";
  }
  if (form.newPassword !== form.confirmPassword) {
    return "नवीन password दोन्ही ठिकाणी सारखा नाही.";
  }
  const strength = passwordStrength(form.newPassword);
  if (strength.score < 85) {
    return "मजबूत password वापरा: ८ अक्षरे, uppercase, lowercase, number आणि special character आवश्यक.";
  }
  return "";
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[16px] font-black text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function inputClass() {
  return "min-h-[54px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[18px] font-bold text-slate-950 shadow-sm outline-none focus:border-green-500";
}

export default function SecuritySettingsPage() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPin, setSavingPin] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sessionSaving, setSessionSaving] = useState("");
  const [notice, setNotice] = useState(null);

  const currentSessionId = useMemo(() => getSessionIdFromToken(), []);
  const strength = passwordStrength(passwordForm.newPassword);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/security", {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सुरक्षा माहिती मिळाली नाही.");
      setData(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changePin(event) {
    event.preventDefault();
    setNotice(null);
    const validation = validatePinForm(pinForm);
    if (validation) {
      setNotice({ type: "error", text: validation });
      return;
    }
    setSavingPin(true);
    try {
      const response = await fetch("/api/auth/change-pin", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ currentPin: pinForm.currentPin, newPin: pinForm.newPin })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "PIN बदलला नाही.");
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      setNotice({ type: "success", text: "PIN यशस्वीरित्या बदलला." });
      load();
    } catch (saveError) {
      setNotice({ type: "error", text: saveError.message });
    } finally {
      setSavingPin(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setNotice(null);
    const validation = validatePasswordForm(passwordForm, Boolean(data?.hasPassword));
    if (validation) {
      setNotice({ type: "error", text: validation });
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch("/api/settings/security/password", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify(passwordForm)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Password बदलला नाही.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice({ type: "success", text: "Password यशस्वीरित्या बदलला." });
      load();
    } catch (saveError) {
      setNotice({ type: "error", text: saveError.message });
    } finally {
      setSavingPassword(false);
    }
  }

  async function closeSession(mode, sessionId = "") {
    const confirmText = mode === "all"
      ? "सर्व devices मधून logout करायचे आहे का?"
      : "ही session बंद करायची आहे का?";
    if (!window.confirm(confirmText)) return;
    setSessionSaving(mode + sessionId);
    setNotice(null);
    try {
      const query = sessionId ? `session_id=${sessionId}` : `mode=${mode}`;
      const response = await fetch(`/api/settings/security/sessions?${query}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Session बंद झाली नाही.");
      if (mode === "all" || (mode === "current" && !sessionId) || sessionId === currentSessionId) {
        logout();
        return;
      }
      setNotice({ type: "success", text: "Session बंद झाली." });
      load();
    } catch (saveError) {
      setNotice({ type: "error", text: saveError.message });
    } finally {
      setSessionSaving("");
    }
  }

  if (loading) return <LoadingState text="सुरक्षा माहिती लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const sessions = data?.sessions || [];
  const loginHistory = data?.loginHistory || [];
  const score = data?.security?.score || 0;

  return (
    <div className="space-y-5">
      <PageHeader title="🔒 सुरक्षा केंद्र" subtitle="PIN, password, sessions आणि login history तपासा." />

      {notice ? (
        <div
          className={`rounded-xl border p-4 text-[18px] font-extrabold shadow-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-black text-slate-500">Security Score</p>
            <h2 className="text-[34px] font-black text-slate-950">
              {toMarathiNumerals(score)}/१००
            </h2>
          </div>
          <div className="h-24 w-24 rounded-full border-[10px] border-green-500 bg-green-50 text-center text-[22px] font-black leading-[72px] text-green-800">
            {toMarathiNumerals(score)}
          </div>
        </div>
        {(data?.security?.suggestions || []).length ? (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3">
            {(data.security.suggestions || []).map((suggestion) => (
              <p key={suggestion} className="text-[16px] font-bold text-yellow-900">• {suggestion}</p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[17px] font-bold text-green-800">तुमची सुरक्षा चांगली आहे.</p>
        )}
      </section>

      <form onSubmit={changePin} className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🔑 PIN बदला</h2>
        <div className="mt-4 grid gap-3">
          <Field label="सध्याचा PIN">
            <input inputMode="numeric" maxLength={4} type="password" value={pinForm.currentPin} onChange={(event) => setPinForm((current) => ({ ...current, currentPin: event.target.value.replace(/\D/g, "") }))} className={inputClass()} />
          </Field>
          <Field label="नवीन PIN">
            <input inputMode="numeric" maxLength={4} type="password" value={pinForm.newPin} onChange={(event) => setPinForm((current) => ({ ...current, newPin: event.target.value.replace(/\D/g, "") }))} className={inputClass()} />
          </Field>
          <Field label="नवीन PIN पुन्हा">
            <input inputMode="numeric" maxLength={4} type="password" value={pinForm.confirmPin} onChange={(event) => setPinForm((current) => ({ ...current, confirmPin: event.target.value.replace(/\D/g, "") }))} className={inputClass()} />
          </Field>
        </div>
        <button type="submit" disabled={savingPin} className="mt-4 min-h-[54px] w-full rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
          {savingPin ? "PIN बदलत आहे..." : "✅ PIN जतन करा"}
        </button>
      </form>

      <form onSubmit={changePassword} className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🛡️ Password बदला</h2>
        <div className="mt-4 grid gap-3">
          {data?.hasPassword ? (
            <Field label="सध्याचा Password">
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className={inputClass()} />
            </Field>
          ) : (
            <p className="rounded-lg bg-blue-50 p-3 text-[16px] font-bold text-blue-900">या खात्यावर password सेट केलेला नाही. नवीन मजबूत password सेट करा.</p>
          )}
          <Field label="नवीन Password">
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className={inputClass()} />
          </Field>
          <div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${strength.color}`} style={{ width: `${strength.score}%` }} />
            </div>
            <p className="mt-1 text-[15px] font-bold text-slate-600">Password strength: {strength.label}</p>
          </div>
          <Field label="नवीन Password पुन्हा">
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} className={inputClass()} />
          </Field>
        </div>
        <button type="submit" disabled={savingPassword} className="mt-4 min-h-[54px] w-full rounded-xl bg-slate-950 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
          {savingPassword ? "Password बदलत आहे..." : "✅ Password जतन करा"}
        </button>
      </form>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">📱 डिव्हाइस Sessions</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-600">तुमचे खाते कोणत्या phone/browser मध्ये active आहे ते इथे दिसते.</p>
          </div>
          <button type="button" onClick={() => closeSession("all")} disabled={Boolean(sessionSaving)} className="min-h-[44px] shrink-0 rounded-lg bg-red-600 px-3 text-[15px] font-black text-white disabled:opacity-60">
            {sessionSaving === "all" ? "Logout..." : "सर्व Logout"}
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {sessions.length ? sessions.map((session) => (
            <article key={session.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[19px] font-black text-slate-950">
                    📱 {session.device_model || session.device_name || "Device"}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-slate-600">
                    🌐 {session.browser || "-"} {session.browser_version || ""} · {session.os || "-"} {session.platform_version ? `(${session.platform_version})` : ""}
                  </p>
                  <p className="text-[15px] font-bold text-slate-600">🕒 Last active: {formatDateTime(session.last_active_at)}</p>
                  <p className="text-[15px] font-bold text-slate-600">Login: {formatDateTime(session.login_at)}</p>
                  <p className="text-[15px] font-bold text-slate-600">IP: {session.ip_address || "-"}</p>
                </div>
                {session.id === currentSessionId ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-[13px] font-black text-green-800">Current</span>
                ) : null}
              </div>
              {session.is_active ? (
                <button
                  type="button"
                  onClick={() => session.id === currentSessionId ? closeSession("current") : closeSession("other", session.id)}
                  disabled={sessionSaving === `other${session.id}` || sessionSaving === "current" || sessionSaving === "all"}
                  className="mt-3 min-h-[42px] rounded-lg border border-red-200 bg-white px-3 text-[15px] font-black text-red-700 disabled:opacity-60"
                >
                  {session.id === currentSessionId ? "हा device Logout करा" : "Session बंद करा"}
                </button>
              ) : (
                <p className="mt-3 text-[15px] font-black text-slate-500">बंद session</p>
              )}
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">Session माहिती उपलब्ध नाही.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🧾 Login History</h2>
        <div className="mt-4 grid gap-3">
          {loginHistory.length ? loginHistory.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-[18px] font-black text-slate-950">
                  {item.status === "success" ? "✅ Success" : "❌ Failed"}
                </p>
                <p className="mt-1 text-[15px] font-bold text-slate-600">{item.device_name || "Device"} · {item.browser || "Browser"} · {item.os || "OS"}</p>
                <p className="text-[15px] font-bold text-slate-600">{item.location || item.ip_address || "-"}</p>
                {item.status !== "success" && item.failure_reason ? (
                  <p className="mt-1 text-[15px] font-black text-red-700">कारण: {item.failure_reason}</p>
                ) : null}
              </div>
              <p className="text-right text-[14px] font-bold text-slate-500">{formatDateTime(item.created_at)}</p>
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">Login history उपलब्ध नाही.</p>
          )}
        </div>
      </section>
    </div>
  );
}
