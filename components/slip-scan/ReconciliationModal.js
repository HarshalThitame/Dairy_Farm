"use client";

import ReconciliationViewer from "@/components/slip-scan/ReconciliationViewer";

export default function ReconciliationModal({ reconciliation, onClose }) {
  if (!reconciliation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
      <section className="w-full rounded-lg bg-white p-4 shadow-xl sm:max-w-md">
        <h2 className="text-[24px] font-extrabold text-slate-950">देयक तपासणी</h2>
        <div className="mt-3">
          <ReconciliationViewer reconciliation={reconciliation} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-[54px] w-full rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white active:bg-green-700"
        >
          ठीक आहे
        </button>
      </section>
    </div>
  );
}
