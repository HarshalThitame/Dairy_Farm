"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import CowSelector from "@/components/CowSelector";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  formatCurrency,
  formatMarathiDate,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import {
  displayFinanceCategory,
  expenseCategories,
  getIndiaMonthParts,
  incomeCategories
} from "@/lib/reportUtils";
import { fetchJson, saveFinanceRecord } from "@/lib/offlineActions";

const FinancePieChart = dynamic(() => import("@/components/FinancePieChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});

function getInitialMonth() {
  const current = getIndiaMonthParts();
  if (typeof window === "undefined") {
    return current;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    month: Number(searchParams.get("month") || current.month),
    year: Number(searchParams.get("year") || current.year)
  };
}

function displayCategory(category) {
  return displayFinanceCategory(category);
}

function combineExpenseBreakdown(report) {
  const grouped = new Map();

  (report?.expenseByCategory || []).forEach((item) => {
    const category = displayFinanceCategory(item.category);
    grouped.set(category, Number(grouped.get(category) || 0) + Number(item.amount || 0));
  });

  const feedDeduction = Number(report?.settlementDeductions?.cattleFeedDeduction || 0);
  const otherDeductions = Number(report?.settlementDeductions?.otherDeductions || 0);

  if (feedDeduction > 0) {
    grouped.set("खाद्य", Number(grouped.get("खाद्य") || 0) + feedDeduction);
  }

  if (otherDeductions > 0) {
    grouped.set("इतर", Number(grouped.get("इतर") || 0) + otherDeductions);
  }

  return Array.from(grouped.entries()).map(([category, amount]) => ({
    category,
    amount: Number(amount.toFixed(2))
  }));
}

function emptyForm(type = "उत्पन्न") {
  return {
    id: "",
    type,
    category: type === "उत्पन्न" ? "दूध विक्री" : "औषध",
    amount: "",
    date: toISODate(new Date()),
    cow_id: "",
    description: ""
  };
}

function CategoryBreakdown({ title, items, total, tone, buttonLabel, onAdd }) {
  const maxAmount = Math.max(...items.map((item) => Number(item.amount || 0)), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className={`min-h-[52px] rounded-lg px-3 text-[18px] font-extrabold text-white ${tone === "green" ? "bg-sheti active:bg-green-700" : "bg-tatkal active:bg-red-700"}`}
          >
            {buttonLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.category} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[19px] font-extrabold text-slate-900">
                  {displayCategory(item.category)}
                </p>
                <p className={`text-[19px] font-extrabold ${tone === "green" ? "text-green-700" : "text-red-700"}`}>
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${tone === "green" ? "bg-sheti" : "bg-tatkal"}`}
                  style={{ width: `${Math.max(8, (Number(item.amount || 0) / maxAmount) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[19px] font-bold text-slate-600">
            अजून नोंदी नाहीत.
          </p>
        )}
      </div>
    </section>
  );
}

function getDerivedTransactionLabel(transaction) {
  if (transaction.source === "health_records") {
    return "आरोग्य नोंदीवरून आपोआप दाखवले आहे";
  }

  if (transaction.source === "milk_records") {
    return "दूध नोंदीवरून आपोआप दाखवले आहे";
  }

  if (transaction.source === "monthly_expenses") {
    return "मासिक खर्च नोंदीवरून आपोआप दाखवले आहे";
  }

  if (transaction.source === "dairy_settlements") {
    return "15 दिवसांच्या स्लिपवरील देयक कपात";
  }

  return "आपोआप दाखवले आहे";
}

function TransactionModal({ form, setForm, selectedCow, setSelectedCow, onClose, onSubmit, onDelete, saving }) {
  const categories = form.type === "उत्पन्न" ? incomeCategories : expenseCategories;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  useEffect(() => {
    updateField("cow_id", selectedCow?.id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCow]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            {form.id ? "व्यवहार बदला" : "नवीन व्यवहार"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] min-w-[52px] rounded-lg border-2 border-slate-200 bg-white text-[22px] font-extrabold active:bg-slate-100"
            aria-label="बंद करा"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <FormField label="प्रकार" required>
            <div className="grid grid-cols-2 gap-3">
              {["उत्पन्न", "खर्च"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type,
                      category: type === "उत्पन्न" ? "दूध विक्री" : "औषध"
                    }))
                  }
                  className={`min-h-[56px] rounded-lg border-2 px-3 text-[20px] font-extrabold ${
                    form.type === type
                      ? type === "उत्पन्न"
                        ? "border-green-300 bg-green-100 text-green-800"
                        : "border-red-300 bg-red-100 text-red-800"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {type === "उत्पन्न" ? "💰 उत्पन्न" : "💸 खर्च"}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="वर्ग" required>
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="रक्कम" required>
            <div className="grid grid-cols-[auto_1fr] items-center rounded-lg border-2 border-slate-200 bg-white focus-within:border-sheti">
              <span className="px-4 text-[22px] font-extrabold text-slate-700">₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                className="min-h-[56px] w-full border-0 bg-transparent px-2 text-[20px] font-bold text-slate-900 outline-none"
                required
              />
            </div>
          </FormField>

          <FormField label="तारीख" required>
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
              required
            />
          </FormField>

          <FormField label="संबंधित गाय">
            <CowSelector
              selectedCow={selectedCow}
              onSelect={setSelectedCow}
              placeholder="गायीचे नाव शोधा..."
              initialCowId={form.cow_id}
            />
          </FormField>

          <FormField label="नोंद">
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
              className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
            />
          </FormField>

          <div className="grid gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700 disabled:bg-slate-400"
            >
              {saving ? "जतन होत आहे..." : "✅ जतन करा"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="min-h-[56px] rounded-lg border-2 border-red-200 bg-red-50 px-4 text-[20px] font-extrabold text-red-800 active:bg-red-100 disabled:bg-slate-100"
              >
                🗑️ व्यवहार काढा
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinanceReportPage() {
  const { isAdmin, isFarmOwner, isSuperAdmin } = useAuth();
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [report, setReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState("सर्व");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedCow, setSelectedCow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canManageFinance = isAdmin || isFarmOwner || isSuperAdmin;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(
        `/api/reports/finance?month=${monthValue.month}&year=${monthValue.year}`
      );

      setReport(result);
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredTransactions = useMemo(() => {
    const transactions = [
      ...(report?.transactions || []),
      ...(report?.deductionTransactions || [])
    ];

    if (activeFilter === "सर्व") {
      return transactions;
    }

    return transactions.filter((item) => item.type === activeFilter);
  }, [activeFilter, report]);
  const finalMonthlyExpense =
    Number(report?.totalExpense || 0) + Number(report?.deductionsCountedInProfit || 0);
  const finalExpenseByCategory = useMemo(() => combineExpenseBreakdown(report), [report]);

  function openNewTransaction(type) {
    if (!canManageFinance) {
      return;
    }

    setForm(emptyForm(type));
    setSelectedCow(null);
    setModalOpen(true);
  }

  function openEditTransaction(transaction) {
    if (!canManageFinance || transaction.is_derived) {
      return;
    }

    setForm({
      id: transaction.id,
      type: transaction.type,
      category: displayCategory(transaction.category),
      amount: transaction.amount || "",
      date: transaction.date,
      cow_id: transaction.cow_id || "",
      description: transaction.description || ""
    });
    setSelectedCow(transaction.cows || null);
    setModalOpen(true);
  }

  async function submitTransaction(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      amount: Number(form.amount || 0),
      cow_id: form.cow_id || null
    };

    try {
      if (form.id) {
        await fetchJson("/api/finance", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await saveFinanceRecord({
          ...payload,
          cowName: selectedCow?.name || ""
        });
      }

      setModalOpen(false);
      fetchReport();
    } catch (saveError) {
      setError(saveError.message || "व्यवहार जतन झाला नाही.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction() {
    if (!form.id) {
      return;
    }

    const confirmed = window.confirm("हा व्यवहार काढायचा आहे का?");

    if (!confirmed) {
      return;
    }

    setSaving(true);
    try {
      await fetchJson(`/api/finance?id=${form.id}`, { method: "DELETE" });
      setModalOpen(false);
      fetchReport();
    } catch (deleteError) {
      setError(deleteError.message || "व्यवहार काढला गेला नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="💰 हिशोब अहवाल" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="हिशोब लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReport} /> : null}

      {!loading && !error && report ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              मासिक उत्पन्न आणि खर्च
            </h2>
            <FinancePieChart income={report.totalIncome} expense={finalMonthlyExpense} />
            <p
              className={`rounded-lg p-4 text-center text-[22px] font-extrabold ${
                report.netProfit >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {report.netProfit >= 0
                ? `✅ या महिन्यात ${formatCurrency(report.netProfit)} नफा झाला`
                : `⚠️ या महिन्यात ${formatCurrency(Math.abs(report.netProfit))} तोटा झाला`}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3" aria-label="हिशोब सारांश">
            <article className="rounded-lg border border-green-100 bg-green-50 p-4">
              <p className="text-[18px] font-extrabold text-green-900">मासिक उत्पन्न</p>
              <p className="mt-2 text-[24px] font-extrabold leading-none text-green-950">
                {formatCurrency(report.totalIncome || 0)}
              </p>
            </article>
            <article className="rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-[18px] font-extrabold text-red-900">मासिक खर्च</p>
              <p className="mt-2 text-[24px] font-extrabold leading-none text-red-950">
                {formatCurrency(finalMonthlyExpense)}
              </p>
              <p className="mt-2 text-[16px] font-bold leading-snug text-red-800">
                खाद्य खर्च + इतर
              </p>
            </article>
            <article className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-[18px] font-extrabold text-blue-900">वार्षिक खर्च</p>
              <p className="mt-2 text-[24px] font-extrabold leading-none text-blue-950">
                {formatCurrency(report.annualExpense || 0)}
              </p>
            </article>
            <article
              className={`rounded-lg border p-4 ${
                report.netProfit >= 0
                  ? "border-green-100 bg-green-50 text-green-950"
                  : "border-red-100 bg-red-50 text-red-950"
              }`}
            >
              <p className="text-[18px] font-extrabold">मासिक नफा</p>
              <p className="mt-2 text-[24px] font-extrabold leading-none">
                {formatCurrency(report.netProfit || 0)}
              </p>
            </article>
          </section>

          <CategoryBreakdown
            title="💰 उत्पन्न"
            items={report.incomeByCategory || []}
            total={report.totalIncome}
            tone="green"
            buttonLabel="नवीन उत्पन्न +"
            onAdd={canManageFinance ? () => openNewTransaction("उत्पन्न") : null}
          />

          <CategoryBreakdown
            title="💸 मासिक खर्च"
            items={finalExpenseByCategory}
            total={finalMonthlyExpense}
            tone="red"
            buttonLabel="नवीन खर्च +"
            onAdd={canManageFinance ? () => openNewTransaction("खर्च") : null}
          />

          <CategoryBreakdown
            title="🌾 वार्षिक खर्च"
            items={report.annualExpenseByCategory || []}
            total={report.annualExpense || 0}
            tone="red"
            buttonLabel=""
            onAdd={null}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मासिक व्यवहार यादी</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["सर्व", "उत्पन्न", "खर्च"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`min-h-[52px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                    activeFilter === filter
                      ? "border-green-300 bg-green-100 text-sheti"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => openEditTransaction(transaction)}
                    disabled={!canManageFinance || transaction.is_derived}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left active:bg-green-50 disabled:cursor-default disabled:active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[20px] font-extrabold text-slate-950">
                          {displayCategory(transaction.category)}
                        </p>
                        <p className="mt-1 text-[18px] font-semibold text-slate-700">
                          {formatMarathiDate(transaction.date)}
                          {transaction.cows?.name ? ` | ${transaction.cows.name}` : ""}
                        </p>
                        {transaction.description ? (
                          <p className="mt-1 text-[18px] font-semibold text-slate-600">
                            {transaction.description}
                          </p>
                        ) : null}
                        {transaction.is_derived ? (
                          <p className="mt-1 text-[17px] font-bold text-green-700">
                            {getDerivedTransactionLabel(transaction)}
                          </p>
                        ) : null}
                      </div>
                      <p
                        className={`shrink-0 text-[20px] font-extrabold ${
                          transaction.type === "उत्पन्न" ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {transaction.type === "उत्पन्न" ? "+" : "-"} {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[19px] font-bold text-slate-600">
                  व्यवहार नोंदी नाहीत.
                </p>
              )}
            </div>

            <p className="mt-3 text-[18px] font-bold text-slate-500">
              एकूण व्यवहार: {toMarathiNumerals(filteredTransactions.length)}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">वार्षिक खर्च यादी</h2>
            <div className="mt-4 space-y-3">
              {(report.annualTransactions || []).length > 0 ? (
                report.annualTransactions.map((transaction) => (
                  <article key={transaction.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[20px] font-extrabold text-slate-950">
                          {displayCategory(transaction.category)}
                        </p>
                        <p className="mt-1 text-[18px] font-semibold text-slate-700">
                          {formatMarathiDate(transaction.date)}
                        </p>
                        {transaction.description ? (
                          <p className="mt-1 text-[18px] font-semibold text-slate-600">
                            {transaction.description}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-[20px] font-extrabold text-red-700">
                        - {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[19px] font-bold text-slate-600">
                  वार्षिक खर्च नोंदी नाहीत.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}

      {modalOpen ? (
        <TransactionModal
          form={form}
          setForm={setForm}
          selectedCow={selectedCow}
          setSelectedCow={setSelectedCow}
          onClose={() => setModalOpen(false)}
          onSubmit={submitTransaction}
          onDelete={deleteTransaction}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
