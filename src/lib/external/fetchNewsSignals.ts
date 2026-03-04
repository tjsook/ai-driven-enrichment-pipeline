import { getEnv } from "@/config/env";
import { fetchWithTimeout } from "@/lib/utils/http";
import type { CompanyInput } from "@/types/enrichment";

type NewsApiArticle = {
  title?: string;
  description?: string;
  url?: string;
  source?: { name?: string };
  publishedAt?: string;
};

type NewsApiResponse = {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  message?: string;
};

type SerpNewsResponse = {
  news_results?: Array<{
    title?: string;
    snippet?: string;
    source?: { name?: string } | string;
    date?: string;
    link?: string;
  }>;
};

function formatNewsApi(items: NewsApiArticle[]): string {
  return items
    .slice(0, 3)
    .map((item, index) => {
      const source = item.source?.name ? ` (${item.source.name})` : "";
      const date = item.publishedAt ? ` ${item.publishedAt.slice(0, 10)}` : "";
      const title = item.title ?? "Untitled";
      const description = item.description ? ` - ${item.description}` : "";
      return `${index + 1}. ${title}${source}${date}${description}`;
    })
    .join("\n");
}

function formatSerpNews(items: NonNullable<SerpNewsResponse["news_results"]>): string {
  return items
    .slice(0, 3)
    .map((item, index) => {
      const sourceName =
        typeof item.source === "string" ? item.source : (item.source?.name ?? "Unknown source");
      const source = sourceName ? ` (${sourceName})` : "";
      const date = item.date ? ` ${item.date}` : "";
      const title = item.title ?? "Untitled";
      const snippet = item.snippet ? ` - ${item.snippet}` : "";
      return `${index + 1}. ${title}${source}${date}${snippet}`;
    })
    .join("\n");
}

async function fetchNewsApiCandidates(apiKey: string, query: string): Promise<NewsApiArticle[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "X-Api-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`News API request failed: ${response.status}`);
  }

  const data = (await response.json()) as NewsApiResponse;
  if (data.status !== "ok") {
    throw new Error(data.message ?? "News API returned non-ok status");
  }

  return data.articles ?? [];
}

async function fetchSerpNews(apiKey: string, query: string): Promise<string | null> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);

  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as SerpNewsResponse;
  const items = data.news_results ?? [];
  if (items.length === 0) {
    return null;
  }

  return formatSerpNews(items);
}

export async function fetchNewsSignals(input: CompanyInput): Promise<string> {
  const env = getEnv();
  const newsApiKey = env.NEWS_API_KEY;
  if (!newsApiKey) {
    throw new Error("Missing NEWS_API_KEY");
  }

  const strictQuery = `"${input.companyName}"`;
  const broadQuery = `${input.companyName} company news`;

  const [strictResults, broadResults] = await Promise.all([
    fetchNewsApiCandidates(newsApiKey, strictQuery),
    fetchNewsApiCandidates(newsApiKey, broadQuery)
  ]);

  const merged = new Map<string, NewsApiArticle>();
  for (const item of [...strictResults, ...broadResults]) {
    const key = item.url || item.title || JSON.stringify(item);
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  }

  const candidates = [...merged.values()].filter(
    (item) => Boolean(item.title) || Boolean(item.description)
  );

  if (candidates.length > 0) {
    return formatNewsApi(candidates);
  }

  if (env.SERPAPI_API_KEY) {
    const serp = await fetchSerpNews(env.SERPAPI_API_KEY, `${input.companyName} company news`);
    if (serp) {
      return serp;
    }
  }

  return `No recent news signal found for ${input.companyName}.`;
}
