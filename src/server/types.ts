export type LessonLevel = "beginner" | "upper-beginner";

export type VocabularyItem = {
  spanish: string;
  english: string;
};

/** One screen in the in-app lesson flow (vocabulary → grammar → phrase, etc.). */
export type LessonStepKind =
  | "overview"
  | "vocabulary"
  | "grammar"
  | "phrase"
  | "practice";

export type LessonStep = {
  kind: LessonStepKind;
  title: string;
  body: string;
  /** Vocabulary step: word list (may also mirror top-level lesson.vocabulary). */
  words?: VocabularyItem[];
  /** Grammar / phrase / practice: optional example line. */
  spanish?: string;
  english?: string;
};

export type Lesson = {
  id: string;
  curriculumSectionId?: string;
  curriculumSectionTitle?: string;
  curriculumPartTitle?: string;
  title: string;
  level: LessonLevel;
  scenario: string;
  touristFocus: string;
  spanishPrompt: string;
  englishTranslation: string;
  vocabulary: VocabularyItem[];
  practiceQuestions: string[];
  /** AI-generated multi-step path; absent on older saved lessons. */
  steps?: LessonStep[];
  createdAt: string;
  source: "ollama" | "fallback";
};

export type LessonProgress = {
  lessonId: string;
  completed: boolean;
  attempts: number;
  lastScore: number | null;
  updatedAt: string;
};

export type PracticeAttempt = {
  id: string;
  lessonId: string;
  stepIndex: number;
  prompt: string;
  transcript: string;
  score: number;
  feedback: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  lessonId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type DailyProgress = {
  date: string;
  minutes: number;
  lessonCompletions: number;
  conversationMessages: number;
  practiceAttempts: number;
};

export type CurriculumProgress = {
  sectionId: string;
  completed: boolean;
  completedAt: string | null;
  attempts: number;
  lastLessonId: string | null;
  updatedAt: string;
};

export type AppSettings = {
  soundEnabled: boolean;
  remindersEnabled: boolean;
  dailyGoalMinutes: number;
  reminderTime: string;
  ollamaBaseUrl: string | null;
  ollamaModel: string | null;
};

export type AppDatabase = {
  lessons: Lesson[];
  progress: LessonProgress[];
  conversationMessages: ConversationMessage[];
  practiceAttempts: PracticeAttempt[];
  dailyProgress: DailyProgress[];
  curriculumProgress: CurriculumProgress[];
  settings: AppSettings;
};

export type LessonGenerationInput = {
  topic?: string;
  scenario?: string;
  level?: LessonLevel;
  curriculumSectionId?: string;
};
