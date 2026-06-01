"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "majhi_dairy_ai_assistant_messages";
const suggestedQuestions = [
  "आजचे दूध",
  "या महिन्याचे उत्पन्न",
  "सरासरी फॅट",
  "सर्वाधिक दूध",
  "सर्वात कमी दूध",
  "SNF अहवाल"
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] rounded-lg px-4 py-3 text-[17px] font-semibold leading-relaxed shadow-sm ${
          isUser
            ? "bg-sheti text-white"
            : "border border-green-100 bg-white text-slate-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-white px-4 py-3 text-[16px] font-bold text-slate-600 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-green-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:240ms]" />
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
        <section className="fixed bottom-24 right-3 z-50 flex max-h-[74vh] w-[calc(100vw-24px)] max-w-[430px] flex-col overflow-hidden rounded-lg border border-green-100 bg-green-50 shadow-2xl sm:right-5">
          <header className="bg-sheti px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-extrabold text-green-100">माझी डेअरी</p>
                <h2 className="text-[22px] font-extrabold leading-tight">🤖 AI सहाय्यक</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetChat}
                  className="rounded-lg bg-white/15 px-3 py-2 text-[15px] font-extrabold active:bg-white/25"
                >
                  साफ
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-[20px] font-extrabold active:bg-white/25"
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

          <div className="border-t border-green-100 bg-white px-3 py-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => askAssistant(question)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-2 text-[15px] font-extrabold text-sheti disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
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
                className="min-h-[52px] flex-1 resize-none rounded-lg border-2 border-green-100 bg-white px-4 py-3 text-[18px] font-semibold text-slate-900 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white shadow-sm disabled:bg-slate-300"
              >
                पाठवा
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-sheti text-[31px] text-white shadow-2xl ring-4 ring-green-100 active:scale-95 sm:right-6"
        aria-label="AI सहाय्यक"
      >
        🤖
      </button>
    </>
  );
}
