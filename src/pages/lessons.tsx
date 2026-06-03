import { useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCheck,
  faBackward,
  faBasketShopping,
  faForward,
  faHotel,
  faMapLocationDot,
  faMicrophone,
  faPenToSquare,
  faPills,
  faPlaneArrival,
  faStop,
  faTrain,
  faUtensils,
  faVolume,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type {
  Lesson,
  LessonLevel,
  LessonStep,
  PracticeAttempt,
} from "@/server/types";
import type { CurriculumSection } from "@/lib/curriculum";

import { resolveLessonSteps } from "@/lib/lessonSteps";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { useSpanishDictation } from "@/hooks/useSpanishDictation";
import { useSpanishPromptSpeech } from "@/hooks/useSpanishPromptSpeech";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const IS_DEV = process.env.NODE_ENV !== "production";

type FlowPhase = "pick-context" | "custom-details" | "lesson";
type PresetStatus = {
  presetId: string;
  message: string;
};

const CONTEXT_PRESETS = [
  {
    id: "restaurant",
    label: "Ordering at a restaurant",
    description:
      "Menus, allergies, paying the bill, and other restaurant-related language.",
    scenario:
      "I'm ordering food and drinks at a sit-down restaurant near the beach in Spain as an English-speaking tourist.",
    icon: faUtensils,
  },
  {
    id: "train",
    label: "Boarding a train",
    description:
      "Tickets, platforms, seats, and other public transit-related language.",
    scenario:
      "I'm boarding and riding a regional train in Spain: tickets, finding the platform, and simple questions on board.",
    icon: faTrain,
  },
  {
    id: "pharmacy",
    label: "At the pharmacy",
    description: "Symptoms, medications, and other health-related language.",
    scenario:
      "I'm visiting a Spanish pharmacy for minor travel needs: describing symptoms briefly and asking for common products.",
    icon: faPills,
  },
  {
    id: "hotel",
    label: "Checking into a hotel",
    description:
      "Reservations, room details, amenities, and polite front-desk requests.",
    scenario:
      "I'm checking into a hotel in Spain as an English-speaking tourist: confirming my reservation, asking about the room, and requesting basic amenities.",
    icon: faHotel,
  },
  {
    id: "directions",
    label: "Asking for directions",
    description: "Streets, landmarks, distances, and finding nearby places.",
    scenario:
      "I'm asking for directions in a Spanish city: finding streets, landmarks, bathrooms, cafes, and understanding simple route instructions.",
    icon: faMapLocationDot,
  },
  {
    id: "market",
    label: "Shopping at a market",
    description:
      "Prices, quantities, sizes, produce, and simple checkout phrases.",
    scenario:
      "I'm shopping at a local Spanish market: asking prices, choosing produce, requesting quantities, and paying politely.",
    icon: faBasketShopping,
  },
  {
    id: "airport",
    label: "Arriving at the airport",
    description:
      "Baggage, gates, delays, transportation, and arrival-related questions.",
    scenario:
      "I'm arriving at an airport in Spain as an English-speaking tourist: asking about baggage claim, gates, delays, taxis, and getting to my hotel.",
    icon: faPlaneArrival,
  },
  {
    id: "custom",
    label: "Custom situation",
    description: "Describe your own scenario.",
    scenario: null,
    icon: faPenToSquare,
  },
] as const;

function stepKindLabel(kind: LessonStep["kind"]): string {
  switch (kind) {
    case "goal":
      return "Goal";
    case "phrases":
      return "Useful phrases";
    case "breakdown":
      return "Breakdown";
    case "swap":
      return "Swap words";
    case "scenario":
      return "Mini scenario";
    case "review":
      return "Review";
    case "overview":
      return "Overview";
    case "vocabulary":
      return "Vocabulary";
    case "grammar":
      return "Grammar";
    case "phrase":
      return "Phrase";
    case "practice":
      return "Practice";
    default:
      return "Step";
  }
}

function speechTextForStep(step: LessonStep, lesson: Lesson): string {
  const phrase = step.spanish?.trim();
  if (phrase) {
    return phrase;
  }
  if (step.kind === "vocabulary" || step.kind === "phrases" || step.kind === "swap") {
    const words = step.words?.length ? step.words : lesson.vocabulary;
    if (words.length > 0) {
      return words.map((w) => w.spanish).join(". ");
    }
  }
  return lesson.spanishPrompt.trim() || "Hola, ¿cómo estás?";
}

export default function Lessons() {
  const [phase, setPhase] = useState<FlowPhase>("pick-context");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [scenario, setScenario] = useState("");
  const [level, setLevel] = useState<LessonLevel>("beginner");
  const [status, setStatus] = useState("");
  const [presetStatus, setPresetStatus] = useState<PresetStatus | null>(null);
  const [lastLessonId, setLastLessonId] = useState<string | null>(null);
  const [stepSpeechText, setStepSpeechText] = useState("");
  const [practiceHint, setPracticeHint] = useState("");
  const [lastPracticeAttempt, setLastPracticeAttempt] =
    useState<PracticeAttempt | null>(null);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  const [currentCurriculumSection, setCurrentCurriculumSection] =
    useState<CurriculumSection | null>(null);
  const [curriculumCompletedCount, setCurriculumCompletedCount] = useState(0);
  const [curriculumTotal, setCurriculumTotal] = useState(0);
  const playSound = useSoundEffect();

  const steps = useMemo(
    () => (lesson ? resolveLessonSteps(lesson) : []),
    [lesson],
  );
  const currentStep = steps[stepIndex] ?? null;

  const speechOverride = useMemo(() => {
    if (!lesson || !currentStep) {
      return null;
    }
    return speechTextForStep(currentStep, lesson);
  }, [lesson, currentStep]);

  const { toggleSpeakPrompt, isSpeaking: isSpeakingPrompt } =
    useSpanishPromptSpeech(lesson, (message) => setStatus(message), {
      textOverride: speechOverride,
    });
  const { isListening, toggleListening, stopListening } = useSpanishDictation({
    value: stepSpeechText,
    onChange: setStepSpeechText,
    onStatus: setPracticeHint,
    messages: {
      listening: "Listening...",
      unsupported: "Speech recognition is not supported in this browser.",
      denied:
        "Microphone access denied. Allow the mic for this site and try again.",
      startError:
        "Could not start dictation. Try refreshing or type your answer.",
      genericError: (code) => `Speech error: ${code}. Try again or type below.`,
    },
  });

  useEffect(() => {
    async function peekLatestLesson() {
      try {
        const [lessonResponse, curriculumResponse] = await Promise.all([
          fetch("/api/lessons"),
          fetch("/api/curriculum"),
        ]);
        const lessonData = (await lessonResponse.json()) as {
          lessons: Lesson[];
        };
        const curriculumData = (await curriculumResponse.json()) as {
          currentSection?: CurriculumSection;
          completedCount?: number;
          total?: number;
        };
        const latest = lessonData.lessons[0];
        setLastLessonId(latest?.id ?? null);
        setCurrentCurriculumSection(curriculumData.currentSection ?? null);
        setCurriculumCompletedCount(curriculumData.completedCount ?? 0);
        setCurriculumTotal(curriculumData.total ?? 0);
      } catch {
        /* ignore */
      }
    }
    void peekLatestLesson();
  }, []);

  function resetStepPractice() {
    stopListening();
    setStepSpeechText("");
    setPracticeHint("");
    setLastPracticeAttempt(null);
  }

  function showLessonLoadStatus(message: string, presetId?: string) {
    if (presetId) {
      setPresetStatus({ presetId, message });
      setStatus("");
      return;
    }

    setPresetStatus(null);
    setStatus(message);
  }

  useEffect(() => {
    if (!currentCurriculumSection) {
      return;
    }

    const presets = CONTEXT_PRESETS.filter((ctx) => ctx.scenario !== null).map(
      (ctx) => ({
        id: ctx.id,
        scenario: ctx.scenario,
      }),
    );
    const controller = new AbortController();
    window.setTimeout(() => {
      void fetch("/api/lessons/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, presets }),
        signal: controller.signal,
      }).catch(() => {
        /* cache warming is best-effort */
      });
    }, 250);

    return () => controller.abort();
  }, [currentCurriculumSection, level]);

  async function generateLesson(
    scenarioText: string,
    scenarioPresetId?: string,
  ) {
    const trimmed = scenarioText.trim();
    if (!trimmed) {
      showLessonLoadStatus("Describe a situation first.", scenarioPresetId);
      return;
    }

    showLessonLoadStatus(
      scenarioPresetId
        ? "Loading cached lesson or generating once..."
        : "Generating with Ollama...",
      scenarioPresetId,
    );
    const response = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: trimmed, scenarioPresetId, level }),
    });
    const data = (await response.json()) as {
      lesson?: Lesson;
      error?: string;
      cacheHit?: boolean;
    };

    if (!response.ok || !data.lesson) {
      showLessonLoadStatus(
        data.error ?? "Could not generate lesson.",
        scenarioPresetId,
      );
      return;
    }

    setLesson(data.lesson);
    setStepIndex(0);
    resetStepPractice();
    setPhase("lesson");
    setStatus("");
    setPresetStatus(null);
    setLastLessonId(data.lesson.id);
  }

  async function continueLastLesson() {
    setPresetStatus(null);
    setStatus("Loading lesson...");
    try {
      const response = await fetch("/api/lessons");
      const data = (await response.json()) as { lessons: Lesson[] };
      const latest = data.lessons[0];
      if (!latest) {
        setStatus("No saved lesson yet.");
        return;
      }
      setLesson(latest);
      setStepIndex(0);
      resetStepPractice();
      setPhase("lesson");
      setStatus("");
    } catch {
      setStatus("Could not load lessons.");
    }
  }

  const isLastStep = steps.length > 0 && stepIndex >= steps.length - 1;

  async function finishLesson() {
    if (!lesson) {
      return;
    }
    setPracticeHint("");
    setStatus("");
    try {
      const response = await fetch(
        `/api/lessons/${encodeURIComponent(lesson.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(data.error ?? "Could not save lesson progress.");
        return;
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("oye:progress-updated"));
      }
      await refreshCurriculum();
      playSound("success");
      newLessonFlow();
    } catch {
      setStatus("Could not save lesson progress.");
    }
  }

  async function saveStepPractice() {
    const transcript = stepSpeechText.trim();
    if (!lesson || !transcript) {
      setPracticeHint("Say or type your answer first.");
      return;
    }

    stopListening();
    setIsSavingPractice(true);
    setPracticeHint("Checking practice...");
    try {
      const response = await fetch(
        `/api/lessons/${encodeURIComponent(lesson.id)}/practice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepIndex, transcript }),
        },
      );
      const data = (await response.json()) as {
        attempt?: PracticeAttempt;
        error?: string;
      };
      if (!response.ok || !data.attempt) {
        setPracticeHint(data.error ?? "Could not save practice.");
        return;
      }
      setLastPracticeAttempt(data.attempt);
      setPracticeHint(data.attempt.feedback);
      window.dispatchEvent(new Event("oye:progress-updated"));
      playSound("success");
    } catch {
      setPracticeHint("Could not save practice.");
    } finally {
      setIsSavingPractice(false);
    }
  }

  function newLessonFlow() {
    setLesson(null);
    setPhase("pick-context");
    setStepIndex(0);
    setScenario("");
    setStatus("");
    setPresetStatus(null);
    setStepSpeechText("");
    setPracticeHint("");
    stopListening();
  }

  async function refreshCurriculum() {
    try {
      const response = await fetch("/api/curriculum");
      const data = (await response.json()) as {
        currentSection?: CurriculumSection;
        completedCount?: number;
        total?: number;
      };
      setCurrentCurriculumSection(data.currentSection ?? null);
      setCurriculumCompletedCount(data.completedCount ?? 0);
      setCurriculumTotal(data.total ?? 0);
    } catch {
      /* keep current */
    }
  }

  async function runDevCurriculumAction(
    action: "dev-complete-current-section" | "dev-reopen-previous-section",
  ) {
    setPresetStatus(null);
    setStatus(
      action === "dev-complete-current-section"
        ? "Skipping current grammar section..."
        : "Going back one grammar section...",
    );
    try {
      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as {
        currentSection?: CurriculumSection;
        completedCount?: number;
        total?: number;
        error?: string;
      };

      if (!response.ok || !data.currentSection) {
        setStatus(data.error ?? "Could not skip section.");
        return;
      }

      setLesson(null);
      setPhase("pick-context");
      setCurrentCurriculumSection(data.currentSection);
      setCurriculumCompletedCount(data.completedCount ?? 0);
      setCurriculumTotal(data.total ?? 0);
      resetStepPractice();
      window.dispatchEvent(new Event("oye:progress-updated"));
      setStatus(
        action === "dev-complete-current-section"
          ? "Skipped to the next grammar section."
          : "Moved back one grammar section.",
      );
      playSound("tap");
    } catch {
      setStatus("Could not change section.");
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
        className="pointer-events-none absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-220 flex-col gap-6 px-8 py-12">
        {phase === "pick-context" ? (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg ring-1 shadow-black/25 ring-white/5 backdrop-blur-sm sm:p-7">
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
                aria-hidden
              />
              <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
                Lessons
              </p>
              <h1 className="mt-3 text-2xl leading-tight font-black tracking-tight text-pretty text-white sm:text-3xl md:text-4xl">
                Pick a real-life context
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-pretty text-stone-400">
                Choose where you will use Spanish. The app builds a task-based
                lesson with useful phrases, swaps, a mini scenario, and
                practice using the same AI as the generate button.
              </p>
              {currentCurriculumSection ? (
                <div className="mt-5 rounded-xl border border-orange-400/25 bg-orange-400/10 p-4 text-left">
                  <p className="text-xs font-semibold tracking-[0.16em] text-orange-300 uppercase">
                    Current grammar path
                  </p>
                  <h2 className="mt-1 text-lg font-black text-orange-50">
                    {currentCurriculumSection.title}
                  </h2>
                  <p className="mt-1 text-sm text-orange-100/80">
                    {currentCurriculumSection.partTitle}
                    {curriculumTotal > 0
                      ? ` · ${curriculumCompletedCount}/${curriculumTotal} complete`
                      : ""}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-300">
                    {currentCurriculumSection.focus}
                  </p>
                  {IS_DEV ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runDevCurriculumAction(
                            "dev-reopen-previous-section",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-orange-300/40 px-3 py-1.5 text-xs font-bold text-orange-100 transition hover:bg-orange-300/10"
                      >
                        <FontAwesomeIcon
                          icon={faBackward}
                          className="text-xs"
                        />
                        Dev previous section
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runDevCurriculumAction(
                            "dev-complete-current-section",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-orange-300/40 px-3 py-1.5 text-xs font-bold text-orange-100 transition hover:bg-orange-300/10"
                      >
                        <FontAwesomeIcon icon={faForward} className="text-xs" />
                        Dev skip section
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <fieldset className="mt-6">
                <legend className="text-xs font-semibold tracking-wide text-stone-500">
                  Level
                </legend>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {(
                    [
                      { id: "beginner", label: "Beginner" },
                      { id: "upper-beginner", label: "Intermediate" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLevel(opt.id);
                        setPresetStatus(null);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${
                        level === opt.id
                          ? "border-orange-400/50 bg-orange-400/15 text-orange-100"
                          : "border-stone-600 bg-stone-800/50 text-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>

            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                {CONTEXT_PRESETS.map((ctx) => (
                  <div key={ctx.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (ctx.scenario === null) {
                          setPresetStatus(null);
                          setStatus("");
                          setPhase("custom-details");
                          setScenario("");
                          return;
                        }
                        void generateLesson(ctx.scenario, ctx.id);
                      }}
                      className="group relative flex h-48 sm:h-56 flex-col rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 text-left shadow-lg ring-1 shadow-black/20 ring-white/5 transition hover:border-orange-400/35 hover:bg-stone-900/65 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:p-6"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/12 text-orange-300 transition group-hover:bg-orange-400/20">
                        <FontAwesomeIcon icon={ctx.icon} className="text-lg" />
                      </span>
                      <span className="mt-4 text-lg font-black text-white">
                        {ctx.label}
                      </span>
                      <span className="mt-1 text-sm text-stone-400">
                        {ctx.description}
                      </span>
                      <span className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 text-xs font-semibold text-orange-400/90 uppercase">
                        {ctx.scenario === null
                          ? "Create scenario →"
                          : "Load lesson →"}
                      </span>
                    </button>
                    {presetStatus?.presetId === ctx.id ? (
                      <p
                        className="rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-100"
                        role="status"
                      >
                        {presetStatus.message}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* <div className="animate-wiggle-less relative h-min">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px" />
                <Image
                  src="/oye-tura-the-criatura-hat4.png"
                  width={600}
                  height={800}
                  alt="Tura the Criatura"
                  className="mx-auto w-full max-w-xs object-contain drop-shadow-2xl drop-shadow-orange-300/30 sm:min-w-xs"
                  priority
                />
              </div> */}
            </div>

            {lastLessonId ? (
              <p className="text-center text-sm text-stone-500">
                Or{" "}
                <button
                  type="button"
                  onClick={() => void continueLastLesson()}
                  className="font-bold text-orange-400 underline-offset-2 hover:underline"
                >
                  open your most recent lesson
                </button>
                .
              </p>
            ) : null}

            {status ? (
              <p className="text-center text-sm text-stone-400" role="status">
                {status}
              </p>
            ) : null}
          </>
        ) : null}

        {phase === "custom-details" ? (
          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <h2 className="text-sm font-semibold tracking-wide text-stone-400">
              Custom scenario
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Describe the situation in English. The model turns it into
              useful phrases, word swaps, a mini scenario, and practice.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                rows={4}
                className="min-h-28 w-full resize-y rounded-xl border border-stone-600/80 bg-stone-900/50 px-4 py-3 text-stone-100 transition outline-none placeholder:text-stone-500 focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                placeholder="e.g. Renting a bike and asking about helmets…"
                aria-label="Custom lesson scenario"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void generateLesson(scenario);
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 text-base font-bold text-stone-950 shadow-lg shadow-orange-500/15 transition outline-none hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:px-8"
                >
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className="text-sm"
                  />
                  Generate lesson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("pick-context");
                    setStatus("");
                    setPresetStatus(null);
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-stone-600 px-6 text-sm font-bold text-stone-200 hover:bg-stone-800"
                >
                  Back to contexts
                </button>
              </div>
            </div>
            {status ? (
              <p className="mt-3 text-sm text-stone-400" role="status">
                {status}
              </p>
            ) : null}
          </section>
        ) : null}

        {phase === "lesson" && lesson ? (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg ring-1 shadow-black/25 ring-white/5 backdrop-blur-sm sm:p-7">
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
                    {lesson.title}
                  </p>
                  {lesson.curriculumSectionTitle ? (
                    <p className="mt-1 text-xs font-semibold text-orange-200/90">
                      {lesson.curriculumPartTitle}:{" "}
                      {lesson.curriculumSectionTitle}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-stone-500">
                    Context: {lesson.scenario}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={newLessonFlow}
                  className="shrink-0 rounded-full border border-stone-600 px-4 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800"
                >
                  New context
                </button>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>
                    Step {stepIndex + 1} of {steps.length}
                  </span>
                  <span className="rounded-full bg-stone-800/80 px-2 py-0.5 font-semibold text-orange-200/90">
                    {currentStep ? stepKindLabel(currentStep.kind) : "Step"}
                  </span>
                </div>
                <div
                  className="mt-3 flex h-1.5 gap-1"
                  role="progressbar"
                  aria-valuenow={stepIndex + 1}
                  aria-valuemin={1}
                  aria-valuemax={steps.length}
                >
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-full min-w-6 flex-1 rounded-full transition ${
                        i <= stepIndex ? "bg-orange-400/70" : "bg-stone-700/80"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {currentStep ? (
                <div className="mt-6">
                  <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                    {currentStep.title}
                  </h2>
                  {currentStep.body ? (
                    <p className="mt-3 leading-relaxed text-pretty whitespace-pre-line text-stone-300">
                      {currentStep.body}
                    </p>
                  ) : null}

                  {currentStep.spanish || currentStep.english ? (
                    <div className="mt-5 flex flex-col gap-2 rounded-xl border border-stone-700/60 bg-stone-950/40 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      {currentStep.spanish ? (
                        <p className="text-lg font-bold text-orange-100">
                          {currentStep.spanish}
                        </p>
                      ) : null}
                      {currentStep.english ? (
                        <p className="text-sm text-stone-400 sm:text-right">
                          {currentStep.english}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep.words && currentStep.words.length > 0 ? (
                    <ul className="mt-5 divide-y divide-stone-700/80 rounded-xl border border-stone-700/60 bg-stone-950/40">
                      {currentStep.words.map((item) => (
                        <li
                          key={`${item.spanish}-${item.english}`}
                          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5"
                        >
                          <span className="font-bold text-orange-100">
                            {item.spanish}
                          </span>
                          <span className="text-right text-stone-400">
                            {item.english}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSpeakPrompt()}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border bg-stone-800/80 transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                        isSpeakingPrompt
                          ? "border-orange-400/50 text-orange-200 hover:border-orange-300/60 hover:bg-orange-400/15"
                          : "border-stone-600/80 text-orange-400 hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-300"
                      }`}
                      aria-label={
                        isSpeakingPrompt ? "Stop reading aloud" : "Read aloud"
                      }
                    >
                      <FontAwesomeIcon
                        icon={isSpeakingPrompt ? faStop : faVolume}
                        className="text-lg"
                      />
                    </button>
                    <p className="text-xs text-stone-500">
                      Plays Spanish for this step when available.
                    </p>
                  </div>

                  <div className="mt-8 rounded-xl border border-stone-700/60 bg-stone-950/35 p-4 sm:p-5">
                    <h3 className="text-xs font-semibold tracking-[0.15em] text-orange-400/90 uppercase">
                      Your turn — say it
                    </h3>
                    <p className="mt-2 text-sm text-stone-400">
                      Use the microphone or type. Try the Spanish words or
                      sentences from this step.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full border font-bold transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 sm:self-auto ${
                          isListening
                            ? "border-red-500/50 bg-red-600 text-white hover:bg-red-500"
                            : "border-stone-600/80 bg-stone-800/80 text-orange-400 hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-300"
                        }`}
                        aria-label={
                          isListening ? "Stop recording" : "Speak in Spanish"
                        }
                      >
                        <FontAwesomeIcon
                          icon={faMicrophone}
                          className="text-lg"
                        />
                      </button>
                      <input
                        value={stepSpeechText}
                        onChange={(e) => {
                          setStepSpeechText(e.target.value);
                          setLastPracticeAttempt(null);
                        }}
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-600/80 bg-stone-900/50 px-4 py-2.5 text-stone-100 transition outline-none placeholder:text-stone-500 focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                        placeholder="What you said appears here…"
                        aria-label="Transcript of your Spanish practice"
                      />
                      <button
                        type="button"
                        onClick={() => void saveStepPractice()}
                        disabled={isSavingPractice}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-orange-400 px-5 text-sm font-bold text-stone-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCheck} className="text-sm" />
                        Check
                      </button>
                    </div>
                    {lastPracticeAttempt ? (
                      <div className="mt-3 rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
                        Score: {lastPracticeAttempt.score}/100
                      </div>
                    ) : null}
                    {practiceHint ? (
                      <p className="mt-3 text-xs text-stone-500" role="status">
                        {practiceHint}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-700/60 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    resetStepPractice();
                    setStepIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={stepIndex === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      void finishLesson();
                    } else {
                      resetStepPractice();
                      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-stone-950 shadow-lg shadow-orange-500/15 transition hover:bg-orange-300"
                >
                  {isLastStep ? "Finish" : "Next"}
                  {isLastStep ? null : (
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-xs"
                    />
                  )}
                </button>
              </div>
            </section>

            {lesson.practiceQuestions.length > 0 &&
            currentStep?.kind === "practice" ? (
              <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
                <h3 className="text-xs font-semibold tracking-[0.18em] text-orange-400/90 uppercase">
                  Extra prompts
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-300">
                  {lesson.practiceQuestions.map((q) => (
                    <li key={q} className="text-pretty">
                      {q}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
