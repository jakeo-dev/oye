import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faMicrophone,
  faVolume,
} from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Lessons() {
  return (
    <div className={`${hostGrotesk.className}`}>
      <div className="flex h-[33vh] items-center bg-orange-400 px-8 py-6 text-stone-900">
        <div className="mx-auto flex h-min w-full max-w-200 items-center">
          <h1 className="text-4xl font-black">Hola, ¿cómo estás?</h1>
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

      <div className="mx-auto flex max-w-200 items-center justify-center">
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
