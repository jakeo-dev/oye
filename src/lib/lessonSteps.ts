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
      kind: "overview",
      title: "Situation",
      body:
        lesson.touristFocus.trim() ||
        `You're working on: ${lesson.title}. Focus on short, polite tourist Spanish.`,
    },
    {
      kind: "vocabulary",
      title: "Key words",
      body: "Memorize these high-frequency words and short phrases for this scenario.",
      words: vocabWords,
    },
    {
      kind: "grammar",
      title: "Grammar pattern",
      body: 'Many tourist requests use "quiero…" (I want) or "me gustaría…" (I would like). Keep verbs in the infinitive after them when you name what you want.',
      spanish: lesson.spanishPrompt || undefined,
      english: lesson.englishTranslation || undefined,
    },
    {
      kind: "phrase",
      title: "Useful line",
      body: "Practice this line until it feels natural; it will carry you through the situation.",
      spanish: lesson.spanishPrompt,
      english: lesson.englishTranslation,
    },
    {
      kind: "practice",
      title: "Try it",
      body: practiceBody,
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
