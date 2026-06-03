"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const statuses = [
  ["open", "Open"],
  ["in_progress", "In Progress"],
  ["waiting_for_user", "Waiting For User"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
  ["rejected", "Rejected"]
];

export default function AdminSupportTicketDetailPage({ params }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("waiting_for_user");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/support/tickets/${params.id}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load ticket");
      setBundle(result);
      setStatus(result.ticket?.status || "waiting_for_user");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(action, body = {}) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/support/tickets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify({ action, ...body })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Ticket update failed");
      setBundle(result);
      setStatus(result.ticket?.status || status);
      setReply("");
      setMessage(result.message || "Ticket updated.");
    } catch (patchError) {
      setMessage(patchError.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="text-[20px] font-extrabold text-slate-600">Loading ticket...</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div>;

  const ticket = bundle.ticket;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold text-slate-950">{ticket.ticketNumber}</h1>
          <p className="mt-1 text-[20px] font-bold text-slate-600">{ticket.subject}</p>
          <p className="mt-2 text-[15px] font-semibold text-slate-500">
            {ticket.farm?.farm_name || "-"} · {ticket.user?.name || "-"} · {ticket.categoryLabel}
          </p>
        </div>
        <Link href="/admin/support/tickets" className="rounded-lg bg-white px-4 py-3 text-[16px] font-bold text-slate-800 shadow-sm">
          Back
        </Link>
      </div>

      {message ? <div className="rounded-lg bg-green-50 p-4 text-[17px] font-bold text-green-800">{message}</div> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-[24px] font-extrabold">Conversation</h2>
          <div className="mt-4 grid gap-3">
            {(bundle.messages || []).map((item) => (
              <div key={item.id} className={`rounded-xl p-4 ${item.senderType === "admin" ? "ml-auto max-w-[82%] bg-slate-900 text-white" : item.senderType === "user" ? "mr-auto max-w-[82%] bg-green-50 text-green-950" : "mx-auto bg-slate-100 text-slate-700"}`}>
                <p className="whitespace-pre-wrap text-[16px] font-semibold">{item.message}</p>
                <p className="mt-2 text-[12px] font-bold opacity-70">{item.senderType} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-[22px] font-extrabold">Status</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-3 min-h-[52px] w-full rounded-lg border border-slate-300 px-3 text-[17px] font-bold">
              {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button disabled={busy} onClick={() => patch("status", { status })} className="mt-3 min-h-[48px] w-full rounded-lg bg-blue-600 text-[16px] font-bold text-white disabled:opacity-60">
              Update Status
            </button>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); patch("reply", { message: reply, status }); }} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-[22px] font-extrabold">Reply to User</h2>
            <textarea value={reply} onChange={(event) => setReply(event.target.value)} className="mt-3 min-h-[140px] w-full rounded-lg border border-slate-300 p-3 text-[16px] font-semibold" placeholder="Write admin reply..." />
            <button disabled={busy} className="mt-3 min-h-[50px] w-full rounded-lg bg-green-600 text-[16px] font-bold text-white disabled:opacity-60">
              Send Reply
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-[22px] font-extrabold">Attachments</h2>
            <div className="mt-3 grid gap-2">
              {(bundle.attachments || []).length ? bundle.attachments.map((file) => (
                <a key={file.id} href={file.signedUrl || "#"} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-50 p-3 text-[15px] font-bold text-slate-800">
                  📎 {file.fileName}
                </a>
              )) : <p className="text-[15px] font-semibold text-slate-500">No attachments.</p>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

