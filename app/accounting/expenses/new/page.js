"use client";

import ExpenseForm from "@/components/accounting/ExpenseForm";
import PageHeader from "@/components/PageHeader";

export default function NewExpensePage() {
  return (
    <div className="space-y-5">
      <PageHeader title="💸 खर्च नोंद जोडा" subtitle="मासिक फार्म खर्च लिहा" />
      <ExpenseForm />
    </div>
  );
}
