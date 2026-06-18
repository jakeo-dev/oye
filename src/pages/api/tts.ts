import type { NextApiRequest, NextApiResponse } from "next";

import {
  normalizePiperText,
  PiperError,
  synthesizePiperSpeech,
} from "@/server/piper";

type ErrorResponse = {
  details?: string;
  error: string;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20kb",
    },
    responseLimit: "8mb",
  },
};

function getRequestText(req: NextApiRequest): string {
  if (req.method === "GET") {
    return normalizePiperText(req.query.text);
  }

  const body = (req.body ?? {}) as { text?: unknown };
  return normalizePiperText(body.text);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer | ErrorResponse>,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const text = getRequestText(req);
    const audio = await synthesizePiperSpeech(text);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (error) {
    if (error instanceof PiperError) {
      res.status(error.statusCode).json({
        details: error.details,
        error: error.message,
      });
      return;
    }

    res.status(500).json({ error: "Could not synthesize speech." });
  }
}
