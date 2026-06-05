"use client";

import Link from "next/link";
import { expenseCategoryMeta } from "@/lib/accountingUtils";
import { formatMarathiDate, toMarathiCurrency } from "@/lib/marathiUtils";

export default function ExpenseCard({ expense, onDelete }) {
  const meta = expenseCategoryMeta[expense.category] || expenseCategoryMeta["इतर"];
  const canEdit = expense.editable !== false && expense.source === "monthly_expenses";
  const title = expense.display_category || meta.label || expense.category;
  const sourceLabel = expense.source === "finance_records"
    ? "हिशोब नोंदीतून"
    : expense.source === "health_records"
      ? "आरोग्य नोंदीतून"
      : expense.source === "dairy_settlements"
        ? "15 दिवसांच्या स्लिपवरून"
        : "";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[22px] font-extrabold text-slate-950">
            {meta.emoji} {title}
          </h3>
          <p className="mt-1 text-[18px] font-bold text-slate-600">
            {formatMarathiDate(expense.expense_date)}
          </p>
        </div>
        <p className="shrink-0 text-[22px] font-extrabold text-red-700">
          {toMarathiCurrency(expense.amount)}
        </p>
      </div>
      {expense.description ? (
        <p className="mt-3 text-[19px] font-semibold text-slate-700">{expense.description}</p>
      ) : null}
      {expense.vendor_name ? (
        <p className="mt-1 text-[18px] font-bold text-slate-500">विक्रेता: {expense.vendor_name}</p>
      ) : null}
      {sourceLabel ? (
        <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[16px] font-extrabold text-slate-600">
          {sourceLabel}
        </p>
      ) : null}
      {expense.info_only ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[16px] font-extrabold text-amber-800">
          ही खाद्य नोंद मासिक खर्च आणि नफा-तोट्यात धरली जाते.
        </p>
      ) : null}
    </>
  );

  return (
    <article className="dashboard-card rounded-lg border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur">
      {canEdit ? (
        <Link href={`/accounting/expenses/${expense.id}/edit`} className="block active:bg-red-50">
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}

      {canEdit && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(expense)}
          className="mt-3 min-h-[48px] w-full rounded-lg border-2 border-red-200 bg-red-50 px-4 text-[18px] font-extrabold text-red-800 active:bg-red-100"
        >
          🗑️ खर्च काढा
        </button>
      ) : null}
    </article>
  );
}
