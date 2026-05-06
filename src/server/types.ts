export type LessonLevel = "beginner" | "upper-beginner";

export type VocabularyItem = {
  spanish: string;
  english: string;
};

export type Lesson = {
  id: string;
  title: string;
  level: LessonLevel;
  scenario: string;
  touristFocus: string;
  spanishPrompt: string;
  englishTranslation: string;
  vocabulary: VocabularyItem[];
  practiceQuestions: string[];
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

export type ConversationMessage = {
  id: string;
  lessonId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AppDatabase = {
  lessons: Lesson[];
  progress: LessonProgress[];
  conversationMessages: ConversationMessage[];
};

export type LessonGenerationInput = {
  topic?: string;
  scenario?: string;
  level?: LessonLevel;
};

