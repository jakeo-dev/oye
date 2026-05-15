import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStop,
  faVolume,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type { Lesson } from "@/server/types";

import { useSpanishPromptSpeech } from "@/hooks/useSpanishPromptSpeech";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

export default function Lessons() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [scenario, setScenario] = useState("ordering food near the beach");
  const [status, setStatus] = useState("Loading lesson...");

  const { toggleSpeakPrompt, isSpeaking: isSpeakingPrompt } =
    useSpanishPromptSpeech(lesson, (message) => setStatus(message));

  useEffect(() => {
    async function loadLesson() {
      const response = await fetch("/api/lessons");
      const data = (await response.json()) as { lessons: Lesson[] };
      setLesson(data.lessons[0] ?? null);
      setStatus(data.lessons[0] ? "" : "Generate a first lesson.");
    }

    loadLesson().catch(() => setStatus("Could not load lessons."));
  }, []);

  async function generateLesson() {
    setStatus("Generating with Ollama...");
    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, level: "beginner" }),
    });
    const data = (await response.json()) as { lesson?: Lesson; error?: string };

    if (!response.ok || !data.lesson) {
      setStatus(data.error ?? "Could not generate lesson.");
      return;
    }

    setLesson(data.lesson);
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
        className="pointer-events-none absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-220 flex-col gap-6 px-8 py-12">
        <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg shadow-black/25 ring-1 ring-white/5 backdrop-blur-sm sm:p-7">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
            Lesson
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

        <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg shadow-black/20 ring-1 ring-white/5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-stone-400">
            New lesson from scenario
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-stone-600/80 bg-stone-900/50 px-4 py-3 text-stone-100 placeholder:text-stone-500 outline-none transition focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
              placeholder="Describe a situation in English…"
              aria-label="Lesson scenario"
            />
            <button
              type="button"
              onClick={() => {
                void generateLesson();
              }}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 text-base font-bold text-stone-950 shadow-lg shadow-orange-500/15 outline-none transition hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:px-8"
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm" />
              Generate
            </button>
          </div>
          {status ? (
            <p className="mt-3 text-sm text-stone-400" role="status">
              {status}
            </p>
          ) : null}
        </section>

        {lesson ? (
          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg shadow-black/20 ring-1 ring-white/5 sm:p-6">
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {lesson.title}
            </h2>
            <p className="mt-2 text-pretty leading-relaxed text-stone-300">
              {lesson.englishTranslation}
            </p>
            <h3 className="mt-6 text-xs font-semibold tracking-[0.18em] text-orange-400/90 uppercase">
              Vocabulary
            </h3>
            <ul className="mt-3 divide-y divide-stone-700/80 rounded-xl border border-stone-700/60 bg-stone-950/40">
              {lesson.vocabulary.map((item) => (
                <li
                  key={`${item.spanish}-${item.english}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5"
                >
                  <span className="font-bold text-orange-100">{item.spanish}</span>
                  <span className="text-right text-stone-400">{item.english}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
