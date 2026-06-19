import type { NextApiRequest, NextApiResponse } from "next";

import { clearSavedLearningData } from "@/server/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const deleted = await clearSavedLearningData();
    res.status(200).json({ deleted });
  } catch {
    res.status(500).json({ error: "Could not delete saved study data." });
  }
}
