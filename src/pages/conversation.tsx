
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

      <main className="mx-auto mt-8 flex max-w-200 flex-col gap-4 px-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearConversation}
            disabled={messages.length === 0}
            aria-label="Clear conversation"
            className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-4 py-2 text-sm font-bold text-stone-100 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-600 disabled:hover:bg-transparent"
          >
            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
            Clear
          </button>
        </div>
        <div className="flex min-h-48 flex-col gap-3">
          {messages.map((message) => (
            <p
              key={message.id}
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "ml-auto bg-orange-400 text-white"
                  : "bg-stone-100 text-stone-900"
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
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={userText}
            onChange={(event) => setUserText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-4 py-3"
            aria-label="Conversation reply"
          />
          <button
            type="button"
            onClick={() => {}}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl text-orange-400 shadow-md shadow-orange-400/25 transition hover:bg-stone-100"
            aria-label="Speak"
            title="Speak"
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
          <button
            onClick={sendMessage}
            className="rounded-full bg-stone-900 px-5 py-3 font-bold text-white transition hover:bg-stone-700"
          >
            Send
          </button>
        </div>
        {status ? <p className="text-sm text-stone-500">{status}</p> : null}
      </main>
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
