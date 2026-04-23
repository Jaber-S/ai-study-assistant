module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

  if (!apiKey) {
    return res.status(500).json({
      error: "Server is not configured with OPENROUTER_API_KEY.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body." });
    }
  }

  const { text, mode, question } = body || {};

  const { callOpenRouter, MODE_CONFIG } = await import("../server/src/openRouter.js");

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
    return res.status(200).json({ result });
  } catch (e) {
    const status = e && e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
    console.error("[POST /api/ai]", e && e.message ? e.message : e);
    return res.status(status).json({
      error: e && e.message ? e.message : "AI request failed.",
    });
  }
};
