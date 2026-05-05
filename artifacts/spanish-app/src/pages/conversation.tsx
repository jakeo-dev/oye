import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faGear,
  faMicrophone,
  faVolume,
} from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Conversation() {
  return (
    <div className={`${hostGrotesk.className}`}>
      <div className="h-[33vh] bg-orange-400 px-8 py-6 text-stone-900">
        <div className="mb-12 flex w-full items-center justify-center gap-4">
          <Link href="/" className="text-orange-400 transition">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="rounded-full bg-stone-900 px-1 py-[6.5px] text-xl hover:bg-stone-900/60"
              aria-label="Back"
            />
          </Link>

          <div className="flex h-4 w-full items-center justify-center rounded-full bg-neutral-500/25">
            <progress
              className="win-rate-bar-white win-rate-bar-rounded mx-auto h-full w-full appearance-none overflow-hidden rounded-full bg-neutral-500/10"
              value={0.7}
            />
          </div>

          <Link href="/settings" className="text-orange-400 transition">
            <FontAwesomeIcon
              icon={faGear}
              className="rounded-full bg-stone-900 px-1 py-[6.5px] text-xl hover:bg-stone-900/60"
              aria-label="Settings"
            />
          </Link>
        </div>

        <div className="flex items-center justify-center">
          <h1 className="text-left text-4xl font-black">Hola, ¿cómo estás?</h1>
          <button
            onClick={() => {}}
            className="ml-auto text-orange-400 transition"
          >
            <FontAwesomeIcon
              icon={faVolume}
              className="rounded-full bg-stone-900 px-1.25 py-2 text-3xl hover:bg-stone-900/60"
              aria-label="Say text"
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <button
          onClick={() => {}}
          className="group absolute bottom-48 mx-auto flex w-min items-center justify-center rounded-full bg-white px-3 py-3.5 text-6xl font-bold text-white shadow-lg shadow-orange-400/50 transition hover:text-white/50"
        >
          <FontAwesomeIcon
            icon={faMicrophone}
            className="mr-auto rounded-full bg-white px-3 py-4 text-orange-400 transition group-hover:translate-x-1/2"
            aria-label="Speak"
          />
        </button>
      </div>
    </div>
  );
}
