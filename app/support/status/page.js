"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { formatMarathiDate } from "@/lib/marathiUtils";

function tone(status) {
  if (status === "operational") return "border-green-200 bg-green-50 text-green-900";
  if (status === "maintenance") return "border-yellow-200 bg-yellow-50 text-yellow-900";
  return "border-red-200 bg-red-50 text-red-900";
}

export default function SupportStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/support/status", {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Status मिळाला नाही.");
      setData(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState text="System status तपासत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="🟢 System Status"
        subtitle="API, Database, OCR, AI आणि notification सेवा स्थिती."
        action={<Link href="/support" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Support</Link>}
      />

      <section className={`rounded-2xl border p-5 shadow-soft ${data.overallStatus === "operational" ? "border-green-200 bg-green-50 text-green-950" : "border-yellow-200 bg-yellow-50 text-yellow-950"}`}>
        <h2 className="text-[26px] font-black">
          {data.overallStatus === "operational" ? "सर्व सेवा सुरळीत आहेत" : "काही सेवांकडे लक्ष द्या"}
        </h2>
        <p className="mt-1 text-[16px] font-bold opacity-80">जर app मध्ये त्रुटी येत असेल तर ticket तयार करा.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {(data.services || []).map((service, index) => (
          <article key={service.id || service.service_name || service.name || index} className={`rounded-2xl border p-4 shadow-soft ${tone(service.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[22px] font-black">{service.service_name}</h3>
                <p className="mt-1 text-[15px] font-bold opacity-80">{service.message}</p>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-black uppercase">{service.status}</span>
            </div>
            <p className="mt-3 text-[13px] font-black opacity-70">Last check: {formatMarathiDate(service.checked_at)}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Incidents / Maintenance</h2>
        <div className="mt-3 grid gap-2">
          {data.incidents?.length ? data.incidents.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[16px] font-black text-slate-950">{item.service_name} · {item.status}</p>
              <p className="mt-1 text-[14px] font-bold text-slate-600">{item.message}</p>
            </div>
          )) : (
            <p className="rounded-xl bg-slate-50 p-4 text-[15px] font-bold text-slate-600">अलीकडे incident नाही.</p>
          )}
        </div>
      </section>
    </div>
  );
}
