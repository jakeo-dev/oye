import type { NextApiRequest, NextApiResponse } from "next";

import {
  getCurrentCurriculumSection,
  getSettings,
  listLessons,
  saveLesson,
} from "@/server/database";
import {
  generateFallbackLesson,
  generateLessonWithOllama,
} from "@/server/ollama";
import type { LessonGenerationInput } from "@/server/types";

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const lessons = await listLessons();
    res.status(200).json({ lessons });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as LessonGenerationInput & {
      ollamaBaseUrl?: string;
      ollamaModel?: string;
      useFallback?: boolean;
    };

    try {
      const settings = await getSettings();
      const currentCurriculumSection = await getCurrentCurriculumSection();
      const generationInput: LessonGenerationInput = {
        ...body,
        curriculumSectionId:
          body.curriculumSectionId ?? currentCurriculumSection.id,
      };
      const lesson = body.useFallback
        ? generateFallbackLesson(generationInput)
        : await generateLessonWithOllama(generationInput, {
            baseUrl: body.ollamaBaseUrl ?? settings.ollamaBaseUrl ?? undefined,
            model: body.ollamaModel ?? settings.ollamaModel ?? undefined,
          });

      await saveLesson(lesson);
      res.status(201).json({ lesson });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate lesson.";
      res.status(502).json({
        error: message,
        hint: "Start Ollama locally or set OLLAMA_BASE_URL and OLLAMA_MODEL.",
      } satisfies ErrorResponse & { hint: string });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed." } satisfies ErrorResponse);
}
