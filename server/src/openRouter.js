const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_PROVIDER_RETRIES = Math.min(
  4,
  Math.max(0, Number(process.env.OPENROUTER_RETRY_COUNT) || 2)
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Models to try in order: primary + OPENROUTER_FALLBACK_MODELS (comma-separated). */
function resolveModelChain(primary) {
  const extra = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const chain = [];
  for (const m of [primary, ...extra]) {
    if (m && !seen.has(m)) {
      seen.add(m);
      chain.push(m);
    }
  }
  return chain.length ? chain : ["openai/gpt-4o-mini"];
}

function textLooksRateLimited(...parts) {
  const t = parts.filter(Boolean).join(" ");
  return /\brate[- ]?limit|temporarily rate-limited|too many requests|\b429\b/i.test(
    t
  );
}

function rateLimitBackoffMs(attemptIndex) {
  const env = process.env.OPENROUTER_RATE_LIMIT_BACKOFF_MS;
  if (env) {
    const nums = env
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (nums.length)
      return nums[Math.min(attemptIndex, nums.length - 1)];
  }
  const defaults = [5000, 14000, 28000];
  return defaults[Math.min(attemptIndex, defaults.length - 1)];
}

function shouldRetryOpenRouter(httpStatus, apiMessage, data) {
  const blob = JSON.stringify(data ?? {}) + (apiMessage || "");
  if (textLooksRateLimited(blob, apiMessage)) return true;
  const code = data?.error?.code;
  const c = typeof code === "number" ? code : httpStatus;
  if (c === 429) return true;
  if (c === 502 || c === 503 || c === 529) return true;
  if (typeof apiMessage === "string" && /provider returned error/i.test(apiMessage))
    return true;
  return false;
}

function failureWarrantsModelFallback(message) {
  const msg = typeof message === "string" ? message : "";
  return (
    textLooksRateLimited(msg) ||
    /provider returned error|temporarily unavailable|model .*not found|no endpoints found|timeout|overloaded/i.test(
      msg
    )
  );
}

function retryDelayMs(attemptIndex, data, apiMessage) {
  const blob = JSON.stringify(data ?? {}) + (apiMessage || "");
  const slow = textLooksRateLimited(blob, apiMessage) || data?.error?.code === 429;
  return slow ? rateLimitBackoffMs(attemptIndex) : 800 * (attemptIndex + 1);
}

/** Pull a useful message from OpenRouter / upstream (metadata.raw, provider_name, etc.) */
function formatOpenRouterError(data, httpStatus) {
  const e = data?.error;
  const base =
    (typeof e === "object" && e?.message) ||
    (typeof e === "string" ? e : null) ||
    (typeof data?.message === "string" ? data.message : null) ||
    `OpenRouter request failed (${httpStatus})`;

  const meta = typeof e === "object" ? e?.metadata : null;
  const bits = [];
  if (meta?.provider_name) bits.push(`provider ${meta.provider_name}`);
  if (meta?.raw != null) {
    const raw = meta.raw;
    if (typeof raw === "string") bits.push(raw.slice(0, 400));
    else if (typeof raw === "object" && raw?.message)
      bits.push(String(raw.message).slice(0, 400));
    else if (typeof raw === "object")
      bits.push(JSON.stringify(raw).slice(0, 400));
  }

  const code = typeof e === "object" && e?.code != null ? Number(e.code) : httpStatus;
  let msg = bits.length ? `${base} — ${bits.join("; ")}` : base;

  if (code === 401 || httpStatus === 401) {
    msg +=
      " (Unauthorized: check OPENROUTER_API_KEY in your deployment environment; an invalid key often returns 'User not found'.)";
  } else if (code === 403 || httpStatus === 403) {
    msg +=
      " (Forbidden: your OPENROUTER_API_KEY may lack access to this model or requests may be blocked by policy.)";
  }

  const limited =
    code === 429 ||
    httpStatus === 429 ||
    textLooksRateLimited(base, JSON.stringify(meta || {}));

  if (limited) {
    msg +=
      " (Rate limited: wait a bit, or check OpenRouter daily/per-minute limits on free models.)";
  } else if (/provider returned error/i.test(base) || code === 502 || code === 503) {
    msg +=
      " (Often temporary; the server retries with backoff. If it persists, change OPENROUTER_MODEL.)";
  }

  return msg;
}

function parseFlashcards(text) {
  const cards = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  let currentQ = null;
  let currentA = null;
  for (const line of lines) {
    if (line.startsWith('Q:')) {
      if (currentQ && currentA) {
        cards.push({ front: currentQ, back: currentA });
      }
      currentQ = line.substring(2).trim();
      currentA = null;
    } else if (line.startsWith('A:')) {
      currentA = line.substring(2).trim();
    } else if (currentQ && !currentA) {
      // Continue question
      currentQ += ' ' + line;
    } else if (currentA) {
      // Continue answer
      currentA += ' ' + line;
    }
  }
  if (currentQ && currentA) {
    cards.push({ front: currentQ, back: currentA });
  }
  return cards;
}

function extractJson(text) {
  if (!text || typeof text !== "string") return "";
  const fenced = text.match(/```(?:json)?\n([\s\S]*?)```/i);
  if (fenced?.[1]) {
    text = fenced[1];
  }

  const jsonMatch = text.match(/(\[[\s\S]*\])/m);
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }

  return text.trim();
}

function parseQuiz(text) {
  const raw = extractJson(text);
  if (!raw) return [];

  const cleaned = raw.replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("Failed to parse quiz JSON:", e, cleaned);
    return [];
  }
}

const MODE_CONFIG = {
  summary: {
    system: `You are an expert information synthesis specialist. Your goal is to generate dynamic, visually attractive summaries following strict Markdown formatting rules:

**Visual Hierarchy:** Use # for the main title and ## for key sections.

**Emphasis:** Apply **bold** to technical concepts, proper names, and crucial dates. Use *italic* for quotes or terms in other languages.

**Dynamic Lists:** Do not write long paragraphs. Use bullet point lists (*) to explain processes or details.

**Separators:** Use --- to separate distinct thematic sections.

**Highlight Blocks:** If there is an important conclusion, place it in a blockquote (>) at the end.

**Source Constraint:** Summarize ONLY the study material provided—no outside knowledge. Match the language of the material.

Generate valid Markdown (not HTML, not code blocks). Structure clearly with hierarchies, lists, and emphasis.`,
  },
  explanation: {
    system: `You are a study assistant. Explain the ideas found only in the study material in the user message (typed notes and/or uploaded file text). Use simple, clear language and short paragraphs. Do not use outside knowledge. Match the language of the material.`,
  },
  quiz: {
    system: `You are a study assistant. Create a multiple-choice quiz based ONLY on the study material in the user message (no outside knowledge).

Return ONLY valid JSON. The response must be an array of objects with exactly these properties:
- question: the question text as a string
- options: an array of 4 answer options
- answer: the zero-based index of the correct option (0, 1, 2, or 3)

Example output:
[
  {
    "question": "Question text?",
    "options": ["A option", "B option", "C option", "D option"],
    "answer": 0
  }
]

Provide 5–8 questions. Do not include any extra text, markdown, code fences, or explanation.
Return the raw JSON only. Match the language of the material.`,
  },
  flashcards: {
    system: `You are a study assistant. Create flashcards using ONLY the study material in the user message. For each card use exactly:

Q: question
A: answer

One concept per card. Provide 20–30 cards. Do not use outside knowledge. Match the language of the material.`,
  },
  chat: {
    system: `You are a study assistant. Answer using ONLY the study material in the user message (typed notes and/or text from uploaded files). If that material does not contain enough information, say so clearly. Be concise. Match the language of the question and material.`,
  },
};

function buildUserContent(mode, text, question) {
  const scope =
    "The following is the only source you may use (no web, no general knowledge beyond clarifying wording).";
  const block = `STUDY MATERIAL:\n${text}`;
  if (mode === "chat") {
    const q = (question || "").trim();
    return `${scope}\n\n${block}\n\nQUESTION:\n${q || "(No question provided)"}`;
  }
  return `${scope}\n\n${block}`;
}

async function runChatCompletionWithRetries({
  apiKey,
  model,
  messages,
  temperature,
}) {
  const body = JSON.stringify({
    model,
    messages,
    temperature,
  });

  let lastErr;
  for (let attempt = 0; attempt <= MAX_PROVIDER_RETRIES; attempt++) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5173",
        "X-Title": "VibeStudy",
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    const hasApiError = !res.ok || (data && data.error);

    if (hasApiError) {
      const msg = formatOpenRouterError(data, res.status);
      const statusFromApi =
        typeof data?.error?.code === "number"
          ? data.error.code
          : res.status;
      const err = new Error(msg);
      err.status =
        statusFromApi >= 400 && statusFromApi < 600 ? statusFromApi : 502;

      const preview = JSON.stringify(data).slice(0, 1500);
      console.error(
        `[OpenRouter] model=${model} attempt ${attempt + 1}/${MAX_PROVIDER_RETRIES + 1} failed:`,
        preview
      );

      lastErr = err;
      const apiMsg = data?.error?.message;
      if (
        attempt < MAX_PROVIDER_RETRIES &&
        shouldRetryOpenRouter(res.status, apiMsg, data)
      ) {
        const delay = retryDelayMs(attempt, data, apiMsg);
        console.error(`[OpenRouter] retrying in ${delay}ms…`);
        await sleep(delay);
        continue;
      }
      throw err;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Empty response from AI");
    }

    return content.trim();
  }

  throw lastErr || new Error("OpenRouter request failed");
}

export async function callOpenRouter({ text, mode, question, apiKey, model }) {
  const config = MODE_CONFIG[mode];
  if (!config) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  const messages = [
    { role: "system", content: config.system },
    { role: "user", content: buildUserContent(mode, text, question) },
  ];

  const temperature = mode === "chat" ? 0.3 : 0.5;
  const chain = resolveModelChain(model);

  let lastErr;
  for (let i = 0; i < chain.length; i++) {
    const m = chain[i];
    try {
      const result = await runChatCompletionWithRetries({
        apiKey,
        model: m,
        messages,
        temperature,
      });
      if (mode === "flashcards") {
        return parseFlashcards(result);
      }
      if (mode === "quiz") {
        return parseQuiz(result);
      }
      return result;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : "";
      const hasNext = i < chain.length - 1;
      if (hasNext && failureWarrantsModelFallback(msg)) {
        console.warn(
          `[OpenRouter] switching to fallback model after rate limit: ${chain[i + 1]}`
        );
        continue;
      }
      throw e;
    }
  }

  throw lastErr || new Error("OpenRouter request failed");
}

export { MODE_CONFIG };
