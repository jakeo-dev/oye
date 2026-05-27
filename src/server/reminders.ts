import { getFrequentPracticeMistakes } from "@/server/database";
import { execFile } from "node:child_process";

export type ReminderPrompt = {
  title: string;
  body: string;
  source: "mistake" | "default";
};

export async function getReminderPrompt(): Promise<ReminderPrompt> {
  const [mistake] = await getFrequentPracticeMistakes(undefined, 1);

  if (!mistake) {
    return {
      title: "¡Oye! practice reminder",
      body: "Spend a few minutes with Spanish today.",
      source: "default",
    };
  }

  if (mistake.kind === "word") {
    return {
      title: "Practice a missed word",
      body: `Use this word today: "${mistake.text}"`,
      source: "mistake",
    };
  }

  return {
    title: "Practice a missed phrase",
    body: `Try again: "${mistake.text}"`,
    source: "mistake",
  };
}

function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function sendMacReminderNow(): Promise<ReminderPrompt> {
  const reminder = await getReminderPrompt();
  const script = `display notification "${escapeAppleScript(
    reminder.body,
  )}" with title "${escapeAppleScript(reminder.title)}"`;

  await new Promise<void>((resolve, reject) => {
    execFile("osascript", ["-e", script], (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  return reminder;
}
