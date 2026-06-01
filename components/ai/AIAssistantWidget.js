"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "majhi_dairy_ai_assistant_messages";
const AI_LOGO_SRC = "/icons/ai logo.png";
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
  if (typeof localStorage === "undefined") {
    return "";
  }

  return localStorage.getItem("goshala_token") || "";
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
  if (typeof localStorage === "undefined") {
    return initialMessages();
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) && stored.length ? stored : initialMessages();
  } catch {
    return initialMessages();
  }
}

function persistMessages(messages) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
}

function messageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Bubble({ message }) {
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
  const scrollerRef = useRef(null);

  useEffect(() => {
    setMessages(readStoredMessages());
  }, []);

  useEffect(() => {
    persistMessages(messages);
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading, open]);

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
          Authorization: `Bearer ${getAuthToken()}`
        },
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
          content: result.data?.answer || "या प्रश्नासाठी माहिती उपलब्ध नाही."
        }
      ]);
    } catch (requestError) {
      setError(requestError.message || "सध्या सहाय्यक उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.");
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    const next = initialMessages();
    setMessages(next);
    setError("");
    persistMessages(next);
  }

  return (
    <>
      {open ? (
        <section className="fixed bottom-24 right-2 z-[70] flex max-h-[78vh] w-[calc(100vw-16px)] max-w-[450px] flex-col overflow-hidden rounded-lg border border-white/70 bg-gradient-to-b from-emerald-50 via-white to-sky-50 shadow-[0_24px_70px_rgba(15,118,110,0.28)] sm:right-5">
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
                  <h2 className="truncate text-[21px] font-extrabold leading-tight">AI सहाय्यक</h2>
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
                  onClick={() => setOpen(false)}
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
              <Bubble key={message.id} message={message} />
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
            <form
              className="flex items-end gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2 shadow-inner"
              onSubmit={(event) => {
                event.preventDefault();
                askAssistant();
              }}
            >
              <textarea
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
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
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
