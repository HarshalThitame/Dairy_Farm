"use client";

import SettlementForm from "@/components/accounting/SettlementForm";
import PageHeader from "@/components/PageHeader";

export default function NewSettlementPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="📋 नवीन सेटलमेंट नोंद करा" subtitle="१५ दिवसांचे डेअरी पेमेंट" />
      <SettlementForm />
    </div>
  );
}
