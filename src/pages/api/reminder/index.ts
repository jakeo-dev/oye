import type { NextApiRequest, NextApiResponse } from "next";

import { getReminderPrompt, sendMacReminderNow } from "@/server/reminders";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const reminder = await sendMacReminderNow();
      res.status(200).json({ reminder });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not send Mac notification.",
      });
    }
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const reminder = await getReminderPrompt();
  res.status(200).json({ reminder });
}
