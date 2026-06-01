import type { NextApiRequest, NextApiResponse } from "next";

import { getSettings } from "@/server/database";
import { generateTravelAnswer } from "@/server/ollama";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = (req.body ?? {}) as {
    question?: string;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
  };
  const question = body.question?.trim();

  if (!question) {
    res.status(400).json({ error: "question is required." });
    return;
  }

  try {
    const settings = await getSettings();
    const answer = await generateTravelAnswer(question, {
      baseUrl: body.ollamaBaseUrl ?? settings.ollamaBaseUrl ?? undefined,
      model: body.ollamaModel ?? settings.ollamaModel ?? undefined,
      aiResponseFlavor: settings.aiResponseFlavor,
      customAiInstructions: settings.customAiInstructions,
    });

    res.status(200).json({ answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate answer.";
    res.status(502).json({
      error: message,
      hint: "Start Ollama locally or set OLLAMA_BASE_URL and OLLAMA_MODEL.",
    });
  }
}
