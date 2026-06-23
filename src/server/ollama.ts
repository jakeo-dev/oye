import { getCurriculumSection } from "@/lib/curriculum";
import type { CurriculumSection } from "@/lib/curriculum";
import {
  DEFAULT_AI_RESPONSE_FLAVOR,
  DEFAULT_CUSTOM_AI_INSTRUCTIONS,
  getCustomAiInstructionLine,
  getAiFlavorInstruction,
} from "@/lib/aiFlavors";
import type { AiResponseFlavor } from "@/lib/aiFlavors";
import {
  normalizeOllamaGenerationOptions,
  toOllamaApiOptions,
} from "@/lib/ollamaGenerationOptions";
import type { OllamaGenerationOptions } from "@/lib/ollamaGenerationOptions";

import { buildLessonStepsFromCore } from "../lib/lessonSteps";
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
  ollamaOptions?: Partial<OllamaGenerationOptions>;
  practiceFocus?: PracticeMistake[];
  aiResponseFlavor?: AiResponseFlavor;
  customAiInstructions?: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

type FallbackLessonCore = {
  spanishPrompt: string;
  englishTranslation: string;
  vocabulary: VocabularyItem[];
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: unknown;
    model?: unknown;
    modified_at?: unknown;
    size?: unknown;
    details?: {
      family?: unknown;
      parameter_size?: unknown;
      quantization_level?: unknown;
    };
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

export type OllamaModelSummary = {
  name: string;
  model: string;
  modifiedAt: string | null;
  size: number | null;
  family: string | null;
  parameterSize: string | null;
  quantizationLevel: string | null;
};

const defaultBaseUrl = "http://127.0.0.1:11434";
const defaultModel = "llama3.2";
const lessonGenerationTimeoutMs = 120000;

export function getOllamaConfig(options: OllamaOptions | AppSettings = {}) {
  const settings = "ollamaBaseUrl" in options ? options : null;
  const optionOverrides =
    "ollamaOptions" in options
      ? options.ollamaOptions
      : settings?.ollamaOptions;
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
    ollamaOptions: normalizeOllamaGenerationOptions(optionOverrides),
  };
}

function getGenerateOptionsPayload(
  options: OllamaOptions | AppSettings,
  fallbackNumPredict: number,
) {
  const payload = toOllamaApiOptions(getOllamaConfig(options).ollamaOptions);
  if (payload.num_predict < 1) {
    payload.num_predict = fallbackNumPredict;
  }
  return payload;
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

function stringOrDefault(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function isLikelyMalformedSpanishPhrase(value: string): boolean {
  const text = value.trim();
  if (!text) {
    return true;
  }
  if (text.length > 140 || text.split(/\s+/).length > 18) {
    return true;
  }
  if (/[\n\r{}[\]]/.test(text)) {
    return true;
  }
  if (
    /\b(step|breakdown|swap|english|spanish|translation|lesson|phrase)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
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
    goal: "goal",
    objective: "goal",
    phrases: "phrases",
    usefulphrases: "phrases",
    phrasebook: "phrases",
    breakdown: "breakdown",
    breakitdown: "breakdown",
    parts: "breakdown",
    swap: "swap",
    swaps: "swap",
    substitutions: "swap",
    scenario: "scenario",
    miniscenario: "scenario",
    review: "review",
    recap: "review",
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
    const targetSpanish = String(rec.targetSpanish ?? "").trim();
    const targetEnglish = String(rec.targetEnglish ?? "").trim();
    const acceptedSpanish = asStringArray(
      rec.acceptedSpanish ?? rec.acceptedPhrases,
    );
    const listenOnly = rec.listenOnly === true;
    const words = parseVocabularyArray(rec.words ?? rec.items);
    const parts = parseVocabularyArray(rec.parts ?? rec.breakdownParts);
    steps.push({
      kind,
      title,
      body,
      ...(parts.length ? { parts } : {}),
      ...(words.length ? { words } : {}),
      ...(spanish ? { spanish } : {}),
      ...(english ? { english } : {}),
      ...(targetSpanish ? { targetSpanish } : {}),
      ...(targetEnglish ? { targetEnglish } : {}),
      ...(acceptedSpanish.length ? { acceptedSpanish } : {}),
      ...(listenOnly ? { listenOnly } : {}),
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

const sectionFallbacks: Record<string, FallbackLessonCore> = {
  "alphabet-pronunciation": {
    spanishPrompt: "La estacion esta en la calle Colon.",
    englishTranslation: "The station is on Colon Street.",
    vocabulary: [
      { spanish: "estacion", english: "station" },
      { spanish: "calle Colon", english: "Colon Street" },
      { spanish: "playa", english: "beach" },
      { spanish: "farmacia", english: "pharmacy" },
      { spanish: "plaza Luceros", english: "Luceros Square" },
      { spanish: "avenida Maisonnave", english: "Maisonnave Avenue" },
    ],
  },
  "nouns-gender": {
    spanishPrompt: "Necesito una habitacion y un mapa.",
    englishTranslation: "I need a room and a map.",
    vocabulary: [
      { spanish: "habitacion", english: "room" },
      { spanish: "mapa", english: "map" },
      { spanish: "maleta", english: "suitcase" },
      { spanish: "reserva", english: "reservation" },
      { spanish: "taxi", english: "taxi" },
      { spanish: "billete", english: "ticket" },
    ],
  },
  articles: {
    spanishPrompt: "Quiero el billete y una botella de agua.",
    englishTranslation: "I want the ticket and a bottle of water.",
    vocabulary: [
      { spanish: "el billete", english: "the ticket" },
      { spanish: "una botella", english: "a bottle" },
      { spanish: "la cuenta", english: "the bill" },
      { spanish: "un cafe", english: "a coffee" },
      { spanish: "un vaso", english: "a glass" },
      { spanish: "una mesa", english: "a table" },
    ],
  },
  adjectives: {
    spanishPrompt: "La mesa pequena esta libre.",
    englishTranslation: "The small table is free.",
    vocabulary: [
      { spanish: "mesa", english: "table" },
      { spanish: "pequena", english: "small" },
      { spanish: "habitacion", english: "room" },
      { spanish: "maleta", english: "suitcase" },
      { spanish: "grande", english: "big" },
      { spanish: "tranquila", english: "quiet" },
    ],
  },
  "subject-pronouns": {
    spanishPrompt: "Yo tengo reserva y usted tiene mi nombre.",
    englishTranslation: "I have a reservation and you have my name.",
    vocabulary: [
      { spanish: "yo", english: "I" },
      { spanish: "usted", english: "you, formal" },
      { spanish: "nosotros", english: "we" },
      { spanish: "ellos", english: "they" },
      { spanish: "reserva", english: "reservation" },
      { spanish: "pasaporte", english: "passport" },
    ],
  },
  "present-tense-verbs": {
    spanishPrompt: "Compro dos billetes y subo al tren.",
    englishTranslation: "I buy two tickets and get on the train.",
    vocabulary: [
      { spanish: "compro", english: "I buy" },
      { spanish: "subo", english: "I get on" },
      { spanish: "reservo", english: "I reserve" },
      { spanish: "busco", english: "I look for" },
      { spanish: "tren", english: "train" },
      { spanish: "autobus", english: "bus" },
    ],
  },
  "irregular-present-tense-verbs": {
    spanishPrompt: "Tengo una pregunta y quiero ayuda.",
    englishTranslation: "I have a question and I want help.",
    vocabulary: [
      { spanish: "tengo", english: "I have" },
      { spanish: "quiero", english: "I want" },
      { spanish: "hago", english: "I do / make" },
      { spanish: "voy", english: "I go" },
      { spanish: "pregunta", english: "question" },
      { spanish: "respuesta", english: "answer" },
    ],
  },
  "ser-estar": {
    spanishPrompt: "El hotel es tranquilo y esta cerca.",
    englishTranslation: "The hotel is quiet and is nearby.",
    vocabulary: [
      { spanish: "es", english: "is, identity/quality" },
      { spanish: "esta", english: "is, location/state" },
      { spanish: "restaurante", english: "restaurant" },
      { spanish: "mercado", english: "market" },
      { spanish: "tranquilo", english: "quiet" },
      { spanish: "lleno", english: "full" },
    ],
  },
  "negation-questions": {
    spanishPrompt: "No entiendo, donde esta la salida?",
    englishTranslation: "I do not understand; where is the exit?",
    vocabulary: [
      { spanish: "no entiendo", english: "I do not understand" },
      { spanish: "donde", english: "where" },
      { spanish: "no se", english: "I do not know" },
      { spanish: "no tengo", english: "I do not have" },
      { spanish: "salida", english: "exit" },
      { spanish: "entrada", english: "entrance" },
    ],
  },
  "basic-sentence-expansion": {
    spanishPrompt: "Quiero cafe, pero necesito agua tambien.",
    englishTranslation: "I want coffee, but I also need water.",
    vocabulary: [
      { spanish: "pero", english: "but" },
      { spanish: "tambien", english: "also" },
      { spanish: "porque", english: "because" },
      { spanish: "entonces", english: "then / so" },
      { spanish: "cafe", english: "coffee" },
      { spanish: "agua", english: "water" },
    ],
  },
  possessives: {
    spanishPrompt: "Mi maleta esta en su oficina.",
    englishTranslation: "My suitcase is in your office.",
    vocabulary: [
      { spanish: "mi", english: "my" },
      { spanish: "su", english: "your / his / her" },
      { spanish: "tu", english: "your, informal" },
      { spanish: "nuestra", english: "our, feminine" },
      { spanish: "maleta", english: "suitcase" },
      { spanish: "bolsa", english: "bag" },
    ],
  },
  prepositions: {
    spanishPrompt: "Voy al mercado con mi amigo.",
    englishTranslation: "I am going to the market with my friend.",
    vocabulary: [
      { spanish: "al", english: "to the" },
      { spanish: "con", english: "with" },
      { spanish: "del", english: "from/of the" },
      { spanish: "para", english: "for" },
      { spanish: "mercado", english: "market" },
      { spanish: "hotel", english: "hotel" },
    ],
  },
  "object-pronouns": {
    spanishPrompt: "Lo quiero ahora y le doy mi tarjeta.",
    englishTranslation: "I want it now and I give you my card.",
    vocabulary: [
      { spanish: "lo", english: "it, masculine direct object" },
      { spanish: "le", english: "to you / to him / to her" },
      { spanish: "la", english: "it, feminine direct object" },
      { spanish: "les", english: "to you all / to them" },
      { spanish: "tarjeta", english: "card" },
      { spanish: "dinero", english: "money" },
    ],
  },
  "reflexive-verbs": {
    spanishPrompt: "Me siento mal y necesito medicina.",
    englishTranslation: "I feel sick and need medicine.",
    vocabulary: [
      { spanish: "me siento", english: "I feel" },
      { spanish: "necesito", english: "I need" },
      { spanish: "me llamo", english: "my name is" },
      { spanish: "me quedo", english: "I am staying" },
      { spanish: "medicina", english: "medicine" },
      { spanish: "ayuda", english: "help" },
    ],
  },
  commands: {
    spanishPrompt: "Por favor, llameme cuando llegue el taxi.",
    englishTranslation: "Please call me when the taxi arrives.",
    vocabulary: [
      { spanish: "llameme", english: "call me, formal" },
      { spanish: "llegue", english: "arrives" },
      { spanish: "ayudeme", english: "help me, formal" },
      { spanish: "digame", english: "tell me, formal" },
      { spanish: "taxi", english: "taxi" },
      { spanish: "tren", english: "train" },
    ],
  },
  "near-future": {
    spanishPrompt: "Voy a comprar pan en el mercado.",
    englishTranslation: "I am going to buy bread at the market.",
    vocabulary: [
      { spanish: "voy a comprar", english: "I am going to buy" },
      { spanish: "pan", english: "bread" },
      { spanish: "voy a tomar", english: "I am going to take/drink" },
      { spanish: "voy a buscar", english: "I am going to look for" },
      { spanish: "mercado", english: "market" },
      { spanish: "cafeteria", english: "cafe" },
    ],
  },
  preterite: {
    spanishPrompt: "Compre el billete ayer.",
    englishTranslation: "I bought the ticket yesterday.",
    vocabulary: [
      { spanish: "compre", english: "I bought" },
      { spanish: "ayer", english: "yesterday" },
      { spanish: "pague", english: "I paid" },
      { spanish: "llegue", english: "I arrived" },
      { spanish: "billete", english: "ticket" },
      { spanish: "cafe", english: "coffee" },
    ],
  },
  imperfect: {
    spanishPrompt: "El tren salia tarde cada manana.",
    englishTranslation: "The train used to leave late every morning.",
    vocabulary: [
      { spanish: "salia", english: "used to leave" },
      { spanish: "cada manana", english: "every morning" },
      { spanish: "estaba", english: "was" },
      { spanish: "tenia", english: "had" },
      { spanish: "tren", english: "train" },
      { spanish: "autobus", english: "bus" },
    ],
  },
  future: {
    spanishPrompt: "Llegare al hotel esta noche.",
    englishTranslation: "I will arrive at the hotel tonight.",
    vocabulary: [
      { spanish: "llegare", english: "I will arrive" },
      { spanish: "esta noche", english: "tonight" },
      { spanish: "comprare", english: "I will buy" },
      { spanish: "buscare", english: "I will look for" },
      { spanish: "hotel", english: "hotel" },
      { spanish: "aeropuerto", english: "airport" },
    ],
  },
  conditional: {
    spanishPrompt: "Quisiera una mesa junto a la ventana.",
    englishTranslation: "I would like a table next to the window.",
    vocabulary: [
      { spanish: "quisiera", english: "I would like" },
      { spanish: "junto a", english: "next to" },
      { spanish: "podria", english: "could I / could you" },
      { spanish: "me gustaria", english: "I would like" },
      { spanish: "mesa", english: "table" },
      { spanish: "barra", english: "bar / counter" },
    ],
  },
  "progressive-tenses": {
    spanishPrompt: "Estoy buscando la puerta ahora.",
    englishTranslation: "I am looking for the gate now.",
    vocabulary: [
      { spanish: "estoy buscando", english: "I am looking for" },
      { spanish: "ahora", english: "now" },
      { spanish: "estoy esperando", english: "I am waiting" },
      { spanish: "estoy comprando", english: "I am buying" },
      { spanish: "puerta", english: "gate / door" },
      { spanish: "salida", english: "exit" },
    ],
  },
  "perfect-tenses": {
    spanishPrompt: "He perdido mi pasaporte.",
    englishTranslation: "I have lost my passport.",
    vocabulary: [
      { spanish: "he perdido", english: "I have lost" },
      { spanish: "pasaporte", english: "passport" },
      { spanish: "he comprado", english: "I have bought" },
      { spanish: "he reservado", english: "I have reserved" },
      { spanish: "maleta", english: "suitcase" },
      { spanish: "tarjeta", english: "card" },
    ],
  },
  subjunctive: {
    spanishPrompt: "Quiero que me ayude, por favor.",
    englishTranslation: "I want you to help me, please.",
    vocabulary: [
      { spanish: "quiero que", english: "I want that / I want you to" },
      { spanish: "me ayude", english: "you help me, formal subjunctive" },
      { spanish: "espero que", english: "I hope that" },
      { spanish: "es posible que", english: "it is possible that" },
      { spanish: "me llame", english: "you call me" },
      { spanish: "me espere", english: "you wait for me" },
    ],
  },
  "relative-pronouns": {
    spanishPrompt: "Busco el hotel que esta cerca del puerto.",
    englishTranslation: "I am looking for the hotel that is near the port.",
    vocabulary: [
      { spanish: "que", english: "that / which" },
      { spanish: "cerca del puerto", english: "near the port" },
      { spanish: "quien", english: "who / whom" },
      { spanish: "lo que", english: "what / the thing that" },
      { spanish: "hotel", english: "hotel" },
      { spanish: "restaurante", english: "restaurant" },
    ],
  },
  "advanced-sentence-structure": {
    spanishPrompt: "Aunque estoy cansado, quiero visitar el museo.",
    englishTranslation: "Although I am tired, I want to visit the museum.",
    vocabulary: [
      { spanish: "aunque", english: "although" },
      { spanish: "quiero visitar", english: "I want to visit" },
      { spanish: "sin embargo", english: "however" },
      { spanish: "por eso", english: "therefore / that is why" },
      { spanish: "museo", english: "museum" },
      { spanish: "castillo", english: "castle" },
    ],
  },
};

function getFallbackCoreForSection(
  curriculumSection: CurriculumSection | null,
): FallbackLessonCore {
  if (!curriculumSection) {
    return {
      spanishPrompt: "Hola, quiero un cafe con leche, por favor.",
      englishTranslation: "Hello, I want a coffee with milk, please.",
      vocabulary: [
        { spanish: "quiero", english: "I want" },
        { spanish: "cafe con leche", english: "coffee with milk" },
        { spanish: "agua", english: "water" },
        { spanish: "te", english: "tea" },
        { spanish: "por favor", english: "please" },
        { spanish: "gracias", english: "thank you" },
      ],
    };
  }

  return sectionFallbacks[curriculumSection.id] ?? sectionFallbacks.articles;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function createTimeoutError(timeoutMs: number): Error {
  return new Error(
    `Ollama took longer than ${Math.round(timeoutMs / 1000)} seconds to respond.`,
  );
}

async function fetchOllamaGenerate(
  baseUrl: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetchWithTimeout(`${baseUrl}/api/generate`, timeoutMs, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw createTimeoutError(timeoutMs);
    }
    throw error;
  }
}

export async function listOllamaModels(
  options: OllamaOptions | AppSettings = {},
): Promise<{
  baseUrl: string;
  model: string;
  models: OllamaModelSummary[];
}> {
  const { baseUrl, model } = getOllamaConfig(options);
  const response = await fetchWithTimeout(`${baseUrl}/api/tags`, 3500);

  if (!response.ok) {
    throw await createOllamaError(response);
  }

  const data = (await response.json()) as OllamaTagsResponse;
  const models =
    data.models
      ?.map((item): OllamaModelSummary | null => {
        const name =
          typeof item.name === "string"
            ? item.name
            : typeof item.model === "string"
              ? item.model
              : "";
        if (!name) {
          return null;
        }
        const modelName = typeof item.model === "string" ? item.model : name;
        return {
          name,
          model: modelName,
          modifiedAt:
            typeof item.modified_at === "string" ? item.modified_at : null,
          size: typeof item.size === "number" ? item.size : null,
          family:
            typeof item.details?.family === "string"
              ? item.details.family
              : null,
          parameterSize:
            typeof item.details?.parameter_size === "string"
              ? item.details.parameter_size
              : null,
          quantizationLevel:
            typeof item.details?.quantization_level === "string"
              ? item.details.quantization_level
              : null,
        };
      })
      .filter((item): item is OllamaModelSummary => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  return { baseUrl, model, models };
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
  const fallbackCore = getFallbackCoreForSection(curriculumSection);
  const core = {
    title: curriculumSection
      ? `${curriculumSection.title} in Context`
      : "Cafe Basics",
    touristFocus: curriculumSection
      ? `${curriculumSection.focus} Practice this through the selected scenario.`
      : "Polite cafe ordering and simple follow-up questions.",
    spanishPrompt: fallbackCore.spanishPrompt,
    englishTranslation: fallbackCore.englishTranslation,
    vocabulary: fallbackCore.vocabulary,
    practiceQuestions: [
      "Repeat the phrase slowly once.",
      "Swap one word and keep the same grammar pattern.",
    ],
    curriculumPartTitle: curriculumSection?.partTitle,
    curriculumSectionTitle: curriculumSection?.title,
    curriculumFocus: curriculumSection?.focus,
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
  const customInstructionLine =
    getCustomAiInstructionLine(customAiInstructions);
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
    "Create a short task-based Spanish lesson for an English-speaking tourist beginner in Alicante.",
    ...curriculumLines,
    "Return only JSON with this exact shape (steps must be exactly 5 items, in this order):",
    '{"title":"string","scenario":"string","touristFocus":"string","spanishPrompt":"string","englishTranslation":"string","vocabulary":[{"spanish":"string","english":"string"}],"practiceQuestions":["string"],"steps":[{"kind":"phrase|breakdown|swap|review","title":"string","body":"string","parts":[{"spanish":"string","english":"string"}],"words":[{"spanish":"string","english":"string"}],"spanish":"string","english":"string","targetSpanish":"string","targetEnglish":"string","acceptedSpanish":["string"],"listenOnly":false}]}',
    "Keep every body field under 24 words. Do not put JSON, markdown, numbered lists, or multi-paragraph explanations inside body.",
    "Step 1 kind phrase: introduce one new complete Spanish phrase tied to the scenario and the current grammar section; include spanish, english, and acceptedSpanish with the original phrase.",
    "Step 2 kind breakdown: put each meaningful part of the phrase in parts as Spanish/English pairs; include the same spanish, english, and acceptedSpanish with the original phrase.",
    "Step 3 kind swap: choose one word or short phrase from the original phrase as targetSpanish, give 3-5 new replacement words in words, and include acceptedSpanish as complete full phrases with that target replaced by each option.",
    "Step 4 kind swap: choose a different targetSpanish from the original phrase, give 3-5 new replacement words in words, and include acceptedSpanish as complete full phrases with that different target replaced by each option.",
    "Step 5 kind review: listen-only recall of the original phrase; include the original spanish for audio, english, acceptedSpanish with the original phrase, and listenOnly true.",
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

  const response = await fetchOllamaGenerate(
    baseUrl,
    {
      model,
      prompt,
      stream: false,
      format: "json",
      options: getGenerateOptionsPayload(options, 1200),
    },
    lessonGenerationTimeoutMs,
  );

  if (!response.ok) {
    throw await createOllamaError(response);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  const generated = parseJsonObject(data.response ?? "");
  const fallbackLesson = createFallbackLesson(input);
  const vocabulary = parseVocabularyArray(generated.vocabulary);
  const title = stringOrDefault(generated.title, fallbackLesson.title);
  const touristFocus = stringOrDefault(
    generated.touristFocus,
    fallbackLesson.touristFocus,
  );
  const generatedSpanishPrompt = stringOrDefault(
    generated.spanishPrompt,
    fallbackLesson.spanishPrompt,
  );
  const spanishPrompt = isLikelyMalformedSpanishPhrase(generatedSpanishPrompt)
    ? fallbackLesson.spanishPrompt
    : generatedSpanishPrompt;
  const englishTranslation = stringOrDefault(
    generated.englishTranslation,
    fallbackLesson.englishTranslation,
  );
  const practiceQuestions = asStringArray(generated.practiceQuestions);

  const generatedSteps = parseLessonStepsRaw(generated.steps);

  let mergedVocabulary = vocabulary;
  if (mergedVocabulary.length === 0) {
    const fromStep = generatedSteps.find(
      (s) =>
        (s.kind === "phrases" ||
          s.kind === "swap" ||
          s.kind === "vocabulary") &&
        s.words &&
        s.words.length > 0,
    )?.words;
    if (fromStep?.length) {
      mergedVocabulary = fromStep;
    }
  }
  if (mergedVocabulary.length === 0) {
    mergedVocabulary = fallbackLesson.vocabulary;
  }
  const generatedStepVocabulary = generatedSteps.flatMap((step) => [
    ...(step.parts ?? []),
    ...(step.words ?? []),
  ]);
  const canonicalPracticeQuestions = practiceQuestions.length
    ? practiceQuestions
    : fallbackLesson.practiceQuestions;
  const steps = buildLessonStepsFromCore({
    title,
    touristFocus,
    spanishPrompt,
    englishTranslation,
    vocabulary: [...mergedVocabulary, ...generatedStepVocabulary],
    practiceQuestions: canonicalPracticeQuestions,
    curriculumPartTitle: curriculumSection?.partTitle,
    curriculumSectionTitle: curriculumSection?.title,
    curriculumFocus: curriculumSection?.focus,
  });

  return {
    ...fallbackLesson,
    scenarioPresetId: input.scenarioPresetId,
    curriculumSectionId: curriculumSection?.id,
    curriculumSectionTitle: curriculumSection?.title,
    curriculumPartTitle: curriculumSection?.partTitle,
    title,
    level,
    scenario: stringOrDefault(generated.scenario, scenario),
    touristFocus,
    spanishPrompt,
    englishTranslation,
    vocabulary: mergedVocabulary,
    practiceQuestions: canonicalPracticeQuestions,
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
    `AI response flavor: ${getAiFlavorInstruction(
      options.aiResponseFlavor ?? DEFAULT_AI_RESPONSE_FLAVOR,
    )}`,
    getCustomAiInstructionLine(
      options.customAiInstructions ?? DEFAULT_CUSTOM_AI_INSTRUCTIONS,
    ) ?? "",
    `Student said: ${userText}`,
  ].join("\n");

  const response = await fetchOllamaGenerate(
    baseUrl,
    {
      model,
      prompt,
      stream: false,
      options: getGenerateOptionsPayload(options, 512),
    },
    30000,
  );

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

  const response = await fetchOllamaGenerate(
    baseUrl,
    {
      model,
      prompt,
      stream: false,
      options: getGenerateOptionsPayload(options, 384),
    },
    25000,
  );

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
