"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthToken } from "@/lib/clientStorage";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const categories = [
  ["technical_support", "Technical Support"],
  ["bug_report", "Bug Report"],
  ["ocr_issue", "Slip/OCR समस्या"],
  ["ai_assistant_issue", "AI Assistant"],
  ["data_issue", "Data समस्या"],
  ["subscription_issue", "Subscription"],
  ["payment_issue", "Payment"],
  ["account_issue", "खाते समस्या"],
  ["feature_request", "Feature Request"],
  ["other", "इतर"]
];

const priorities = [
  ["low", "कमी"],
  ["medium", "मध्यम"],
  ["high", "जास्त"],
  ["critical", "तातडीचे"]
];

function getToken() {
  return getClientAuthToken();
}

function getDeviceInfo() {
  if (typeof window === "undefined") return {};
  return {
    screenSize: `${window.screen.width}x${window.screen.height}`,
    browserLanguage: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent
  };
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    subject: "",
    category: "technical_support",
    priority: "medium",
    description: "",
    preferredContactMethod: "app",
    bugTitle: "",
    stepsToReproduce: "",
    expectedResult: "",
    actualResult: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/support/tickets", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Tickets मिळाले नाहीत.");
      setTickets(result.tickets || []);
      setStats(result.stats || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, deviceInfo: getDeviceInfo() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Ticket तयार झाले नाही.");
      router.push(`/support/tickets/${result.ticket.id}`);
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="Tickets लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="🎫 Support Tickets"
        subtitle="समस्या नोंदवा, reply द्या आणि ticket status बघा."
        action={<Link href="/support" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Support</Link>}
      />

      {stats ? (
        <section className="grid grid-cols-4 gap-2">
          <MiniStat label="एकूण" value={stats.total} />
          <MiniStat label="Open" value={stats.open} />
          <MiniStat label="Solved" value={stats.resolved} />
          <MiniStat label="Critical" value={stats.critical} />
        </section>
      ) : null}

      <form onSubmit={submit} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">नवीन ticket तयार करा</h2>
        {formError ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-[15px] font-bold text-red-800">{formError}</p> : null}

        <div className="mt-4 grid gap-3">
          <input
            value={form.subject}
            onChange={(event) => update("subject", event.target.value)}
            className="min-h-[54px] rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
            placeholder="विषय"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              className="min-h-[54px] rounded-xl border border-slate-200 px-3 text-[16px] font-bold"
            >
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select
              value={form.priority}
              onChange={(event) => update("priority", event.target.value)}
              className="min-h-[54px] rounded-xl border border-slate-200 px-3 text-[16px] font-bold"
            >
              {priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className="min-h-[150px] rounded-xl border border-slate-200 p-4 text-[17px] font-bold outline-none focus:border-green-500"
            placeholder="काय समस्या आहे? शक्य तितकी स्पष्ट माहिती लिहा."
          />

          {form.category === "bug_report" ? (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-3">
              <input value={form.bugTitle} onChange={(event) => update("bugTitle", event.target.value)} className="min-h-[50px] rounded-xl border border-slate-200 px-4 font-bold" placeholder="Bug title" />
              <textarea value={form.stepsToReproduce} onChange={(event) => update("stepsToReproduce", event.target.value)} className="min-h-[110px] rounded-xl border border-slate-200 p-4 font-bold" placeholder="कसे reproduce करायचे?" />
              <input value={form.expectedResult} onChange={(event) => update("expectedResult", event.target.value)} className="min-h-[50px] rounded-xl border border-slate-200 px-4 font-bold" placeholder="Expected result" />
              <input value={form.actualResult} onChange={(event) => update("actualResult", event.target.value)} className="min-h-[50px] rounded-xl border border-slate-200 px-4 font-bold" placeholder="Actual result" />
            </div>
          ) : null}

          <select
            value={form.preferredContactMethod}
            onChange={(event) => update("preferredContactMethod", event.target.value)}
            className="min-h-[54px] rounded-xl border border-slate-200 px-3 text-[16px] font-bold"
          >
            <option value="app">App मध्ये reply</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[56px] rounded-xl bg-green-600 text-[18px] font-black text-white shadow-sm disabled:opacity-60"
          >
            {saving ? "Ticket तयार होत आहे..." : "✅ Ticket तयार करा"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">माझे tickets</h2>
        <div className="mt-3 grid gap-3">
          {tickets.length ? tickets.map((ticket) => (
            <Link key={ticket.id} href={`/support/tickets/${ticket.id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4 active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[18px] font-black text-slate-950">{ticket.subject}</p>
                  <p className="mt-1 text-[13px] font-bold text-slate-500">
                    {ticket.ticketNumber} · {ticket.categoryLabel} · {formatMarathiDate(ticket.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-slate-700 shadow-sm">
                  {ticket.statusLabel}
                </span>
              </div>
            </Link>
          )) : (
            <p className="rounded-xl bg-slate-50 p-4 text-[16px] font-bold text-slate-600">अजून ticket नाही.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/95 p-3 text-center shadow-sm">
      <p className="text-[20px] font-black text-slate-950">{toMarathiNumerals(value || 0)}</p>
      <p className="mt-1 text-[12px] font-black text-slate-500">{label}</p>
    </div>
  );
}
