import { getEnv } from "@/config/env";
import { runOpenAiCall } from "@/lib/ai/openaiClient";
import { fetchWithTimeout } from "@/lib/utils/http";
import type { CompanyInput } from "@/types/enrichment";

type NewsApiArticle = {
  title?: string;
  description?: string;
  content?: string;
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

type RankedNewsResult = {
  selectedIndex: number;
  summary: string;
};

const MAX_NEWS_AGE_DAYS = 28;
const MAX_CANDIDATES = 20;
const MIN_NEWS_API_INTERVAL_MS = 1200;

let newsApiRequestChain: Promise<void> = Promise.resolve();
let lastNewsApiRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleNewsApiRequest<T>(task: () => Promise<T>): Promise<T> {
  const execute = newsApiRequestChain.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, MIN_NEWS_API_INTERVAL_MS - (now - lastNewsApiRequestAt));
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastNewsApiRequestAt = Date.now();
    return task();
  });

  newsApiRequestChain = execute.then(
    () => undefined,
    () => undefined
  );

  return execute;
}

function safeText(value: string | undefined, fallback = "N/A"): string {
  const text = value?.trim();
  return text && text.length > 0 ? text : fallback;
}

function dedupeArticles(items: NewsApiArticle[]): NewsApiArticle[] {
  const unique = new Map<string, NewsApiArticle>();

  for (const item of items) {
    const key = item.url || item.title || JSON.stringify(item);
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return [...unique.values()];
}

function formatArticleLine(article: NewsApiArticle): string {
  const source = article.source?.name ? ` (${article.source.name})` : "";
  const date = article.publishedAt ? ` ${article.publishedAt.slice(0, 10)}` : "";
  const title = safeText(article.title, "Recent company development identified");
  const description = article.description ? ` - ${article.description}` : "";
  return `${title}${source}${date}${description}`.trim();
}

function isNegativeNoNewsSummary(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("no recent news") ||
    normalized.includes("news signals are unavailable") ||
    normalized.includes("no news signal") ||
    normalized.includes("news unavailable")
  );
}

async function fetchNewsApiCandidates(apiKey: string, query: string): Promise<NewsApiArticle[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("searchIn", "title,description,content");
  url.searchParams.set("pageSize", String(MAX_CANDIDATES));

  const since = new Date(Date.now() - MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  url.searchParams.set("from", since);

  const response = await scheduleNewsApiRequest(() =>
    fetchWithTimeout(url.toString(), {
      headers: {
        "X-Api-Key": apiKey
      }
    })
  );

  if (!response.ok) {
    const errorBody = await response.text();
    const compactBody = errorBody.replace(/\s+/g, " ").slice(0, 220);
    throw new Error(
      `News API request failed (${response.status}) for query "${query}": ${compactBody}`
    );
  }

  const data = (await response.json()) as NewsApiResponse;
  if (data.status !== "ok") {
    throw new Error(
      `News API returned non-ok status for query "${query}": ${data.message ?? "unknown error"}`
    );
  }

  return data.articles ?? [];
}

async function rankAndSummarizeWithGpt(
  input: CompanyInput,
  articles: NewsApiArticle[]
): Promise<RankedNewsResult> {
  const env = getEnv();

  const articleContext = articles
    .map((article, index) => {
      return [
        `[${index}]`,
        `Title: ${safeText(article.title)}`,
        `Source: ${safeText(article.source?.name)}`,
        `Published: ${safeText(article.publishedAt)}`,
        `URL: ${safeText(article.url)}`,
        `Description: ${safeText(article.description)}`,
        `Content: ${safeText(article.content)}`
      ].join("\n");
    })
    .join("\n\n");

  const completion = await runOpenAiCall((client) =>
    client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are selecting the single most relevant company-development news item. Return JSON only with keys: selectedIndex (integer) and summary (string). summary must be 1-2 factual sentences and mention concrete development details from the selected article."
        },
        {
          role: "user",
          content: [
            `Company: ${input.companyName}`,
            "Pick the best-matching article about this company and summarize it.",
            "Candidate articles:",
            articleContext
          ].join("\n\n")
        }
      ]
    })
  );

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Model returned empty response for news ranking");
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON object for news ranking");
  }

  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    selectedIndex?: number;
    summary?: string;
  };

  const selectedIndex =
    typeof parsed.selectedIndex === "number" &&
    Number.isFinite(parsed.selectedIndex) &&
    parsed.selectedIndex >= 0 &&
    parsed.selectedIndex < articles.length
      ? Math.floor(parsed.selectedIndex)
      : 0;

  const summary = safeText(parsed.summary, "Recent company development identified.");

  return {
    selectedIndex,
    summary
  };
}

export async function fetchNewsSignals(input: CompanyInput): Promise<string> {
  const env = getEnv();
  const newsApiKey = env.NEWS_API_KEY;
  if (!newsApiKey) {
    throw new Error("Missing NEWS_API_KEY");
  }

  const strictQuery = `"${input.companyName}"`;
  const broadQuery = `${input.companyName} company update OR ${input.companyName} announced`;

  const [strictResults, broadResults] = await Promise.all([
    fetchNewsApiCandidates(newsApiKey, strictQuery),
    fetchNewsApiCandidates(newsApiKey, broadQuery)
  ]);

  const candidates = dedupeArticles([...strictResults, ...broadResults]).filter(
    (article) => article.title || article.description
  );

  if (candidates.length === 0) {
    return `No recent news signal found for ${input.companyName}.`;
  }

  const topCandidates = candidates.slice(0, 10);
  const guaranteedFallback = formatArticleLine(topCandidates[0]);

  try {
    const ranked = await rankAndSummarizeWithGpt(input, topCandidates);
    const selected = topCandidates[ranked.selectedIndex] ?? topCandidates[0];
    const source = selected.source?.name ? ` (${selected.source.name})` : "";
    const date = selected.publishedAt ? ` ${selected.publishedAt.slice(0, 10)}` : "";
    const summaryWithSource = `${ranked.summary}${source}${date}`.trim();
    return isNegativeNoNewsSummary(summaryWithSource) ? guaranteedFallback : summaryWithSource;
  } catch {
    return guaranteedFallback;
  }
}
