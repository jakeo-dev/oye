import { useEffect } from "react";

type SettingsResponse = {
  settings?: {
    remindersEnabled?: boolean;
    reminderTime?: string;
  };
};

type ReminderResponse = {
  reminder?: {
    title?: string;
    body?: string;
  };
};

function msUntilReminder(time: string): number {
  const [hours = "18", minutes = "00"] = time.split(":");
  const target = new Date();
  target.setHours(Number(hours), Number(minutes), 0, 0);
  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - Date.now();
}

export default function ReminderManager() {
  useEffect(() => {
    let timeoutId: number | null = null;
    let cancelled = false;

    async function scheduleReminder() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      try {
        const response = await fetch("/api/settings");
        const data = (await response.json()) as SettingsResponse;
        const settings = data.settings;
        if (!settings?.remindersEnabled || cancelled) {
          return;
        }

        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }

        timeoutId = window.setTimeout(() => {
          if ("Notification" in window && Notification.permission === "granted") {
            void fetch("/api/reminder")
              .then((response) => response.json())
              .then((data: ReminderResponse) => {
                new Notification(
                  data.reminder?.title ?? "¡Oye! practice reminder",
                  {
                    body:
                      data.reminder?.body ??
                      "Spend a few minutes with Spanish today.",
                  },
                );
              })
              .catch(() => {
                new Notification("¡Oye! practice reminder", {
                  body: "Spend a few minutes with Spanish today.",
                });
              });
          }
          void scheduleReminder();
        }, msUntilReminder(settings.reminderTime ?? "18:00"));
      } catch {
        /* reminders are best-effort while the app is open */
      }
    }

    void scheduleReminder();
    window.addEventListener("oye:settings-updated", scheduleReminder);
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("oye:settings-updated", scheduleReminder);
    };
  }, []);

  return null;
}
