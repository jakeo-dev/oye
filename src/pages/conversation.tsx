
import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faTrash,
  faStop,
  faVolume,
} from "@fortawesome/free-solid-svg-icons";

import type { ConversationMessage, Lesson } from "@/server/types";

import { useSpanishPromptSpeech } from "@/hooks/useSpanishPromptSpeech";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

export default function Conversation() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [userText, setUserText] = useState("");
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  /** Typed text before mic session; transcripts are appended to this string. */
  const baseTextRef = useRef("");

  const { toggleSpeakPrompt, isSpeaking: isSpeakingPrompt } =
    useSpanishPromptSpeech(lesson, (message) => setStatus(message));

  useEffect(() => {
    async function loadConversation() {
      const lessonResponse = await fetch("/api/lessons");
      const lessonData = (await lessonResponse.json()) as { lessons: Lesson[] };
      const currentLesson = lessonData.lessons[0] ?? null;
      setLesson(currentLesson);

      const messagesResponse = await fetch(
        currentLesson
          ? `/api/conversation?lessonId=${currentLesson.id}`
          : "/api/conversation",
      );
      const messagesData = (await messagesResponse.json()) as {
        messages: ConversationMessage[];
      };
      setMessages(messagesData.messages);
    }

    loadConversation().catch(() => setStatus("Could not load conversation."));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  async function sendMessage() {
    const trimmedText = userText.trim();
    if (!trimmedText) {
      return;
    }

    setStatus("Thinking...");
    const response = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson?.id, userText: trimmedText }),
    });
    const data = (await response.json()) as {
      messages?: ConversationMessage[];
      error?: string;
    };

    const newMessages = data.messages;

    if (!response.ok || !newMessages) {
      setStatus(data.error ?? "Could not get a reply.");
      return;
    }

    setMessages((current) => [...current, ...newMessages]);
    setUserText("");
    setStatus("");
  }

  async function clearConversation() {
    if (messages.length === 0) {
      return;
    }

    setStatus("Clearing conversation...");
    const endpoint = lesson
      ? `/api/conversation?lessonId=${encodeURIComponent(lesson.id)}`
      : "/api/conversation";
    const response = await fetch(endpoint, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(data.error ?? "Could not clear conversation.");
      return;
    }

    setMessages([]);
    setStatus("");
  }

  function startListening() {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      setStatus("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;

    baseTextRef.current = userText;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionResultListEvent) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const first = result?.[0];
        if (first?.transcript?.length) {
          spoken += first.transcript;
        }
      }
      const spokenTrimmed = spoken.trim();
      const prefix = baseTextRef.current.trim();
      const merged =
        prefix && spokenTrimmed
          ? `${prefix} ${spokenTrimmed}`
          : spokenTrimmed || prefix;
      setUserText(merged);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      recognitionRef.current = null;
      const code = event.error ?? "unknown";
      if (code === "aborted" || code === "no-speech") {
        setStatus("");
        return;
      }
      if (code === "not-allowed") {
        setStatus(
          "Microphone access denied. Allow the mic for this site and try again.",
        );
        return;
      }
      setStatus(`Speech error: ${code}. Try again or type your message.`);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setStatus((current) => (current === "Listening..." ? "" : current));
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setStatus("Listening...");
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setStatus("Could not start speech recognition. Try refreshing the page.");
    }
  }

  function stopListening() {
    if (!recognitionRef.current || !isListening) {
      return;
    }
    try {
      recognitionRef.current.stop();
    } catch {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
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
        <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg shadow-black/25 ring-1 ring-white/5 backdrop-blur-sm sm:p-7">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
            Conversation
          </p>
          <div className="mt-3 flex items-start gap-4">
            <h1 className="min-w-0 flex-1 text-pretty text-2xl leading-tight font-black tracking-tight text-white sm:text-3xl md:text-4xl">
              {lesson?.spanishPrompt ?? "Hola, ¿cómo estás?"}
            </h1>
            <button
              type="button"
              onClick={() => toggleSpeakPrompt()}
              className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-full border bg-stone-800/80 outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                isSpeakingPrompt
                  ? "border-orange-400/50 text-orange-200 hover:border-orange-300/60 hover:bg-orange-400/15"
                  : "border-stone-600/80 text-orange-400 hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-300"
              }`}
              aria-label={
                isSpeakingPrompt ? "Stop reading prompt" : "Read prompt aloud"
              }
            >
              <FontAwesomeIcon
                icon={isSpeakingPrompt ? faStop : faVolume}
                className="text-lg"
              />
            </button>
          </div>
        </section>

        <main className="mt-6 flex min-h-0 flex-1 flex-col gap-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                void clearConversation();
              }}
              disabled={messages.length === 0}
              aria-label="Clear conversation"
              className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm font-bold text-stone-100 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-600 disabled:hover:bg-transparent"
            >
              <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
              Clear
            </button>
          </div>

          <div
            className="flex max-h-[min(52vh,28rem)] min-h-40 flex-col gap-3 overflow-y-auto rounded-2xl border border-stone-700/60 bg-stone-900/30 p-4 ring-1 ring-white/5 sm:p-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <p className="text-center text-sm text-stone-500">
                Say hello below — your thread appears here.
              </p>
            ) : null}
            {messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[min(100%,28rem)] text-pretty rounded-2xl px-4 py-3 text-base leading-relaxed sm:px-5 ${
                  message.role === "user"
                    ? "ml-auto border border-orange-400/35 bg-orange-400/15 font-medium text-stone-100"
                    : "border border-stone-600/80 bg-stone-800/70 text-stone-200"
                }`}
              >
                {message.content}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={handleMicClick}
              className={`flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-full border font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:self-auto ${
                isListening
                  ? "border-red-500/50 bg-red-600 text-white hover:bg-red-500"
                  : "border-stone-600/80 bg-stone-800/80 text-orange-400 hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-300"
              }`}
              aria-label={isListening ? "Stop recording" : "Start speaking"}
            >
              <FontAwesomeIcon icon={faMicrophone} className="text-lg" />
            </button>
            <input
              value={userText}
              onChange={(event) => setUserText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendMessage();
                }
              }}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-stone-600/80 bg-stone-900/50 px-4 py-3 text-stone-100 placeholder:text-stone-500 outline-none transition focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
              placeholder="Type in Spanish…"
              aria-label="Conversation reply"
            />
            <button
              type="button"
              onClick={() => {
                void sendMessage();
              }}
              className="h-12 shrink-0 rounded-full bg-orange-400 px-6 text-base font-bold text-stone-950 shadow-lg shadow-orange-500/15 outline-none transition hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:px-8"
            >
              Send
            </button>
          </div>
          {status ? (
            <p className="text-sm text-stone-400" role="status">
              {status}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = ArrayLike<SpeechRecognitionAlternative> & {
  length: number;
  isFinal: boolean;
};

type SpeechRecognitionResultListEvent = {
  results: ArrayLike<SpeechRecognitionResult> & {
    length: number;
    item?: (index: number) => SpeechRecognitionResult | null;
    [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionErrorEvent = {
  error?: string;
};

type SpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultListEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
