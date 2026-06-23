import type { Lesson, LessonStep, VocabularyItem } from "@/server/types";

type LessonCore = {
  title: string;
  touristFocus: string;
  spanishPrompt: string;
  englishTranslation: string;
  vocabulary: VocabularyItem[];
  practiceQuestions: string[];
  curriculumPartTitle?: string;
  curriculumSectionTitle?: string;
  curriculumFocus?: string;
};

type SwapPlan = {
  targetSpanish: string;
  targetEnglish: string;
  words: VocabularyItem[];
};

const FALLBACK_SWAP_WORDS: VocabularyItem[] = [
  { spanish: "agua", english: "water" },
  { spanish: "cafe", english: "coffee" },
  { spanish: "billete", english: "ticket" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFirstPhrase(
  phrase: string,
  target: string,
  replacement: string,
): string {
  const trimmedTarget = target.trim();
  if (!trimmedTarget) {
    return phrase;
  }

  const pattern = new RegExp(`\\b${escapeRegExp(trimmedTarget)}\\b`, "i");
  if (!pattern.test(phrase)) {
    return `${phrase} ${replacement}`.trim();
  }
  return phrase.replace(pattern, replacement);
}

function includesSpanishPhrase(phrase: string, item: VocabularyItem): boolean {
  const spanish = item.spanish.trim();
  if (!spanish) {
    return false;
  }
  return new RegExp(`\\b${escapeRegExp(spanish)}\\b`, "i").test(phrase);
}

function uniqueVocabulary(words: VocabularyItem[]): VocabularyItem[] {
  const seen = new Set<string>();
  return words.filter((word) => {
    const key = word.spanish.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isLikelyBadSpanishPhrase(value: string): boolean {
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
    /\b(step|breakdown|swap|english|spanish|translation|phrase|lesson)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (/\b(the|this|that|with|please|would|could|need|want)\b/i.test(text)) {
    return !/[¿¡áéíóúñü]|\b(el|la|los|las|un|una|quiero|necesito|por|para|con|donde|esta|tengo|voy|me|su|mi)\b/i.test(
      text,
    );
  }
  return false;
}

function cleanVocabularyItem(item: VocabularyItem): VocabularyItem | null {
  const spanish = compactText(item.spanish);
  const english = compactText(item.english);
  if (!spanish || !english || isLikelyBadSpanishPhrase(spanish)) {
    return null;
  }
  return { spanish, english };
}

function cleanVocabulary(words: VocabularyItem[]): VocabularyItem[] {
  return uniqueVocabulary(
    words
      .map(cleanVocabularyItem)
      .filter((item): item is VocabularyItem => item !== null),
  );
}

function getSectionLine(lesson: LessonCore): string {
  const section = lesson.curriculumSectionTitle?.trim();
  const focus = lesson.curriculumFocus?.trim() || lesson.touristFocus.trim();
  if (section && focus) {
    return `${section}: ${focus}`;
  }
  return focus || lesson.title;
}

function buildBreakdownBody(lesson: LessonCore): string {
  const sectionLine = getSectionLine(lesson);
  return `Whole phrase: ${lesson.englishTranslation}\nGrammar thread: ${sectionLine}`;
}

function buildBreakdownParts(lesson: LessonCore): VocabularyItem[] {
  const matchingWords = cleanVocabulary(lesson.vocabulary).filter((item) =>
    includesSpanishPhrase(lesson.spanishPrompt, item),
  );
  if (matchingWords.length > 0) {
    return matchingWords.slice(0, 5);
  }

  return cleanVocabulary([
    {
      spanish: lesson.spanishPrompt,
      english: lesson.englishTranslation,
    },
  ]);
}

function findSwapPlans(lesson: LessonCore): [SwapPlan, SwapPlan] {
  const vocabulary = cleanVocabulary(lesson.vocabulary);
  const phraseWords = vocabulary.filter((item) =>
    includesSpanishPhrase(lesson.spanishPrompt, item),
  );
  const uniqueWords = uniqueVocabulary(
    phraseWords.length >= 2 ? phraseWords : vocabulary,
  );
  const firstTarget = uniqueWords[0] ?? {
    spanish: lesson.spanishPrompt.split(/\s+/)[0] ?? "esto",
    english: "this part",
  };
  const secondTarget = uniqueWords.find(
    (word) => word.spanish.toLowerCase() !== firstTarget.spanish.toLowerCase(),
  ) ?? {
    spanish: lesson.spanishPrompt.split(/\s+/).at(-1) ?? "favor",
    english: "another part",
  };

  const firstAlternatives = uniqueVocabulary(
    vocabulary.filter(
      (word) =>
        word.spanish.toLowerCase() !== firstTarget.spanish.toLowerCase() &&
        word.spanish.toLowerCase() !== secondTarget.spanish.toLowerCase(),
    ),
  ).slice(0, 4);
  const secondAlternatives = uniqueVocabulary(
    vocabulary.filter(
      (word) =>
        word.spanish.toLowerCase() !== secondTarget.spanish.toLowerCase() &&
        word.spanish.toLowerCase() !== firstTarget.spanish.toLowerCase(),
    ),
  )
    .slice()
    .reverse()
    .slice(0, 4);

  return [
    {
      targetSpanish: firstTarget.spanish,
      targetEnglish: firstTarget.english,
      words: firstAlternatives.length ? firstAlternatives : FALLBACK_SWAP_WORDS,
    },
    {
      targetSpanish: secondTarget.spanish,
      targetEnglish: secondTarget.english,
      words: secondAlternatives.length
        ? secondAlternatives
        : FALLBACK_SWAP_WORDS.slice().reverse(),
    },
  ];
}

function acceptedSwapPhrases(
  phrase: string,
  targetSpanish: string,
  words: VocabularyItem[],
): string[] {
  return uniqueVocabulary(words)
    .map((word) => replaceFirstPhrase(phrase, targetSpanish, word.spanish))
    .filter(Boolean);
}

export function buildLessonStepsFromCore(lesson: LessonCore): LessonStep[] {
  const cleanedPrompt = compactText(lesson.spanishPrompt);
  const originalPhrase =
    !isLikelyBadSpanishPhrase(cleanedPrompt) && cleanedPrompt
      ? cleanedPrompt
      : "Hola, quiero ayuda, por favor.";
  const englishTranslation =
    compactText(lesson.englishTranslation) || "Hello, I want help, please.";
  const normalizedLesson = {
    ...lesson,
    spanishPrompt: originalPhrase,
    englishTranslation,
    vocabulary: cleanVocabulary(lesson.vocabulary),
  };
  const [firstSwap, secondSwap] = findSwapPlans(normalizedLesson);
  const sectionLine = getSectionLine(normalizedLesson);

  return [
    {
      kind: "phrase",
      title: "Hear the new phrase",
      body: `Use this line for the current section: ${sectionLine}`,
      spanish: originalPhrase,
      english: englishTranslation,
      acceptedSpanish: [originalPhrase],
    },
    {
      kind: "breakdown",
      title: "Break it down",
      body: buildBreakdownBody(normalizedLesson),
      parts: buildBreakdownParts(normalizedLesson),
      spanish: originalPhrase,
      english: englishTranslation,
      acceptedSpanish: [originalPhrase],
    },
    {
      kind: "swap",
      title: `Swap "${firstSwap.targetSpanish}"`,
      body: `Keep the same sentence shape. Replace "${firstSwap.targetSpanish}" with one option below.`,
      spanish: originalPhrase,
      english: englishTranslation,
      targetSpanish: firstSwap.targetSpanish,
      targetEnglish: firstSwap.targetEnglish,
      words: firstSwap.words,
      acceptedSpanish: acceptedSwapPhrases(
        originalPhrase,
        firstSwap.targetSpanish,
        firstSwap.words,
      ),
    },
    {
      kind: "swap",
      title: `Swap "${secondSwap.targetSpanish}"`,
      body: `Now change a different part of the phrase: "${secondSwap.targetSpanish}".`,
      spanish: originalPhrase,
      english: englishTranslation,
      targetSpanish: secondSwap.targetSpanish,
      targetEnglish: secondSwap.targetEnglish,
      words: secondSwap.words,
      acceptedSpanish: acceptedSwapPhrases(
        originalPhrase,
        secondSwap.targetSpanish,
        secondSwap.words,
      ),
    },
    {
      kind: "review",
      title: "Listen and recall",
      body: "Listen first, then type or say the original phrase from memory.",
      spanish: originalPhrase,
      english: englishTranslation,
      acceptedSpanish: [originalPhrase],
      listenOnly: true,
    },
  ];
}

/** Steps for UI: use the five-step lesson flow; rebuild older saved lessons. */
export function resolveLessonSteps(lesson: Lesson): LessonStep[] {
  const stepVocabulary =
    lesson.steps
      ?.flatMap((step) => [...(step.words ?? []), ...(step.parts ?? [])])
      .filter(Boolean) ?? [];
  const originalPhrase =
    compactText(lesson.spanishPrompt) ||
    compactText(
      lesson.steps?.find((step) => step.spanish?.trim())?.spanish ?? "",
    ) ||
    "Hola, quiero ayuda, por favor.";

  return buildLessonStepsFromCore({
    title: lesson.title,
    touristFocus: lesson.touristFocus,
    spanishPrompt: originalPhrase,
    englishTranslation: lesson.englishTranslation,
    vocabulary: [...lesson.vocabulary, ...stepVocabulary],
    practiceQuestions: lesson.practiceQuestions,
    curriculumPartTitle: lesson.curriculumPartTitle,
    curriculumSectionTitle: lesson.curriculumSectionTitle,
    curriculumFocus: lesson.touristFocus,
  });
}

export function practicePromptsForStep(
  step: LessonStep | null | undefined,
  lesson: Lesson,
): string[] {
  if (!step) {
    return [lesson.spanishPrompt].filter(Boolean);
  }

  const accepted = uniqueVocabulary(
    (step.acceptedSpanish ?? []).map((spanish) => ({
      spanish,
      english: "",
    })),
  ).map((item) => item.spanish);
  if (accepted.length > 0) {
    return accepted;
  }

  if (step.spanish?.trim()) {
    return [step.spanish.trim()];
  }

  if (step.words?.length) {
    return step.words.map((word) => word.spanish);
  }

  return [lesson.spanishPrompt].filter(Boolean);
}
