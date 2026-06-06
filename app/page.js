"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  safeParseLocalStorageJson,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";
import {
  fetchCows as fetchCowsOffline,
  fetchJson,
  fetchMilkByDate,
  fetchRemindersByFilter,
  markReminderDone as markReminderDoneOffline,
  uploadSlipImage
} from "@/lib/offlineActions";

const DASHBOARD_CACHE_PREFIX = "majhi_dashboard_snapshot_v3";
const DASHBOARD_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function dashboardCacheKey(farmId, month, year) {
  return `${DASHBOARD_CACHE_PREFIX}:${farmId || "farm"}:${year}-${String(month).padStart(2, "0")}`;
}

function readDashboardCache(farmId, month, year) {
  const cached = safeParseLocalStorageJson(dashboardCacheKey(farmId, month, year), null);

  if (!cached?.snapshot || !cached.savedAt) {
    return null;
  }

  if (Date.now() - Number(cached.savedAt) > DASHBOARD_CACHE_MAX_AGE_MS) {
    return null;
  }

  return cached.snapshot;
}

function writeDashboardCache(farmId, month, year, snapshot) {
  if (!snapshot) {
    return;
  }

  safeSetLocalStorageItem(
    dashboardCacheKey(farmId, month, year),
    JSON.stringify({
      savedAt: Date.now(),
      snapshot
    })
  );
}

export default function DashboardPage() {
  const { farm } = useAuth();
  const router = useRouter();
  const nativeSlipInputRef = useRef(null);
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
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [error, setError] = useState("");

  const applyDashboardSnapshot = useCallback((snapshot) => {
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
  }, []);

  const applyPreviousDashboardSnapshot = useCallback((snapshot) => {
    setPreviousMonthlyMilkReport(snapshot?.monthlyMilkReport || null);
    setPreviousMonthlyFinanceReport(snapshot?.monthlyFinanceReport || null);
  }, []);

  const refreshPreviousDashboard = useCallback(async () => {
    if (!farm?.id) {
      return;
    }

    const previousMonth = addMonths(currentMonth.month, currentMonth.year, -1);
    const cachedPrevious = readDashboardCache(farm.id, previousMonth.month, previousMonth.year);

    if (cachedPrevious) {
      applyPreviousDashboardSnapshot(cachedPrevious);
    }

    try {
      const previousSnapshot = await fetchJson(
        `/api/dashboard?scope=monthly&month=${previousMonth.month}&year=${previousMonth.year}`,
        { cacheTtlMs: 60 * 1000 }
      );

      writeDashboardCache(farm.id, previousMonth.month, previousMonth.year, previousSnapshot);
      applyPreviousDashboardSnapshot(previousSnapshot);
    } catch {
      // Previous month data is secondary. Keep current dashboard fast and usable.
    }
  }, [applyPreviousDashboardSnapshot, currentMonth.month, currentMonth.year, farm?.id]);

  const fetchDashboard = useCallback(async () => {
    const cachedSnapshot = farm?.id ? readDashboardCache(farm.id, currentMonth.month, currentMonth.year) : null;

    if (cachedSnapshot) {
      applyDashboardSnapshot(cachedSnapshot);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const reportQuery = `month=${currentMonth.month}&year=${currentMonth.year}`;
      try {
        const snapshot = await fetchJson(`/api/dashboard?${reportQuery}`, { cacheTtlMs: 60 * 1000 });

        applyDashboardSnapshot(snapshot);
        if (farm?.id) {
          writeDashboardCache(farm.id, currentMonth.month, currentMonth.year, snapshot);
        }
        setLoading(false);
        refreshPreviousDashboard();
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
      if (!cachedSnapshot) {
        setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    applyDashboardSnapshot,
    currentMonth.month,
    currentMonth.year,
    farm?.id,
    refreshPreviousDashboard
  ]);

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

  function openNativeSlipCamera() {
    if (scanLoading) {
      return;
    }

    setError("");
    setScanMessage("");

    if (nativeSlipInputRef.current) {
      nativeSlipInputRef.current.value = "";
      nativeSlipInputRef.current.click();
    }
  }

  async function handleNativeSlipFile(file) {
    if (!file) {
      return;
    }

    const fileType = String(file.type || "").toLowerCase();
    if (fileType && !fileType.startsWith("image/")) {
      setError("फक्त स्लिपचा फोटो निवडा.");
      return;
    }

    setScanLoading(true);
    setScanMessage("फोटो तयार करत आहे...");
    setError("");

    try {
      const result = await uploadSlipImage(file, {
        originalFilename: file.name || `dairy-slip-${Date.now()}.jpg`,
        originalSize: file.size,
        onProgress: (progress) => {
          if (progress?.message) {
            setScanMessage(progress.message);
          }
        }
      });

      if (result.offline) {
        setScanMessage("फोटो फोनवर साठवला. इंटरनेट आल्यावर process होईल.");
        window.setTimeout(() => router.push("/accounting/slip-scan"), 900);
        return;
      }

      const uploadId = result.data?.uploadId;
      if (!uploadId) {
        throw new Error("Upload ID मिळाला नाही.");
      }

      setScanMessage("फोटो अपलोड झाला. AI वाचत आहे...");
      router.push(`/accounting/slip-scan/preview/${uploadId}`);
    } catch (scanError) {
      setError(scanError.message || "स्लिप फोटो अपलोड झाला नाही.");
      setScanMessage("");
    } finally {
      setScanLoading(false);
    }
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
      <input
        ref={nativeSlipInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleNativeSlipFile(event.target.files?.[0])}
      />
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

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link
              href="/ahval"
              className="dashboard-card rounded-lg bg-white px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50"
            >
              <p className="text-[20px] font-extrabold">📊</p>
              <p className="mt-1 text-[15px] font-extrabold leading-tight">अहवाल</p>
            </Link>
            <Link
              href="/accounting/expenses/new"
              className="dashboard-card rounded-lg bg-white px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50"
            >
              <p className="text-[20px] font-extrabold">💸</p>
              <p className="mt-1 text-[15px] font-extrabold leading-tight">खर्च</p>
            </Link>
            <button
              type="button"
              onClick={openNativeSlipCamera}
              disabled={scanLoading}
              className="dashboard-card rounded-lg bg-white px-2 py-3 text-center text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50 disabled:cursor-wait disabled:opacity-75"
            >
              <p className="text-[20px] font-extrabold">📷</p>
              <p className="mt-1 text-[15px] font-extrabold leading-tight">स्कॅन</p>
            </button>
          </div>
        </div>
      </header>

      {scanLoading || scanMessage ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-[18px] font-extrabold text-emerald-900 shadow-soft">
          {scanLoading ? "📷 " : "✅ "}
          {scanMessage || "स्लिप तयार करत आहे..."}
        </section>
      ) : null}

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

      <section className="dashboard-card home-ai-card rounded-lg border border-white/80 bg-white p-4 shadow-soft">
        <div className="relative z-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => openAiAssistant()}
            className="ai-mascot-home home-ai-avatar flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white p-1.5"
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
              className="home-primary-button mt-3 rounded-full px-4 py-2 text-[16px] font-extrabold text-white shadow-sm active:bg-emerald-700"
            >
              AI उघडा →
            </button>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex gap-2 overflow-x-auto pb-1">
          {["आजचे दूध?", "या महिन्याचे उत्पन्न?", "सरासरी फॅट?", "आजच्या आठवणी?"].map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => openAiAssistant(question)}
              className="home-question-chip shrink-0 rounded-full border border-white/80 bg-white px-3 py-2 text-[14px] font-extrabold text-emerald-800 shadow-sm active:bg-emerald-50"
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
              className={`dashboard-card home-summary-card dashboard-summary-tile relative block min-h-[142px] overflow-hidden rounded-lg border p-4 shadow-soft ${tone.card}`}
            >
              <span className={`absolute left-0 top-0 h-1.5 w-full ${tone.accent}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className={`home-summary-icon flex h-12 w-12 items-center justify-center rounded-lg text-[28px] shadow-sm ${tone.icon}`} aria-hidden="true">
                  {item.emoji}
                </div>
                <span className="home-card-arrow rounded-full bg-white/80 px-2 py-1 text-[15px] font-extrabold text-slate-600 shadow-sm">→</span>
              </div>
              <h2 className="mt-3 text-[18px] font-bold leading-tight text-slate-700">
                {item.label}
              </h2>
              <p className="mt-2 text-[26px] font-black leading-none text-slate-950">
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

      <button
        type="button"
        onClick={openNativeSlipCamera}
        disabled={scanLoading}
        className="dashboard-card home-scan-card dashboard-scan block w-full rounded-lg border border-white/80 bg-white p-4 text-left shadow-soft active:bg-green-100 disabled:cursor-wait disabled:opacity-75"
      >
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="dashboard-scan-icon home-scan-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-[34px] text-white shadow-soft">
            📷
          </div>
          <div className="min-w-0">
            <p className="text-[25px] font-extrabold leading-tight text-green-950">
              स्लिप स्कॅन करा
            </p>
            <p className="mt-2 text-[18px] font-bold leading-snug text-green-800">
              फोनचा कॅमेरा थेट उघडून स्पष्ट फोटो घ्या
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="home-soft-chip rounded-full bg-white px-3 py-1 text-[14px] font-extrabold text-green-800 shadow-sm">AI वाचेल</span>
              <span className="home-soft-chip rounded-full bg-white px-3 py-1 text-[14px] font-extrabold text-blue-800 shadow-sm">तुम्ही तपासा</span>
            </div>
          </div>
          <span className="home-primary-button shrink-0 rounded-full px-4 py-3 text-[18px] font-extrabold text-white shadow-sm">
            कॅमेरा →
          </span>
        </div>
      </button>

      <section className="home-panel dashboard-panel rounded-lg border border-white/80 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="home-panel-icon home-panel-icon-red flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[27px] shadow-sm">
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
            className="dashboard-card home-panel-action shrink-0 rounded-full px-3 py-2 text-[17px] font-extrabold text-sheti"
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

      <section className="home-panel dashboard-panel rounded-lg border border-white/80 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="home-panel-icon home-panel-icon-blue flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[27px] shadow-sm">
              📊
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-slate-500">या महिन्याची स्थिती</p>
              <h2 className="text-[25px] font-extrabold leading-tight text-slate-950">
                मासिक सारांश
              </h2>
            </div>
          </div>
          <p className="home-date-pill shrink-0 rounded-full px-3 py-2 text-[17px] font-extrabold text-slate-700">
            {getMonthName(currentMonth.month)} {toMarathiNumerals(currentMonth.year)}
          </p>
        </div>

        <Link
          href={`/ahval/nafa?${monthlyQuery}`}
          className={`dashboard-card home-profit-card mt-4 block rounded-lg border p-4 shadow-sm ${
            monthlyNetProfit >= 0
              ? "home-profit-positive text-green-950 active:bg-green-100"
              : "home-profit-negative text-red-950 active:bg-red-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-extrabold opacity-75">शुद्ध नफा / तोटा</p>
              <p className="mt-1 text-[30px] font-black leading-tight">
                <AnimatedNumber value={monthlyNetProfit} formatter={(value) => formatCurrency(value)} />
              </p>
            </div>
            <span className="home-card-arrow rounded-full bg-white px-4 py-2 text-[17px] font-extrabold shadow-sm">
              तपशील →
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-extrabold leading-snug">
            <p className="home-inline-metric min-w-0 break-words rounded-lg bg-white/70 px-3 py-2 text-green-800">
              उत्पन्न: <AnimatedNumber value={monthlyIncomeTotal} formatter={(value) => formatCurrency(value)} />
            </p>
            <p className="home-inline-metric min-w-0 break-words rounded-lg bg-white/70 px-3 py-2 text-red-800">
              खर्च: <AnimatedNumber value={monthlyExpenseTotal} formatter={(value) => formatCurrency(value)} />
            </p>
          </div>
        </Link>

        <div className="dashboard-stagger mt-4 grid grid-cols-2 gap-3">
          <Link
            href={`/ahval/dudh?${monthlyQuery}`}
            className="dashboard-card home-metric-card home-metric-blue block rounded-lg border p-3 text-blue-900 shadow-sm active:bg-blue-100"
          >
            <p className="text-[18px] font-extrabold">🥛 दूध</p>
            <p className="mt-1 text-[22px] font-black">
              <AnimatedNumber value={monthlyMilkReport?.totalLitres || 0} formatter={(value) => `${formatLitres(value)} लिटर`} />
            </p>
          </Link>
          <Link
            href={`/ahval/utpanna?${monthlyQuery}`}
            className="dashboard-card home-metric-card home-metric-green block rounded-lg border p-3 text-green-900 shadow-sm active:bg-green-100"
          >
            <p className="text-[18px] font-extrabold">💰 उत्पन्न</p>
            <p className="mt-1 text-[22px] font-black">
              <AnimatedNumber value={monthlyFinanceReport?.totalIncome || 0} formatter={(value) => formatCurrency(value)} />
            </p>
          </Link>
          <Link
            href={`/ahval/kharch?${monthlyQuery}`}
            className="dashboard-card home-metric-card home-metric-red block rounded-lg border p-3 text-red-900 shadow-sm active:bg-red-100"
          >
            <p className="text-[18px] font-extrabold">💸 मासिक खर्च</p>
            <p className="mt-1 text-[22px] font-black">
              <AnimatedNumber value={monthlyExpenseTotal} formatter={(value) => formatCurrency(value)} />
            </p>
            <p className="mt-1 text-[15px] font-bold leading-snug text-red-800">
              खाद्य खर्च + इतर
            </p>
          </Link>
          <Link
            href={`/ahval/nafa?${monthlyQuery}`}
            className={`dashboard-card home-metric-card block rounded-lg border p-3 shadow-sm ${
              monthlyNetProfit >= 0
                ? "home-metric-green text-green-900 active:bg-green-100"
                : "home-metric-red text-red-900 active:bg-red-100"
            }`}
          >
            <p className="text-[18px] font-extrabold">📈 मासिक नफा</p>
            <p className="mt-1 text-[22px] font-black">
              <AnimatedNumber value={monthlyNetProfit} formatter={(value) => formatCurrency(value)} />
            </p>
          </Link>
        </div>

        <section className="home-activity-card mt-4 rounded-lg border border-white/80 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-500">अलीकडील हालचाल</p>
              <h3 className="text-[21px] font-extrabold text-slate-950">आजचे अपडेट</h3>
            </div>
            <span className="home-live-pill rounded-full px-3 py-1 text-[14px] font-extrabold text-green-800">
              Live
            </span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="activity-fade-list mt-3 space-y-2">
              {recentActivities.map((activity) => (
                <div key={`${activity.title}-${activity.detail}`} className="home-activity-row flex items-center gap-3 rounded-lg border border-white/80 bg-white px-3 py-2">
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

        <div className="home-previous-card mt-4 rounded-lg border border-white/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-slate-500">मागील महिन्याचा डेटा</p>
              <h3 className="text-[21px] font-extrabold text-slate-950">
                {getMonthName(previousMonth.month)} {toMarathiNumerals(previousMonth.year)}
              </h3>
            </div>
            <Link
              href={`/ahval?month=${previousMonth.month}&year=${previousMonth.year}`}
              className="home-panel-action shrink-0 rounded-full px-3 py-2 text-[15px] font-extrabold text-sheti shadow-sm"
            >
              तपशील →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-extrabold leading-snug">
            <p className="home-inline-metric rounded-lg bg-white px-3 py-2 text-blue-800">
              दूध: {formatLitres(previousMonthlyMilkReport?.totalLitres || 0)} लि.
            </p>
            <p className="home-inline-metric rounded-lg bg-white px-3 py-2 text-green-800">
              उत्पन्न: {formatCurrency(previousMonthlyIncomeTotal)}
            </p>
            <p className="home-inline-metric rounded-lg bg-white px-3 py-2 text-red-800">
              खर्च: {formatCurrency(previousMonthlyExpenseTotal)}
            </p>
            <p className={`home-inline-metric rounded-lg bg-white px-3 py-2 ${previousMonthlyNetProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
              नफा: {formatCurrency(previousMonthlyNetProfit)}
            </p>
          </div>
        </div>

        <Link
          href="/ahval"
          className="dashboard-card home-full-report mt-4 flex min-h-[54px] items-center justify-center rounded-lg border px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
        >
          पूर्ण अहवाल बघा →
        </Link>
      </section>
    </div>
  );
}
