import type { NextApiRequest, NextApiResponse } from "next";

import { getSettings } from "@/server/database";
import { checkOllamaStatus } from "@/server/ollama";

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
  const status = await checkOllamaStatus(settings);
  res.status(200).json(status);
}
