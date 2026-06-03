import type {
  Lesson,
  LessonStep,
  VocabularyItem,
} from "@/server/types";

export function buildLessonStepsFromCore(lesson: {
  title: string;
  touristFocus: string;
  spanishPrompt: string;
  englishTranslation: string;
  vocabulary: VocabularyItem[];
  practiceQuestions: string[];
}): LessonStep[] {
  const vocabWords =
    lesson.vocabulary.length > 0
      ? lesson.vocabulary
      : [
          { spanish: lesson.spanishPrompt, english: lesson.englishTranslation },
        ];

  const practiceBody =
    lesson.practiceQuestions.length > 0
      ? lesson.practiceQuestions.map((q) => `• ${q}`).join("\n")
      : "Review the phrase aloud and try swapping one word (e.g. a drink or dish).";

  return [
    {
      kind: "goal",
      title: "Goal",
      body:
        lesson.touristFocus.trim() ||
        `Use short, polite tourist Spanish for: ${lesson.title}.`,
    },
    {
      kind: "phrases",
      title: "Useful phrases",
      body: "Start with language you can use immediately in this situation.",
      words: vocabWords,
      spanish: lesson.spanishPrompt || undefined,
      english: lesson.englishTranslation || undefined,
    },
    {
      kind: "breakdown",
      title: "Break it down",
      body: "Notice the building blocks: the request word, the thing you need, and the polite ending.",
      spanish: lesson.spanishPrompt || undefined,
      english: lesson.englishTranslation || undefined,
    },
    {
      kind: "swap",
      title: "Swap words",
      body: "Keep the same sentence shape and swap in different useful words from the list.",
      spanish: lesson.spanishPrompt,
      english: lesson.englishTranslation,
      words: vocabWords,
    },
    {
      kind: "grammar",
      title: "Grammar note",
      body: 'Many tourist requests use "quiero..." (I want) or "me gustaria..." (I would like). Keep the next verb in the infinitive when you name what you want to do.',
      spanish: lesson.spanishPrompt || undefined,
      english: lesson.englishTranslation || undefined,
    },
    {
      kind: "scenario",
      title: "Mini scenario",
      body: "Imagine the other person asks a simple follow-up. Answer with the phrase, then add one detail if you can.",
      spanish: lesson.spanishPrompt,
      english: lesson.englishTranslation,
    },
    {
      kind: "practice",
      title: "Try it",
      body: practiceBody,
    },
    {
      kind: "review",
      title: "Review",
      body: "Remember the useful phrase, one word you can swap, and the polite ending. Use the phrase once more before finishing.",
      spanish: lesson.spanishPrompt || undefined,
      english: lesson.englishTranslation || undefined,
    },
  ];
}

/** Steps for UI: use persisted AI steps when present, else derive from legacy fields. */
export function resolveLessonSteps(lesson: Lesson): LessonStep[] {
  if (lesson.steps && lesson.steps.length > 0) {
    return lesson.steps;
  }
  return buildLessonStepsFromCore({
    title: lesson.title,
    touristFocus: lesson.touristFocus,
    spanishPrompt: lesson.spanishPrompt,
    englishTranslation: lesson.englishTranslation,
    vocabulary: lesson.vocabulary,
    practiceQuestions: lesson.practiceQuestions,
  });
}
