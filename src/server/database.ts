import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AppDatabase,
  ConversationMessage,
  Lesson,
  LessonProgress,
} from "./types";

const databasePath =
  process.env.APP_DATABASE_PATH ?? path.join("data", "app-db.json");

const emptyDatabase = (): AppDatabase => ({
  lessons: [],
  progress: [],
  conversationMessages: [],
});

async function readDatabase(): Promise<AppDatabase> {
  try {
    const file = await readFile(databasePath, "utf8");
    return { ...emptyDatabase(), ...JSON.parse(file) };
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

export async function upsertProgress(
  lessonId: string,
  changes: Partial<Pick<LessonProgress, "completed" | "lastScore">>,
): Promise<LessonProgress> {
  const database = await readDatabase();
  const existing = database.progress.find((item) => item.lessonId === lessonId);
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
  await writeDatabase(database);
  return progress;
}

export async function getProgress(
  lessonId: string,
): Promise<LessonProgress | null> {
  const database = await readDatabase();
  return database.progress.find((item) => item.lessonId === lessonId) ?? null;
}

export async function saveConversationMessages(
  messages: ConversationMessage[],
): Promise<ConversationMessage[]> {
  const database = await readDatabase();
  database.conversationMessages = [...database.conversationMessages, ...messages];
  await writeDatabase(database);
  return messages;
}

export async function listConversationMessages(
  lessonId?: string,
): Promise<ConversationMessage[]> {
  const database = await readDatabase();
  return database.conversationMessages.filter(
    (message) => lessonId === undefined || message.lessonId === lessonId,
  );
}
