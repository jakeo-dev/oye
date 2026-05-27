#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultDatabasePath = path.join(repoRoot, "data", "app-db.json");
const databasePath = process.env.APP_DATABASE_PATH || defaultDatabasePath;

function readDatabase() {
  try {
    return JSON.parse(fs.readFileSync(databasePath, "utf8"));
  } catch {
    return {};
  }
}

function pickReminder(database) {
  const mistakes = Array.isArray(database.practiceMistakes)
    ? database.practiceMistakes
    : [];
  const [mistake] = mistakes
    .filter((item) => Number(item.count) >= 2)
    .sort((a, b) => {
      const countDiff = Number(b.count ?? 0) - Number(a.count ?? 0);
      if (countDiff !== 0) return countDiff;
      return String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));
    });

  if (!mistake) {
    return {
      title: "¡Oye! practice reminder",
      body: "Spend a few minutes with Spanish today.",
    };
  }

  if (mistake.kind === "word") {
    return {
      title: "Practice a missed word",
      body: `Use this word today: "${mistake.text}"`,
    };
  }

  return {
    title: "Practice a missed phrase",
    body: `Try again: "${mistake.text}"`,
  };
}

function escapeAppleScript(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const database = readDatabase();
const settings = database.settings ?? {};

if (settings.remindersEnabled !== true) {
  process.exit(0);
}

const reminder = pickReminder(database);
const script = `display notification "${escapeAppleScript(
  reminder.body,
)}" with title "${escapeAppleScript(reminder.title)}"`;

execFile("osascript", ["-e", script], (error) => {
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
});
