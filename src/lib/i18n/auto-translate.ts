// ====================================================================
// Client-side Translation Helper
// Calls /api/translate with optional user-supplied Gemini API key
// ====================================================================

export async function translateText(
  text: string,
  userApiKey?: string
): Promise<{ success: boolean; translatedText: string; error?: string }> {
  if (!text || !text.trim()) {
    return { success: true, translatedText: "" };
  }

  try {
    const key =
      userApiKey ||
      (typeof window !== "undefined"
        ? localStorage.getItem("taskflow_gemini_api_key") || ""
        : "");

    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        apiKey: key,
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
