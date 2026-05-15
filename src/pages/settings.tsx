import { useCallback, useEffect, useId, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faTrashCan,
  faVolumeHigh,
  faBell,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import { Host_Grotesk } from "next/font/google";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const LS = {
  sound: "oye:soundEnabled",
  reminders: "oye:remindersEnabled",
  dailyGoal: "oye:dailyGoalMinutes",
} as const;

type OllamaSettings = {
  ollama: {
    baseUrl: string;
    model: string;
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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/ollama")
      .then((response) => response.json())
      .then((data: OllamaSettings) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    setMounted(true);
    setSoundEnabled(localStorage.getItem(LS.sound) !== "0");
    setRemindersEnabled(localStorage.getItem(LS.reminders) === "1");
    const goal = localStorage.getItem(LS.dailyGoal);
    if (goal === "5" || goal === "10" || goal === "15" || goal === "20") {
      setDailyGoalMinutes(goal);
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const persistSound = useCallback(
    (next: boolean) => {
      setSoundEnabled(next);
      localStorage.setItem(LS.sound, next ? "1" : "0");
      showToast(next ? "Sound effects on." : "Sound effects off.");
    },
    [showToast],
  );

  const persistReminders = useCallback(
    (next: boolean) => {
      setRemindersEnabled(next);
      localStorage.setItem(LS.reminders, next ? "1" : "0");
      showToast(
        next ? "Reminder preference saved (browser only)." : "Reminders off.",
      );
    },
    [showToast],
  );

  const persistDailyGoal = useCallback(
    (value: string) => {
      setDailyGoalMinutes(value);
      localStorage.setItem(LS.dailyGoal, value);
      showToast(`Daily goal set to ${value} minutes.`);
    },
    [showToast],
  );

  function clearSavedPreferences() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Clear saved preferences on this device? This resets toggles and your daily goal.",
      )
    ) {
      return;
    }
    Object.values(LS).forEach((key) => localStorage.removeItem(key));
    setSoundEnabled(true);
    setRemindersEnabled(false);
    setDailyGoalMinutes("10");
    showToast("Preferences cleared.");
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
                Tune study habits and audio. These choices stay on this browser
                unless you clear them.
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
                description="Reserved for future playback cues and success sounds in the app."
                icon={faVolumeHigh}
              />
              <SettingSwitch
                checked={remindersEnabled}
                onChange={persistReminders}
                label="Practice reminders"
                description="Remember to study (stored locally; connect a calendar later for real alerts)."
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
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-white">
              Data on this device
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Remove locally stored preference keys. Your lessons on the server
              are not deleted.
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
              Read-only view of how this dev server is configured. Set{" "}
              <code className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-orange-200/90">
                OLLAMA_BASE_URL
              </code>
              ,{" "}
              <code className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-orange-200/90">
                OLLAMA_MODEL
              </code>
              , or{" "}
              <code className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-orange-200/90">
                APP_DATABASE_PATH
              </code>{" "}
              before starting Next.js to change targets.
            </p>
            <dl className="mt-4 space-y-3 rounded-xl border border-stone-700/60 bg-stone-950/50 p-4 text-sm">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-stone-300">Base URL</dt>
                <dd className="font-mono text-xs break-all text-stone-400 sm:text-right sm:text-sm">
                  {settings?.ollama.baseUrl ?? "Loading…"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-stone-300">Model</dt>
                <dd className="font-mono text-xs break-all text-stone-400 sm:text-right sm:text-sm">
                  {settings?.ollama.model ?? "Loading…"}
                </dd>
              </div>
            </dl>
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
