import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTrash } from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

type AskMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const ASK_MESSAGES_STORAGE_KEY = "oye:ask-messages";
const ASK_HISTORY_CLEARED_EVENT = "oye:ask-history-cleared";
const ASK_TIMEOUT_MS = 30000;

function TypingIndicator() {
  return (
    <div
      className="max-w-[min(100%,34rem)] self-start rounded-2xl border border-stone-600/80 bg-stone-800/70 px-5 py-3.5"
      role="status"
      aria-label="Answer is loading"
    >
      <span className="inline-flex items-center gap-1.5" aria-hidden>
        <span
          className="inline-block h-2 w-2 rounded-full bg-orange-300/90 motion-safe:animate-bounce"
          style={{ animationDuration: "0.9s", animationDelay: "0ms" }}
        />
        <span
          className="inline-block h-2 w-2 rounded-full bg-orange-300/90 motion-safe:animate-bounce"
          style={{ animationDuration: "0.9s", animationDelay: "150ms" }}
        />
        <span
          className="inline-block h-2 w-2 rounded-full bg-orange-300/90 motion-safe:animate-bounce"
          style={{ animationDuration: "0.9s", animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}

function newMessage(role: AskMessage["role"], content: string): AskMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function Ask() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [hasLoadedSavedMessages, setHasLoadedSavedMessages] = useState(false);
  const [status, setStatus] = useState("");
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedMessages = window.localStorage.getItem(
          ASK_MESSAGES_STORAGE_KEY,
        );
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages) as AskMessage[]);
        }
      } catch {
        window.localStorage.removeItem(ASK_MESSAGES_STORAGE_KEY);
      } finally {
        setHasLoadedSavedMessages(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedMessages) {
      return;
    }

    if (messages.length === 0) {
      window.localStorage.removeItem(ASK_MESSAGES_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      ASK_MESSAGES_STORAGE_KEY,
      JSON.stringify(messages),
    );
  }, [hasLoadedSavedMessages, messages]);

  useEffect(() => {
    function clearSavedAskHistory() {
      setMessages([]);
      setStatus("");
    }

    window.addEventListener(ASK_HISTORY_CLEARED_EVENT, clearSavedAskHistory);
    return () => {
      window.removeEventListener(
        ASK_HISTORY_CLEARED_EVENT,
        clearSavedAskHistory,
      );
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isAwaitingAnswer]);

  async function askQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAwaitingAnswer) {
      return;
    }

    setMessages((current) => [...current, newMessage("user", trimmedQuestion)]);
    setQuestion("");
    setStatus("");
    setIsAwaitingAnswer(true);

    try {
      const response = await fetchWithTimeout(
        "/api/ask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion }),
        },
        ASK_TIMEOUT_MS,
      );
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok || !data.answer) {
        setStatus(data.error ?? "Could not get an answer.");
        return;
      }

      setMessages((current) => [
        ...current,
        newMessage("assistant", data.answer ?? ""),
      ]);
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? "Ollama is taking too long to answer. Try restarting Ollama or choosing a smaller model."
          : "Could not reach the Ask service. Check that the app backend is running.",
      );
    } finally {
      setIsAwaitingAnswer(false);
    }
  }

  return (
    <div
      className={`${hostGrotesk.className} relative isolate min-h-[calc(100dvh-5.5rem)] overflow-hidden bg-stone-950 text-stone-100`}
    >
      <div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-orange-600/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-220 flex-col px-8 py-12">
        <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg ring-1 shadow-black/25 ring-white/5 backdrop-blur-sm sm:p-7">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
            Offline answers
          </p>
          <div className="mt-3 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight font-black tracking-tight text-pretty text-white sm:text-3xl md:text-4xl">
                Ask anything
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-400 sm:text-base">
                Type in English or Spanish for practical travel translations,
                meanings, and quick language help.
              </p>
            </div>
          </div>
        </section>

        <main className="mt-6 flex min-h-0 flex-1 flex-col gap-5">
          <div
            className="relative flex max-h-[min(52vh,28rem)] min-h-52 flex-col gap-3 overflow-y-auto rounded-2xl border border-stone-700/60 bg-stone-900/30 p-4 ring-1 ring-white/5 sm:p-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && !isAwaitingAnswer ? (
              <p className="m-auto text-center text-sm leading-relaxed text-stone-500">
                Try{" "}
                <button
                  type="button"
                  onClick={() => setQuestion("How do I ask for the check?")}
                  className="cursor-pointer text-stone-400 hover:text-stone-300"
                >
                  How do I ask for the check?
                </button>{" "}
                or{" "}
                <button
                  type="button"
                  onClick={() =>
                    setQuestion('What does "dónde está el baño" mean?')
                  }
                  className="cursor-pointer text-stone-400 hover:text-stone-300"
                >
                  What does &quot;dónde está el baño&quot; mean?
                </button>
              </p>
            ) : null}
            {messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[min(100%,34rem)] rounded-2xl px-4 py-3 text-left text-base leading-relaxed text-pretty whitespace-pre-wrap sm:px-5 ${
                  message.role === "user"
                    ? "ml-auto border border-orange-400/35 bg-orange-400/15 font-medium text-stone-100"
                    : "border border-stone-600/80 bg-stone-800/70 text-stone-200"
                }`}
              >
                {message.content}
              </p>
            ))}
            {isAwaitingAnswer ? <TypingIndicator /> : null}
            <div ref={logEndRef} className="h-0 shrink-0" aria-hidden />
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setStatus("");
                window.localStorage.removeItem(ASK_MESSAGES_STORAGE_KEY);
              }}
              disabled={messages.length === 0 || isAwaitingAnswer}
              aria-label="Clear answers"
              className="sticky bottom-0 z-10 mt-auto ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-700 bg-stone-900/90 px-4 py-2 text-sm font-bold text-stone-100 shadow-lg shadow-black/20 backdrop-blur transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-600 disabled:shadow-none disabled:hover:bg-stone-900/90"
            >
              <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  void askQuestion();
                }
              }}
              disabled={isAwaitingAnswer}
              className="min-w-0 flex-1 resize-none rounded-xl border border-stone-600/80 bg-stone-900/50 px-4 py-3 text-stone-100 transition outline-none placeholder:text-stone-500 focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:cursor-not-allowed disabled:opacity-45"
              placeholder="Ask in English or Spanish..."
              aria-label="Question"
            />
            <button
              type="button"
              onClick={() => {
                void askQuestion();
              }}
              disabled={isAwaitingAnswer || !question.trim()}
              className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-400 px-6 text-base font-bold text-stone-950 shadow-lg shadow-orange-500/15 transition outline-none hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-45 sm:px-8"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
              Ask
            </button>
          </div>
          {status && !isAwaitingAnswer ? (
            <p className="text-sm text-stone-400" role="status">
              {status}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
