export type OllamaGenerationOptions = {
  temperature: number;
  topP: number;
  topK: number;
  minP: number;
  repeatPenalty: number;
  repeatLastN: number;
  frequencyPenalty: number;
  presencePenalty: number;
  numCtx: number;
  numPredict: number;
  seed: number;
};

export type OllamaGenerationOptionId = keyof OllamaGenerationOptions;

type OllamaGenerationOptionField = {
  id: OllamaGenerationOptionId;
  apiKey: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  valueType: "float" | "int";
  control: "slider" | "input";
  supportedByGenerateApi?: boolean;
};

export const DEFAULT_OLLAMA_GENERATION_OPTIONS: OllamaGenerationOptions = {
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  minP: 0,
  repeatPenalty: 1.1,
  repeatLastN: 64,
  frequencyPenalty: 0,
  presencePenalty: 0,
  numCtx: 2048,
  numPredict: -1,
  seed: 0,
};

export const OLLAMA_GENERATION_OPTION_FIELDS: OllamaGenerationOptionField[] = [
  {
    id: "temperature",
    apiKey: "temperature",
    label: "Temperature",
    description:
      "Controls randomness. Lower values are steadier and more predictable; higher values make answers more varied and creative.",
    min: 0,
    max: 2,
    step: 0.05,
    valueType: "float",
    control: "slider",
  },
  {
    id: "topP",
    apiKey: "top_p",
    label: "Nucleus sampling (top-p)",
    description:
      "Limits each next word to the smallest high-probability pool. Lower values are focused; higher values allow more variety.",
    min: 0,
    max: 1,
    step: 0.01,
    valueType: "float",
    control: "slider",
  },
  {
    id: "topK",
    apiKey: "top_k",
    label: "Top-k",
    description:
      "Caps how many candidate words the model can consider. Smaller values are conservative; larger values are more exploratory.",
    min: 0,
    max: 200,
    step: 1,
    valueType: "int",
    control: "slider",
  },
  {
    id: "minP",
    apiKey: "min_p",
    label: "Minimum probability (min-p)",
    description:
      "Filters out words that are too unlikely compared with the best candidate. It can balance quality and variety alongside top-p.",
    min: 0,
    max: 1,
    step: 0.01,
    valueType: "float",
    control: "slider",
  },
  {
    id: "repeatPenalty",
    apiKey: "repeat_penalty",
    label: "Repeat penalty",
    description:
      "Discourages repeated wording. Higher values push harder against repetition; values near 1 are more permissive.",
    min: 0.5,
    max: 2,
    step: 0.05,
    valueType: "float",
    control: "slider",
  },
  {
    id: "repeatLastN",
    apiKey: "repeat_last_n",
    label: "Repeat lookback",
    description:
      "Sets how far back the model looks when applying repeat penalties. Use 0 to disable or -1 to use the full context.",
    min: -1,
    max: 4096,
    step: 1,
    valueType: "int",
    control: "input",
  },
  {
    id: "frequencyPenalty",
    apiKey: "frequency_penalty",
    label: "Frequency penalty",
    description:
      "Penalizes words more as they appear repeatedly. Useful for reducing loops when supported by the active Ollama API path.",
    min: -2,
    max: 2,
    step: 0.05,
    valueType: "float",
    control: "slider",
    supportedByGenerateApi: false,
  },
  {
    id: "presencePenalty",
    apiKey: "presence_penalty",
    label: "Presence penalty",
    description:
      "Penalizes words once they have appeared at all. Positive values encourage new topics or phrasing when supported.",
    min: -2,
    max: 2,
    step: 0.05,
    valueType: "float",
    control: "slider",
    supportedByGenerateApi: false,
  },
  {
    id: "numCtx",
    apiKey: "num_ctx",
    label: "Context window",
    description:
      "Controls how many tokens the model can use as context. Larger windows remember more but can be slower and heavier.",
    min: 512,
    max: 32768,
    step: 512,
    valueType: "int",
    control: "input",
  },
  {
    id: "numPredict",
    apiKey: "num_predict",
    label: "Max output tokens",
    description:
      "Caps how much the model can write. Use -1 for Ollama's default unlimited generation behavior.",
    min: -1,
    max: 4096,
    step: 1,
    valueType: "int",
    control: "input",
  },
  {
    id: "seed",
    apiKey: "seed",
    label: "Seed",
    description:
      "Sets the random seed. Use 0 for normal randomness, or a specific number to make similar prompts more reproducible.",
    min: 0,
    max: 2147483647,
    step: 1,
    valueType: "int",
    control: "input",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeOptionValue(
  value: unknown,
  field: OllamaGenerationOptionField,
): number {
  const fallback = DEFAULT_OLLAMA_GENERATION_OPTIONS[field.id];
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : fallback;
  const safeValue = Number.isFinite(numeric) ? numeric : fallback;
  const stepped =
    field.valueType === "int" ? Math.round(safeValue) : Number(safeValue);
  return clamp(stepped, field.min, field.max);
}

export function normalizeOllamaGenerationOptions(
  value: unknown,
  base: OllamaGenerationOptions = DEFAULT_OLLAMA_GENERATION_OPTIONS,
): OllamaGenerationOptions {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next = { ...base };

  for (const field of OLLAMA_GENERATION_OPTION_FIELDS) {
    if (field.id in source) {
      next[field.id] = normalizeOptionValue(source[field.id], field);
    }
  }

  return next;
}

export function toOllamaApiOptions(
  options: OllamaGenerationOptions,
): Record<string, number> {
  return OLLAMA_GENERATION_OPTION_FIELDS.reduce<Record<string, number>>(
    (payload, field) => {
      if (field.supportedByGenerateApi === false) {
        return payload;
      }
      payload[field.apiKey] = options[field.id];
      return payload;
    },
    {},
  );
}
