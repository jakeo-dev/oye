import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
import { useCallback, useEffect, useState } from "react";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

type OllamaConnectionStatus =
  | "checking"
  | "online"
  | "missing-model"
  | "offline";

type OllamaStatusResponse = {
  status?: OllamaConnectionStatus;
  label?: string;
  detail?: string;
  baseUrl?: string;
  model?: string;
};

const ollamaStatusStyles: Record<
  OllamaConnectionStatus,
  { bubble: string; dot: string }
> = {
  checking: {
    bubble: "border-stone-600/80 bg-stone-900/80 text-stone-300",
    dot: "bg-stone-400",
  },
  online: {
    bubble: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    dot: "bg-emerald-400",
  },
  "missing-model": {
    bubble: "border-amber-300/35 bg-amber-300/10 text-amber-100",
    dot: "bg-amber-300",
  },
  offline: {
    bubble: "border-red-400/35 bg-red-500/10 text-red-100",
    dot: "bg-red-400",
  },
};

function NavCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof faBookOpen;
}) {
  return (
    <Link
      href={href}
      className="group relative flex cursor-pointer gap-5 rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg shadow-black/20 ring-orange-400/0 transition outline-none hover:border-orange-400/35 hover:bg-stone-900/70 hover:shadow-orange-950/20 focus-visible:ring-2 focus-visible:ring-orange-400/80 md:p-6"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400 transition group-hover:bg-orange-400/25 group-hover:text-orange-300"
        aria-hidden
      >
        <FontAwesomeIcon icon={icon} className="text-2xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="block text-left">
            <span className="text-lg font-bold tracking-tight text-stone-100 md:text-xl">
              {title}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-stone-400 md:text-[0.9375rem]">
              {description}
            </span>
          </div>
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-600/80 bg-stone-800/80 text-stone-300 transition group-hover:translate-x-0.5 group-hover:border-orange-400/40 group-hover:bg-orange-400/10 group-hover:text-orange-300"
            aria-hidden
          >
            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [ollamaStatus, setOllamaStatus] = useState<
    Required<Pick<OllamaStatusResponse, "status" | "label" | "detail">>
  >({
    status: "checking",
    label: "Checking Ollama",
    detail: "Checking configured Ollama connection.",
  });

  const loadOllamaStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/settings/ollama/status", { signal });
      const data = (await response.json()) as OllamaStatusResponse;

      if (!response.ok) {
        throw new Error(data.detail ?? "Could not check Ollama.");
      }

      setOllamaStatus({
        status: data.status ?? "offline",
        label: data.label ?? "Ollama offline",
        detail: data.detail ?? "Could not check Ollama.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setOllamaStatus({
        status: "offline",
        label: "Ollama offline",
        detail: "Could not check Ollama.",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadOllamaStatus(controller.signal);
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadOllamaStatus();
    }, 45000);

    function onSettingsUpdated() {
      void loadOllamaStatus();
    }

    window.addEventListener("oye:settings-updated", onSettingsUpdated);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("oye:settings-updated", onSettingsUpdated);
    };
  }, [loadOllamaStatus]);

  return (
    <div
      className={`${hostGrotesk.className} relative isolate min-h-[calc(100dvh-5.5rem)] overflow-hidden bg-stone-950 text-stone-100`}
    >
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-112 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-220 flex-col gap-12 px-8 py-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-8 lg:max-w-xl">
          <header className="flex flex-col items-center justify-center space-y-3 lg:items-end">
            <OllamaStatusBadge status={ollamaStatus} />

            <h1 className="text-center text-4xl leading-[1.1] font-black tracking-tight text-pretty text-white sm:text-5xl lg:text-right">
              Pick up where you left off
            </h1>
            <p className="text-center text-base leading-relaxed text-pretty text-stone-400 sm:text-lg lg:text-right">
              Continue with structured lessons built around practical Spanish.
            </p>
          </header>

          <nav
            className="flex flex-col gap-3 sm:gap-4"
            aria-label="Main navigation"
          >
            <NavCard
              href="/lessons"
              title="Lessons"
              description="Guided phrases, grammar, and scenarios you can study at your own pace."
              icon={faBookOpen}
            />
            <NavCard
              href="/ask"
              title="Ask"
              description="Type a travel question in English or Spanish and get a local answer."
              icon={faCircleQuestion}
            />
          </nav>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm shrink-0 justify-center lg:mx-0 lg:max-w-sm">
          <div
            className="absolute inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-orange-500/25 via-stone-800/40 to-stone-950 blur-2xl"
            aria-hidden
          />
          <div className="animate-wiggle relative w-full">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px" />
            <Image
              src="/oye-tura-the-criatura-hat1.png"
              width={500}
              height={600}
              alt="Tura the Criatura"
              priority
              className="mx-auto h-auto w-full max-w-80 object-contain drop-shadow-2xl drop-shadow-orange-300/30 sm:max-w-95"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OllamaStatusBadge({
  status,
}: {
  status: Required<Pick<OllamaStatusResponse, "status" | "label" | "detail">>;
}) {
  const statusStyles = ollamaStatusStyles[status.status];

  return (
    <span
      className={`inline-flex max-w-36 items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[0.6875rem] leading-none font-bold sm:max-w-44 ${statusStyles.bubble}`}
      role="status"
      aria-live="polite"
      title={status.detail}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${statusStyles.dot}`}
        aria-hidden
      />
      <span className="truncate">{status.label}</span>
    </span>
  );
}
