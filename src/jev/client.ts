import { JEV_TIMEOUT_MS } from "./questions";
import type { JevRequest } from "./rank";

const JEV_URL = "https://api.typesafe.ai/v1/systemone";

export function jevApiKey(): string | undefined {
  return process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || undefined;
}

export async function callJev(
  body: JevRequest,
  opts: { apiKey?: string; timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<Record<string, any>> {
  const apiKey = opts.apiKey ?? jevApiKey();
  if (!apiKey) {
    throw new Error("missing TYPESAFE_API_KEY");
  }
  const timeoutMs = opts.timeoutMs ?? JEV_TIMEOUT_MS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchImpl(JEV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    if (!res.ok) {
      throw new Error(`jev http ${res.status}`);
    }
    const json = (await res.json()) as { answers?: Record<string, any> };
    if (!json.answers) {
      throw new Error("jev missing answers");
    }
    return json.answers;
  } finally {
    clearTimeout(t);
  }
}
