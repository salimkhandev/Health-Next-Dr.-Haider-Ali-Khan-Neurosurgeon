/**
 * Safely parses a fetch Response as JSON.
 * Guards against empty bodies (which throw "Unexpected end of JSON input")
 * that can occur during service worker activation races or network errors.
 */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from server (status ${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from server: ${text.slice(0, 120)}`);
  }
}
