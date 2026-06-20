import type { NextApiRequest, NextApiResponse } from "next";

import { buildLessonExercises } from "@/lib/lessonExercises";
import {
  getLesson,
  listPracticeAttempts,
  savePracticeAttempt,
} from "@/server/database";
import type { PracticeAttempt } from "@/server/types";

function getId(req: NextApiRequest): string {
  const id = req.query.id;
  return Array.isArray(id) ? id[0] : (id ?? "");
}

function normalizeForScore(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zñáéíóúü\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function uniqueWords(words: string[]): string[] {
  return [...new Set(words)];
}

function scoreTranscript(transcript: string, prompt: string) {
  const said = new Set(normalizeForScore(transcript));
  const expected = normalizeForScore(prompt);
  const missedWords = uniqueWords(expected.filter((word) => !said.has(word)));

  if (expected.length === 0) {
    return {
      score: transcript.trim().length > 0 ? 70 : 0,
      feedback: "Saved. Keep practicing with a complete Spanish phrase.",
      missedWords: [],
    };
  }

  const matched = expected.filter((word) => said.has(word)).length;
  const score = Math.round((matched / expected.length) * 100);

  if (score >= 80) {
    return {
      score,
      feedback: "Strong match. Nice work with the key phrase.",
      missedWords,
    };
  }
  if (score >= 50) {
    return {
      score,
      feedback: "Good start. Try again and include more of the key words.",
      missedWords,
    };
  }
  return {
    score,
    feedback: "Saved. Listen once more, then repeat the full Spanish line.",
    missedWords,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const lessonId = getId(req);
  const lesson = await getLesson(lessonId);

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }

  if (req.method === "GET") {
    const attempts = await listPracticeAttempts(lessonId);
    res.status(200).json({ attempts });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      stepIndex?: number;
      transcript?: string;
    };
    const transcript = body.transcript?.trim();

    if (!transcript) {
      res.status(400).json({ error: "transcript is required." });
      return;
    }

    const steps = buildLessonExercises(lesson);
    const stepIndex = Math.max(
      0,
      Math.min(steps.length - 1, body.stepIndex ?? 0),
    );
    const step = steps[stepIndex];
    const prompt = step?.targetText || lesson.spanishPrompt;
    const result = scoreTranscript(transcript, prompt);
    const attempt: PracticeAttempt = {
      id: `practice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lessonId,
      stepIndex,
      prompt,
      transcript,
      score: result.score,
      feedback: result.feedback,
      missedWords: result.missedWords,
      createdAt: new Date().toISOString(),
    };

    await savePracticeAttempt(attempt);
    res.status(201).json({ attempt });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed." });
}
