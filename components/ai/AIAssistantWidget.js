"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getClientAuthHeaders,
  getClientAuthToken,
  safeGetLocalStorageItem,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";

const STORAGE_KEY = "majhi_dairy_ai_assistant_messages";
const AI_LOGO_SRC = "/icons/ai logo.png";
const AI_HISTORY_STATE_KEY = "__majhiDairyAiOpen";
const suggestedQuestions = [
  "🥛 आजचे दूध?",
  "📅 या महिन्याचे दूध?",
  "💰 आजचे उत्पन्न?",
  "💵 या महिन्याचे उत्पन्न?",
  "📈 सरासरी दूध?",
  "🏆 सर्वाधिक दूध?",
  "📉 सर्वात कमी दूध?",
  "🧈 सरासरी फॅट?",
  "🧪 सरासरी SNF?",
  "🌅 सकाळचे दूध?",
  "🌙 संध्याकाळचे दूध?",
  "📊 दूधाचा ट्रेंड?",
  "📆 कालचे दूध?",
  "🗓️ मागील महिन्याचा अहवाल?",
  "🐄 सर्वाधिक उत्पादन?",
  "💸 खर्च किती?",
  "📋 नफा किती?",
  "🔍 आजची नोंद?",
  "📑 मासिक सारांश?",
  "🤖 माझी डेअरी स्थिती?"
];

function getAuthToken() {
  return getClientAuthToken();
}

function initialMessages() {
  return [
    {
      id: "welcome",
      role: "assistant",
      content: "नमस्कार. तुमच्या डेअरीच्या खऱ्या नोंदींवरून मी दूध, फॅट, SNF आणि उत्पन्नाची माहिती सांगू शकतो."
    }
  ];
}

function readStoredMessages() {
  try {
    const stored = JSON.parse(safeGetLocalStorageItem(STORAGE_KEY, "[]"));
    return Array.isArray(stored) && stored.length ? stored : initialMessages();
  } catch {
    return initialMessages();
  }
}

function persistMessages(messages) {
  safeSetLocalStorageItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
}

function messageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Bubble({ message, onFeedback }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-white p-1 shadow-sm">
          <Image src={AI_LOGO_SRC} alt="" width={36} height={36} className="h-full w-full rounded-md object-cover" />
        </div>
      ) : null}
      <div
        className={`max-w-[84%] rounded-lg px-4 py-3 text-[16.5px] font-semibold leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-emerald-900/15"
            : "rounded-bl-sm border border-emerald-100 bg-white/95 text-slate-800 shadow-emerald-900/5"
        }`}
      >
        {message.content}
        {!isUser && message.logId ? (
          <div className="mt-3 flex gap-2 border-t border-emerald-50 pt-2">
            <button
              type="button"
              onClick={() => onFeedback?.(message.logId, "useful")}
              className={`rounded-full px-3 py-1 text-[13px] font-black ${
                message.feedback === "useful" ? "bg-green-600 text-white" : "bg-green-50 text-green-800"
              }`}
            >
              👍 उपयोगी
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.(message.logId, "not_useful")}
              className={`rounded-full px-3 py-1 text-[13px] font-black ${
                message.feedback === "not_useful" ? "bg-red-600 text-white" : "bg-red-50 text-red-800"
              }`}
            >
              👎 नाही
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-white p-1 shadow-sm">
        <Image src={AI_LOGO_SRC} alt="" width={36} height={36} className="h-full w-full rounded-md object-cover" />
      </div>
      <div className="flex items-center gap-2 rounded-lg rounded-bl-sm border border-emerald-100 bg-white px-4 py-3 text-[16px] font-bold text-slate-600 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:240ms]" />
        माहिती तपासत आहे...
      </div>
    </div>
  );
}

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [assistantSettings, setAssistantSettings] = useState({
    enabled: true,
    suggested_questions_enabled: true
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const scrollerRef = useRef(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const aiHistoryPushedRef = useRef(false);

  useEffect(() => {
    setMessages(readStoredMessages());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();

    if (!token || typeof navigator !== "undefined" && !navigator.onLine) {
      setSettingsLoaded(true);
      return undefined;
    }

    fetch("/api/settings/ai", {
      cache: "no-store",
      credentials: "same-origin",
      headers: getClientAuthHeaders()
    })
      .then((response) => response.json().then((json) => ({ ok: response.ok, json })))
      .then(({ ok, json }) => {
        if (!cancelled && ok && json.preferences) {
          setAssistantSettings(json.preferences);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistMessages(messages);
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return undefined;
    }

    function handleBackButton() {
      aiHistoryPushedRef.current = false;
      setOpen(false);
    }

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      if (!inputRef.current) {
        dialogRef.current?.focus({ preventScroll: true });
      }
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAssistant();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element instanceof HTMLElement && !element.hasAttribute("hidden"));

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
      previousFocusRef.current = null;
    };
  }, [open]);

  const visibleHistory = useMemo(
    () =>
      messages
        .filter((message) => ["user", "assistant"].includes(message.role))
        .map((message) => ({ role: message.role, content: message.content }))
        .slice(-8),
    [messages]
  );

  async function askAssistant(questionText) {
    const question = String(questionText || input).trim();

    if (!question || loading) {
      return;
    }

    setInput("");
    setError("");
    setLastQuestion(question);
    const userMessage = { id: messageId("user"), role: "user", content: question };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getClientAuthHeaders()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message: question,
          messages: visibleHistory
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "सध्या सहाय्यक उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.");
      }

      setMessages((current) => [
        ...current,
        {
          id: messageId("assistant"),
          role: "assistant",
          content: result.data?.answer || "या प्रश्नासाठी माहिती उपलब्ध नाही.",
          logId: result.data?.logId || null
        }
      ]);
    } catch (requestError) {
      setError(requestError.message || "सध्या सहाय्यक उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.");
    } finally {
      setLoading(false);
    }
  }

  async function saveFeedback(logId, feedback) {
    if (!logId) return;

    setMessages((current) =>
      current.map((message) => (message.logId === logId ? { ...message, feedback } : message))
    );

    try {
      await fetch("/api/settings/ai/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getClientAuthHeaders()
        },
        credentials: "same-origin",
        body: JSON.stringify({ logId, feedback })
      });
    } catch {
      // Feedback is best-effort and should not interrupt chat.
    }
  }

  function resetChat() {
    const next = initialMessages();
    setMessages(next);
    setError("");
    persistMessages(next);
  }

  const openAssistant = useCallback(() => {
    if (typeof window !== "undefined" && !open) {
      const currentState =
        window.history.state && typeof window.history.state === "object"
          ? window.history.state
          : {};

      window.history.pushState(
        {
          ...currentState,
          [AI_HISTORY_STATE_KEY]: true
        },
        "",
        window.location.href
      );
      aiHistoryPushedRef.current = true;
    }

    setOpen(true);
  }, [open]);

  function closeAssistant() {
    if (
      typeof window !== "undefined" &&
      aiHistoryPushedRef.current &&
      window.history.state?.[AI_HISTORY_STATE_KEY]
    ) {
      aiHistoryPushedRef.current = false;
      window.history.back();
      return;
    }

    setOpen(false);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleOpenAssistant(event) {
      const question = event.detail?.question;
      openAssistant();

      if (typeof question === "string" && question.trim()) {
        setInput(question.trim());
      }
    }

    window.addEventListener("majhi-open-ai-assistant", handleOpenAssistant);

    return () => {
      window.removeEventListener("majhi-open-ai-assistant", handleOpenAssistant);
    };
  }, [openAssistant]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[90] flex overscroll-contain items-end justify-center bg-slate-950/35 px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 backdrop-blur-[2px] sm:items-end sm:justify-end sm:px-5 sm:pb-24"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-assistant-title"
          tabIndex={-1}
          className="flex max-h-[88vh] w-full max-w-[450px] flex-col overflow-hidden rounded-lg border border-white/70 bg-gradient-to-b from-emerald-50 via-white to-sky-50 shadow-[0_24px_70px_rgba(15,118,110,0.35)]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <header className="bg-gradient-to-r from-emerald-700 via-green-600 to-sky-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-lg shadow-emerald-900/20">
                  <Image
                    src={AI_LOGO_SRC}
                    alt="AI सहाय्यक"
                    width={48}
                    height={48}
                    className="h-full w-full rounded-md object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold text-emerald-50">माझी डेअरी</p>
                  <h2 id="ai-assistant-title" className="truncate text-[21px] font-extrabold leading-tight">AI सहाय्यक</h2>
                  <p className="mt-0.5 text-[12px] font-bold text-emerald-50/90">खऱ्या डेटावर उत्तर</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={resetChat}
                  className="rounded-lg bg-white/15 px-3 py-2 text-[14px] font-extrabold shadow-sm ring-1 ring-white/10 active:bg-white/25"
                >
                  साफ
                </button>
                <button
                  type="button"
                  onClick={closeAssistant}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-[20px] font-extrabold shadow-sm ring-1 ring-white/10 active:bg-white/25"
                  aria-label="बंद करा"
                >
                  ×
                </button>
              </div>
            </div>
          </header>

          <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((message) => (
              <Bubble key={message.id} message={message} onFeedback={saveFeedback} />
            ))}
            {loading ? <TypingIndicator /> : null}
          </div>

          {error ? (
            <div className="border-t border-red-100 bg-red-50 px-3 py-3">
              <p className="text-[16px] font-bold text-red-800">{error}</p>
              {lastQuestion ? (
                <button
                  type="button"
                  onClick={() => askAssistant(lastQuestion)}
                  className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-[16px] font-extrabold text-white"
                >
                  पुन्हा प्रयत्न करा
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-emerald-100 bg-white/95 px-3 py-3 shadow-[0_-12px_28px_rgba(15,118,110,0.08)] backdrop-blur">
            {assistantSettings.suggested_questions_enabled ? (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => askAssistant(question)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[14px] font-extrabold text-emerald-800 shadow-sm active:scale-[0.98] disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
            ) : null}
            <form
              className="flex items-end gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2 shadow-inner"
              onSubmit={(event) => {
                event.preventDefault();
                askAssistant();
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={1}
                placeholder="प्रश्न विचारा..."
                className="min-h-[52px] flex-1 resize-none rounded-lg border border-white bg-white px-4 py-3 text-[17px] font-semibold text-slate-900 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-emerald-600 to-green-700 px-4 text-[17px] font-extrabold text-white shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                <span>पाठवा</span>
                <span aria-hidden="true">➤</span>
              </button>
            </form>
          </div>
        </section>
        </div>
      ) : null}

      {!open && settingsLoaded && assistantSettings.enabled ? (
        <button
          type="button"
          onClick={openAssistant}
          className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_18px_45px_rgba(15,118,110,0.35)] ring-4 ring-emerald-100 transition active:scale-95 sm:right-6"
          aria-label="AI सहाय्यक"
        >
          <Image
            src={AI_LOGO_SRC}
            alt="AI सहाय्यक"
            width={64}
            height={64}
            className="h-full w-full rounded-full object-cover"
          />
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
        </button>
      ) : null}
    </>
  );
}
