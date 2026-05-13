import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faTrash,
  faVolume,
} from "@fortawesome/free-solid-svg-icons";
import type { ConversationMessage, Lesson } from "@/server/types";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Conversation() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [userText, setUserText] = useState("");
  const [status, setStatus] = useState("");

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
    <div className={`${hostGrotesk.className}`}>
      <div className="flex h-[33vh] items-center bg-orange-400 px-8 py-6 text-stone-900">
        <div className="mx-auto flex h-min w-full max-w-200 items-center">
          <h1 className="text-4xl font-black">{lesson?.spanishPrompt ?? "Hola, ¿cómo estás?"}</h1>
          <button
            onClick={() => {}}
            className="ml-auto text-orange-400 transition"
          >
            <FontAwesomeIcon
              icon={faVolume}
              className="rounded-full bg-stone-900 px-1.25 py-2 text-3xl hover:bg-stone-900/60"
              aria-label="Say text"
            />
          </button>
        </div>
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
            >
              {message.content}
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
