"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import AnimatedNumber from "@/components/home/AnimatedNumber";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import MilkWaveProgress from "@/components/home/MilkWaveProgress";
import ReminderCard from "@/components/ReminderCard";
import TrialBanner from "@/components/TrialBanner";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import {
  formatCurrency,
  formatLitres,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { addMonths, getIndiaMonthParts, getMonthName } from "@/lib/reportUtils";
import { isOnline } from "@/lib/networkStatus";
import {
  fetchCows as fetchCowsOffline,
  fetchJson,
  fetchMilkByDate,
  fetchRemindersByFilter,
  markReminderDone as markReminderDoneOffline
} from "@/lib/offlineActions";

export default function DashboardPage() {
  const { farm } = useAuth();
  const currentMonth = getIndiaMonthParts();
  const [cows, setCows] = useState([]);
  const [cowsSummary, setCowsSummary] = useState({ total: 0, pregnant: 0 });
  const [milkRecords, setMilkRecords] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [reminderCounts, setReminderCounts] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [calvesSummary, setCalvesSummary] = useState(null);
  const [monthlyMilkReport, setMonthlyMilkReport] = useState(null);
  const [monthlyFinanceReport, setMonthlyFinanceReport] = useState(null);
  const [previousMonthlyMilkReport, setPreviousMonthlyMilkReport] = useState(null);
  const [previousMonthlyFinanceReport, setPreviousMonthlyFinanceReport] = useState(null);
  const [pendingSettlementSlips, setPendingSettlementSlips] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(null);
  const [todayIncome, setTodayIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reportQuery = `month=${currentMonth.month}&year=${currentMonth.year}`;
      try {
        const snapshot = await fetchJson(`/api/dashboard?${reportQuery}`, { cacheTtlMs: 10 * 1000 });
        const previousMonth = addMonths(currentMonth.month, currentMonth.year, -1);
        let previousSnapshot = null;

        try {
          previousSnapshot = await fetchJson(
            `/api/dashboard?month=${previousMonth.month}&year=${previousMonth.year}`,
            { cacheTtlMs: 30 * 1000 }
          );
        } catch {
          previousSnapshot = null;
        }

        setCows([]);
        setCowsSummary(snapshot.cowsSummary || { total: 0, pregnant: 0 });
        setMilkRecords(snapshot.todayMilk?.records || []);
        setTodayReminders(snapshot.reminders?.today || []);
        setOverdueReminders(snapshot.reminders?.overdue || []);
        setUpcomingReminders(snapshot.reminders?.upcoming || []);
        setReminderCounts({
          today: snapshot.reminders?.todayCount || 0,
          overdue: snapshot.reminders?.overdueCount || 0,
          upcoming: snapshot.reminders?.upcomingCount || 0
        });
        setCalvesSummary(snapshot.calvesSummary || null);
        setMonthlyMilkReport(snapshot.monthlyMilkReport || null);
        setMonthlyFinanceReport(snapshot.monthlyFinanceReport || null);
        setPendingSettlementSlips(snapshot.settlementSlipStatus || null);
        setDailyGoal(snapshot.dailyGoal || null);
        setTodayIncome(snapshot.todayIncome || 0);
        setPreviousMonthlyMilkReport(previousSnapshot?.monthlyMilkReport || null);
        setPreviousMonthlyFinanceReport(previousSnapshot?.monthlyFinanceReport || null);
        return;
      } catch (dashboardError) {
        if (isOnline()) {
          throw dashboardError;
        }
        // Offline fallback below keeps the dashboard usable with locally cached data.
      }

      const [
        cowsResult,
        milkResult,
        todayResult,
        overdueResult,
        upcomingResult
      ] =
        await Promise.all([
          fetchCowsOffline(),
          fetchMilkByDate(getTodayISODate()),
          fetchRemindersByFilter("today"),
          fetchRemindersByFilter("overdue"),
          fetchRemindersByFilter("week")
        ]);

      setCows(cowsResult.data || []);
      setCowsSummary({
        total: (cowsResult.data || []).length,
        pregnant: (cowsResult.data || []).filter((cow) => cow.status === "गाभण").length
      });
      setMilkRecords(milkResult.data || []);
      setTodayReminders(todayResult.data || []);
      setOverdueReminders(overdueResult.data || []);
      setUpcomingReminders((upcomingResult.data || []).filter((reminder) => reminder.reminder_date > getTodayISODate()));
      setReminderCounts({
        today: (todayResult.data || []).length,
        overdue: (overdueResult.data || []).length,
        upcoming: (upcomingResult.data || []).filter((reminder) => reminder.reminder_date > getTodayISODate()).length
      });
      setCalvesSummary(null);
      setMonthlyMilkReport(null);
      setMonthlyFinanceReport(null);
      setPendingSettlementSlips(null);
      setDailyGoal(null);
      setTodayIncome(0);
      setPreviousMonthlyMilkReport(null);
      setPreviousMonthlyFinanceReport(null);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth.month, currentMonth.year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const todayMilkTotal = useMemo(() => {
    return milkRecords.reduce(
      (total, record) =>
        total + Number(record.total_litres ?? Number(record.morning_litres || 0) + Number(record.evening_litres || 0)),
      0
    );
  }, [milkRecords]);
  const todayMorningMilkTotal = useMemo(() => {
    return milkRecords.reduce((total, record) => total + Number(record.morning_litres || 0), 0);
  }, [milkRecords]);
  const todayEveningMilkTotal = useMemo(() => {
    return milkRecords.reduce((total, record) => total + Number(record.evening_litres || 0), 0);
  }, [milkRecords]);

  const pregnantCount = useMemo(() => {
    return cowsSummary.pregnant || cows.filter((cow) => cow.status === "गाभण").length;
  }, [cows, cowsSummary.pregnant]);

  const pendingReminderCount =
    Number(reminderCounts.overdue || 0) +
    Number(reminderCounts.today || 0) +
    Number(reminderCounts.upcoming || 0);
  const todayReminderCount = Number(reminderCounts.today || 0);
  const monthlyNetProfit = Number(monthlyFinanceReport?.netProfit || 0);
  const pendingSettlementSlipCount = Number(pendingSettlementSlips?.pendingCount || 0);
  const monthlyExpenseTotal =
    Number(monthlyFinanceReport?.totalExpense || 0) +
    Number(monthlyFinanceReport?.deductionsCountedInProfit || monthlyFinanceReport?.totalDeductions || 0);
  const monthlyIncomeTotal = Number(monthlyFinanceReport?.totalIncome || 0);
  const previousMonth = addMonths(currentMonth.month, currentMonth.year, -1);
  const previousMonthlyNetProfit = Number(previousMonthlyFinanceReport?.netProfit || 0);
  const previousMonthlyExpenseTotal =
    Number(previousMonthlyFinanceReport?.totalExpense || 0) +
    Number(previousMonthlyFinanceReport?.deductionsCountedInProfit || previousMonthlyFinanceReport?.totalDeductions || 0);
  const previousMonthlyIncomeTotal = Number(previousMonthlyFinanceReport?.totalIncome || 0);
  const farmName = farm?.farmName || APP_NAME;
  const monthlyQuery = `month=${currentMonth.month}&year=${currentMonth.year}`;
  const today = getTodayISODate();
  const goalCurrentLiters = dailyGoal?.currentLiters ?? todayMilkTotal;
  const goalTargetLiters = dailyGoal?.targetLiters || 300;

  const summaryTone = {
    blue: {
      card: "border-blue-100 bg-blue-50 text-blue-950",
      icon: "bg-blue-100 text-blue-900",
      accent: "bg-blue-500"
    },
    green: {
      card: "border-green-100 bg-green-50 text-green-950",
      icon: "bg-green-100 text-green-900",
      accent: "bg-green-500"
    },
    red: {
      card: "border-red-100 bg-red-50 text-red-950",
      icon: "bg-red-100 text-red-900",
      accent: "bg-red-500"
    },
    amber: {
      card: "border-yellow-100 bg-yellow-50 text-yellow-950",
      icon: "bg-yellow-100 text-yellow-900",
      accent: "bg-yellow-500"
    },
    purple: {
      card: "border-purple-100 bg-purple-50 text-purple-950",
      icon: "bg-purple-100 text-purple-900",
      accent: "bg-purple-500"
    }
  };

  const heroStats = [
    {
      label: "सकाळचे दूध",
      value: todayMorningMilkTotal,
      formatter: (value) => `${formatLitres(value)} लि.`
    },
    {
      label: "आठवणी",
      value: pendingReminderCount,
      formatter: (value) => toMarathiNumerals(Math.round(value))
    },
    {
      label: "संध्याकाळचे दूध",
      value: todayEveningMilkTotal,
      formatter: (value) => `${formatLitres(value)} लि.`
    }
  ];

  const primaryActions = [
    {
      href: `/nondi/dudh?date=${today}`,
      icon: "🥛",
      title: "दूध नोंद",
      subtitle: "आजचे दूध भरा",
      className: "border-blue-100 bg-blue-50 text-blue-950 active:bg-blue-100",
      iconClassName: "bg-blue-100"
    },
    {
      href: "/accounting/slip-scan",
      icon: "📷",
      title: "स्लिप स्कॅन",
      subtitle: "फोटोवरून नोंद",
      className: "border-green-100 bg-green-50 text-green-950 active:bg-green-100",
      iconClassName: "bg-green-100"
    },
    {
      href: "/accounting/expenses/new",
      icon: "💸",
      title: "खर्च नोंद",
      subtitle: "औषध, मजुरी, इतर",
      className: "border-amber-100 bg-amber-50 text-amber-950 active:bg-amber-100",
      iconClassName: "bg-amber-100"
    }
  ];

  const summaries = [
    {
      emoji: "🐄",
      label: "एकूण गायी",
      value: toMarathiNumerals(farm?.totalCows ?? cowsSummary.total ?? cows.length),
      numericValue: farm?.totalCows ?? cowsSummary.total ?? cows.length,
      formatter: (value) => toMarathiNumerals(Math.round(value)),
      href: "/gayi",
      tone: "green"
    },
    {
      emoji: "🥛",
      label: "आज दूध",
      value: `${formatLitres(todayMilkTotal)} लिटर`,
      numericValue: todayMilkTotal,
      formatter: (value) => `${formatLitres(value)} लिटर`,
      href: `/nondi/dudh?date=${today}`,
      tone: "blue"
    },
    {
      emoji: "💰",
      label: "आजचे उत्पन्न",
      value: formatCurrency(todayIncome),
      numericValue: todayIncome,
      formatter: (value) => formatCurrency(value),
      href: `/ahval/utpanna?${monthlyQuery}`,
      tone: "green"
    },
    {
      emoji: "🔔",
      label: "आजच्या आठवणी",
      value: toMarathiNumerals(todayReminderCount),
      numericValue: todayReminderCount,
      formatter: (value) => toMarathiNumerals(Math.round(value)),
      href: "/athavan",
      tone: todayReminderCount > 0 ? "red" : "amber"
    },
    {
      emoji: "🐄",
      label: "गाभण गायी",
      value: toMarathiNumerals(pregnantCount),
      numericValue: pregnantCount,
      formatter: (value) => toMarathiNumerals(Math.round(value)),
      href: "/nondi/vyayan",
      tone: "purple"
    },
    {
      emoji: "🐮",
      label: "वासरे",
      value: toMarathiNumerals(calvesSummary?.active || 0),
      numericValue: calvesSummary?.active || 0,
      formatter: (value) => toMarathiNumerals(Math.round(value)),
      href: "/vasare",
      tone: "amber"
    }
  ];

  const recentActivities = useMemo(() => {
    const activities = [];

    if (todayMilkTotal > 0) {
      activities.push({
        icon: "🥛",
        title: "आजची दूध नोंद अपडेट झाली",
        detail: `${formatLitres(todayMorningMilkTotal)} लि. सकाळ + ${formatLitres(todayEveningMilkTotal)} लि. संध्याकाळ`
      });
    }

    if (todayIncome > 0) {
      activities.push({
        icon: "💰",
        title: "आजचे उत्पन्न तयार झाले",
        detail: formatCurrency(todayIncome)
      });
    }

    if (pendingSettlementSlipCount > 0) {
      activities.push({
        icon: "📋",
        title: "देयक स्लिप अपलोड बाकी",
        detail: `${toMarathiNumerals(pendingSettlementSlipCount)} स्लिप तपासायच्या आहेत`
      });
    }

    if (todayReminderCount > 0) {
      activities.push({
        icon: "🔔",
        title: "आजच्या आठवणी तयार आहेत",
        detail: `${toMarathiNumerals(todayReminderCount)} कामे बाकी`
      });
    }

    if (monthlyMilkReport?.totalLitres > 0) {
      activities.push({
        icon: "📊",
        title: "मासिक दूध सारांश अपडेट",
        detail: `${formatLitres(monthlyMilkReport.totalLitres)} लिटर`
      });
    }

    return activities.slice(0, 5);
  }, [
    monthlyMilkReport?.totalLitres,
    pendingSettlementSlipCount,
    todayEveningMilkTotal,
    todayIncome,
    todayMilkTotal,
    todayMorningMilkTotal,
    todayReminderCount
  ]);

  function openAiAssistant(question = "") {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("majhi-open-ai-assistant", {
        detail: { question }
      })
    );
  }

  async function markReminderDone(reminder) {
    try {
      await markReminderDoneOffline(reminder.id);
      fetchDashboard();
    } catch {
      setError("आठवण बदलली नाही.");
    }
  }

  function ReminderGroup({ title, count, reminders, emptyText, tone = "green" }) {
    const titleClass = tone === "red" ? "text-red-900" : tone === "blue" ? "text-blue-900" : "text-slate-950";
    const emptyClass =
      tone === "red"
        ? "border-red-200 bg-red-50 text-red-800"
        : tone === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-green-200 bg-green-50 text-green-800";
    const shellClass =
      tone === "red"
        ? "border-red-100 bg-red-50/60"
        : tone === "blue"
          ? "border-blue-100 bg-blue-50/60"
          : "border-green-100 bg-green-50/60";

    return (
      <div className={`dashboard-reminder-group rounded-lg border p-3 ${shellClass}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className={`text-[21px] font-extrabold leading-tight ${titleClass}`}>
            {title}
          </h3>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[17px] font-extrabold text-slate-700">
            {toMarathiNumerals(count || 0)}
          </span>
        </div>

        {(reminders || []).length > 0 ? (
          <div className="mt-3 space-y-3">
            {reminders.slice(0, 2).map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={markReminderDone}
                compact
              />
            ))}
          </div>
        ) : (
          <p className={`mt-3 rounded-lg border-2 border-dashed p-4 text-center text-[18px] font-extrabold ${emptyClass}`}>
            {emptyText}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  return (
    <div className="dashboard-enter space-y-5 pb-2">
      <TrialBanner />

      <header className="dashboard-hero rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[15px] font-extrabold text-green-50 ring-1 ring-white/25 backdrop-blur">
                {APP_TAGLINE}
              </p>
              <h1 className="mt-3 text-[31px] font-extrabold leading-tight sm:text-[34px]">
                🐄 {farmName}
              </h1>
              <p className="mt-2 text-[18px] font-bold leading-snug text-green-50">
                रोजचे दूध, आठवणी आणि हिशोब एकाच ठिकाणी
              </p>
            </div>
            <Link
              href="/athavan"
              className="relative flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-white text-[28px] text-sheti shadow-sm active:bg-green-50"
              aria-label="आठवणी"
            >
              🔔
              {todayReminderCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-[26px] min-w-[26px] items-center justify-center rounded-full bg-tatkal px-1 text-[16px] font-extrabold text-white">
                  {toMarathiNumerals(todayReminderCount)}
                </span>
              ) : null}
            </Link>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-3 gap-2 rounded-lg p-2">
            {heroStats.map((stat) => (
              <div key={stat.label} className="min-w-0 rounded-lg bg-white/10 px-2 py-3 text-center ring-1 ring-white/20">
                <p className="text-[13px] font-extrabold leading-tight text-green-50/90">
                  {stat.label}
                </p>
                <p className="mt-1 truncate text-[18px] font-extrabold leading-tight text-white">
                  <AnimatedNumber value={stat.value} formatter={stat.formatter} />
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/ahval"
              className="dashboard-card rounded-lg bg-white px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50"
            >
              <p className="text-[20px] font-extrabold">📊</p>
              <p className="mt-1 text-[15px] font-extrabold leading-tight">अहवाल</p>
            </Link>
            <Link
              href="/accounting/slip-scan"
              className="dashboard-card rounded-lg bg-white px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50"
            >
              <p className="text-[20px] font-extrabold">📷</p>
              <p className="mt-1 text-[15px] font-extrabold leading-tight">स्कॅन</p>
            </Link>
          </div>
        </div>
      </header>

      <section className="dashboard-stagger grid grid-cols-3 gap-2" aria-label="जलद काम">
        {primaryActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`dashboard-card dashboard-action-tile relative flex min-h-[122px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center shadow-soft ${action.className}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[23px] shadow-sm ${action.iconClassName}`}>
              {action.icon}
            </span>
            <span className="min-w-0">
              <span className="block break-words text-[15px] font-extrabold leading-tight sm:text-[18px]">{action.title}</span>
              <span className="mt-1 block break-words text-[12px] font-bold leading-tight opacity-75 sm:text-[14px]">{action.subtitle}</span>
            </span>
            <span className="absolute right-2 top-2 text-[16px] font-extrabold opacity-60">→</span>
          </Link>
        ))}
      </section>

      {pendingSettlementSlipCount > 0 ? (
        <Link
          href="/accounting/pending-slips"
          className="dashboard-card dashboard-scan block rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-green-50 p-4 shadow-soft active:bg-amber-100"
        >
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[30px] text-amber-900 shadow-sm">
              📋
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[23px] font-black leading-tight text-amber-950">
                {toMarathiNumerals(pendingSettlementSlipCount)} देयक स्लिप अपलोड बाकी
              </p>
              <p className="mt-1 text-[16px] font-bold leading-snug text-amber-800">
                कोणत्या महिन्याची १५ दिवसांची स्लिप राहिली आहे ते तपासा.
              </p>
              {pendingSettlementSlips?.periods?.[0] ? (
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[14px] font-extrabold text-amber-900 shadow-sm">
                  पहिले बाकी: {pendingSettlementSlips.periods[0].period_label}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-amber-600 px-3 py-2 text-[16px] font-extrabold text-white shadow-sm">
              उघडा →
            </span>
          </div>
        </Link>
      ) : null}

      <MilkWaveProgress
        current={goalCurrentLiters}
        target={goalTargetLiters}
        enabled={dailyGoal?.enabled !== false}
      />

      <section className="dashboard-card ai-home-card rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => openAiAssistant()}
            className="ai-mascot-home flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white p-1.5 shadow-lg shadow-emerald-900/10"
            aria-label="AI सहाय्यक उघडा"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/ai logo.png" alt="दुग्धमित्र AI" className="h-full w-full rounded-full object-cover" />
            <span className="ai-mascot-eye ai-mascot-eye-left" aria-hidden="true" />
            <span className="ai-mascot-eye ai-mascot-eye-right" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-emerald-700">दुग्धमित्र AI</p>
            <h2 className="mt-1 text-[24px] font-black leading-tight text-slate-950">
              आज मी तुमची कशी मदत करू?
            </h2>
            <button
              type="button"
              onClick={() => openAiAssistant()}
              className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-[16px] font-extrabold text-white shadow-sm active:bg-emerald-700"
            >
              AI उघडा →
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["आजचे दूध?", "या महिन्याचे उत्पन्न?", "सरासरी फॅट?", "आजच्या आठवणी?"].map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => openAiAssistant(question)}
              className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-2 text-[14px] font-extrabold text-emerald-800 shadow-sm active:bg-emerald-50"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-stagger grid grid-cols-2 gap-3" aria-label="सारांश">
        {summaries.map((item) => {
          const tone = summaryTone[item.tone] || summaryTone.green;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`dashboard-card dashboard-summary-tile relative block min-h-[136px] overflow-hidden rounded-lg border p-4 shadow-soft ${tone.card}`}
            >
              <span className={`absolute left-0 top-0 h-1.5 w-full ${tone.accent}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-[28px] shadow-sm ${tone.icon}`} aria-hidden="true">
                  {item.emoji}
                </div>
                <span className="rounded-full bg-white/80 px-2 py-1 text-[15px] font-extrabold text-slate-600 shadow-sm">→</span>
              </div>
              <h2 className="mt-3 text-[18px] font-bold leading-tight text-slate-700">
                {item.label}
              </h2>
              <p className="mt-2 text-[26px] font-extrabold leading-none text-slate-950">
                {item.numericValue !== undefined ? (
                  <AnimatedNumber value={item.numericValue} formatter={item.formatter} />
                ) : (
                  item.value
                )}
              </p>
            </Link>
          );
        })}
      </section>

      <Link
        href="/accounting/slip-scan"
        className="dashboard-card dashboard-scan block rounded-lg border border-emerald-200 bg-gradient-to-r from-green-50 via-white to-blue-50 p-4 shadow-soft active:bg-green-100"
      >
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="dashboard-scan-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-sheti text-[34px] text-white shadow-soft">
            📷
          </div>
          <div className="min-w-0">
            <p className="text-[25px] font-extrabold leading-tight text-green-950">
              स्लिप स्कॅन करा
            </p>
            <p className="mt-2 text-[18px] font-bold leading-snug text-green-800">
              दूध स्लिपचा फोटो काढा किंवा गॅलरीमधून अपलोड करा
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[14px] font-extrabold text-green-800 shadow-sm">AI वाचेल</span>
              <span className="rounded-full bg-white px-3 py-1 text-[14px] font-extrabold text-blue-800 shadow-sm">तुम्ही तपासा</span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-sheti px-4 py-3 text-[18px] font-extrabold text-white shadow-sm">
            उघडा →
          </span>
        </div>
      </Link>

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[27px] shadow-sm">
              🔔
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-slate-500">कामाची यादी</p>
              <h2 className="text-[25px] font-extrabold leading-tight text-slate-950">
                आठवणी
              </h2>
            </div>
          </div>
          <Link
            href="/athavan"
            className="dashboard-card shrink-0 rounded-full bg-green-50 px-3 py-2 text-[17px] font-extrabold text-sheti ring-1 ring-green-200"
          >
            सर्व {toMarathiNumerals(pendingReminderCount)} →
          </Link>
        </div>

        <div className="dashboard-stagger mt-4 space-y-3">
          <ReminderGroup
            title="आजच्या आठवणी"
            count={reminderCounts.today}
            reminders={todayReminders}
            emptyText="आज कोणतीही आठवण नाही."
          />
          <ReminderGroup
            title="मागील बाकी"
            count={reminderCounts.overdue}
            reminders={overdueReminders}
            emptyText="मागील बाकी आठवण नाही."
            tone="red"
          />
          <ReminderGroup
            title="पुढील आठवणी"
            count={reminderCounts.upcoming}
            reminders={upcomingReminders}
            emptyText="पुढील ७ दिवसांत आठवण नाही."
            tone="blue"
          />
        </div>
      </section>

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[27px] shadow-sm">
              📊
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-slate-500">या महिन्याची स्थिती</p>
              <h2 className="text-[25px] font-extrabold leading-tight text-slate-950">
                मासिक सारांश
              </h2>
            </div>
          </div>
          <p className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-[17px] font-extrabold text-slate-700">
            {getMonthName(currentMonth.month)} {toMarathiNumerals(currentMonth.year)}
          </p>
        </div>

        <Link
          href={`/ahval/nafa?${monthlyQuery}`}
          className={`dashboard-card mt-4 block rounded-lg border p-4 shadow-sm ${
            monthlyNetProfit >= 0
              ? "border-green-100 bg-green-50 text-green-950 active:bg-green-100"
              : "border-red-100 bg-red-50 text-red-950 active:bg-red-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-extrabold opacity-75">शुद्ध नफा / तोटा</p>
              <p className="mt-1 text-[30px] font-extrabold leading-tight">
                <AnimatedNumber value={monthlyNetProfit} formatter={(value) => formatCurrency(value)} />
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-[17px] font-extrabold shadow-sm">
              तपशील →
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-extrabold leading-snug">
            <p className="min-w-0 break-words rounded-lg bg-white/70 px-3 py-2 text-green-800">
              उत्पन्न: <AnimatedNumber value={monthlyIncomeTotal} formatter={(value) => formatCurrency(value)} />
            </p>
            <p className="min-w-0 break-words rounded-lg bg-white/70 px-3 py-2 text-red-800">
              खर्च: <AnimatedNumber value={monthlyExpenseTotal} formatter={(value) => formatCurrency(value)} />
            </p>
          </div>
        </Link>

        <div className="dashboard-stagger mt-4 grid grid-cols-2 gap-3">
          <Link
            href={`/ahval/dudh?${monthlyQuery}`}
            className="dashboard-card block rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-900 shadow-sm active:bg-blue-100"
          >
            <p className="text-[18px] font-extrabold">🥛 दूध</p>
            <p className="mt-1 text-[22px] font-extrabold">
              <AnimatedNumber value={monthlyMilkReport?.totalLitres || 0} formatter={(value) => `${formatLitres(value)} लिटर`} />
            </p>
          </Link>
          <Link
            href={`/ahval/utpanna?${monthlyQuery}`}
            className="dashboard-card block rounded-lg border border-green-100 bg-green-50 p-3 text-green-900 shadow-sm active:bg-green-100"
          >
            <p className="text-[18px] font-extrabold">💰 उत्पन्न</p>
            <p className="mt-1 text-[22px] font-extrabold">
              <AnimatedNumber value={monthlyFinanceReport?.totalIncome || 0} formatter={(value) => formatCurrency(value)} />
            </p>
          </Link>
          <Link
            href={`/ahval/kharch?${monthlyQuery}`}
            className="dashboard-card block rounded-lg border border-red-100 bg-red-50 p-3 text-red-900 shadow-sm active:bg-red-100"
          >
            <p className="text-[18px] font-extrabold">💸 मासिक खर्च</p>
            <p className="mt-1 text-[22px] font-extrabold">
              <AnimatedNumber value={monthlyExpenseTotal} formatter={(value) => formatCurrency(value)} />
            </p>
            <p className="mt-1 text-[15px] font-bold leading-snug text-red-800">
              डेअरी खाद्य कपात + इतर
            </p>
          </Link>
          <Link
            href={`/ahval/nafa?${monthlyQuery}`}
            className={`dashboard-card block rounded-lg border p-3 shadow-sm ${
              monthlyNetProfit >= 0
                ? "border-green-100 bg-green-50 text-green-900 active:bg-green-100"
                : "border-red-100 bg-red-50 text-red-900 active:bg-red-100"
            }`}
          >
            <p className="text-[18px] font-extrabold">📈 मासिक नफा</p>
            <p className="mt-1 text-[22px] font-extrabold">
              <AnimatedNumber value={monthlyNetProfit} formatter={(value) => formatCurrency(value)} />
            </p>
          </Link>
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-500">अलीकडील हालचाल</p>
              <h3 className="text-[21px] font-extrabold text-slate-950">आजचे अपडेट</h3>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-[14px] font-extrabold text-green-800">
              Live
            </span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="activity-fade-list mt-3 space-y-2">
              {recentActivities.map((activity) => (
                <div key={`${activity.title}-${activity.detail}`} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[22px] shadow-sm">
                    {activity.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-extrabold text-slate-950">{activity.title}</p>
                    <p className="truncate text-[14px] font-bold text-slate-600">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-soft mt-3 rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-4 text-center">
              <p className="text-[28px]" aria-hidden="true">🎉</p>
              <p className="mt-1 text-[17px] font-extrabold text-green-900">आज नवीन हालचाल नाही.</p>
            </div>
          )}
        </section>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-500">मागील महिन्याचा डेटा</p>
              <h3 className="text-[21px] font-extrabold text-slate-950">
                {getMonthName(previousMonth.month)} {toMarathiNumerals(previousMonth.year)}
              </h3>
            </div>
            <Link
              href={`/ahval?month=${previousMonth.month}&year=${previousMonth.year}`}
              className="shrink-0 rounded-full bg-white px-3 py-2 text-[15px] font-extrabold text-sheti shadow-sm ring-1 ring-green-100"
            >
              तपशील →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-extrabold leading-snug">
            <p className="rounded-lg bg-white px-3 py-2 text-blue-800">
              दूध: {formatLitres(previousMonthlyMilkReport?.totalLitres || 0)} लि.
            </p>
            <p className="rounded-lg bg-white px-3 py-2 text-green-800">
              उत्पन्न: {formatCurrency(previousMonthlyIncomeTotal)}
            </p>
            <p className="rounded-lg bg-white px-3 py-2 text-red-800">
              खर्च: {formatCurrency(previousMonthlyExpenseTotal)}
            </p>
            <p className={`rounded-lg bg-white px-3 py-2 ${previousMonthlyNetProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
              नफा: {formatCurrency(previousMonthlyNetProfit)}
            </p>
          </div>
        </div>

        <Link
          href="/ahval"
          className="dashboard-card mt-4 flex min-h-[54px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
        >
          पूर्ण अहवाल बघा →
        </Link>
      </section>
    </div>
  );
}
