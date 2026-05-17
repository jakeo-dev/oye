import type { NextApiRequest, NextApiResponse } from "next";

import { getSettings, updateSettings } from "@/server/database";
import { getOllamaConfig } from "@/server/ollama";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as {
      baseUrl?: string;
      model?: string;
    };
    const settings = await updateSettings({
      ollamaBaseUrl: body.baseUrl ?? null,
      ollamaModel: body.model ?? null,
    });
    const config = getOllamaConfig(settings);
    res.status(200).json({
      ollama: config,
      settings,
      env: {
        OLLAMA_BASE_URL: config.baseUrl,
        OLLAMA_MODEL: config.model,
        APP_DATABASE_PATH: process.env.APP_DATABASE_PATH ?? "data/app-db.json",
      },
    });
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, PATCH");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const settings = await getSettings();
  const config = getOllamaConfig(settings);
  res.status(200).json({
    ollama: config,
    settings,
    env: {
      OLLAMA_BASE_URL: config.baseUrl,
      OLLAMA_MODEL: config.model,
      APP_DATABASE_PATH: process.env.APP_DATABASE_PATH ?? "data/app-db.json",
    },
  });
}
