import type { NextApiRequest, NextApiResponse } from "next";

import { getSettings } from "@/server/database";
import { getOllamaConfig, listOllamaModels } from "@/server/ollama";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const settings = await getSettings();
  const baseUrl =
    typeof req.query.baseUrl === "string" && req.query.baseUrl.trim()
      ? req.query.baseUrl
      : settings.ollamaBaseUrl ?? undefined;
  const config = getOllamaConfig({ ...settings, ollamaBaseUrl: baseUrl ?? null });

  try {
    const result = await listOllamaModels({
      baseUrl: config.baseUrl,
      model: config.model,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(502).json({
      baseUrl: config.baseUrl,
      model: config.model,
      models: [],
      error:
        error instanceof Error ? error.message : "Could not list Ollama models.",
    });
  }
}
