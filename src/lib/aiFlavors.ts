export const AI_RESPONSE_FLAVORS = [
  {
    id: "friendly-coach",
    label: "Friendly coach",
    description: "Warm, encouraging, and still concise.",
    instruction:
      "Use a warm, encouraging tutor voice. Be concise, but include a brief confidence-building note when useful.",
  },
  {
    id: "quick-phrasebook",
    label: "Quick phrasebook",
    description: "Short answers focused on useful travel phrases.",
    instruction:
      "Prefer short, phrasebook-style answers. Put the most useful Spanish phrase first and keep explanations minimal.",
  },
  {
    id: "grammar-helper",
    label: "Grammar helper",
    description: "Adds a little more grammar and structure.",
    instruction:
      "Include a compact grammar note when it helps the learner understand the answer. Keep the note beginner-friendly.",
  },
  {
    id: "local-travel",
    label: "Local travel",
    description: "Practical language for real travel situations.",
    instruction:
      "Prioritize practical, polite language a traveler can use in real situations. Include tone and context notes when helpful.",
  },
  {
    id: "direct-translator",
    label: "Direct translator",
    description: "Direct translations with minimal extra commentary.",
    instruction:
      "Act like a direct translator. Give the translation or meaning first and avoid extra commentary unless the user asks for it.",
  },
] as const;

export type AiResponseFlavor = (typeof AI_RESPONSE_FLAVORS)[number]["id"];

export const DEFAULT_AI_RESPONSE_FLAVOR: AiResponseFlavor = "friendly-coach";

export function normalizeAiResponseFlavor(value: unknown): AiResponseFlavor {
  return AI_RESPONSE_FLAVORS.some((flavor) => flavor.id === value)
    ? (value as AiResponseFlavor)
    : DEFAULT_AI_RESPONSE_FLAVOR;
}

export function getAiFlavorInstruction(flavor: unknown): string {
  const normalized = normalizeAiResponseFlavor(flavor);
  return (
    AI_RESPONSE_FLAVORS.find((item) => item.id === normalized)?.instruction ??
    AI_RESPONSE_FLAVORS[0].instruction
  );
}
