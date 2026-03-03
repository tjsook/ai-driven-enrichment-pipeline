import type { CompanyInput } from "@/types/enrichment";

export async function fetchNewsSignals(input: CompanyInput): Promise<string> {
  // TODO: Integrate news API (NewsAPI, SerpAPI news, GDELT).
  return `No major public signal found for ${input.companyName}.`;
}
