// ====================================================================
// Client-side Translation Helper (Secure Server-Side Execution)
// Calls /api/translate which reads GEMINI_API_KEY from server environment
// ====================================================================

export async function translateText(
  text: string
): Promise<{ success: boolean; translatedText: string; error?: string }> {
  if (!text || !text.trim()) {
    return { success: true, translatedText: "" };
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        translatedText: text,
        error: err.error || `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      translatedText: data.translatedText || text,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[translateText error]:", errMsg);
    return {
      success: false,
      translatedText: text,
      error: errMsg,
    };
  }
}
