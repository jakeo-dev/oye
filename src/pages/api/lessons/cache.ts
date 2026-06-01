import type { NextApiRequest, NextApiResponse } from "next";

import {
  getCachedLesson,
  getCurrentCurriculumSection,
  getSettings,
  saveCachedLesson,
} from "@/server/database";
import { generateLessonWithOllama } from "@/server/ollama";
import type { LessonGenerationInput, LessonLevel } from "@/server/types";

type PresetInput = {
  id?: string;
  scenario?: string;
};

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
    level?: LessonLevel;
    presets?: PresetInput[];
  };
  const presets = Array.isArray(body.presets) ? body.presets : [];
  const level = body.level ?? "beginner";

  if (presets.length === 0) {
    res.status(400).json({ error: "presets are required." });
    return;
  }

  const settings = await getSettings();
  const currentCurriculumSection = await getCurrentCurriculumSection();
  const warmed: string[] = [];
  const cached: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const preset of presets) {
    const scenarioPresetId = preset.id?.trim();
    const scenario = preset.scenario?.trim();
    if (!scenarioPresetId || !scenario) {
      continue;
    }

    try {
      const existing = await getCachedLesson({
        scenarioPresetId,
        curriculumSectionId: currentCurriculumSection.id,
        level,
        aiResponseFlavor: settings.aiResponseFlavor,
        customAiInstructions: settings.customAiInstructions,
      });
      if (existing) {
        cached.push(scenarioPresetId);
        continue;
      }

      const input: LessonGenerationInput = {
        scenario,
        scenarioPresetId,
        level,
        curriculumSectionId: currentCurriculumSection.id,
      };
      const lesson = await generateLessonWithOllama(input, {
        baseUrl: settings.ollamaBaseUrl ?? undefined,
        model: settings.ollamaModel ?? undefined,
        aiResponseFlavor: settings.aiResponseFlavor,
        customAiInstructions: settings.customAiInstructions,
      });
      await saveCachedLesson({
        scenarioPresetId,
        curriculumSectionId: currentCurriculumSection.id,
        level: lesson.level,
        aiResponseFlavor: settings.aiResponseFlavor,
        customAiInstructions: settings.customAiInstructions,
        lesson,
      });
      warmed.push(scenarioPresetId);
    } catch (error) {
      failed.push({
        id: scenarioPresetId,
        error: error instanceof Error ? error.message : "Could not warm cache.",
      });
    }
  }

  res.status(200).json({
    curriculumSectionId: currentCurriculumSection.id,
    level,
    cached,
    warmed,
    failed,
  });
}
