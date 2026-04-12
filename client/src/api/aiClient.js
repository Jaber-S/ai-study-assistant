const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const API_PATH = `${base}/api/ai`;

export async function requestAi({ text, mode, question }) {
  const res = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, question }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data.result;
}
