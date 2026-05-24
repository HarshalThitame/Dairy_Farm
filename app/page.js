"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import NotificationBanner from "@/components/NotificationBanner";
import ReminderCard from "@/components/ReminderCard";
import { useAuth } from "@/context/AuthContext";
import {
  formatCurrency,
  formatLitres,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { getIndiaMonthParts, getMonthName } from "@/lib/reportUtils";
import {
  fetchCows as fetchCowsOffline,
  fetchMilkByDate,
  fetchRemindersByFilter,
  markReminderDone as markReminderDoneOffline
} from "@/lib/offlineActions";

export default function DashboardPage() {
  const { farm } = useAuth();
  const currentMonth = getIndiaMonthParts();
  const [cows, setCows] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [monthlyMilkReport, setMonthlyMilkReport] = useState(null);
  const [monthlyFinanceReport, setMonthlyFinanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reportQuery = `month=${currentMonth.month}&year=${currentMonth.year}`;
      const [
        cowsResult,
        milkResult,
        todayResult,
        overdueResult,
        monthlyMilkResponse,
        monthlyFinanceResponse
      ] =
        await Promise.all([
          fetchCowsOffline(),
          fetchMilkByDate(getTodayISODate()),
          fetchRemindersByFilter("today"),
          fetchRemindersByFilter("overdue"),
          fetch(`/api/reports/milk?${reportQuery}`, { cache: "no-store" }),
          fetch(`/api/reports/finance?${reportQuery}`, { cache: "no-store" })
        ]);

      const [
        monthlyMilkResult,
        monthlyFinanceResult
      ] = await Promise.all([
        monthlyMilkResponse.json(),
        monthlyFinanceResponse.json()
      ]);

      setCows(cowsResult.data || []);
      setMilkRecords(milkResult.data || []);
      setTodayReminders(todayResult.data || []);
      setOverdueReminders(overdueResult.data || []);
      setMonthlyMilkReport(monthlyMilkResponse.ok ? monthlyMilkResult.data || null : null);
      setMonthlyFinanceReport(monthlyFinanceResponse.ok ? monthlyFinanceResult.data || null : null);
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
      (total, record) => total + Number(record.total_litres || 0),
      0
    );
  }, [milkRecords]);

  const pregnantCount = useMemo(() => {
    return cows.filter((cow) => cow.status === "गाभण").length;
  }, [cows]);

  const pendingReminders = useMemo(() => {
    return [...overdueReminders, ...todayReminders].slice(0, 5);
  }, [overdueReminders, todayReminders]);

  const pendingReminderCount = overdueReminders.length + todayReminders.length;
  const todayReminderCount = todayReminders.length;
  const monthlyNetProfit = Number(monthlyFinanceReport?.netProfit || 0);
  const farmName = farm?.farmName || "गोशाळा व्यवस्थापन";

  const summaries = [
    { emoji: "🐄", label: "एकूण गायी", value: toMarathiNumerals(farm?.totalCows ?? cows.length) },
    { emoji: "🥛", label: "आज दूध", value: `${formatLitres(todayMilkTotal)} लिटर` },
    {
      emoji: "🔔",
      label: "आजच्या आठवणी",
      value: toMarathiNumerals(todayReminderCount)
    },
    { emoji: "🤰", label: "गाभण गायी", value: toMarathiNumerals(pregnantCount) }
  ];

  async function markReminderDone(reminder) {
    try {
      await markReminderDoneOffline(reminder.id);
      fetchDashboard();
    } catch {
      setError("आठवण बदलली नाही.");
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      <NotificationBanner />

      <header className="rounded-lg bg-sheti px-4 py-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight sm:text-[32px]">
              🐄 {farmName}
            </h1>
            <p className="mt-2 text-[18px] font-medium text-green-50">
              रोजच्या गायी, दूध आणि आठवणी एकाच ठिकाणी.
            </p>
          </div>
          <Link
            href="/athavan"
            className="relative flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full bg-white text-[28px] text-sheti shadow-sm active:bg-green-50"
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
      </header>

      <section className="grid grid-cols-2 gap-3" aria-label="सारांश">
        {summaries.map((item) => (
          <article
            key={item.label}
            className="min-h-[132px] rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
          >
            <div className="text-[28px] leading-none" aria-hidden="true">
              {item.emoji}
            </div>
            <h2 className="mt-3 text-[18px] font-bold leading-tight text-slate-700">
              {item.label}
            </h2>
            <p className="mt-2 text-[26px] font-extrabold leading-none text-slate-950">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">
            आजच्या आठवणी
          </h2>
          <Link
            href="/athavan"
            className="shrink-0 text-[18px] font-extrabold text-sheti"
          >
            सर्व {toMarathiNumerals(pendingReminderCount)} आठवणी बघा →
          </Link>
        </div>

        {pendingReminders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {pendingReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={markReminderDone}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border-2 border-dashed border-green-200 bg-green-50 px-4 py-8 text-center">
            <p className="text-[20px] font-extrabold leading-relaxed text-green-800">
              आज कोणतीही बाकी आठवण नाही.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">
            मासिक सारांश
          </h2>
          <p className="shrink-0 text-[18px] font-extrabold text-slate-600">
            {getMonthName(currentMonth.month)} {toMarathiNumerals(currentMonth.year)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
            <p className="text-[18px] font-extrabold">🥛 दूध</p>
            <p className="mt-1 text-[22px] font-extrabold">
              {formatLitres(monthlyMilkReport?.totalLitres || 0)} लिटर
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-green-900">
            <p className="text-[18px] font-extrabold">💰 उत्पन्न</p>
            <p className="mt-1 text-[22px] font-extrabold">
              {formatCurrency(monthlyFinanceReport?.totalIncome || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-red-900">
            <p className="text-[18px] font-extrabold">💸 खर्च</p>
            <p className="mt-1 text-[22px] font-extrabold">
              {formatCurrency(monthlyFinanceReport?.totalExpense || 0)}
            </p>
          </div>
          <div
            className={`rounded-lg p-3 ${
              monthlyNetProfit >= 0 ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
            }`}
          >
            <p className="text-[18px] font-extrabold">📈 नफा</p>
            <p className="mt-1 text-[22px] font-extrabold">
              {formatCurrency(monthlyNetProfit)}
            </p>
          </div>
        </div>

        <Link
          href="/ahval"
          className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
        >
          पूर्ण अहवाल बघा →
        </Link>
      </section>
    </div>
  );
}
