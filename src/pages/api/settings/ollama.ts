import type { NextApiRequest, NextApiResponse } from "next";

import { getOllamaConfig } from "@/server/ollama";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const config = getOllamaConfig();
  res.status(200).json({
    ollama: config,
    env: {
      OLLAMA_BASE_URL: config.baseUrl,
      OLLAMA_MODEL: config.model,
      APP_DATABASE_PATH: process.env.APP_DATABASE_PATH ?? "data/app-db.json",
    },
  });
}

