"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import { formatCurrency, formatLitres } from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { getIndiaMonthParts, getMonthLabel } from "@/lib/reportUtils";

const reportLinks = [
  {
    href: "/ahval/dudh",
    title: "दूध सविस्तर अहवाल",
    description: "दैनिक दूध, सकाळ-संध्याकाळ आणि दर",
    emoji: "🥛",
    color: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    accent: "from-blue-500 to-cyan-400"
  },
  {
    href: "/ahval/utpanna",
    title: "उत्पन्न सविस्तर",
    description: "दूध विक्री, पेमेंट आणि बाकी",
    emoji: "💰",
    color: "border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 text-green-950",
    accent: "from-green-500 to-emerald-400"
  },
  {
    href: "/ahval/kharch",
    title: "खर्च सविस्तर",
    description: "खाद्य, औषध, मजुरी आणि इतर",
    emoji: "💸",
    color: "border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-950",
    accent: "from-red-500 to-rose-400"
  },
  {
    href: "/ahval/nafa",
    title: "नफा-तोटा विश्लेषण",
    description: "महिन्याचा नफा, खर्च आणि ट्रेंड",
    emoji: "📈",
    color: "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 text-purple-950",
    accent: "from-purple-500 to-pink-400"
  },
  {
    href: "/ahval/hishob",
    title: "पूर्ण हिशोब अहवाल",
    description: "सर्व आर्थिक नोंदी एकत्र",
    emoji: "💰",
    color: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 text-emerald-950",
    accent: "from-emerald-500 to-green-400"
  },
  {
    href: "/ahval/varshik",
    title: "वार्षिक अहवाल",
    description: "वर्षभराचा दूध, खर्च आणि नफा",
    emoji: "📘",
    color: "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 text-sky-950",
    accent: "from-sky-500 to-blue-400"
  },
  {
    href: "/ahval/gaykamgiri",
    title: "गाय कामगिरी",
    description: "गायींची स्थिती आणि कामगिरी",
    emoji: "🐄",
    color: "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50 text-violet-950",
    accent: "from-violet-500 to-purple-400"
  },
  {
    href: "/ahval/lasiyadi",
    title: "लसीकरण यादी",
    description: "लस, जंतनाशक आणि due dates",
    emoji: "💉",
    color: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-950",
    accent: "from-amber-500 to-yellow-400"
  },
  {
    href: "/ahval/chapa",
    title: "मासिक अहवाल छापा",
    description: "प्रिंटसाठी तयार अहवाल",
    emoji: "🖨️",
    color: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-green-50 text-slate-950",
    accent: "from-slate-700 to-green-500"
  }
];

const accountingLinks = [
  {
    href: "/accounting/slip-scan",
    title: "स्लिप स्कॅन",
    description: "फोटोवरून दूध किंवा सेटलमेंट नोंद",
    emoji: "📷",
    badge: "AI स्कॅन",
    color: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 text-emerald-950",
    accent: "from-emerald-500 to-green-400"
  },
  {
    href: "/nondi/dudh?date=today",
    title: "दूध नोंद",
    description: "स्कॅन न करता स्वतः दूध भरा",
    emoji: "🥛",
    badge: "हाताने नोंद",
    color: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    accent: "from-blue-500 to-cyan-400"
  },
  {
    href: "/accounting/settlements/new",
    title: "१५ दिवसांचे पेमेंट",
    description: "स्कॅन न करता सेटलमेंट भरा",
    emoji: "📋",
    badge: "हाताने नोंद",
    color: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-950",
    accent: "from-amber-500 to-yellow-400"
  },
  {
    href: "/accounting/dairy-slips",
    title: "दूध रेकॉर्ड्स",
    description: "या महिन्याच्या सर्व दूध नोंदी",
    emoji: "📊",
    color: "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 text-sky-950",
    accent: "from-sky-500 to-blue-400"
  },
  {
    href: "/accounting/settlements",
    title: "सेटलमेंट्स",
    description: "१५ दिवसांचे पेमेंट रेकॉर्ड्स",
    emoji: "🧾",
    color: "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50 text-violet-950",
    accent: "from-violet-500 to-purple-400"
  },
  {
    href: "/accounting/payment-slips",
    title: "Payment Slip स्थिती",
    description: "वर्षानुसार १५ दिवसांच्या slips upload झाल्या का",
    emoji: "📅",
    color: "border-teal-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50 text-teal-950",
    accent: "from-teal-500 to-emerald-400"
  },
  {
    href: "/accounting/profit",
    title: "नफा/तोटा",
    description: "महिन्याचा हिशोब आणि analysis",
    emoji: "📈",
    color: "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 text-purple-950",
    accent: "from-purple-500 to-pink-400"
  }
];

function MetricCard({ href, emoji, title, value, subtext, tone = "green" }) {
  const tones = {
    green: "border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 text-green-950",
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    red: "border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-950"
  };

  return (
    <Link
      href={href}
      className={`dashboard-card dashboard-summary-tile relative block min-h-[150px] overflow-hidden rounded-lg border p-4 shadow-soft ${
        tones[tone] || tones.green
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[34px] leading-none" aria-hidden="true">{emoji}</span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[14px] font-extrabold shadow-sm ring-1 ring-white/70">
          बघा
        </span>
      </div>
      <p className="mt-3 text-[16px] font-extrabold leading-tight opacity-75">{title}</p>
      <p className="mt-2 break-words text-[25px] font-black leading-tight">{value}</p>
      <p className="mt-2 text-[15px] font-bold leading-snug opacity-75">{subtext}</p>
    </Link>
  );
}

function ReportTile({ item, linkQuery }) {
  return (
    <Link
      href={`${item.href}${item.keepQuery === false ? "" : linkQuery}`}
      className={`dashboard-card dashboard-action-tile relative flex min-h-[118px] items-center gap-4 overflow-hidden rounded-lg border p-4 shadow-soft ${item.color}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${item.accent}`} aria-hidden="true" />
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/85 text-[34px] shadow-sm ring-1 ring-white/70" aria-hidden="true">
        {item.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[21px] font-extrabold leading-tight">{item.title}</span>
        <span className="mt-1 block text-[16px] font-bold leading-snug opacity-75">{item.description}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white">
        →
      </span>
    </Link>
  );
}

function AccountingTile({ item }) {
  return (
    <Link
      href={item.href}
      className={`dashboard-card dashboard-action-tile relative flex min-h-[112px] items-center gap-4 overflow-hidden rounded-lg border p-4 shadow-soft ${item.color}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${item.accent}`} aria-hidden="true" />
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/85 text-[31px] shadow-sm ring-1 ring-white/70" aria-hidden="true">
        {item.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block text-[20px] font-extrabold leading-tight">{item.title}</span>
          {item.badge ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-black text-slate-700 shadow-sm ring-1 ring-white/70">
              {item.badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[15px] font-bold leading-snug opacity-75">{item.description}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white">
        →
      </span>
    </Link>
  );
}

export default function AhvalPage() {
  const [monthValue, setMonthValue] = useState(getIndiaMonthParts());
  const [milkReport, setMilkReport] = useState(null);
  const [financeReport, setFinanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const [milkReportData, financeReportData] = await Promise.all([
        fetchJson(`/api/reports/milk?${query}`),
        fetchJson(`/api/reports/finance?${query}`)
      ]);

      setMilkReport(milkReportData);
      setFinanceReport(financeReportData);
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const netProfit = financeReport?.netProfit || 0;
  const monthlyExpenseTotal =
    Number(financeReport?.totalExpense || 0) + Number(financeReport?.deductionsCountedInProfit || 0);
  const linkQuery = `?month=${monthValue.month}&year=${monthValue.year}`;
  const selectedMonthLabel = getMonthLabel(monthValue.month, monthValue.year);

  return (
    <div className="space-y-6">
      <header className="dashboard-hero overflow-hidden rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-green-100">
                माझी डेअरी
              </p>
              <h1 className="mt-1 text-[34px] font-black leading-tight">
                📊 अहवाल
              </h1>
              <p className="mt-1 text-[18px] font-bold leading-snug text-green-50">
                {selectedMonthLabel} महिन्याची स्पष्ट माहिती
              </p>
            </div>
            <Link
              href={`/ahval/chapa${linkQuery}`}
              className="flex min-h-[52px] shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[18px] font-extrabold text-green-800 shadow-sm active:bg-green-50"
            >
              🖨️ छापा
            </Link>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-3 gap-2 rounded-lg p-2">
            <article className="rounded-lg bg-white px-2 py-3 text-center text-slate-950 shadow-sm ring-1 ring-white/60">
              <p className="text-[13px] font-extrabold leading-tight text-slate-500">दूध</p>
              <p className="mt-1 text-[22px] font-black leading-tight">
                {formatLitres(milkReport?.totalLitres || 0)}
              </p>
            </article>
            <article className="rounded-lg bg-green-50 px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-green-100">
              <p className="text-[13px] font-extrabold leading-tight text-green-600">उत्पन्न</p>
              <p className="mt-1 text-[20px] font-black leading-tight">
                {formatCurrency(financeReport?.totalIncome || 0)}
              </p>
            </article>
            <article className={`${netProfit >= 0 ? "bg-blue-50 text-blue-950 ring-blue-100" : "bg-red-50 text-red-950 ring-red-100"} rounded-lg px-2 py-3 text-center shadow-sm ring-1`}>
              <p className="text-[13px] font-extrabold leading-tight opacity-70">नफा</p>
              <p className="mt-1 text-[20px] font-black leading-tight">
                {formatCurrency(netProfit)}
              </p>
            </article>
          </div>
        </div>
      </header>

      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {!loading && !error ? (
        <section className="grid grid-cols-2 gap-3" aria-label="मासिक सारांश">
          <MetricCard
            href={`/ahval/dudh${linkQuery}`}
            emoji="🥛"
            title="एकूण दूध उत्पादन"
            value={`${formatLitres(milkReport?.totalLitres || 0)} लिटर`}
            subtext={`दररोज सरासरी ${formatLitres(milkReport?.dailyAverage || 0)} लिटर`}
            tone="blue"
          />
          <MetricCard
            href={`/ahval/utpanna${linkQuery}`}
            emoji="💰"
            title="एकूण उत्पन्न"
            value={formatCurrency(financeReport?.totalIncome || 0)}
            subtext="दूध विक्री + इतर उत्पन्न"
            tone="green"
          />
          <MetricCard
            href={`/ahval/kharch${linkQuery}`}
            emoji="💸"
            title="मासिक खर्च"
            value={formatCurrency(monthlyExpenseTotal)}
            subtext="खाद्य कपात + इतर खर्च"
            tone="red"
          />
          <MetricCard
            href={`/ahval/nafa${linkQuery}`}
            emoji={netProfit >= 0 ? "📈" : "📉"}
            title={netProfit >= 0 ? "मासिक नफा" : "मासिक तोटा"}
            value={formatCurrency(Math.abs(netProfit))}
            subtext="महिन्याचा अंतिम हिशोब"
            tone={netProfit >= 0 ? "green" : "red"}
          />
        </section>
      ) : null}

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative z-10 mb-4">
          <h2 className="text-[24px] font-extrabold text-slate-950">सविस्तर अहवाल</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-500">
            शेतकऱ्याला पटकन समजेल अशा प्रकारे विभागलेले अहवाल
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {reportLinks.map((item) => (
            <ReportTile key={item.href} item={item} linkQuery={linkQuery} />
          ))}
        </div>
      </section>

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative z-10 mb-4">
          <h2 className="text-[24px] font-extrabold text-slate-950">हिशोब कामे</h2>
          <p className="mt-1 text-[17px] font-bold leading-snug text-slate-500">
            स्कॅन, हाताने नोंद आणि पेमेंट रेकॉर्ड्स इथून उघडा
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {accountingLinks.map((item) => (
            <AccountingTile key={item.href} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
