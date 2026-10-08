export type JsonFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function fetchJson(url: string, init?: RequestInit, fetcher: JsonFetcher = fetch): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`La fuente de recetas respondió ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
