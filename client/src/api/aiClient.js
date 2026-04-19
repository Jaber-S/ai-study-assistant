const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
const API_PATH = `${base}/api/ai`;

export async function requestAi({ text, mode, question }) {
  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode, question }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Show user-friendly message instead of technical error
      if (res.status === 502 || res.status === 503 || res.status === 429) {
        throw new Error("El servidor de IA está saturado. Por favor, reintenta en unos segundos.");
      }
      
      const message =
        typeof data.error === "string"
          ? data.error
          : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data.result;
  } catch (error) {
    // Catch network errors and other failures
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("No se puede conectar con el servidor. Verifica tu conexión a internet.");
    }
    
    if (error.message === "El servidor de IA está saturado. Por favor, reintenta en unos segundos.") {
      throw error;
    }
    
    throw error instanceof Error 
      ? error 
      : new Error("Error desconocido al procesar tu solicitud.");
  }
}
