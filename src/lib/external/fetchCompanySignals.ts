import type { CompanyInput } from "@/types/enrichment";

export async function fetchCompanySignals(input: CompanyInput): Promise<string> {
  // TODO: Integrate second non-LLM external source (search/enrichment provider).
  return `General company signal placeholder for ${input.companyName}.`;
}
