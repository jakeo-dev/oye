import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { Host_Grotesk } from "next/font/google";
const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${hostGrotesk.className} px-8 py-4`}>
      <div className="mx-auto mt-10 mb-18 flex max-w-200 flex-col gap-y-8">
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
          src="/mascot.png"
          width={400}
          height={500}
          alt="Mascot"
          className="mx-auto"
        />
      </div>
    </div>
  );
}
