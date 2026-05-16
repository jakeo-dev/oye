import type { NextApiRequest, NextApiResponse } from "next";

import { getProgressSummary } from "@/server/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const summary = await getProgressSummary();
    res.status(200).json(summary);
  } catch {
    res.status(500).json({ error: "Could not read progress." });
  }
}
