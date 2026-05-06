import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faGear } from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${hostGrotesk.className}`}>
      <div className="flex items-center justify-center bg-orange-400 px-8 py-6 text-stone-900">
        <h1 className="text-2xl font-black">Spanish App!!!!</h1>
        <Link href="/settings" className="ml-auto text-orange-400 transition">
          <FontAwesomeIcon
            icon={faGear}
            className="rounded-full bg-stone-900 px-1.25 py-2 text-xl hover:bg-stone-900/60"
            aria-label="Settings"
          />
        </Link>
      </div>

      <div className="mx-auto mt-16 flex max-w-200 flex-col gap-y-8 px-8 py-4">
        <Link
          href="/lessons"
          className="group flex items-center justify-center rounded-full bg-orange-400 py-3 pr-6 pl-4 text-4xl font-bold text-white shadow-lg shadow-orange-400/50 transition hover:text-white/50"
        >
          <FontAwesomeIcon
            icon={faArrowRight}
            className="mr-auto rounded-full bg-white px-1 py-2 text-3xl text-orange-400 transition group-hover:translate-x-1/2 group-active:translate-x-full"
            aria-labelledby="lessons-btn-text"
          />
          <span id="lessons-btn-text">Lessons</span>
        </Link>
        <Link
          href="/conversation"
          className="group flex items-center justify-center rounded-full bg-orange-400 py-3 pr-6 pl-4 text-4xl font-bold text-white shadow-lg shadow-orange-400/50 transition hover:text-white/50"
        >
          <FontAwesomeIcon
            icon={faArrowRight}
            className="mr-auto rounded-full bg-white px-1 py-2 text-3xl text-orange-400 transition duration-200 group-hover:translate-x-1/2 group-active:translate-x-full"
            aria-labelledby="conversation-btn-text"
          />
          <span id="conversation-btn-text">Conversation</span>
        </Link>
      </div>

      <div className="">
        <Image
          src="/mascot-placeholder.png"
          width={400}
          height={500}
          alt="Mascot"
          className="mx-auto"
        />
        <div className="flex items-center justify-center">
          <div
            className={`absolute bottom-16 flex h-4 w-5/6 items-center justify-center rounded-full bg-neutral-500/25 md:w-2/3 lg:w-1/2`}
          >
            <progress
              className={`win-rate-bar-orange win-rate-bar-rounded mx-auto h-full w-full appearance-none overflow-hidden rounded-full bg-neutral-500/10`}
              value={0.7}
            />
          </div>
        </div>
        <div className="flex items-center justify-center">
          <p className="absolute bottom-9 mx-auto mb-0.5 flex w-5/6 items-center justify-start px-1 text-sm text-stone-400 md:w-2/3 lg:w-1/2">
            Today&apos;s progress
          </p>
        </div>
      </div>
    </div>
  );
}
