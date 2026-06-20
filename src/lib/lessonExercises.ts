import {
  CURRICULUM_PARTS,
  getCurriculumIndex,
  getCurriculumSection,
} from "@/lib/curriculum";
import type { CurriculumSection } from "@/lib/curriculum";
import { resolveLessonSteps } from "@/lib/lessonSteps";
import type { Lesson, VocabularyItem } from "@/server/types";

export type LessonExerciseMode =
  | "words-visible"
  | "words-audio"
  | "phrase-visible"
  | "phrase-audio";

export type LessonExercise = {
  mode: LessonExerciseMode;
  title: string;
  body: string;
  items: VocabularyItem[];
  phrase: string;
  english: string;
  targetText: string;
  section: CurriculumSection | null;
  sectionIndex: number;
  sectionTotal: number;
  partIndex: number;
  partTotal: number;
};

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function isUsefulSpanish(value: string): boolean {
  const cleaned = cleanText(value);
  return (
    /[a-záéíóúüñ]/i.test(cleaned) &&
    cleaned.replace(/[^a-záéíóúüñ]/gi, "").length > 1
  );
}

function dedupeVocabulary(items: VocabularyItem[]): VocabularyItem[] {
  const seen = new Set<string>();
  const next: VocabularyItem[] = [];

  for (const item of items) {
    const spanish = cleanText(item.spanish);
    const english = cleanText(item.english);
    const key = spanish.toLowerCase();
    if (!isUsefulSpanish(spanish) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push({ spanish, english });
  }

  return next.slice(0, 4);
}

function getLessonItems(lesson: Lesson): VocabularyItem[] {
  const stepItems = resolveLessonSteps(lesson).flatMap(
    (step) => step.words ?? [],
  );
  const items = dedupeVocabulary([...lesson.vocabulary, ...stepItems]);
  if (items.length > 0) {
    return items;
  }

  const phrase = cleanText(lesson.spanishPrompt);
  if (phrase) {
    return [{ spanish: phrase, english: cleanText(lesson.englishTranslation) }];
  }

  return [{ spanish: "Hola", english: "Hello" }];
}

function getLessonPhrase(
  lesson: Lesson,
  items: VocabularyItem[],
): {
  phrase: string;
  english: string;
} {
  const steps = resolveLessonSteps(lesson);
  const stepPhrase = steps.find((step) => cleanText(step.spanish))?.spanish;
  const stepEnglish = steps.find((step) => cleanText(step.spanish))?.english;
  const phrase =
    cleanText(lesson.spanishPrompt) ||
    cleanText(stepPhrase) ||
    items.map((item) => item.spanish).join(", ");
  const english =
    cleanText(lesson.englishTranslation) ||
    cleanText(stepEnglish) ||
    items
      .map((item) => item.english)
      .filter(Boolean)
      .join(", ");
  return {
    phrase: phrase || "Hola",
    english,
  };
}

function grammarBody(
  section: CurriculumSection | null,
  exercise: string,
): string {
  if (!section) {
    return exercise;
  }
  const concept = section.concepts[0]
    ? ` Focus on ${section.concepts[0]}.`
    : "";
  return `${exercise} ${section.focus}${concept}`;
}

export function getLessonCurriculumMeta(lesson: Lesson): {
  section: CurriculumSection | null;
  sectionIndex: number;
  sectionTotal: number;
  partIndex: number;
  partTotal: number;
} {
  const section = getCurriculumSection(lesson.curriculumSectionId);
  const sectionIndex = getCurriculumIndex(section?.id) + 1;
  const partIndex =
    CURRICULUM_PARTS.findIndex((part) => part.id === section?.partId) + 1 || 1;

  return {
    section,
    sectionIndex,
    sectionTotal: 25,
    partIndex,
    partTotal: CURRICULUM_PARTS.length,
  };
}

export function buildLessonExercises(lesson: Lesson): LessonExercise[] {
  const meta = getLessonCurriculumMeta(lesson);
  const items = getLessonItems(lesson);
  const phrase = getLessonPhrase(lesson, items);
  const wordTarget = items.map((item) => item.spanish).join(" ");
  const sectionTitle = meta.section?.title ?? "Spanish practice";

  return [
    {
      mode: "words-visible",
      title: `See it: ${sectionTitle}`,
      body: grammarBody(
        meta.section,
        "Read each word or short phrase, listen to it, then say or type them.",
      ),
      items,
      phrase: "",
      english: "",
      targetText: wordTarget,
      ...meta,
    },
    {
      mode: "words-audio",
      title: `Hear it: ${sectionTitle}`,
      body: grammarBody(
        meta.section,
        "Listen to each item without reading it, then say or type what you heard.",
      ),
      items,
      phrase: "",
      english: "",
      targetText: wordTarget,
      ...meta,
    },
    {
      mode: "phrase-visible",
      title: `Use it: ${sectionTitle}`,
      body: grammarBody(
        meta.section,
        "Read the full phrase, listen to it, then say or type the full phrase.",
      ),
      items: [],
      phrase: phrase.phrase,
      english: phrase.english,
      targetText: phrase.phrase,
      ...meta,
    },
    {
      mode: "phrase-audio",
      title: `Recall it: ${sectionTitle}`,
      body: grammarBody(
        meta.section,
        "Listen to the full phrase without reading it, then say or type what you heard.",
      ),
      items: [],
      phrase: phrase.phrase,
      english: phrase.english,
      targetText: phrase.phrase,
      ...meta,
    },
  ];
}
