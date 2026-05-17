import type { NextApiRequest, NextApiResponse } from "next";

import { getSettings, updateSettings } from "@/server/database";
import { getOllamaConfig } from "@/server/ollama";
import type { AppSettings } from "@/server/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const settings = await getSettings();
    const ollama = getOllamaConfig(settings);
    res.status(200).json({
      settings,
      ollama,
      env: {
        OLLAMA_BASE_URL: ollama.baseUrl,
        OLLAMA_MODEL: ollama.model,
        APP_DATABASE_PATH: process.env.APP_DATABASE_PATH ?? "data/app-db.json",
      },
    });
    return;
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as Partial<AppSettings>;
    const settings = await updateSettings(body);
    const ollama = getOllamaConfig(settings);
    res.status(200).json({
      settings,
      ollama,
      env: {
        OLLAMA_BASE_URL: ollama.baseUrl,
        OLLAMA_MODEL: ollama.model,
        APP_DATABASE_PATH: process.env.APP_DATABASE_PATH ?? "data/app-db.json",
      },
    });
    return;
  }

  res.setHeader("Allow", "GET, PATCH");
  res.status(405).json({ error: "Method not allowed." });
}
