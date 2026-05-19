import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AppDatabase,
  AppSettings,
  ConversationMessage,
  CurriculumProgress,
  DailyProgress,
  Lesson,
  LessonProgress,
  PracticeAttempt,
} from "./types";

import {
  CURRICULUM_SECTIONS,
  getCurriculumIndex,
  getFirstCurriculumSection,
  getNextCurriculumSection,
} from "@/lib/curriculum";
import type { CurriculumSection } from "@/lib/curriculum";

const databasePath =
  process.env.APP_DATABASE_PATH ?? path.join("data", "app-db.json");

const emptyDatabase = (): AppDatabase => ({
  lessons: [],
  progress: [],
  conversationMessages: [],
  practiceAttempts: [],
  dailyProgress: [],
  curriculumProgress: [],
  settings: defaultSettings(),
});

function defaultSettings(): AppSettings {
  return {
    soundEnabled: true,
    remindersEnabled: false,
    dailyGoalMinutes: 10,
    reminderTime: "18:00",
    ollamaBaseUrl: null,
    ollamaModel: null,
  };
}

async function readDatabase(): Promise<AppDatabase> {
  try {
    const file = await readFile(databasePath, "utf8");
    const parsed = JSON.parse(file) as Partial<AppDatabase>;
    return {
      ...emptyDatabase(),
      ...parsed,
      settings: { ...defaultSettings(), ...parsed.settings },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyDatabase();
    }

    throw error;
  }
}

async function writeDatabase(database: AppDatabase): Promise<void> {
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

export async function listLessons(): Promise<Lesson[]> {
  const database = await readDatabase();
  return database.lessons.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const database = await readDatabase();
  return database.lessons.find((lesson) => lesson.id === id) ?? null;
}

export async function saveLesson(lesson: Lesson): Promise<Lesson> {
  const database = await readDatabase();
  database.lessons = [
    lesson,
    ...database.lessons.filter((existing) => existing.id !== lesson.id),
  ];
  await writeDatabase(database);
  return lesson;
}

export async function getCurrentCurriculumSection(): Promise<CurriculumSection> {
  const database = await readDatabase();
  const completedIds = new Set(
    database.curriculumProgress
      .filter((item) => item.completed)
      .map((item) => item.sectionId),
  );
  return getNextCurriculumSection(completedIds) ?? getFirstCurriculumSection();
}

export async function upsertProgress(
  lessonId: string,
  changes: Partial<Pick<LessonProgress, "completed" | "lastScore">>,
): Promise<LessonProgress> {
  const database = await readDatabase();
  const existing = database.progress.find((item) => item.lessonId === lessonId);
  const lesson = database.lessons.find((item) => item.id === lessonId) ?? null;
  const completedNow = changes.completed === true && existing?.completed !== true;
  const progress: LessonProgress = {
    lessonId,
    completed: changes.completed ?? existing?.completed ?? false,
    attempts: (existing?.attempts ?? 0) + 1,
    lastScore: changes.lastScore ?? existing?.lastScore ?? null,
    updatedAt: new Date().toISOString(),
  };

  database.progress = [
    progress,
    ...database.progress.filter((item) => item.lessonId !== lessonId),
  ];
  if (completedNow) {
    if (lesson?.curriculumSectionId) {
      upsertCurriculumProgressInDatabase(database, lesson.curriculumSectionId, {
        completed: true,
        lastLessonId: lesson.id,
      });
    }
    incrementDailyProgress(database, {
      minutes: 3,
      lessonCompletions: 1,
    });
  }
  await writeDatabase(database);
  return progress;
}

export async function getProgress(
  lessonId: string,
): Promise<LessonProgress | null> {
  const database = await readDatabase();
  return database.progress.find((item) => item.lessonId === lessonId) ?? null;
}

export async function getProgressSummary(): Promise<{
  completedLessonCount: number;
  lessonTotal: number;
  fraction: number;
  curriculumCompletedCount: number;
  curriculumTotal: number;
  currentCurriculumSection: CurriculumSection;
  today: DailyProgress;
  dailyGoalMinutes: number;
  dailyFraction: number;
  streakDays: number;
}> {
  const database = await readDatabase();
  const lessonTotal = database.lessons.length;
  const completedLessonCount = database.progress.filter(
    (item) => item.completed === true,
  ).length;
  const fraction =
    lessonTotal === 0
      ? 0
      : Math.min(1, completedLessonCount / lessonTotal);
  const today = getDailyProgressForDate(database, todayKey());
  const completedCurriculumIds = new Set(
    database.curriculumProgress
      .filter((item) => item.completed)
      .map((item) => item.sectionId),
  );
  const currentCurriculumSection =
    getNextCurriculumSection(completedCurriculumIds) ?? getFirstCurriculumSection();
  const dailyGoalMinutes = database.settings.dailyGoalMinutes;
  const dailyFraction =
    dailyGoalMinutes <= 0 ? 0 : Math.min(1, today.minutes / dailyGoalMinutes);
  return {
    completedLessonCount,
    lessonTotal,
    fraction,
    curriculumCompletedCount: Math.min(
      completedCurriculumIds.size,
      CURRICULUM_SECTIONS.length,
    ),
    curriculumTotal: CURRICULUM_SECTIONS.length,
    currentCurriculumSection,
    today,
    dailyGoalMinutes,
    dailyFraction,
    streakDays: getStreakDays(database.dailyProgress),
  };
}

export async function getCurriculumProgressSummary(): Promise<{
  sections: Array<CurriculumSection & { completed: boolean; active: boolean }>;
  currentSection: CurriculumSection;
  completedCount: number;
  total: number;
}> {
  const database = await readDatabase();
  const completedIds = new Set(
    database.curriculumProgress
      .filter((item) => item.completed)
      .map((item) => item.sectionId),
  );
  const currentSection =
    getNextCurriculumSection(completedIds) ?? getFirstCurriculumSection();

  return {
    sections: CURRICULUM_SECTIONS.map((sectionItem) => ({
      ...sectionItem,
      completed: completedIds.has(sectionItem.id),
      active: sectionItem.id === currentSection.id,
    })),
    currentSection,
    completedCount: Math.min(completedIds.size, CURRICULUM_SECTIONS.length),
    total: CURRICULUM_SECTIONS.length,
  };
}

export async function saveConversationMessages(
  messages: ConversationMessage[],
): Promise<ConversationMessage[]> {
  const database = await readDatabase();
  database.conversationMessages = [...database.conversationMessages, ...messages];
  await writeDatabase(database);
  return messages;
}

export async function clearConversationMessages(
  lessonId?: string,
): Promise<number> {
  const database = await readDatabase();
  const previousCount = database.conversationMessages.length;
  database.conversationMessages =
    lessonId === undefined
      ? []
      : database.conversationMessages.filter(
          (message) => message.lessonId !== lessonId,
        );
  await writeDatabase(database);
  return previousCount - database.conversationMessages.length;
}

export async function listConversationMessages(
  lessonId?: string,
): Promise<ConversationMessage[]> {
  const database = await readDatabase();
  return database.conversationMessages.filter(
    (message) => lessonId === undefined || message.lessonId === lessonId,
  );
}

export async function getSettings(): Promise<AppSettings> {
  const database = await readDatabase();
  return database.settings;
}

export async function updateSettings(
  changes: Partial<AppSettings>,
): Promise<AppSettings> {
  const database = await readDatabase();
  database.settings = {
    ...database.settings,
    ...normalizeSettings(changes),
  };
  await writeDatabase(database);
  return database.settings;
}

export async function savePracticeAttempt(
  attempt: PracticeAttempt,
): Promise<PracticeAttempt> {
  const database = await readDatabase();
  database.practiceAttempts = [attempt, ...database.practiceAttempts];
  const existing = database.progress.find(
    (item) => item.lessonId === attempt.lessonId,
  );
  database.progress = [
    {
      lessonId: attempt.lessonId,
      completed: existing?.completed ?? false,
      attempts: (existing?.attempts ?? 0) + 1,
      lastScore: attempt.score,
      updatedAt: new Date().toISOString(),
    },
    ...database.progress.filter((item) => item.lessonId !== attempt.lessonId),
  ];
  incrementDailyProgress(database, {
    minutes: 1,
    practiceAttempts: 1,
  });
  await writeDatabase(database);
  return attempt;
}

export async function listPracticeAttempts(
  lessonId?: string,
): Promise<PracticeAttempt[]> {
  const database = await readDatabase();
  return database.practiceAttempts.filter(
    (attempt) => lessonId === undefined || attempt.lessonId === lessonId,
  );
}

export async function recordActivity(
  changes: Partial<Omit<DailyProgress, "date">>,
): Promise<DailyProgress> {
  const database = await readDatabase();
  const today = incrementDailyProgress(database, changes);
  await writeDatabase(database);
  return today;
}

function normalizeSettings(changes: Partial<AppSettings>): Partial<AppSettings> {
  const next: Partial<AppSettings> = {};
  if (typeof changes.soundEnabled === "boolean") {
    next.soundEnabled = changes.soundEnabled;
  }
  if (typeof changes.remindersEnabled === "boolean") {
    next.remindersEnabled = changes.remindersEnabled;
  }
  if (typeof changes.dailyGoalMinutes === "number") {
    next.dailyGoalMinutes = Math.max(1, Math.min(240, changes.dailyGoalMinutes));
  }
  if (
    typeof changes.reminderTime === "string" &&
    /^\d{2}:\d{2}$/.test(changes.reminderTime)
  ) {
    next.reminderTime = changes.reminderTime;
  }
  if (changes.ollamaBaseUrl === null || typeof changes.ollamaBaseUrl === "string") {
    next.ollamaBaseUrl = changes.ollamaBaseUrl?.trim() || null;
  }
  if (changes.ollamaModel === null || typeof changes.ollamaModel === "string") {
    next.ollamaModel = changes.ollamaModel?.trim() || null;
  }
  return next;
}

function upsertCurriculumProgressInDatabase(
  database: AppDatabase,
  sectionId: string,
  changes: Partial<Pick<CurriculumProgress, "completed" | "lastLessonId">>,
): CurriculumProgress {
  const existing = database.curriculumProgress.find(
    (item) => item.sectionId === sectionId,
  );
  const completed = changes.completed ?? existing?.completed ?? false;
  const progress: CurriculumProgress = {
    sectionId,
    completed,
    completedAt:
      completed && !existing?.completed
        ? new Date().toISOString()
        : existing?.completedAt ?? null,
    attempts: (existing?.attempts ?? 0) + 1,
    lastLessonId: changes.lastLessonId ?? existing?.lastLessonId ?? null,
    updatedAt: new Date().toISOString(),
  };

  database.curriculumProgress = [
    progress,
    ...database.curriculumProgress.filter((item) => item.sectionId !== sectionId),
  ].sort((a, b) => getCurriculumIndex(a.sectionId) - getCurriculumIndex(b.sectionId));

  return progress;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyProgressForDate(
  database: AppDatabase,
  date: string,
): DailyProgress {
  return (
    database.dailyProgress.find((item) => item.date === date) ?? {
      date,
      minutes: 0,
      lessonCompletions: 0,
      conversationMessages: 0,
      practiceAttempts: 0,
    }
  );
}

function incrementDailyProgress(
  database: AppDatabase,
  changes: Partial<Omit<DailyProgress, "date">>,
): DailyProgress {
  const date = todayKey();
  const existing = getDailyProgressForDate(database, date);
  const next: DailyProgress = {
    date,
    minutes: Math.max(0, existing.minutes + (changes.minutes ?? 0)),
    lessonCompletions:
      existing.lessonCompletions + (changes.lessonCompletions ?? 0),
    conversationMessages:
      existing.conversationMessages + (changes.conversationMessages ?? 0),
    practiceAttempts: existing.practiceAttempts + (changes.practiceAttempts ?? 0),
  };
  database.dailyProgress = [
    next,
    ...database.dailyProgress.filter((item) => item.date !== date),
  ];
  return next;
}

function getStreakDays(progress: DailyProgress[]): number {
  const activeDates = new Set(
    progress.filter((item) => item.minutes > 0).map((item) => item.date),
  );
  let streak = 0;
  const cursor = new Date(`${todayKey()}T00:00:00.000Z`);
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
