import Link from "next/link";
import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { Host_Grotesk } from "next/font/google";

const hostGrotesk = Host_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

type OllamaSettings = {
  ollama: {
    baseUrl: string;
    model: string;
  };
  env: Record<string, string>;
};

export default function Settings() {
  const [settings, setSettings] = useState<OllamaSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings/ollama")
      .then((response) => response.json())
      .then((data: OllamaSettings) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  return (
    <div className={`${hostGrotesk.className}`}>
      <div className="flex items-center bg-orange-400 px-8 py-6 text-stone-900">
        <Link href="/" className="text-orange-400 transition">
          <FontAwesomeIcon
            icon={faChevronLeft}
            className="rounded-full bg-stone-900 px-1 py-[6.5px] text-xl hover:bg-stone-900/60"
            aria-label="Back"
          />
        </Link>
        <h1 className="mx-auto text-2xl font-black">Settings</h1>
      </div>

      <main className="mx-auto mt-10 flex max-w-200 flex-col gap-4 px-8 text-stone-900">
        <h2 className="text-xl font-black">Ollama</h2>
        <div className="grid gap-3 rounded-lg border border-stone-200 p-4">
          <p>
            <span className="font-bold">Base URL:</span>{" "}
            {settings?.ollama.baseUrl ?? "Loading..."}
          </p>
          <p>
            <span className="font-bold">Model:</span>{" "}
            {settings?.ollama.model ?? "Loading..."}
          </p>
          <p className="text-sm text-stone-500">
            Set OLLAMA_BASE_URL, OLLAMA_MODEL, or APP_DATABASE_PATH before
            starting Next.js to change backend targets.
          </p>
        </div>
      </main>
    </div>
  );
}
