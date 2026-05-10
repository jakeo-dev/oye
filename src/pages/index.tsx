import Link from "next/link";
import Image from "next/image";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${hostGrotesk.className}`}>
      <div className="min-h-screen bg-stone-900 text-white">
        <header className="border-b border-orange-300/30 bg-orange-400 text-stone-900">
          <div className="mx-auto flex max-w-220 items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">[app name]</h1>
              <p className="mt-1 text-sm font-semibold">
                Conversational AI for practical Spanish.
              </p>
            </div>
            <Link
              href="/home"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-black text-orange-300 transition hover:bg-stone-800"
            >
              Open App
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-200 flex-col gap-16 px-8 py-12">
          <section className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-left text-5xl leading-tight font-black text-orange-400 md:text-6xl">
                Learn what you need to know.
              </h2>
              <p className="max-w-xl text-left text-lg text-stone-300">
                [app name] combines lessons with conversational AI so you can
                practice the way Spanish is actually spoken. Build vocabulary,
                improve pronunciation, and gain confidence for everyday
                situations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/home"
                  className="rounded-full bg-orange-400 px-7 py-3 text-lg font-black text-stone-900 shadow-lg shadow-orange-400/30 transition hover:bg-orange-300"
                >
                  Start Learning
                </Link>
                <Link
                  href="/conversation"
                  className="rounded-full border border-stone-500 px-7 py-3 text-lg font-black text-stone-100 transition hover:border-orange-300 hover:text-orange-300"
                >
                  Try Conversation
                </Link>
              </div>
            </div>
            <div className="mx-auto rounded-3xl border border-stone-700 bg-stone-800/60 p-8 shadow-xl shadow-black/40">
              <Image
                src="/mascot.png"
                width={360}
                height={420}
                alt="Spanish app mascot"
                className="mx-auto drop-shadow-xl"
              />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-stone-700 bg-stone-800/60 p-6">
              <h3 className="text-xl font-black text-orange-300">
                Conversational AI Coach
              </h3>
              <p className="mt-3 text-stone-300">
                Practice open-ended dialogue and get instant feedback while
                learning how to respond naturally.
              </p>
            </article>
            <article className="rounded-2xl border border-stone-700 bg-stone-800/60 p-6">
              <h3 className="text-xl font-black text-orange-300">
                Focused Lessons
              </h3>
              <p className="mt-3 text-stone-300">
                Study high-frequency phrases, grammar patterns, and useful
                vocabulary before applying them in conversation.
              </p>
            </article>
            <article className="rounded-2xl border border-stone-700 bg-stone-800/60 p-6">
              <h3 className="text-xl font-black text-orange-300">
                Daily Progress Tracking
              </h3>
              <p className="mt-3 text-stone-300">
                Stay motivated with visible progress so each short practice
                session compounds over time.
              </p>
            </article>
          </section>

          <section className="rounded-3xl border border-orange-400/30 bg-orange-400/10 p-8">
            <h3 className="text-3xl font-black text-orange-300">
              How [app name] Works
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-stone-900/70 p-5">
                <p className="text-sm font-black text-orange-300">1. Learn</p>
                <p className="mt-2 text-stone-300">
                  Complete lessons to understand words and sentence structure.
                </p>
              </div>
              <div className="rounded-xl bg-stone-900/70 p-5">
                <p className="text-sm font-black text-orange-300">2. Speak</p>
                <p className="mt-2 text-stone-300">
                  Use conversational AI to practice realistic scenarios and
                  responses.
                </p>
              </div>
              <div className="rounded-xl bg-stone-900/70 p-5">
                <p className="text-sm font-black text-orange-300">3. Improve</p>
                <p className="mt-2 text-stone-300">
                  Review your progress daily and keep building confidence in
                  Spanish.
                </p>
              </div>
            </div>
          </section>

          <section className="pb-4 text-center">
            <h3 className="text-3xl font-black text-white">
              Ready to practice Spanish every day?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-stone-300">
              Start with lessons, then jump into guided conversations with AI to
              make your Spanish feel natural in real life.
            </p>
            <Link
              href="/home"
              className="mt-6 inline-block rounded-full bg-orange-400 px-8 py-4 text-xl font-black text-stone-900 shadow-lg shadow-orange-400/30 transition hover:bg-orange-300"
            >
              Enter [app name]
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
