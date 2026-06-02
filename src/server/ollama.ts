import { buildLessonStepsFromCore } from "@/lib/lessonSteps";
import { getCurriculumSection } from "@/lib/curriculum";
import type { CurriculumSection } from "@/lib/curriculum";
import {
  DEFAULT_AI_RESPONSE_FLAVOR,
  DEFAULT_CUSTOM_AI_INSTRUCTIONS,
  getCustomAiInstructionLine,
  getAiFlavorInstruction,
} from "@/lib/aiFlavors";
import type { AiResponseFlavor } from "@/lib/aiFlavors";

import type {
  AppSettings,
  Lesson,
  LessonGenerationInput,
  LessonLevel,
  LessonStep,
  LessonStepKind,
  PracticeMistake,
  VocabularyItem,
} from "./types";

type OllamaOptions = {
  baseUrl?: string;
  model?: string;
  practiceFocus?: PracticeMistake[];
  aiResponseFlavor?: AiResponseFlavor;
  customAiInstructions?: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: unknown;
    model?: unknown;
  }>;
};

type OllamaErrorResponse = {
  error?: unknown;
};

export type OllamaStatus = "online" | "missing-model" | "offline";

export type OllamaStatusResult = {
  status: OllamaStatus;
  label: string;
  detail: string;
  baseUrl: string;
  model: string;
};

const defaultBaseUrl = "http://127.0.0.1:11434";
const defaultModel = "llama3.2";

export function getOllamaConfig(options: OllamaOptions | AppSettings = {}) {
  const settings = "ollamaBaseUrl" in options ? options : null;
  return {
    baseUrl: (
      ("baseUrl" in options ? options.baseUrl : settings?.ollamaBaseUrl) ??
      process.env.OLLAMA_BASE_URL ??
      defaultBaseUrl
    ).replace(/\/+$/, ""),
    model:
      ("model" in options ? options.model : settings?.ollamaModel) ??
      process.env.OLLAMA_MODEL ??
      defaultModel,
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

function modelNameMatches(
  availableModel: string,
  configuredModel: string,
): boolean {
  return (
    availableModel === configuredModel ||
    availableModel === `${configuredModel}:latest` ||
    availableModel.startsWith(`${configuredModel}:`)
  );
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkOllamaStatus(
  options: OllamaOptions | AppSettings = {},
): Promise<OllamaStatusResult> {
  const { baseUrl, model } = getOllamaConfig(options);

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/tags`, 2500);
    if (!response.ok) {
      return {
        status: "offline",
        label: "Ollama offline",
        detail: `Ollama responded with ${response.status}.`,
        baseUrl,
        model,
      };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const modelNames =
      data.models
        ?.map((item) =>
          typeof item.name === "string"
            ? item.name
            : typeof item.model === "string"
              ? item.model
              : "",
        )
        .filter(Boolean) ?? [];
    const hasConfiguredModel = modelNames.some((name) =>
      modelNameMatches(name, model),
    );

    if (!hasConfiguredModel) {
      return {
        status: "missing-model",
        label: "Model missing",
        detail: `${model} is not installed in Ollama.`,
        baseUrl,
        model,
      };
    }

    return {
      status: "online",
      label: "Ollama ready",
      detail: `${model} is available.`,
      baseUrl,
      model,
    };
  } catch {
    return {
      status: "offline",
      label: "Ollama offline",
      detail: `Could not reach ${baseUrl}.`,
      baseUrl,
      model,
    };
  }
}

function createFallbackLesson(input: LessonGenerationInput): Lesson {
  const scenario =
    input.scenario ?? input.topic ?? "ordering coffee in Alicante";
  const curriculumSection = getCurriculumSection(input.curriculumSectionId);
  const core = {
    title: curriculumSection
      ? `${curriculumSection.title} in Context`
      : "Cafe Basics",
    touristFocus: curriculumSection
      ? `${curriculumSection.focus} Practice this through the selected scenario.`
      : "Polite cafe ordering and simple follow-up questions.",
    spanishPrompt: curriculumSection
      ? "El cafe es pequeno, pero la mesa es grande."
      : "Hola, quiero un cafe con leche, por favor.",
    englishTranslation: curriculumSection
      ? "The coffee is small, but the table is big."
      : "Hello, I want a coffee with milk, please.",
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
    scenarioPresetId: input.scenarioPresetId,
    curriculumSectionId: curriculumSection?.id,
    curriculumSectionTitle: curriculumSection?.title,
    curriculumPartTitle: curriculumSection?.partTitle,
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

function buildLessonPrompt({
  curriculumSection,
  level,
  scenario,
  aiResponseFlavor,
  customAiInstructions,
}: {
  curriculumSection: CurriculumSection | null;
  level: LessonLevel;
  scenario: string;
  aiResponseFlavor: AiResponseFlavor;
  customAiInstructions: string;
}): string {
  const customInstructionLine = getCustomAiInstructionLine(customAiInstructions);
  const curriculumLines = curriculumSection
    ? [
        `Curriculum part: ${curriculumSection.partTitle}`,
        `Curriculum section: ${curriculumSection.title}`,
        `Grammar focus: ${curriculumSection.focus}`,
        "Required concepts:",
        ...curriculumSection.concepts.map((concept) => `- ${concept}`),
        "Teaching guidance:",
        ...curriculumSection.promptGuidance.map((item) => `- ${item}`),
        "Make this lesson primarily teach the curriculum section above while using the scenario for examples, vocabulary, and practice.",
      ]
    : [
        "Curriculum section: general tourist Spanish review.",
        "Use the scenario for examples, vocabulary, and practice.",
      ];

  return [
    "Create a short multi-step Spanish lesson for an English-speaking tourist beginner in Alicante.",
    ...curriculumLines,
    "Return only JSON with this exact shape (steps must be 4 to 6 items, in teaching order):",
    '{"title":"string","scenario":"string","touristFocus":"string","spanishPrompt":"string","englishTranslation":"string","vocabulary":[{"spanish":"string","english":"string"}],"practiceQuestions":["string"],"steps":[{"kind":"overview|vocabulary|grammar|phrase|practice","title":"string","body":"string","words":[{"spanish":"string","english":"string"}],"spanish":"string","english":"string"}]}',
    "Rules for steps: use kind overview first (set expectations), then vocabulary (include words array), grammar (explain the curriculum section clearly; spanish/english optional), phrase (key line in spanish + english), practice last (body with 2-4 prompts, no need for spanish field).",
    "Omit optional fields when empty.",
    `AI response flavor: ${getAiFlavorInstruction(aiResponseFlavor)}`,
    customInstructionLine ?? "",
    `Level: ${level}`,
    `Scenario: ${scenario}`,
    "Keep Spanish natural, practical, and beginner friendly.",
  ].join("\n");
}

export async function generateLessonWithOllama(
  input: LessonGenerationInput,
  options: OllamaOptions = {},
): Promise<Lesson> {
  const { baseUrl, model } = getOllamaConfig(options);
  const level = normalizeLevel(input.level);
  const scenario =
    input.scenario ?? input.topic ?? "tourist basics in Alicante";
  const curriculumSection = getCurriculumSection(input.curriculumSectionId);
  const prompt = buildLessonPrompt({
    curriculumSection,
    level,
    scenario,
    aiResponseFlavor: options.aiResponseFlavor ?? DEFAULT_AI_RESPONSE_FLAVOR,
    customAiInstructions:
      options.customAiInstructions ?? DEFAULT_CUSTOM_AI_INSTRUCTIONS,
  });

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
  const touristFocus = String(
    generated.touristFocus ?? "Tourist Spanish basics.",
  );
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
    scenarioPresetId: input.scenarioPresetId,
    curriculumSectionId: curriculumSection?.id,
    curriculumSectionTitle: curriculumSection?.title,
    curriculumPartTitle: curriculumSection?.partTitle,
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
  lesson: Pick<
    Lesson,
    | "scenario"
    | "spanishPrompt"
    | "curriculumSectionId"
    | "curriculumSectionTitle"
    | "curriculumPartTitle"
  > | null,
  options: OllamaOptions = {},
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig(options);
  const curriculumSection = getCurriculumSection(lesson?.curriculumSectionId);
  const practiceFocus = options.practiceFocus ?? [];
  const practiceFocusLines =
    practiceFocus.length > 0
      ? [
          "The student has repeatedly missed these items in lesson practice. Work them into the conversation naturally and ask follow-up questions that make the student use them again:",
          ...practiceFocus.map((item) =>
            item.kind === "word"
              ? `- Word: ${item.text} (missed ${item.count} times; original prompt: ${item.prompt})`
              : `- Sentence: ${item.text} (missed ${item.count} times)`,
          ),
          "Prioritize the most repeated missed items, but do not list them mechanically.",
        ]
      : [];
  const prompt = [
    "You are a patient Spanish tutor for an English-speaking tourist beginner.",
    "Reply in simple Spanish first, then one concise English hint.",
    lesson?.curriculumPartTitle
      ? `Curriculum part: ${lesson.curriculumPartTitle}`
      : "",
    lesson?.curriculumSectionTitle
      ? `Current curriculum section: ${lesson.curriculumSectionTitle}`
      : "",
    curriculumSection
      ? `Keep your correction aligned with this grammar focus: ${curriculumSection.focus}`
      : "",
    lesson
      ? `Lesson scenario: ${lesson.scenario}`
      : "Scenario: tourist Spanish practice.",
    lesson ? `Current lesson phrase: ${lesson.spanishPrompt}` : "",
    ...practiceFocusLines,
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

export async function generateTravelAnswer(
  question: string,
  options: OllamaOptions = {},
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig(options);
  const prompt = [
    "You are an offline Spanish travel language assistant for an English-speaking traveler.",
    "The user may ask in English or Spanish.",
    "Answer practical questions about how to say something in Spanish, what Spanish text means in English, pronunciation, grammar, vocabulary, and travel situations.",
    "If the user asks for a translation, give the most natural travel phrase first, then a literal meaning if useful.",
    "If the user asks what something means, translate it and explain any important tone or usage.",
    "Keep answers concise, practical, and beginner-friendly.",
    `AI response flavor: ${getAiFlavorInstruction(
      options.aiResponseFlavor ?? DEFAULT_AI_RESPONSE_FLAVOR,
    )}`,
    getCustomAiInstructionLine(
      options.customAiInstructions ?? DEFAULT_CUSTOM_AI_INSTRUCTIONS,
    ) ?? "",
    "Do not claim access to live information, maps, prices, schedules, laws, or current events. If the answer depends on current local facts, say that you cannot verify that offline and give language help instead.",
    `Question: ${question}`,
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
  return (
    data.response?.trim() ||
    "I could not generate an answer. Try asking in a shorter sentence."
  );
}

export function generateFallbackLesson(input: LessonGenerationInput): Lesson {
  return createFallbackLesson(input);
}
