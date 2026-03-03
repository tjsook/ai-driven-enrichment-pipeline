import type { CompanyInput } from "@/types/enrichment";

export async function fetchWebsiteContext(input: CompanyInput): Promise<string> {
  // TODO: Integrate Firecrawl/Jina Reader/custom scraper.
  return `Website context placeholder for ${input.companyName} (${input.website})`;
}
