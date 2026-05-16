import { buildLessonStepsFromCore } from "@/lib/lessonSteps";

import type {
  Lesson,
  LessonGenerationInput,
  LessonLevel,
  LessonStep,
  LessonStepKind,
  VocabularyItem,
} from "./types";

type OllamaOptions = {
  baseUrl?: string;
  model?: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OllamaErrorResponse = {
  error?: unknown;
};

const defaultBaseUrl = "http://127.0.0.1:11434";
const defaultModel = "llama3.2";

export function getOllamaConfig(options: OllamaOptions = {}) {
  return {
    baseUrl: (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? defaultBaseUrl)
      .replace(/\/+$/, ""),
    model: options.model ?? process.env.OLLAMA_MODEL ?? defaultModel,
  };
}

function idFromDate(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLevel(level: unknown): LessonLevel {
  return level === "upper-beginner" ? "upper-beginner" : "beginner";
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Ollama did not return a JSON object.");
    }
    return JSON.parse(match[0]);
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseVocabularyArray(value: unknown): VocabularyItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => ({
      spanish:
        typeof item === "object" && item && "spanish" in item
          ? String(item.spanish)
          : "",
      english:
        typeof item === "object" && item && "english" in item
          ? String(item.english)
          : "",
    }))
    .filter((item) => item.spanish && item.english);
}

function normalizeStepKind(raw: unknown): LessonStepKind {
  const key = String(raw ?? "overview")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const map: Record<string, LessonStepKind> = {
    overview: "overview",
    intro: "overview",
    context: "overview",
    vocabulary: "vocabulary",
    vocab: "vocabulary",
    words: "vocabulary",
    grammar: "grammar",
    phrase: "phrase",
    dialog: "phrase",
    practice: "practice",
    review: "practice",
    drill: "practice",
  };
  return map[key] ?? "overview";
}

function parseLessonStepsRaw(raw: unknown): LessonStep[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const steps: LessonStep[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const rec = entry as Record<string, unknown>;
    const kind = normalizeStepKind(rec.kind ?? rec.type);
    const title = String(rec.title ?? rec.headline ?? "").trim() || "Step";
    const body = String(rec.body ?? rec.content ?? rec.text ?? "").trim();
    const spanish = String(rec.spanish ?? rec.exampleSpanish ?? "").trim();
    const english = String(rec.english ?? rec.exampleEnglish ?? "").trim();
    const words = parseVocabularyArray(rec.words ?? rec.items);
    steps.push({
      kind,
      title,
      body,
      ...(words.length ? { words } : {}),
      ...(spanish ? { spanish } : {}),
      ...(english ? { english } : {}),
    });
  }
  return steps;
}

async function createOllamaError(response: Response): Promise<Error> {
  let detail = "";

  try {
    const rawBody = await response.text();
    if (rawBody) {
      const parsed = JSON.parse(rawBody) as OllamaErrorResponse;
      detail =
        typeof parsed.error === "string"
          ? `: ${parsed.error}`
          : `: ${rawBody.slice(0, 240)}`;
    }
  } catch {
    // Keep the status-only message if Ollama returns a non-JSON error body.
  }

  return new Error(`Ollama request failed with ${response.status}${detail}.`);
}

function createFallbackLesson(input: LessonGenerationInput): Lesson {
  const scenario = input.scenario ?? input.topic ?? "ordering coffee in Alicante";
  const core = {
    title: "Cafe Basics",
    touristFocus: "Polite cafe ordering and simple follow-up questions.",
    spanishPrompt: "Hola, quiero un cafe con leche, por favor.",
    englishTranslation: "Hello, I want a coffee with milk, please.",
    vocabulary: [
      { spanish: "quiero", english: "I want" },
      { spanish: "por favor", english: "please" },
      { spanish: "gracias", english: "thank you" },
    ] as VocabularyItem[],
    practiceQuestions: [
      "How would you politely ask for water?",
      "Say thank you after receiving your order.",
    ],
  };

  return {
    id: idFromDate("lesson"),
    title: core.title,
    level: normalizeLevel(input.level),
    scenario,
    touristFocus: core.touristFocus,
    spanishPrompt: core.spanishPrompt,
    englishTranslation: core.englishTranslation,
    vocabulary: core.vocabulary,
    practiceQuestions: core.practiceQuestions,
    steps: buildLessonStepsFromCore(core),
    createdAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function generateLessonWithOllama(
  input: LessonGenerationInput,
  options: OllamaOptions = {},
): Promise<Lesson> {
  const { baseUrl, model } = getOllamaConfig(options);
  const level = normalizeLevel(input.level);
  const scenario = input.scenario ?? input.topic ?? "tourist basics in Alicante";
  const prompt = [
    "Create a short multi-step Spanish lesson for an English-speaking tourist beginner in Alicante.",
    "Return only JSON with this exact shape (steps must be 4 to 6 items, in teaching order):",
    '{"title":"string","scenario":"string","touristFocus":"string","spanishPrompt":"string","englishTranslation":"string","vocabulary":[{"spanish":"string","english":"string"}],"practiceQuestions":["string"],"steps":[{"kind":"overview|vocabulary|grammar|phrase|practice","title":"string","body":"string","words":[{"spanish":"string","english":"string"}],"spanish":"string","english":"string"}]}',
    "Rules for steps: use kind overview first (set expectations), then vocabulary (include words array), grammar (explain one pattern; spanish/english optional), phrase (key line in spanish + english), practice last (body with 2-4 prompts, no need for spanish field).",
    "Omit optional fields when empty.",
    `Level: ${level}`,
    `Scenario: ${scenario}`,
    "Keep Spanish natural, practical, and beginner friendly.",
  ].join("\n");

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw await createOllamaError(response);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  const generated = parseJsonObject(data.response ?? "");
  const vocabulary = parseVocabularyArray(generated.vocabulary);
  const title = String(generated.title ?? "Spanish Tourist Lesson");
  const touristFocus = String(generated.touristFocus ?? "Tourist Spanish basics.");
  const spanishPrompt = String(generated.spanishPrompt ?? "");
  const englishTranslation = String(generated.englishTranslation ?? "");
  const practiceQuestions = asStringArray(generated.practiceQuestions);

  let steps = parseLessonStepsRaw(generated.steps);
  if (steps.length === 0) {
    steps = buildLessonStepsFromCore({
      title,
      touristFocus,
      spanishPrompt,
      englishTranslation,
      vocabulary,
      practiceQuestions,
    });
  }

  let mergedVocabulary = vocabulary;
  if (mergedVocabulary.length === 0) {
    const fromStep = steps.find(
      (s) => s.kind === "vocabulary" && s.words && s.words.length > 0,
    )?.words;
    if (fromStep?.length) {
      mergedVocabulary = fromStep;
    }
  }

  return {
    ...createFallbackLesson(input),
    title,
    level,
    scenario: String(generated.scenario ?? scenario),
    touristFocus,
    spanishPrompt,
    englishTranslation,
    vocabulary: mergedVocabulary,
    practiceQuestions,
    steps,
    source: "ollama",
  };
}

export async function generateConversationReply(
  userText: string,
  lesson: Pick<Lesson, "scenario" | "spanishPrompt"> | null,
  options: OllamaOptions = {},
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig(options);
  const prompt = [
    "You are a patient Spanish tutor for an English-speaking tourist beginner.",
    "Reply in simple Spanish first, then one concise English hint.",
    lesson ? `Lesson scenario: ${lesson.scenario}` : "Scenario: tourist Spanish practice.",
    lesson ? `Current lesson phrase: ${lesson.spanishPrompt}` : "",
    `Student said: ${userText}`,
  ].join("\n");

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!response.ok) {
    throw await createOllamaError(response);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  return data.response?.trim() || "Muy bien. Try saying it one more time.";
}

export function generateFallbackLesson(input: LessonGenerationInput): Lesson {
  return createFallbackLesson(input);
}
