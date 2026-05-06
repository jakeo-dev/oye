import Link from "next/link";
import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faMicrophone,
  faVolume,
} from "@fortawesome/free-solid-svg-icons";
import type { Lesson } from "@/server/types";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Lessons() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [scenario, setScenario] = useState("ordering food near the beach");
  const [status, setStatus] = useState("Loading lesson...");

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
    <div className={`${hostGrotesk.className}`}>
      <div className="h-[33vh] bg-orange-400 px-8 py-6 text-stone-900">
        <div className="mx-auto mb-12 flex w-full max-w-200 items-start">
          <Link href="/" className="mr-auto text-orange-400 transition">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="rounded-full bg-stone-900 px-1 py-[6.5px] text-xl hover:bg-stone-900/60"
              aria-label="Back"
            />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <h1 className="text-left text-4xl font-black">
            {lesson?.spanishPrompt ?? "Hola, ¿cómo estás?"}
          </h1>
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

      <main className="mx-auto mt-8 flex max-w-200 flex-col gap-4 px-8 text-stone-900">
        <input
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
          className="rounded-lg border border-stone-300 px-4 py-3"
          aria-label="Lesson scenario"
        />
        <button
          onClick={generateLesson}
          className="rounded-full bg-stone-900 px-5 py-3 font-bold text-white transition hover:bg-stone-700"
        >
          Generate lesson
        </button>
        {status ? <p className="text-sm text-stone-500">{status}</p> : null}
        {lesson ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-black">{lesson.title}</h2>
            <p>{lesson.englishTranslation}</p>
            <div className="grid gap-2">
              {lesson.vocabulary.map((item) => (
                <div
                  key={`${item.spanish}-${item.english}`}
                  className="flex justify-between border-b border-stone-200 py-2"
                >
                  <span className="font-bold">{item.spanish}</span>
                  <span>{item.english}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="mx-auto flex max-w-200 items-center justify-center">
        <button
          onClick={() => {}}
          className="group absolute bottom-48 mx-auto flex w-min items-center justify-center rounded-full bg-white px-3 py-3.5 text-6xl font-bold text-white shadow-lg shadow-orange-400/50 transition hover:text-white/50"
        >
          <FontAwesomeIcon
            icon={faMicrophone}
            className="mr-auto rounded-full bg-white px-3 py-4 text-orange-400 transition group-hover:translate-x-1/2"
            aria-label="Speak"
          />
        </button>
      </div>
    </div>
  );
}
