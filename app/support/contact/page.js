"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthToken } from "@/lib/clientStorage";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const supportWhatsAppUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || "/support/tickets";
const supportEmailUrl = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  ? `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`
  : "/support/tickets";
const supportPhoneUrl = process.env.NEXT_PUBLIC_SUPPORT_PHONE
  ? `tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE}`
  : "/support/tickets";

function getToken() {
  return getClientAuthToken();
}

export default function ContactSupportPage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", expectedBenefit: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/support/features", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Feature requests मिळाले नाहीत.");
      setFeatures(result.features || []);
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
    setMessage("");
  }

  async function submitFeature(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/support/features", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Feature request जतन झाली नाही.");
      setForm({ title: "", description: "", expectedBenefit: "" });
      setMessage(result.message || "Feature request जतन झाली.");
      load();
    } catch (saveError) {
      setMessage(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function vote(featureId, hasVoted) {
    const response = await fetch("/api/support/features", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ featureId, action: hasVoted ? "unvote" : "vote" })
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setFeatures(result.features || []);
  }

  if (loading) return <LoadingState text="Contact Support लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="📞 Contact Support"
        subtitle="थेट मदत, bug report आणि feature request."
        action={<Link href="/support" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Support</Link>}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <ContactCard title="WhatsApp" value="Support शी chat" href={supportWhatsAppUrl} icon="🟢" />
        <ContactCard title="Email" value="Support email" href={supportEmailUrl} icon="✉️" />
        <ContactCard title="Phone" value="Support call" href={supportPhoneUrl} icon="☎️" />
        <ContactCard title="Ticket" value="समस्या नोंदवा" href="/support/tickets" icon="🎫" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submitFeature} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
          <h2 className="text-[24px] font-black text-slate-950">Feature Request</h2>
          {message ? <p className="mt-3 rounded-xl bg-green-50 p-3 text-[15px] font-bold text-green-800">{message}</p> : null}
          <div className="mt-4 grid gap-3">
            <input value={form.title} onChange={(event) => update("title", event.target.value)} className="min-h-[52px] rounded-xl border border-slate-200 px-4 font-bold" placeholder="Feature title" />
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-[120px] rounded-xl border border-slate-200 p-4 font-bold" placeholder="काय feature पाहिजे?" />
            <textarea value={form.expectedBenefit} onChange={(event) => update("expectedBenefit", event.target.value)} className="min-h-[90px] rounded-xl border border-slate-200 p-4 font-bold" placeholder="याचा उपयोग काय होईल?" />
            <button disabled={saving} className="min-h-[54px] rounded-xl bg-green-600 text-[17px] font-black text-white disabled:opacity-60">
              {saving ? "जतन होत आहे..." : "✅ Feature Request पाठवा"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
          <h2 className="text-[24px] font-black text-slate-950">Requested Features</h2>
          <div className="mt-3 grid gap-3">
            {features.length ? features.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-[14px] font-bold text-slate-600">{item.description}</p>
                    <p className="mt-2 text-[12px] font-black text-slate-500">{item.statusLabel}</p>
                  </div>
                  <button onClick={() => vote(item.id, item.hasVoted)} className={`rounded-xl px-3 py-2 text-[13px] font-black ${item.hasVoted ? "bg-green-600 text-white" : "bg-white text-slate-800"}`}>
                    👍 {toMarathiNumerals(item.votesCount)}
                  </button>
                </div>
              </article>
            )) : <p className="rounded-xl bg-slate-50 p-4 text-[15px] font-bold text-slate-600">Feature request नाही.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50 p-4 shadow-soft">
        <h2 className="text-[22px] font-black text-red-950">Bug Report</h2>
        <p className="mt-1 text-[15px] font-bold text-red-800">
          Screenshot, steps आणि expected/actual result लिहिण्यासाठी bug report ticket तयार करा.
        </p>
        <Link href="/support/tickets" className="mt-3 inline-flex min-h-[48px] items-center rounded-xl bg-red-600 px-5 text-[16px] font-black text-white">
          🐞 Bug ticket तयार करा
        </Link>
      </section>
    </div>
  );
}

function ContactCard({ title, value, href, icon }) {
  const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const content = (
    <span className="block rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft active:scale-[0.98]">
      <span className="text-[32px]">{icon}</span>
      <span className="mt-3 block text-[20px] font-black text-slate-950">{title}</span>
      <span className="mt-1 block text-[14px] font-bold text-slate-500">{value}</span>
    </span>
  );
  if (external) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{content}</a>;
  return <Link href={href}>{content}</Link>;
}
