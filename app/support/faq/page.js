"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export default function SupportFaqPage() {
  const [articles, setArticles] = useState([]);
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
      const params = new URLSearchParams({ category });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/support/faq?${params.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "FAQ मिळाले नाहीत.");
      setArticles(result.articles || []);
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

  async function vote(articleId, action, shouldReload = true) {
    await fetch("/api/support/faq", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ articleId, action })
    }).catch(() => null);
    if (shouldReload) load();
  }

  async function toggleArticle(article) {
    const next = openId === article.id ? "" : article.id;
    setOpenId(next);
    if (next) {
      await vote(article.id, "view", false);
    }
  }

  if (loading) return <LoadingState text="FAQ लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="❓ FAQ"
        subtitle="सामान्य प्रश्नांची जलद उत्तरे."
        action={<Link href="/support" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Support</Link>}
      />

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
          placeholder="FAQ शोधा..."
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

      <section className="grid gap-3">
        {articles.length ? articles.map((article) => (
          <article key={article.id} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
            <button type="button" onClick={() => toggleArticle(article)} className="flex w-full items-start justify-between gap-3 text-left">
              <span>
                <span className="block text-[20px] font-black text-slate-950">{article.title}</span>
                <span className="mt-1 block text-[13px] font-black text-slate-500">
                  {article.categoryLabel} · {toMarathiNumerals(article.viewsCount)} views
                </span>
              </span>
              <span className="text-[24px] font-black text-slate-400">{openId === article.id ? "−" : "+"}</span>
            </button>

            {openId === article.id ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="whitespace-pre-wrap text-[16px] font-bold leading-relaxed text-slate-700">{article.body}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => vote(article.id, "helpful")} className="rounded-xl bg-green-50 px-4 py-2 text-[14px] font-black text-green-800">
                    👍 उपयोगी ({toMarathiNumerals(article.helpfulCount)})
                  </button>
                  <button onClick={() => vote(article.id, "not_helpful")} className="rounded-xl bg-red-50 px-4 py-2 text-[14px] font-black text-red-800">
                    👎 नाही ({toMarathiNumerals(article.notHelpfulCount)})
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        )) : (
          <p className="rounded-2xl bg-white p-5 text-[17px] font-bold text-slate-600 shadow-soft">FAQ सापडले नाहीत.</p>
        )}
      </section>
    </div>
  );
}
