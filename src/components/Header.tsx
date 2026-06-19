import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGear, faHouse } from "@fortawesome/free-solid-svg-icons";

const iconButtonClassName =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stone-600/80 bg-stone-800/80 text-orange-400 outline-none transition hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950";

type AppHeaderProps = {
  showBackButton?: boolean;
  showProgressBar?: boolean;
};

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className={iconButtonClassName}>
      {children}
    </Link>
  );
}

function ExternalIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className={iconButtonClassName}
    >
      {children}
    </a>
  );
}

export default function Header({ showProgressBar = false }: AppHeaderProps) {
  const router = useRouter();
  const [progressFraction, setProgressFraction] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Daily progress");

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const response = await fetch("/api/progress");
        const data = (await response.json()) as {
          dailyFraction?: number;
          today?: { minutes?: number };
          dailyGoalMinutes?: number;
          streakDays?: number;
        };
        if (!cancelled) {
          const fraction =
            typeof data.dailyFraction === "number" &&
            !Number.isNaN(data.dailyFraction)
              ? data.dailyFraction
              : 0;
          setProgressFraction(Math.max(0, Math.min(1, fraction)));
          setProgressLabel(
            `${data.today?.minutes ?? 0}/${data.dailyGoalMinutes ?? 10} min today${
              data.streakDays ? ` · ${data.streakDays} day streak` : ""
            }`,
          );
        }
      } catch {
        /* ignore */
      }
    }

    void loadProgress();

    function onProgressUpdated() {
      void loadProgress();
    }

    window.addEventListener("oye:progress-updated", onProgressUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("oye:progress-updated", onProgressUpdated);
    };
  }, [router.asPath]);

  const githubHref =
    process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ||
    "https://github.com/jakeo-dev/oye";

  return (
    <header
      className={`relative isolate border-b border-stone-700/80 bg-stone-950/90 text-stone-100 backdrop-blur-md ${hostGrotesk.className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-400/35 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-220 items-center gap-4 px-8 py-4">
        <Link
          href="/home"
          className="group shrink-0 cursor-pointer outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
        >
          <h1 className="text-2xl leading-none font-black tracking-tight text-white transition group-hover:text-orange-100 sm:text-3xl">
            ¡Oye!
          </h1>
        </Link>

        {showProgressBar && (
          <div className="mx-1 flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:mx-2">
            <div className="flex h-2.5 items-center rounded-full bg-stone-800 ring-1 ring-stone-700/60">
              <progress
                className="win-rate-bar-orange win-rate-bar-rounded mx-auto h-full w-full appearance-none overflow-hidden rounded-full bg-transparent"
                max={1}
                value={progressFraction}
                title={progressLabel}
                aria-label={progressLabel}
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {router.pathname === "/home" && (
            <ExternalIconButton href={githubHref} label="Project on GitHub">
              <FontAwesomeIcon
                icon={faGithub}
                className="text-lg"
                aria-hidden
              />
            </ExternalIconButton>
          )}

          {router.pathname !== "/home" && (
            <IconButton href="/home" label="Home">
              <FontAwesomeIcon
                icon={faHouse}
                className="text-base"
                aria-hidden
              />
            </IconButton>
          )}

          <IconButton href="/settings" label="Settings">
            <FontAwesomeIcon icon={faGear} className="text-base" aria-hidden />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
