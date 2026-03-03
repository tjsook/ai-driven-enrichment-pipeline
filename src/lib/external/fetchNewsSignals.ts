import { env } from "@/config/env";
import { fetchWithTimeout } from "@/lib/utils/http";
import type { CompanyInput } from "@/types/enrichment";

type NewsApiArticle = {
  title?: string;
  description?: string;
  source?: { name?: string };
  publishedAt?: string;
};

type NewsApiResponse = {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  message?: string;
};

export async function fetchNewsSignals(input: CompanyInput): Promise<string> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", `"${input.companyName}"`);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "3");

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "X-Api-Key": env.NEWS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`News API request failed: ${response.status}`);
  }

  const data = (await response.json()) as NewsApiResponse;
  if (data.status !== "ok") {
    throw new Error(data.message ?? "News API returned non-ok status");
  }

  const items = (data.articles ?? []).slice(0, 3);
  if (items.length === 0) {
    return `No recent high-confidence news hits found for ${input.companyName}.`;
  }

  return items
    .map((item, index) => {
      const source = item.source?.name ? ` (${item.source.name})` : "";
      const date = item.publishedAt ? ` ${item.publishedAt.slice(0, 10)}` : "";
      const title = item.title ?? "Untitled";
      const description = item.description ? ` - ${item.description}` : "";
      return `${index + 1}. ${title}${source}${date}${description}`;
    })
    .join("\n");
}
