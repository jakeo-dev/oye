import type { NextApiRequest, NextApiResponse } from "next";

import { getLesson, getProgress, upsertProgress } from "@/server/database";

function getId(req: NextApiRequest): string {
  const id = req.query.id;
  return Array.isArray(id) ? id[0] : id ?? "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const id = getId(req);
  const lesson = await getLesson(id);

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  if (req.method === "GET") {
    const progress = await getProgress(id);
    res.status(200).json({ lesson, progress });
    return;
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as {
      completed?: boolean;
      lastScore?: number;
    };
    const progress = await upsertProgress(id, {
      completed: body.completed,
      lastScore:
        typeof body.lastScore === "number"
          ? Math.max(0, Math.min(100, body.lastScore))
          : undefined,
    });
    res.status(200).json({ lesson, progress });
    return;
  }

  res.setHeader("Allow", "GET, PATCH");
  res.status(405).json({ error: "Method not allowed." });
}

