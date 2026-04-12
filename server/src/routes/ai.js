import { Router } from "express";
import { callOpenRouter, MODE_CONFIG } from "../openRouter.js";

export function createAiRouter({ apiKey, model }) {
  const router = Router();

  router.post("/ai", async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({
        error: "Server is not configured with OPENROUTER_API_KEY.",
      });
    }

    const { text, mode, question } = req.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing or empty 'text'." });
    }

    if (typeof mode !== "string" || !MODE_CONFIG[mode]) {
      return res.status(400).json({
        error: `Invalid 'mode'. Use one of: ${Object.keys(MODE_CONFIG).join(", ")}.`,
      });
    }

    if (mode === "chat") {
      if (typeof question !== "string" || !question.trim()) {
        return res
          .status(400)
          .json({ error: "Chat mode requires a non-empty 'question'." });
      }
    }

    try {
      const result = await callOpenRouter({
        text: text.trim(),
        mode,
        question: typeof question === "string" ? question : "",
        apiKey,
        model,
      });
      res.json({ result });
    } catch (e) {
      const status =
        e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
      console.error("[POST /api/ai]", e.message);
      res.status(status).json({
        error: e.message || "AI request failed.",
      });
    }
  });

  return router;
}
