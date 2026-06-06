"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { formatMarathiDate } from "@/lib/marathiUtils";

export default function TicketDetailPage({ params }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [reply, setReply] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/support/tickets/${params.id}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Ticket मिळाले नाही.");
      setBundle(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function postReply(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      const response = await fetch(`/api/support/tickets/${params.id}/messages`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ message: reply })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Reply जतन झाला नाही.");
      setBundle(result);
      setReply("");
      setNotice({ type: "success", text: result.message || "Reply जतन झाला." });
    } catch (replyError) {
      setNotice({ type: "error", text: replyError.message });
    } finally {
      setBusy(false);
    }
  }

  async function patchTicket(action, extra = {}) {
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      const response = await fetch(`/api/support/tickets/${params.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ action, ...extra })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Ticket update झाले नाही.");
      setBundle(result);
      setNotice({ type: "success", text: result.message || "Ticket update झाले." });
    } catch (patchError) {
      setNotice({ type: "error", text: patchError.message });
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/support/tickets/${params.id}/attachments`, {
        method: "POST",
        credentials: "same-origin",
        headers: getClientAuthHeaders(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Attachment upload झाली नाही.");
      setBundle(result);
      setNotice({ type: "success", text: result.message || "Attachment upload झाली." });
    } catch (uploadError) {
      setNotice({ type: "error", text: uploadError.message });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  if (loading) return <LoadingState text="Ticket लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const ticket = bundle.ticket;
  const canReply = !["closed", "rejected"].includes(ticket.status);
  const canRate = ["resolved", "closed"].includes(ticket.status);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`🎫 ${ticket.ticketNumber}`}
        subtitle={ticket.subject}
        action={<Link href="/support/tickets" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Tickets</Link>}
      />

      {notice.text ? (
        <div className={`rounded-xl border p-4 text-[16px] font-black ${
          notice.type === "error"
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-green-200 bg-green-50 text-green-900"
        }`}>
          {notice.text}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[13px] font-black text-slate-700">{ticket.statusLabel}</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[13px] font-black text-blue-800">{ticket.categoryLabel}</span>
          <span className="rounded-full bg-yellow-50 px-3 py-1 text-[13px] font-black text-yellow-800">{ticket.priorityLabel}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[16px] font-bold leading-relaxed text-slate-700">{ticket.description}</p>
        <p className="mt-3 text-[13px] font-bold text-slate-500">तयार: {formatMarathiDate(ticket.createdAt)} · Update: {formatMarathiDate(ticket.updatedAt)}</p>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Conversation</h2>
        <div className="mt-4 grid gap-3">
          {(bundle.messages || []).map((item) => (
            <div
              key={item.id}
              className={`max-w-[92%] rounded-2xl p-4 ${
                item.senderType === "user"
                  ? "ml-auto bg-green-600 text-white"
                  : item.senderType === "admin"
                    ? "bg-slate-950 text-white"
                    : "mx-auto bg-slate-100 text-slate-700"
              }`}
            >
              <p className="whitespace-pre-wrap text-[16px] font-bold">{item.message}</p>
              <p className="mt-2 text-[12px] font-black opacity-70">{formatMarathiDate(item.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[22px] font-black text-slate-950">Attachments</h2>
        <div className="mt-3 grid gap-2">
          {(bundle.attachments || []).length ? bundle.attachments.map((file) => (
            <a key={file.id} href={file.signedUrl || "#"} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-50 p-3 text-[15px] font-black text-slate-800">
              📎 {file.fileName}
            </a>
          )) : <p className="rounded-xl bg-slate-50 p-3 text-[15px] font-bold text-slate-500">Attachment नाही.</p>}
        </div>
        {canReply ? (
          <label className="mt-3 block min-h-[52px] cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center text-[16px] font-black text-slate-700">
            📎 Attachment जोडा
            <input type="file" className="hidden" accept="image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadAttachment} disabled={busy} />
          </label>
        ) : null}
      </section>

      {canReply ? (
        <form onSubmit={postReply} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
          <h2 className="text-[22px] font-black text-slate-950">Reply द्या</h2>
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            className="mt-3 min-h-[130px] w-full rounded-xl border border-slate-200 p-4 text-[17px] font-bold outline-none focus:border-green-500"
            placeholder="तुमचे उत्तर लिहा..."
          />
          <button disabled={busy} className="mt-3 min-h-[54px] w-full rounded-xl bg-green-600 text-[18px] font-black text-white disabled:opacity-60">
            {busy ? "जतन होत आहे..." : "✅ Reply जतन करा"}
          </button>
        </form>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        {ticket.status === "closed" || ticket.status === "resolved" || ticket.status === "rejected" ? (
          <button disabled={busy} onClick={() => patchTicket("reopen")} className="min-h-[52px] rounded-xl bg-slate-950 text-[17px] font-black text-white">
            🔄 Ticket पुन्हा सुरू करा
          </button>
        ) : (
          <button disabled={busy} onClick={() => patchTicket("close")} className="min-h-[52px] rounded-xl bg-red-600 text-[17px] font-black text-white">
            ✅ Ticket बंद करा
          </button>
        )}

        {canRate ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <h3 className="text-[18px] font-black text-slate-950">Support rating</h3>
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 font-bold">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} Stars</option>)}
            </select>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-2 min-h-[80px] w-full rounded-xl border border-slate-200 p-3 font-bold" placeholder="Feedback optional" />
            <button onClick={() => patchTicket("rate", { rating, feedback })} disabled={busy} className="mt-2 min-h-[48px] w-full rounded-xl bg-yellow-500 text-[16px] font-black text-white">
              ⭐ Rating जतन करा
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
