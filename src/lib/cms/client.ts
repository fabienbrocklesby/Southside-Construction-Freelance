export type StrapiQueryValue = string | number | boolean | undefined;
export type StrapiQuery = Record<string, StrapiQueryValue>;

const DEFAULT_TIMEOUT_MS = 5000;

export function getStrapiBaseUrl() {
  const raw = import.meta.env.STRAPI_URL;
  return typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";
}

function getStrapiApiToken() {
  const raw = import.meta.env.STRAPI_API_TOKEN;
  return typeof raw === "string" ? raw.trim() : "";
}

function getFetchTimeoutMs() {
  const raw = import.meta.env.CMS_FETCH_TIMEOUT_MS;
  const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function buildUrl(endpoint: string, query: StrapiQuery = {}) {
  const baseUrl = getStrapiBaseUrl();
  if (!baseUrl) return null;

  const url = new URL(endpoint, `${baseUrl}/`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

function warnCmsFallback(label: string, reason: string) {
  console.warn(`CMS unavailable for ${label}; using fallback content. ${reason}`);
}

export async function fetchStrapiData(
  endpoint: string,
  query: StrapiQuery,
  label: string,
): Promise<unknown | null> {
  let url: URL | null = null;
  try {
    url = buildUrl(endpoint, query);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CMS URL.";
    warnCmsFallback(label, message);
    return null;
  }

  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getFetchTimeoutMs());
  const token = getStrapiApiToken();

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });

    if (!response.ok) {
      warnCmsFallback(label, `Received HTTP ${response.status}.`);
      return null;
    }

    const json = (await response.json()) as { data?: unknown };
    return json.data ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    warnCmsFallback(label, message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
