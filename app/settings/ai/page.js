"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const responseStyles = [
  ["short", "लहान", "थेट, एका-दोन वाक्यात उत्तर"],
  ["detailed", "सविस्तर", "सकाळ/संध्याकाळ split आणि संदर्भासह"],
  ["expert", "तज्ञ", "आकडे, अर्थ आणि farm-management insight"]
];

const dataPermissionRows = [
  ["milk_records", "दूध नोंदी वापरू द्या", "दूध, फॅट, SNF आणि सकाळ/संध्याकाळचे आकडे"],
  ["slip_history", "स्लिप इतिहास वापरू द्या", "दूध स्लिप, 15 दिवसांचे payment आणि उत्पन्न"],
  ["analytics", "Analytics वापरू द्या", "नफा, खर्च, trend आणि मासिक सारांश"],
  ["animal_data", "जनावरांची माहिती वापरू द्या", "गायी/वासरे माहितीवर future AI उत्तरांसाठी"]
];

const exampleQuestions = ["🥛 आजचे दूध", "💰 आजचे उत्पन्न", "📈 सरासरी फॅट", "🏆 सर्वाधिक दूध"];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function ToggleRow({ title, subtitle, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-[78px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm disabled:opacity-60 ${
        checked ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
      }`}
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }));
}

function formatMs(value) {
  const ms = Number(value || 0);
  if (ms <= 0) return "-";
  if (ms < 1000) return `${toMarathiNumerals(ms)} ms`;
  return `${toMarathiNumerals((ms / 1000).toFixed(1))} सेकंद`;
}

function StatCard({ title, value, icon, subtext }) {
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-soft">
      <p className="text-[28px]">{icon}</p>
      <p className="mt-2 text-[14px] font-black text-slate-500">{title}</p>
      <p className="mt-1 text-[24px] font-black text-slate-950">{value}</p>
      {subtext ? <p className="mt-1 text-[13px] font-bold text-slate-500">{subtext}</p> : null}
    </article>
  );
}

export default function AiSettingsPage() {
  const [preferences, setPreferences] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [feedbackSavingId, setFeedbackSavingId] = useState("");

  const filteredHistory = useMemo(() => history, [history]);

  function showMessage(text, tone = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/ai", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "AI सेटिंग्ज मिळाल्या नाहीत.");
      setPreferences(result.preferences);
      setStats(result.stats);
      setHistory(result.history || []);
    } catch (loadError) {
      setError(loadError.message || "AI सेटिंग्ज मिळाल्या नाहीत.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (query = search) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/settings/ai/history?search=${encodeURIComponent(query || "")}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "AI history मिळाली नाही.");
      setHistory(result.history || []);
    } catch (loadError) {
      showMessage(loadError.message || "AI history मिळाली नाही.", "error");
    } finally {
      setHistoryLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function update(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
    showMessage("");
  }

  function updatePermission(key, value) {
    setPreferences((current) => ({
      ...current,
      data_permissions: {
        ...(current?.data_permissions || {}),
        [key]: value
      }
    }));
    showMessage("");
  }

  async function save() {
    if (saving || !preferences) return;
    setSaving(true);
    showMessage("");
    try {
      const response = await fetch("/api/settings/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(preferences)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "AI सेटिंग्ज जतन झाल्या नाहीत.");
      setPreferences(result.preferences);
      showMessage(result.message || "AI सेटिंग्ज जतन झाल्या.", "success");
    } catch (saveError) {
      showMessage(saveError.message || "AI सेटिंग्ज जतन झाल्या नाहीत.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHistory(id = "") {
    if (historyLoading) return;
    const all = !id;
    if (!window.confirm(all ? "संपूर्ण AI chat history delete करायची आहे का?" : "ही AI history delete करायची आहे का?")) {
      return;
    }
    setHistoryLoading(true);
    showMessage("");
    try {
      const query = all ? "all=true" : `id=${id}`;
      const response = await fetch(`/api/settings/ai/history?${query}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "History delete झाली नाही.");
      setHistory((current) => (all ? [] : current.filter((item) => item.id !== id)));
      showMessage(all ? "संपूर्ण AI history delete झाली." : "AI history delete झाली.", "success");
      load();
    } catch (deleteError) {
      showMessage(deleteError.message || "History delete झाली नाही.", "error");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function sendFeedback(logId, feedback) {
    if (feedbackSavingId) return;
    const previous = history.find((item) => item.id === logId)?.feedback || null;
    setFeedbackSavingId(logId);
    setHistory((current) => current.map((item) => (item.id === logId ? { ...item, feedback } : item)));
    try {
      const response = await fetch("/api/settings/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ logId, feedback })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Feedback जतन झाला नाही.");
      showMessage("Feedback जतन झाला.", "success");
    } catch (feedbackError) {
      setHistory((current) => current.map((item) => (item.id === logId ? { ...item, feedback: previous } : item)));
      showMessage(feedbackError.message || "Feedback जतन झाला नाही.", "error");
    } finally {
      setFeedbackSavingId("");
    }
  }

  if (loading) return <LoadingState text="AI सेटिंग्ज लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader title="🤖 दुग्धमित्र AI सेटिंग्ज" subtitle="AI सहाय्यक कसा वागेल आणि कोणता data वापरेल ते ठरवा." />

      {message ? (
        <div className={`rounded-xl border p-4 text-[18px] font-extrabold shadow-sm ${
          messageTone === "error"
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-green-200 bg-green-50 text-green-900"
        }`}>
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">AI सहाय्यक</h2>
        <div className="mt-4">
          <ToggleRow
            title="दुग्धमित्र AI सुरू ठेवा"
            subtitle="बंद केल्यास app मध्ये AI bot दिसणार नाही आणि प्रश्न विचारता येणार नाहीत."
            checked={Boolean(preferences?.enabled)}
            onChange={(value) => update("enabled", value)}
            disabled={saving}
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">उत्तर शैली</h2>
        <div className="mt-4 grid gap-3">
          {responseStyles.map(([value, title, subtitle]) => (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => update("response_style", value)}
              className={`rounded-xl border p-4 text-left shadow-sm disabled:opacity-60 ${
                preferences?.response_style === value ? "border-green-500 bg-green-50 ring-2 ring-green-100" : "border-slate-200 bg-white"
              }`}
            >
              <span className="block text-[20px] font-black text-slate-950">{title}</span>
              <span className="mt-1 block text-[15px] font-bold text-slate-600">{subtitle}</span>
              {value === "short" ? <span className="mt-2 block text-[14px] font-bold text-green-700">उदा. आज २८५ लिटर दूध जमा झाले.</span> : null}
              {value === "detailed" ? <span className="mt-2 block text-[14px] font-bold text-green-700">उदा. सकाळी १४५ आणि संध्याकाळी १४० लिटर.</span> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">झटपट प्रश्न</h2>
        <div className="mt-4">
          <ToggleRow
            title="झटपट प्रश्न दाखवा"
            subtitle="AI box मध्ये वापरायला सोपे प्रश्न chips म्हणून दिसतील."
            checked={Boolean(preferences?.suggested_questions_enabled)}
            onChange={(value) => update("suggested_questions_enabled", value)}
            disabled={saving}
          />
        </div>
        {preferences?.suggested_questions_enabled ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {exampleQuestions.map((question) => (
              <span key={question} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[15px] font-black text-emerald-800">
                {question}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">डेटा परवानग्या</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-600">AI फक्त तुम्ही परवानगी दिलेला data वापरेल.</p>
        <div className="mt-4 grid gap-3">
          {dataPermissionRows.map(([key, title, subtitle]) => (
            <ToggleRow
              key={key}
              title={title}
              subtitle={subtitle}
              checked={Boolean(preferences?.data_permissions?.[key])}
              onChange={(value) => updatePermission(key, value)}
              disabled={saving}
            />
          ))}
        </div>
      </section>

      <button type="button" onClick={save} disabled={saving} className="min-h-[58px] w-full rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
        {saving ? "जतन करत आहे..." : "✅ AI सेटिंग्ज जतन करा"}
      </button>

      <section className="grid grid-cols-2 gap-3">
        <StatCard icon="💬" title="एकूण प्रश्न" value={toMarathiNumerals(stats?.totalQuestions || 0)} />
        <StatCard icon="📅" title="या महिन्यात" value={toMarathiNumerals(stats?.questionsThisMonth || 0)} />
        <StatCard icon="🏷️" title="सर्वाधिक विषय" value={stats?.mostAskedTopic || "-"} />
        <StatCard icon="⚡" title="सरासरी वेळ" value={formatMs(stats?.averageResponseTime)} />
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">AI प्रश्न इतिहास</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-600">प्रश्न, उत्तर, feedback आणि delete control.</p>
          </div>
          <button type="button" onClick={() => deleteHistory()} disabled={historyLoading || !history.length} className="min-h-[46px] rounded-lg bg-red-600 px-4 text-[16px] font-black text-white disabled:opacity-50">
            सर्व delete
          </button>
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            loadHistory(search);
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="प्रश्न किंवा उत्तर शोधा..."
            className="min-h-[52px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-[17px] font-bold text-slate-950 outline-none focus:border-green-500"
          />
          <button type="submit" disabled={historyLoading} className="min-h-[52px] rounded-xl bg-slate-950 px-4 text-[16px] font-black text-white disabled:opacity-60">
            शोधा
          </button>
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                loadHistory("");
              }}
              disabled={historyLoading}
              className="min-h-[52px] rounded-xl border border-slate-200 bg-white px-4 text-[16px] font-black text-slate-700 disabled:opacity-60"
            >
              साफ
            </button>
          ) : null}
        </form>

        {historyLoading ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[16px] font-black text-slate-600">
            AI history अपडेट होत आहे...
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {filteredHistory.length ? filteredHistory.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-500">{formatDate(item.created_at)} · {formatMs(item.execution_ms)}</p>
                  <p className="mt-2 text-[18px] font-black text-slate-950">प्रश्न: {item.question}</p>
                  <p className="mt-2 text-[16px] font-bold leading-relaxed text-slate-700">उत्तर: {item.response || "उत्तर नाही"}</p>
                </div>
                <button type="button" onClick={() => deleteHistory(item.id)} disabled={historyLoading} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-[14px] font-black text-red-700 disabled:opacity-50">
                  काढा
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => sendFeedback(item.id, "useful")}
                  disabled={feedbackSavingId === item.id}
                  className={`rounded-full px-3 py-2 text-[14px] font-black ${item.feedback === "useful" ? "bg-green-600 text-white" : "bg-white text-green-800 ring-1 ring-green-200"}`}
                >
                  👍 उपयोगी
                </button>
                <button
                  type="button"
                  onClick={() => sendFeedback(item.id, "not_useful")}
                  disabled={feedbackSavingId === item.id}
                  className={`rounded-full px-3 py-2 text-[14px] font-black ${item.feedback === "not_useful" ? "bg-red-600 text-white" : "bg-white text-red-800 ring-1 ring-red-200"}`}
                >
                  👎 उपयोगी नाही
                </button>
              </div>
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">
              AI history उपलब्ध नाही.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
