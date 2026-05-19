import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

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
      className="group relative flex gap-5 rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 shadow-lg shadow-black/20 ring-orange-400/0 transition outline-none hover:border-orange-400/35 hover:bg-stone-900/70 hover:shadow-orange-950/20 focus-visible:ring-2 focus-visible:ring-orange-400/80 md:p-6"
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-400 transition group-hover:bg-orange-400/25 group-hover:text-orange-300"
        aria-hidden
      >
        <FontAwesomeIcon icon={icon} className="text-2xl" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="block text-left">
            <span className="text-lg font-bold tracking-tight text-stone-100 md:text-xl">
              {title}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-stone-400 md:text-[0.9375rem]">
              {description}
            </span>
          </span>
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-600/80 bg-stone-800/80 text-stone-300 transition group-hover:translate-x-0.5 group-hover:border-orange-400/40 group-hover:bg-orange-400/10 group-hover:text-orange-300"
            aria-hidden
          >
            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
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
          <header className="space-y-3">
            <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-pretty text-white sm:text-5xl">
              Pick up where you left off
            </h1>
            <p className="max-w-md text-base leading-relaxed text-pretty text-stone-400 sm:text-lg">
              Structured lessons and open conversation practice — use whichever
              fits your mood today.
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
              href="/conversation"
              title="Conversation"
              description="Talk with the AI coach and practice responding in real time."
              icon={faComments}
            />
          </nav>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm shrink-0 justify-center lg:mx-0 lg:max-w-md">
          <div
            className="absolute inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-orange-500/25 via-stone-800/40 to-stone-950 blur-2xl"
            aria-hidden
          />
          <div className="relative w-full rounded-4xl border border-stone-700/60 bg-linear-to-b from-stone-900/80 to-stone-950/90 p-6 shadow-2xl ring-1 shadow-black/50 ring-white/5 backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-orange-400/40 to-transparent" />
            <Image
              src="/mascot.png"
              width={400}
              height={500}
              alt="Spanish learning app mascot"
              priority
              className="mx-auto h-auto w-full max-w-[280px] object-contain drop-shadow-2xl sm:max-w-[320px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
