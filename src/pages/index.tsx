import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faComments,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const isLocal = process.env.NODE_ENV === "development";

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: typeof faBookOpen;
}) {
  return (
    <article className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-6 shadow-lg ring-1 shadow-black/20 ring-white/5 transition hover:border-orange-400/25 hover:bg-stone-900/60">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400"
        aria-hidden
      >
        <FontAwesomeIcon icon={icon} className="text-xl" />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-white md:text-xl">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-400 md:text-base">
        {description}
      </p>
    </article>
  );
}

export default function Home() {
  return (
    <div
      className={`${hostGrotesk.className} relative isolate min-h-screen overflow-hidden bg-stone-950 text-stone-100`}
    >
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-112 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl"
        aria-hidden
      />

      <header className="relative isolate z-10 border-b border-stone-700/80 bg-stone-950/90 text-stone-100 backdrop-blur-md">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-400/35 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-220 items-center justify-between gap-4 px-8 py-4">
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            ¡Oye!
          </h1>
          <Link
            href={
              isLocal
                ? "/home"
                : "https://github.com/jakeo-dev/oye#quick-start-on-macos"
            }
            target={isLocal ? "" : "_blank"}
            className="shrink-0 cursor-pointer rounded-full border border-stone-600/80 bg-stone-800/80 px-5 py-2.5 text-base font-black text-stone-100 shadow-lg transition outline-none hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-200 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 md:text-lg"
          >
            {isLocal ? "Open App" : "Install"}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-220 flex-col gap-16 px-8 py-12 md:gap-20 md:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col items-center space-y-6 lg:block lg:text-right">
            {isLocal && (
              <p className="text-sm font-semibold tracking-wide text-orange-400/90 uppercase">
                Running locally
              </p>
            )}
            <h2 className="text-4xl leading-[1.1] font-black tracking-tight text-pretty text-white md:text-5xl lg:text-6xl">
              Learn what you need to know.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-pretty text-stone-400">
              ¡Oye! combines tailored lessons with conversational AI that runs
              locally on your computer. Practice real-world Spanish, improve
              your pronunciation, and build confidence completely offline.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-end">
              <Link
                href={
                  isLocal
                    ? "/home"
                    : "https://github.com/jakeo-dev/oye#quick-start-on-macos"
                }
                target={isLocal ? "" : "_blank"}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-400 px-7 py-3 text-lg font-black text-stone-950 shadow-lg shadow-orange-500/20 transition outline-none hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                {isLocal ? "Start Learning" : "Install"}
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </Link>
              {/* <Link
                href="/conversation"
                className="inline-flex items-center gap-2 rounded-full border border-stone-600/80 bg-stone-800/80 px-7 py-3 text-lg font-black text-stone-100 transition outline-none hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-200 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                Try Conversation
                <FontAwesomeIcon
                  icon={faComments}
                  className="text-sm opacity-80"
                />
              </Link> */}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div
              className="absolute inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-orange-500/25 via-stone-800/40 to-stone-950 blur-2xl"
              aria-hidden
            />
            <div className="animate-wiggle relative p-6">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px" />
              <Image
                src="/tura-the-criatura.png"
                width={360}
                height={420}
                alt="Tura the Criatura"
                className="mx-auto h-auto w-full max-w-xs object-contain drop-shadow-2xl drop-shadow-orange-300/30 sm:max-w-sm"
                priority
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
          <FeatureCard
            title="Conversational AI coach"
            description="Practice open-ended dialogue and get instant feedback while learning how to respond naturally."
            icon={faComments}
          />
          <FeatureCard
            title="Local learning"
            description="Practice entirely on your device with complete privacy and full offline access anytime, legs anywhere."
            icon={faGlobe}
          />
          <FeatureCard
            title="Focused lessons"
            description="Study high-frequency phrases, grammar patterns, and useful vocabulary before applying them in conversation."
            icon={faBookOpen}
          />
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/40 p-8 shadow-lg ring-1 shadow-black/20 ring-white/5 md:p-10">
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-orange-400/35 to-transparent"
            aria-hidden
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-400/90 uppercase">
            How it works
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
            Three steps to better Spanish
          </h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-700/60 bg-stone-950/50 p-5">
              <p className="text-sm font-black text-orange-400">1. Learn</p>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-400">
                Complete lessons to understand words and sentence structure.
              </p>
            </div>
            <div className="rounded-xl border border-stone-700/60 bg-stone-950/50 p-5">
              <p className="text-sm font-black text-orange-400">2. Speak</p>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-400">
                Use conversational AI to practice realistic scenarios and
                responses.
              </p>
            </div>
            <div className="rounded-xl border border-stone-700/60 bg-stone-950/50 p-5">
              <p className="text-sm font-black text-orange-400">3. Improve</p>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-400">
                Review your progress daily and keep building confidence in
                Spanish.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-orange-400/25 bg-orange-400/10 p-8 text-center shadow-lg ring-1 shadow-orange-950/10 ring-orange-400/15 md:p-10">
          <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Ready to practice Spanish every day?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-stone-300">
            Start with lessons, then jump into guided conversations with AI to
            make your Spanish feel natural in real life.
          </p>
          <Link
            href={
              isLocal
                ? "/home"
                : "https://github.com/jakeo-dev/oye#quick-start-on-macos"
            }
            target={isLocal ? "" : "_blank"}
            className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-orange-400 px-8 py-4 text-xl font-black text-stone-950 shadow-lg shadow-orange-500/25 transition outline-none hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
          >
            {isLocal ? "Enter ¡Oye!" : "Install ¡Oye!"}
            <FontAwesomeIcon icon={faArrowRight} className="text-base" />
          </Link>
        </section>
      </main>
    </div>
  );
}
