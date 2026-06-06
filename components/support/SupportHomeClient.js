"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

function statusTone(status) {
  if (status === "operational") return "border-green-200 bg-green-50 text-green-900";
  if (status === "maintenance") return "border-yellow-200 bg-yellow-50 text-yellow-900";
  return "border-red-200 bg-red-50 text-red-900";
}

function statusLabel(status) {
  if (status === "operational") return "सुरळीत";
  if (status === "maintenance") return "देखभाल";
  if (status === "degraded") return "मंद";
  return "अडचण";
}

function TicketStatusBadge({ statusLabel }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700">
      {statusLabel}
    </span>
  );
}

export default function SupportHomeClient({ settingsMode = false }) {
  const searchRequestRef = useRef(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Support माहिती मिळाली नाही.");
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

  async function runSearch(event) {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setResults(null);
      return;
    }
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearching(true);
    setResults(null);
    try {
      const response = await fetch(`/api/support/search?q=${encodeURIComponent(cleanQuery)}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Search झाले नाही.");
      if (requestId !== searchRequestRef.current) return;
      setResults(result);
    } catch (searchError) {
      if (requestId !== searchRequestRef.current) return;
      setResults({ error: searchError.message, faqs: [], tutorials: [], tickets: [] });
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearching(false);
      }
    }
  }

  const searchDisabled = searching || query.trim().length < 2;

  if (loading) return <LoadingState text="Support Center लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={settingsMode ? "📞 मदत आणि Support" : "📞 Support Center"}
        subtitle="FAQ, ticket, tutorials, bug report आणि platform status एका ठिकाणी."
        action={
          <Link
            href="/support/tickets"
            className="rounded-xl bg-green-600 px-4 py-3 text-[15px] font-black text-white shadow-sm active:scale-[0.98]"
          >
            🎫 Ticket तयार करा
          </Link>
        }
      />

      <form onSubmit={runSearch} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <label className="text-[18px] font-black text-slate-950">मदत शोधा</label>
        <div className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim().length < 2) {
                setResults(null);
              }
            }}
            maxLength={120}
            className="min-h-[52px] flex-1 rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
            placeholder="Slip upload, अहवाल, notification, AI..."
          />
          <button
            type="submit"
            className="min-h-[52px] rounded-xl bg-slate-950 px-5 text-[16px] font-black text-white disabled:opacity-60"
            disabled={searchDisabled}
          >
            {searching ? "शोधत आहे..." : "शोधा"}
          </button>
        </div>
        <p className="mt-2 text-[13px] font-bold text-slate-500">किमान २ अक्षरे टाका.</p>

        {results ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            {results.error ? <p className="font-bold text-red-700">{results.error}</p> : null}
            <div className="grid gap-3 md:grid-cols-3">
              <SearchGroup title="FAQ" items={results.faqs || []} hrefPrefix="/support/faq" />
              <SearchGroup title="Tutorials" items={results.tutorials || []} hrefPrefix="/support/tutorials" />
              <SearchGroup title="Tickets" items={results.tickets || []} ticket />
            </div>
          </div>
        ) : null}
      </form>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <ActionCard href="/support/faq" icon="❓" title="FAQ" subtitle="सामान्य प्रश्न" />
        <ActionCard href="/support/tickets" icon="🎫" title="Ticket" subtitle="समस्या नोंदवा" />
        <ActionCard href="/support/contact" icon="📞" title="संपर्क" subtitle="थेट मदत" />
        <ActionCard href="/support/tutorials" icon="🎥" title="मार्गदर्शक" subtitle="Step-by-step मदत" />
        <ActionCard href="/support/status" icon="🟢" title="स्थिती" subtitle="सेवा स्थिती" />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="एकूण tickets" value={data.stats?.total || 0} tone="bg-slate-950 text-white" />
        <MetricCard label="चालू" value={data.stats?.open || 0} tone="bg-yellow-50 text-yellow-900 border-yellow-200" />
        <MetricCard label="सोडवले" value={data.stats?.resolved || 0} tone="bg-green-50 text-green-900 border-green-200" />
        <MetricCard label="तातडीचे" value={data.stats?.critical || 0} tone="bg-red-50 text-red-900 border-red-200" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[24px] font-black text-slate-950">माझे अलीकडील tickets</h2>
            <Link href="/support/tickets" className="text-[15px] font-black text-green-700">
              सर्व बघा
            </Link>
          </div>
          <div className="mt-3 grid gap-3">
            {data.recentTickets?.length ? data.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-black text-slate-950">{ticket.subject}</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-500">
                      {ticket.ticketNumber} · {ticket.categoryLabel} · {formatMarathiDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <TicketStatusBadge statusLabel={ticket.statusLabel} />
                </div>
              </Link>
            )) : (
              <p className="rounded-xl bg-slate-50 p-4 text-[16px] font-bold text-slate-600">
                अजून ticket नाही. काही अडचण असल्यास ticket तयार करा.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
          <h2 className="text-[24px] font-black text-slate-950">System स्थिती</h2>
          <div className="mt-3 grid gap-2">
            {(data.status || []).length ? (data.status || []).map((service) => (
              <div key={service.id} className={`rounded-xl border p-3 ${statusTone(service.status)}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black">{service.service_name}</p>
                  <p className="text-[12px] font-black uppercase">{statusLabel(service.status)}</p>
                </div>
                <p className="mt-1 text-[13px] font-bold opacity-80">{service.message}</p>
              </div>
            )) : (
              <p className="rounded-xl bg-slate-50 p-4 text-[15px] font-bold text-slate-600">
                सेवा स्थितीची माहिती उपलब्ध नाही. App वापरताना अडचण आल्यास ticket तयार करा.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ListCard title="लोकप्रिय FAQ" items={data.topFaq || []} href="/support/faq" />
        <ListCard title="उपयुक्त Tutorials" items={data.tutorials || []} href="/support/tutorials" />
      </section>
    </div>
  );
}

function SearchGroup({ title, items, hrefPrefix, ticket = false }) {
  return (
    <div>
      <p className="text-[14px] font-black text-slate-500">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.length ? items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={ticket ? `/support/tickets/${item.id}` : `${hrefPrefix}?open=${item.id}`}
            className="rounded-lg bg-white p-3 text-[14px] font-bold text-slate-800 shadow-sm"
          >
            {item.title || item.subject}
          </Link>
        )) : (
          <p className="rounded-lg bg-white p-3 text-[13px] font-bold text-slate-500">माहिती नाही</p>
        )}
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, subtitle }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft active:scale-[0.98]"
    >
      <span className="text-[34px]">{icon}</span>
      <span className="mt-3 block text-[20px] font-black text-slate-950">{title}</span>
      <span className="mt-1 block text-[14px] font-bold text-slate-500">{subtitle}</span>
    </Link>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${tone}`}>
      <p className="text-[14px] font-black opacity-80">{label}</p>
      <p className="mt-2 text-[30px] font-black">{toMarathiNumerals(value)}</p>
    </div>
  );
}

function ListCard({ title, items, href }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-black text-slate-950">{title}</h2>
        <Link href={href} className="text-[14px] font-black text-green-700">सर्व</Link>
      </div>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => (
          <Link key={item.id} href={`${href}?open=${item.id}`} className="rounded-xl bg-slate-50 p-3">
            <p className="text-[16px] font-black text-slate-900">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-[13px] font-bold text-slate-500">{item.body || item.description}</p>
          </Link>
        )) : (
          <p className="rounded-xl bg-slate-50 p-4 text-[15px] font-bold text-slate-600">माहिती उपलब्ध नाही.</p>
        )}
      </div>
    </div>
  );
}
