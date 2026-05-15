import type { Lesson, LessonGenerationInput, LessonLevel } from "./types";

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

  return {
    id: idFromDate("lesson"),
    title: "Cafe Basics",
    level: normalizeLevel(input.level),
    scenario,
    touristFocus: "Polite cafe ordering and simple follow-up questions.",
    spanishPrompt: "Hola, quiero un cafe con leche, por favor.",
    englishTranslation: "Hello, I want a coffee with milk, please.",
    vocabulary: [
      { spanish: "quiero", english: "I want" },
      { spanish: "por favor", english: "please" },
      { spanish: "gracias", english: "thank you" },
    ],
    practiceQuestions: [
      "How would you politely ask for water?",
      "Say thank you after receiving your order.",
    ],
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
    "Create one short Spanish lesson for an English-speaking tourist beginner in Alicante.",
    "Return only JSON with this exact shape:",
    '{"title":"string","scenario":"string","touristFocus":"string","spanishPrompt":"string","englishTranslation":"string","vocabulary":[{"spanish":"string","english":"string"}],"practiceQuestions":["string"]}',
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
  const vocabulary = Array.isArray(generated.vocabulary)
    ? generated.vocabulary
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
        .filter((item) => item.spanish && item.english)
    : [];

  return {
    ...createFallbackLesson(input),
    title: String(generated.title ?? "Spanish Tourist Lesson"),
    level,
    scenario: String(generated.scenario ?? scenario),
    touristFocus: String(generated.touristFocus ?? "Tourist Spanish basics."),
    spanishPrompt: String(generated.spanishPrompt ?? ""),
    englishTranslation: String(generated.englishTranslation ?? ""),
    vocabulary,
    practiceQuestions: asStringArray(generated.practiceQuestions),
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
