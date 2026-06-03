import type { NextApiRequest, NextApiResponse } from "next";

import {
  getCachedLesson,
  getCurrentCurriculumSection,
  getSettings,
  listLessons,
  saveCachedLesson,
  saveLesson,
} from "@/server/database";
import {
  generateFallbackLesson,
  generateLessonWithOllama,
  getOllamaConfig,
} from "@/server/ollama";
import type { LessonGenerationInput } from "@/server/types";
import type { OllamaGenerationOptions } from "@/lib/ollamaGenerationOptions";

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
      ollamaOptions?: Partial<OllamaGenerationOptions>;
      useFallback?: boolean;
    };

    try {
      const settings = await getSettings();
      const currentCurriculumSection = await getCurrentCurriculumSection();
      const curriculumSectionId =
        body.curriculumSectionId ?? currentCurriculumSection.id;
      const generationInput: LessonGenerationInput = {
        ...body,
        curriculumSectionId,
      };
      const ollamaConfig = getOllamaConfig({
        ...settings,
        ollamaBaseUrl: body.ollamaBaseUrl ?? settings.ollamaBaseUrl,
        ollamaModel: body.ollamaModel ?? settings.ollamaModel,
        ollamaOptions: body.ollamaOptions ?? settings.ollamaOptions,
      });
      if (generationInput.scenarioPresetId) {
        const cachedLesson = await getCachedLesson({
          scenarioPresetId: generationInput.scenarioPresetId,
          curriculumSectionId,
          level: generationInput.level ?? "beginner",
          aiResponseFlavor: settings.aiResponseFlavor,
          customAiInstructions: settings.customAiInstructions,
          ollamaBaseUrl: ollamaConfig.baseUrl,
          ollamaModel: ollamaConfig.model,
          ollamaOptions: ollamaConfig.ollamaOptions,
        });
        if (cachedLesson) {
          await saveLesson(cachedLesson);
          res.status(200).json({ lesson: cachedLesson, cacheHit: true });
          return;
        }
      }

      const lesson = body.useFallback
        ? generateFallbackLesson(generationInput)
        : await generateLessonWithOllama(generationInput, {
            baseUrl: body.ollamaBaseUrl ?? settings.ollamaBaseUrl ?? undefined,
            model: body.ollamaModel ?? settings.ollamaModel ?? undefined,
            ollamaOptions: body.ollamaOptions ?? settings.ollamaOptions,
            aiResponseFlavor: settings.aiResponseFlavor,
            customAiInstructions: settings.customAiInstructions,
          });

      if (generationInput.scenarioPresetId) {
        await saveCachedLesson({
          scenarioPresetId: generationInput.scenarioPresetId,
          curriculumSectionId,
          level: lesson.level,
          aiResponseFlavor: settings.aiResponseFlavor,
          customAiInstructions: settings.customAiInstructions,
          ollamaBaseUrl: ollamaConfig.baseUrl,
          ollamaModel: ollamaConfig.model,
          ollamaOptions: ollamaConfig.ollamaOptions,
          lesson,
        });
      }
      await saveLesson(lesson);
      res.status(201).json({ lesson, cacheHit: false });
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
