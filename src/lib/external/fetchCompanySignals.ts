import { env } from "@/config/env";
import { fetchWithTimeout } from "@/lib/utils/http";
import type { CompanyInput } from "@/types/enrichment";

type SerpApiResponse = {
  knowledge_graph?: {
    title?: string;
    type?: string;
    description?: string;
    headquarters?: string;
    founded?: string;
    website?: string;
  };
  organic_results?: Array<{
    title?: string;
    snippet?: string;
    link?: string;
  }>;
};

export async function fetchCompanySignals(input: CompanyInput): Promise<string> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", `${input.companyName} company overview`);
  url.searchParams.set("api_key", env.SERPAPI_API_KEY);
  url.searchParams.set("num", "5");

  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status}`);
  }

  const data = (await response.json()) as SerpApiResponse;

  const kg = data.knowledge_graph
    ? `Knowledge Graph: ${[
        data.knowledge_graph.title,
        data.knowledge_graph.type,
        data.knowledge_graph.description,
        data.knowledge_graph.headquarters,
        data.knowledge_graph.founded,
        data.knowledge_graph.website
      ]
        .filter(Boolean)
        .join(" | ")}`
    : "Knowledge Graph: none";

  const organic = (data.organic_results ?? [])
    .slice(0, 3)
    .map((item, index) => {
      const title = item.title ?? "Untitled";
      const snippet = item.snippet ?? "";
      const link = item.link ?? "";
      return `${index + 1}. ${title} - ${snippet} ${link}`.trim();
    })
    .join("\n");

  return [kg, organic || "Organic results: none"].join("\n");
}
