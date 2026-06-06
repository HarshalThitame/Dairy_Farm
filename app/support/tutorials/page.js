"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { toMarathiNumerals } from "@/lib/marathiUtils";

export default function SupportTutorialsPage() {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const targetOpenId = typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("open");
      const params = new URLSearchParams({ category });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/support/tutorials?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Tutorials मिळाले नाहीत.");
      let nextTutorials = result.tutorials || [];
      if (targetOpenId && !nextTutorials.some((item) => item.id === targetOpenId)) {
        const tutorialResponse = await fetch(`/api/support/tutorials?tutorialId=${encodeURIComponent(targetOpenId)}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: getClientAuthHeaders()
        });
        const tutorialResult = await tutorialResponse.json().catch(() => ({}));
        if (tutorialResponse.ok && tutorialResult.tutorial) {
          nextTutorials = [tutorialResult.tutorial, ...nextTutorials];
        }
      }
      setTutorials(nextTutorials);
      setCategories(result.categories || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialOpen = new URLSearchParams(window.location.search).get("open");
    if (initialOpen) setOpenId(initialOpen);
  }, []);

  async function openTutorial(item) {
    const next = openId === item.id ? "" : item.id;
    setOpenId(next);
    if (next) {
      await fetch(`/api/support/tutorials?tutorialId=${item.id}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      }).catch(() => null);
    }
  }

  if (loading) return <LoadingState text="Tutorials लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="🎥 Tutorials"
        subtitle="Step-by-step guide, articles आणि slip upload tips."
        action={<Link href="/support" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Support</Link>}
      />

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
          placeholder="Tutorial शोधा..."
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-black ${
                category === item.id ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {tutorials.length ? tutorials.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
            <button type="button" onClick={() => openTutorial(item)} className="w-full text-left">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700">{item.categoryLabel}</span>
              <h2 className="mt-3 text-[22px] font-black text-slate-950">{item.title}</h2>
              <p className="mt-1 text-[14px] font-bold text-slate-500">{item.description}</p>
              <p className="mt-2 text-[12px] font-black text-slate-400">{toMarathiNumerals(item.viewsCount)} views · {item.type}</p>
            </button>

            {openId === item.id ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {item.mediaUrl ? (
                  <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="mb-3 block rounded-xl bg-blue-50 p-3 text-[15px] font-black text-blue-800">
                    Media उघडा
                  </a>
                ) : null}
                {item.content ? <p className="whitespace-pre-wrap text-[16px] font-bold leading-relaxed text-slate-700">{item.content}</p> : null}
                {item.steps?.length ? (
                  <div className="mt-3 grid gap-2">
                    {item.steps.map((step, index) => (
                      <div key={`${item.id}-${index}`} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[16px] font-black text-slate-950">{toMarathiNumerals(index + 1)}. {step.title}</p>
                        <p className="mt-1 text-[14px] font-bold text-slate-600">{step.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        )) : (
          <p className="rounded-2xl bg-white p-5 text-[17px] font-bold text-slate-600 shadow-soft">Tutorial सापडले नाहीत.</p>
        )}
      </section>
    </div>
  );
}
