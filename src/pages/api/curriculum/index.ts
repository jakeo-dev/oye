import type { NextApiRequest, NextApiResponse } from "next";

import { getCurriculumProgressSummary } from "@/server/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const summary = await getCurriculumProgressSummary();
  res.status(200).json(summary);
}
