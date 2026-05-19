import type { NextApiRequest, NextApiResponse } from "next";

import {
  devCompleteCurrentCurriculumSection,
  devReopenPreviousCurriculumSection,
  getCurriculumProgressSummary,
} from "@/server/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ error: "Not found." });
      return;
    }

    const body = (req.body ?? {}) as { action?: string };
    if (body.action === "dev-complete-current-section") {
      const summary = await devCompleteCurrentCurriculumSection();
      res.status(200).json(summary);
      return;
    }

    if (body.action === "dev-reopen-previous-section") {
      const summary = await devReopenPreviousCurriculumSection();
      res.status(200).json(summary);
      return;
    }

    res.status(400).json({ error: "Unsupported curriculum action." });
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const summary = await getCurriculumProgressSummary();
  res.status(200).json(summary);
}
