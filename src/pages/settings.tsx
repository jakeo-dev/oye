import { useCallback, useEffect, useId, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faDatabase,
  faFloppyDisk,
  faSliders,
  faTrashCan,
  faVolumeHigh,
  faBell,
  faBullseye,
  faPalette,
} from "@fortawesome/free-solid-svg-icons";
import { Host_Grotesk } from "next/font/google";

import Image from "next/image";

import {
  AI_RESPONSE_FLAVORS,
  DEFAULT_CUSTOM_AI_INSTRUCTIONS,
  DEFAULT_AI_RESPONSE_FLAVOR,
} from "@/lib/aiFlavors";
import type { AiResponseFlavor } from "@/lib/aiFlavors";
import {
  DEFAULT_OLLAMA_GENERATION_OPTIONS,
  OLLAMA_GENERATION_OPTION_FIELDS,
  normalizeOllamaGenerationOptions,
} from "@/lib/ollamaGenerationOptions";
import type {
  OllamaGenerationOptionId,
  OllamaGenerationOptions,
} from "@/lib/ollamaGenerationOptions";
import { useSoundEffect } from "@/hooks/useSoundEffect";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

type OllamaSettings = {
  ollama: {
    baseUrl: string;
    model: string;
    ollamaOptions: OllamaGenerationOptions;
  };
  settings: {
    soundEnabled: boolean;
    remindersEnabled: boolean;
    dailyGoalMinutes: number;
    reminderTime: string;
    ollamaBaseUrl: string | null;
    ollamaModel: string | null;
    ollamaOptions: OllamaGenerationOptions;
    aiResponseFlavor: AiResponseFlavor;
    customAiInstructions: string;
  };
  env: Record<string, string>;
};

type OllamaModelOption = {
  name: string;
  model: string;
  family: string | null;
  parameterSize: string | null;
  quantizationLevel: string | null;
};

type OllamaModelsResponse = {
  models?: OllamaModelOption[];
  error?: string;
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
        className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full border transition outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
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

function formatModelLabel(model: OllamaModelOption) {
  const details = [model.parameterSize, model.quantizationLevel, model.family]
    .filter(Boolean)
    .join(" · ");
  return details ? `${model.name} (${details})` : model.name;
}

function formatOptionValue(value: number, valueType: "float" | "int") {
  return valueType === "int" ? String(Math.round(value)) : value.toFixed(2);
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
  const [ollamaOptions, setOllamaOptions] = useState<OllamaGenerationOptions>(
    DEFAULT_OLLAMA_GENERATION_OPTIONS,
  );
  const [ollamaModels, setOllamaModels] = useState<OllamaModelOption[]>([]);
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false);
  const [ollamaModelsError, setOllamaModelsError] = useState("");
  const [aiResponseFlavor, setAiResponseFlavor] = useState<AiResponseFlavor>(
    DEFAULT_AI_RESPONSE_FLAVOR,
  );
  const [customAiInstructions, setCustomAiInstructions] = useState(
    DEFAULT_CUSTOM_AI_INSTRUCTIONS,
  );
  const [isClearingStudyData, setIsClearingStudyData] = useState(false);
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
    setOllamaOptions(
      normalizeOllamaGenerationOptions(data.settings.ollamaOptions),
    );
    setAiResponseFlavor(
      data.settings.aiResponseFlavor ?? DEFAULT_AI_RESPONSE_FLAVOR,
    );
    setCustomAiInstructions(
      data.settings.customAiInstructions ?? DEFAULT_CUSTOM_AI_INSTRUCTIONS,
    );
  }, []);

  const loadOllamaModels = useCallback(async (baseUrl: string) => {
    setIsLoadingOllamaModels(true);
    setOllamaModelsError("");
    try {
      const params = new URLSearchParams();
      if (baseUrl.trim()) {
        params.set("baseUrl", baseUrl.trim());
      }
      const query = params.toString();
      const response = await fetch(
        `/api/settings/ollama/models${query ? `?${query}` : ""}`,
      );
      const data = (await response.json()) as OllamaModelsResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load Ollama models.");
      }
      setOllamaModels(data.models ?? []);
      setOllamaModelsError("");
    } catch (error) {
      setOllamaModels([]);
      setOllamaModelsError(
        error instanceof Error
          ? error.message
          : "Could not load Ollama models.",
      );
    } finally {
      setIsLoadingOllamaModels(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/ollama");
      const data = (await response.json()) as OllamaSettings;
      applySettings(data);
      void loadOllamaModels(data.settings.ollamaBaseUrl ?? data.ollama.baseUrl);
      setMounted(true);
    } catch {
      setSettings(null);
      setMounted(true);
    }
  }, [applySettings, loadOllamaModels]);

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
          ollamaOptions,
        }),
      });
      const data = (await response.json()) as OllamaSettings;
      if (!response.ok) {
        throw new Error("Could not save Ollama settings.");
      }
      applySettings(data);
      window.dispatchEvent(new Event("oye:settings-updated"));
      void loadOllamaModels(data.settings.ollamaBaseUrl ?? data.ollama.baseUrl);
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
          ollamaOptions,
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

  async function persistAiResponseFlavor(value: AiResponseFlavor) {
    setAiResponseFlavor(value);
    try {
      await patchSettings({ aiResponseFlavor: value });
      const label =
        AI_RESPONSE_FLAVORS.find((flavor) => flavor.id === value)?.label ??
        "AI flavor";
      showToast(`AI flavor set to ${label}.`);
      playSound("tap");
    } catch {
      showToast("Could not save AI flavor.");
    }
  }

  async function persistCustomAiInstructions() {
    try {
      const trimmed = customAiInstructions.trim();
      await patchSettings({ customAiInstructions: trimmed });
      setCustomAiInstructions(trimmed);
      showToast(
        trimmed
          ? "Custom AI instructions saved."
          : "Custom AI instructions cleared.",
      );
      playSound("tap");
    } catch {
      showToast("Could not save custom AI instructions.");
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
        ollamaOptions: DEFAULT_OLLAMA_GENERATION_OPTIONS,
        aiResponseFlavor: DEFAULT_AI_RESPONSE_FLAVOR,
        customAiInstructions: DEFAULT_CUSTOM_AI_INSTRUCTIONS,
      });
      showToast("Preferences cleared.");
    } catch {
      showToast("Could not clear preferences.");
    }
  }

  async function clearSavedStudyData() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Delete saved lessons and conversations? This also clears lesson progress, practice attempts, and cached lessons.",
      )
    ) {
      return;
    }

    setIsClearingStudyData(true);
    try {
      const response = await fetch("/api/settings/data", { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete saved study data.");
      }
      window.localStorage.removeItem("oye:ask-messages");
      window.dispatchEvent(new Event("oye:ask-history-cleared"));
      window.dispatchEvent(new Event("oye:progress-updated"));
      showToast("Saved lessons and conversations deleted.");
      playSound("success");
    } catch {
      showToast("Could not delete saved lessons and conversations.");
    } finally {
      setIsClearingStudyData(false);
    }
  }

  function updateOllamaOption(id: OllamaGenerationOptionId, rawValue: string) {
    setOllamaOptions((current) =>
      normalizeOllamaGenerationOptions({
        ...current,
        [id]: rawValue,
      }),
    );
  }

  function resetOllamaOptions() {
    setOllamaOptions(DEFAULT_OLLAMA_GENERATION_OPTIONS);
    showToast("Model parameters reset to defaults.");
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

      <div className="relative mx-auto w-full max-w-300 px-8 py-12">
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
                className="mt-3 h-11 w-full cursor-pointer rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 text-stone-100 transition outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-44"
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
                className="mt-3 h-11 w-full cursor-pointer rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 text-stone-100 transition outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-44"
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
                className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800"
              >
                Test Mac notification
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3 text-left">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
                  aria-hidden
                >
                  <FontAwesomeIcon icon={faPalette} className="text-lg" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    AI response style
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-400">
                    Choose the flavor used for Ask answers and newly generated
                    lessons.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {AI_RESPONSE_FLAVORS.map((flavor) => (
                <div
                  key={flavor.id}
                  className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                    aiResponseFlavor === flavor.id
                      ? "border-orange-400/45 bg-orange-400/10"
                      : "border-stone-700/60 bg-stone-950/35"
                  }`}
                  onClick={() =>
                    void persistAiResponseFlavor(flavor.id as AiResponseFlavor)
                  }
                >
                  <p className="text-sm font-bold text-stone-100">
                    {flavor.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-400">
                    {flavor.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-stone-700/80 pt-5 text-left">
              <label
                className="text-sm font-bold text-stone-100"
                htmlFor="custom-ai-instructions"
              >
                Custom instructions
              </label>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-400">
                Add your own style notes for Ask answers and newly generated
                lessons.
              </p>
              <textarea
                id="custom-ai-instructions"
                value={customAiInstructions}
                onChange={(e) => setCustomAiInstructions(e.target.value)}
                onBlur={() => void persistCustomAiInstructions()}
                disabled={!mounted}
                rows={4}
                maxLength={1000}
                className="mt-3 min-h-28 w-full resize-y rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 py-3 text-stone-100 transition outline-none placeholder:text-stone-500 focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30 disabled:opacity-50"
                placeholder="Example: Keep answers extra short, use Spain Spanish, and include pronunciation tips."
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-stone-500">
                  {customAiInstructions.length}/1000 characters
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAiInstructions(DEFAULT_CUSTOM_AI_INSTRUCTIONS);
                      void patchSettings({
                        customAiInstructions: DEFAULT_CUSTOM_AI_INSTRUCTIONS,
                      })
                        .then(() =>
                          showToast("Custom AI instructions cleared."),
                        )
                        .catch(() =>
                          showToast("Could not clear custom AI instructions."),
                        );
                    }}
                    disabled={!mounted || !customAiInstructions.trim()}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-600 disabled:hover:bg-transparent"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => void persistCustomAiInstructions()}
                    disabled={!mounted}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save instructions
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-white">
              Data on this device
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Reset preferences or delete saved lesson and conversation history.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearSavedPreferences}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200 transition outline-none hover:bg-red-950/50 focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-base" />
                Clear saved preferences
              </button>
              <button
                type="button"
                onClick={() => void clearSavedStudyData()}
                disabled={isClearingStudyData}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200 transition outline-none hover:bg-red-950/50 focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-base" />
                {isClearingStudyData
                  ? "Deleting..."
                  : "Delete lessons and conversations"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg ring-1 shadow-black/20 ring-white/5 sm:p-6">
            <div className="flex flex-col gap-8 md:flex-row md:gap-12">
              <div className="min-w-0 flex-1">
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
                <div className="mt-4 space-y-5 rounded-xl border border-stone-700/60 bg-stone-950/50 p-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
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
                      <div className="flex items-center justify-between gap-3">
                        <label
                          className="text-xs font-semibold tracking-wide text-stone-400 uppercase"
                          htmlFor="ollama-model"
                        >
                          Model
                        </label>
                        <button
                          type="button"
                          onClick={() => void loadOllamaModels(ollamaBaseUrl)}
                          disabled={isLoadingOllamaModels}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-600 px-3 py-1 text-xs font-bold text-stone-200 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FontAwesomeIcon
                            icon={faArrowsRotate}
                            className={`text-xs ${
                              isLoadingOllamaModels ? "animate-spin" : ""
                            }`}
                          />
                          Refresh
                        </button>
                      </div>
                      {ollamaModels.length > 0 ? (
                        <select
                          id="ollama-model"
                          value={ollamaModel}
                          onChange={(e) => setOllamaModel(e.target.value)}
                          className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 font-mono text-sm text-stone-100 outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                        >
                          {ollamaModel &&
                          !ollamaModels.some(
                            (model) => model.name === ollamaModel,
                          ) ? (
                            <option value={ollamaModel}>
                              {ollamaModel} (manual)
                            </option>
                          ) : null}
                          {ollamaModels.map((model) => (
                            <option key={model.model} value={model.name}>
                              {formatModelLabel(model)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="ollama-model"
                          value={ollamaModel}
                          onChange={(e) => setOllamaModel(e.target.value)}
                          className="mt-2 h-11 w-full rounded-xl border border-stone-600/80 bg-stone-900/60 px-4 font-mono text-sm text-stone-100 outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                          placeholder={settings?.env.OLLAMA_MODEL ?? "llama3.2"}
                        />
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-stone-500">
                        {ollamaModelsError
                          ? `${ollamaModelsError} You can still type a model name manually.`
                          : ollamaModels.length > 0
                            ? `${ollamaModels.length} local model${
                                ollamaModels.length === 1 ? "" : "s"
                              } found.`
                            : "Refresh to load locally installed Ollama models."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-stone-700/80 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3 text-left">
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
                          aria-hidden
                        >
                          <FontAwesomeIcon
                            icon={faSliders}
                            className="text-base"
                          />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-stone-100">
                            Generation parameters
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-stone-400">
                            These values are sent with Ollama generation
                            requests for new lessons, Ask answers, and
                            conversation replies.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetOllamaOptions}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-600 px-4 py-2 text-xs font-bold text-stone-200 transition hover:bg-stone-800"
                      >
                        Reset defaults
                      </button>
                    </div>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {OLLAMA_GENERATION_OPTION_FIELDS.map((field) => {
                        const fieldId = `ollama-option-${field.id}`;
                        const value = ollamaOptions[field.id];
                        return (
                          <div
                            key={field.id}
                            className="rounded-xl border border-stone-700/60 bg-stone-900/45 p-4"
                          >
                            <div className="flex flex-col items-start gap-3 xl:flex-row xl:justify-between">
                              <label
                                className="min-w-0 text-sm leading-snug font-bold text-stone-100"
                                htmlFor={fieldId}
                              >
                                {field.label}
                              </label>
                              <input
                                id={fieldId}
                                type="number"
                                value={formatOptionValue(
                                  value,
                                  field.valueType,
                                )}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                onChange={(e) =>
                                  updateOllamaOption(field.id, e.target.value)
                                }
                                className="h-9 w-24 shrink-0 rounded-lg border border-stone-600/80 bg-stone-950/70 px-3 text-right font-mono text-sm text-stone-100 outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/30"
                                aria-describedby={`${fieldId}-desc`}
                              />
                            </div>
                            {field.control === "slider" ? (
                              <input
                                type="range"
                                value={value}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                onChange={(e) =>
                                  updateOllamaOption(field.id, e.target.value)
                                }
                                className="mt-3 h-2 w-full cursor-pointer accent-orange-400"
                                aria-label={`${field.label} slider`}
                              />
                            ) : null}
                            <p
                              className="mt-3 text-xs leading-relaxed text-stone-500"
                              id={`${fieldId}-desc`}
                            >
                              {field.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-stone-700/80 pt-5">
                    <button
                      type="button"
                      onClick={() => void saveOllamaSettings()}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-orange-300"
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
                      className="inline-flex cursor-pointer items-center justify-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800"
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
