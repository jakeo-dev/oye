import { useCallback, useEffect, useId, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faFloppyDisk,
  faTrashCan,
  faVolumeHigh,
  faBell,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import { Host_Grotesk } from "next/font/google";

import Image from "next/image";

import { useSoundEffect } from "@/hooks/useSoundEffect";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

type OllamaSettings = {
  ollama: {
    baseUrl: string;
    model: string;
  };
  settings: {
    soundEnabled: boolean;
    remindersEnabled: boolean;
    dailyGoalMinutes: number;
    reminderTime: string;
    ollamaBaseUrl: string | null;
    ollamaModel: string | null;
  };
  env: Record<string, string>;
};

function SettingSwitch({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  icon: typeof faVolumeHigh;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
          aria-hidden
        >
          <FontAwesomeIcon icon={icon} className="text-lg" />
        </span>
        <div className="min-w-0 text-left">
          <p className="font-semibold text-stone-100" id={`${id}-label`}>
            {label}
          </p>
          <p
            className="mt-0.5 text-sm leading-relaxed text-stone-400"
            id={`${id}-desc`}
          >
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
          checked
            ? "border-orange-400/50 bg-orange-400"
            : "border-stone-600 bg-stone-800"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
          aria-hidden
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<OllamaSettings | null>(null);
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState("10");
  const [reminderTime, setReminderTime] = useState("18:00");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("");
  const [ollamaModel, setOllamaModel] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const playSound = useSoundEffect();

  const applySettings = useCallback((data: OllamaSettings) => {
    setSettings(data);
    setSoundEnabled(data.settings.soundEnabled);
    setRemindersEnabled(data.settings.remindersEnabled);
    setDailyGoalMinutes(String(data.settings.dailyGoalMinutes));
    setReminderTime(data.settings.reminderTime);
    setOllamaBaseUrl(data.settings.ollamaBaseUrl ?? data.ollama.baseUrl);
    setOllamaModel(data.settings.ollamaModel ?? data.ollama.model);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/ollama");
      const data = (await response.json()) as OllamaSettings;
      applySettings(data);
      setMounted(true);
    } catch {
      setSettings(null);
      setMounted(true);
    }
  }, [applySettings]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSettings]);

  const patchSettings = useCallback(
    async (changes: Record<string, unknown>) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = (await response.json()) as OllamaSettings;
      if (!response.ok) {
        throw new Error("Could not save settings.");
      }
      applySettings(data);
      window.dispatchEvent(new Event("oye:settings-updated"));
      window.dispatchEvent(new Event("oye:progress-updated"));
      return data;
    },
    [applySettings],
  );

  async function saveOllamaSettings() {
    try {
      const response = await fetch("/api/settings/ollama", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: ollamaBaseUrl,
          model: ollamaModel,
        }),
      });
      const data = (await response.json()) as OllamaSettings;
      if (!response.ok) {
        throw new Error("Could not save Ollama settings.");
      }
      applySettings(data);
      window.dispatchEvent(new Event("oye:settings-updated"));
      showToast("Ollama settings saved.");
      playSound("success");
    } catch {
      showToast("Could not save Ollama settings.");
    }
  }

  async function testOllamaSettings() {
    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "Testing the configured Ollama connection.",
          level: "beginner",
          ollamaBaseUrl,
          ollamaModel,
        }),
      });
      if (!response.ok) {
        throw new Error("Could not generate test lesson.");
      }
      showToast("Ollama generated a test lesson.");
      playSound("success");
    } catch {
      showToast("Ollama test failed.");
    }
  }

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const persistSound = useCallback(
    async (next: boolean) => {
      setSoundEnabled(next);
      try {
        await patchSettings({ soundEnabled: next });
        showToast(next ? "Sound effects on." : "Sound effects off.");
        if (next) {
          playSound("tap");
        }
      } catch {
        setSoundEnabled(!next);
        showToast("Could not save sound setting.");
      }
    },
    [patchSettings, playSound, showToast],
  );

  const persistReminders = useCallback(
    async (next: boolean) => {
      setRemindersEnabled(next);
      try {
        await patchSettings({ remindersEnabled: next });
        showToast(next ? "Practice reminders on." : "Reminders off.");
        playSound("tap");
      } catch {
        setRemindersEnabled(!next);
        showToast("Could not save reminder setting.");
      }
    },
    [patchSettings, playSound, showToast],
  );

  const persistDailyGoal = useCallback(
    async (value: string) => {
      setDailyGoalMinutes(value);
      try {
        await patchSettings({ dailyGoalMinutes: Number(value) });
        showToast(`Daily goal set to ${value} minutes.`);
        playSound("tap");
      } catch {
        showToast("Could not save daily goal.");
      }
    },
    [patchSettings, playSound, showToast],
  );

  async function persistReminderTime(value: string) {
    setReminderTime(value);
    try {
      await patchSettings({ reminderTime: value });
      showToast(`Reminder time set to ${value}.`);
    } catch {
      showToast("Could not save reminder time.");
    }
  }

  async function testMacReminder() {
    try {
      const response = await fetch("/api/reminder", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not send test notification.");
      }
      showToast("Test Mac notification sent.");
      playSound("success");
    } catch {
      showToast("Could not send test Mac notification.");
    }
  }

  async function clearSavedPreferences() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Clear saved preferences? This resets toggles, your daily goal, and Ollama overrides.",
      )
    ) {
      return;
    }
    try {
      await patchSettings({
        soundEnabled: true,
        remindersEnabled: false,
        dailyGoalMinutes: 10,
        reminderTime: "18:00",
        ollamaBaseUrl: null,
        ollamaModel: null,
      });
      showToast("Preferences cleared.");
    } catch {
      showToast("Could not clear preferences.");
    }
  }

  return (
    <div
      className={`${hostGrotesk.className} relative isolate min-h-[calc(100dvh-5.5rem)] overflow-hidden bg-stone-950 text-stone-100`}
    >
      <div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-16 h-56 w-56 rounded-full bg-amber-500/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-220 px-8 py-12">
        <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/50 p-5 shadow-lg ring-1 shadow-black/25 ring-white/5 backdrop-blur-sm sm:p-7">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent"
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
                Preferences
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Settings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-stone-400 sm:text-base">
                Tune study habits, reminders, audio, and model settings. These
                choices are saved by the app backend.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-6">
          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-white">
              Study &amp; audio
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              {mounted
                ? "Changes save automatically on this device."
                : "Loading your saved preferences…"}
            </p>
            <div className="mt-2 divide-y divide-stone-700/80">
              <SettingSwitch
                checked={soundEnabled}
                onChange={persistSound}
                label="Sound effects"
                description="Play short cues when practice, messages, and settings save successfully."
                icon={faVolumeHigh}
              />
              <SettingSwitch
                checked={remindersEnabled}
                onChange={persistReminders}
                label="Practice reminders"
                description="Show a browser notification at your saved reminder time while the app is open."
                icon={faBell}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-stone-700/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-left">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
                  aria-hidden
                >
                  <FontAwesomeIcon icon={faBullseye} className="text-lg" />
                </span>
                <div>
                  <p className="font-semibold text-stone-100">Daily goal</p>
                  <p className="mt-0.5 text-sm text-stone-400">
                    Target practice length to aim for each day.
                  </p>
                </div>
              </div>
              <label className="sr-only" htmlFor="daily-goal">
                Daily goal in minutes
              </label>
              <select
                id="daily-goal"
                value={dailyGoalMinutes}
                onChange={(e) => persistDailyGoal(e.target.value)}
                disabled={!mounted}
                className="mt-3 h-11 w-full rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 text-stone-100 transition outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:opacity-50 sm:mt-0 sm:w-44"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
              </select>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-stone-700/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <p className="font-semibold text-stone-100">Reminder time</p>
                <p className="mt-0.5 text-sm text-stone-400">
                  Browser notification time for daily practice.
                </p>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => void persistReminderTime(e.target.value)}
                disabled={!mounted || !remindersEnabled}
                className="mt-3 h-11 w-full rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 text-stone-100 transition outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:opacity-50 sm:mt-0 sm:w-44"
                aria-label="Practice reminder time"
              />
            </div>
            <div className="mt-4 border-t border-stone-700/80 pt-4 text-left">
              <p className="font-semibold text-stone-100">
                Local Mac reminders
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-stone-400">
                For reminders after closing the app, install the local macOS
                reminder agent from this repo. It reads your local practice
                mistakes and sends a Mac notification at the saved time.
              </p>
              <div className="mt-3 space-y-2 rounded-xl border border-stone-700/60 bg-stone-950/50 p-3 font-mono text-xs text-stone-300">
                <p>./scripts/install-mac-reminders.sh</p>
                <p>./scripts/uninstall-mac-reminders.sh</p>
              </div>
              <button
                type="button"
                onClick={() => void testMacReminder()}
                className="mt-3 inline-flex items-center justify-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800"
              >
                Test Mac notification
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-white">
              Data on this device
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Reset saved preferences. Your lessons and conversation history are
              not deleted.
            </p>
            <button
              type="button"
              onClick={clearSavedPreferences}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200 transition outline-none hover:bg-red-950/50 focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              <FontAwesomeIcon icon={faTrashCan} className="text-base" />
              Clear saved preferences
            </button>
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
                    aria-hidden
                  >
                    <FontAwesomeIcon icon={faDatabase} className="text-lg" />
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Ollama backend
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-400">
                  Save model settings without restarting Next.js. Environment
                  variables remain the fallback when these fields are blank.
                </p>
                <div className="mt-4 space-y-4 rounded-xl border border-stone-700/60 bg-stone-950/50 p-4 text-sm">
                  <div>
                    <label
                      className="text-xs font-semibold tracking-wide text-stone-400 uppercase"
                      htmlFor="ollama-base-url"
                    >
                      Base URL
                    </label>
                    <input
                      id="ollama-base-url"
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 font-mono text-sm text-stone-100 outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                      placeholder={
                        settings?.env.OLLAMA_BASE_URL ??
                        "http://127.0.0.1:11434"
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-semibold tracking-wide text-stone-400 uppercase"
                      htmlFor="ollama-model"
                    >
                      Model
                    </label>
                    <input
                      id="ollama-model"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 font-mono text-sm text-stone-100 outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                      placeholder={settings?.env.OLLAMA_MODEL ?? "llama3.2"}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => void saveOllamaSettings()}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-orange-300"
                    >
                      <FontAwesomeIcon
                        icon={faFloppyDisk}
                        className="text-sm"
                      />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => void testOllamaSettings()}
                      className="inline-flex items-center justify-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>
              <div className="animate-wiggle-less relative h-min">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px" />
                <Image
                  src="/oye-tura-the-criatura-hat3.png"
                  width={400}
                  height={500}
                  alt="Tura the Criatura"
                  className="mx-auto w-full max-w-xs object-contain drop-shadow-2xl drop-shadow-orange-300/30 sm:min-w-2xs"
                  priority
                />
              </div>
            </div>
          </section>
        </div>

        {toast ? (
          <div
            className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border border-stone-600/80 bg-stone-900/95 px-5 py-2.5 text-sm font-medium text-stone-100 shadow-xl shadow-black/40 backdrop-blur-md"
            role="status"
          >
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}
