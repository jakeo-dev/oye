import type { NextApiRequest, NextApiResponse } from "next";

import {
  clearConversationMessages,
  getLesson,
  listConversationMessages,
  saveConversationMessages,
} from "@/server/database";
import { generateConversationReply } from "@/server/ollama";
import type { ConversationMessage } from "@/server/types";

function newMessage(
  role: ConversationMessage["role"],
  content: string,
  lessonId: string | null,
): ConversationMessage {
  return {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lessonId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const lessonId =
      typeof req.query.lessonId === "string" ? req.query.lessonId : undefined;
    const messages = await listConversationMessages(lessonId);
    res.status(200).json({ messages });
    return;
  }

  if (req.method === "DELETE") {
    const lessonId =
      typeof req.query.lessonId === "string" ? req.query.lessonId : undefined;
    const deletedCount = await clearConversationMessages(lessonId);
    res.status(200).json({ deletedCount, messages: [] });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      lessonId?: string;
      userText?: string;
      ollamaBaseUrl?: string;
      ollamaModel?: string;
    };
    const userText = body.userText?.trim();

    if (!userText) {
      res.status(400).json({ error: "userText is required." });
      return;
    }

    const lesson = body.lessonId ? await getLesson(body.lessonId) : null;

    try {
      const reply = await generateConversationReply(userText, lesson, {
        baseUrl: body.ollamaBaseUrl,
        model: body.ollamaModel,
      });
      const messages = await saveConversationMessages([
        newMessage("user", userText, body.lessonId ?? null),
        newMessage("assistant", reply, body.lessonId ?? null),
      ]);

      res.status(201).json({ messages, reply });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate reply.";
      res.status(502).json({
        error: message,
        hint: "Start Ollama locally or set OLLAMA_BASE_URL and OLLAMA_MODEL.",
      });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ error: "Method not allowed." });
}
