import { env } from "@/config/env";
import { fetchWithTimeout, normalizeWebsiteUrl } from "@/lib/utils/http";
import type { CompanyInput } from "@/types/enrichment";

export async function fetchWebsiteContext(input: CompanyInput): Promise<string> {
  const websiteUrl = normalizeWebsiteUrl(input.website);
  const readerUrl = `https://r.jina.ai/http://${websiteUrl.replace(/^https?:\/\//, "")}`;

  const response = await fetchWithTimeout(
    readerUrl,
    {
      headers: env.JINA_API_KEY
        ? {
            Authorization: `Bearer ${env.JINA_API_KEY}`
          }
        : undefined
    },
    20000
  );

  if (!response.ok) {
    throw new Error(`Website extraction failed for ${input.companyName}: ${response.status}`);
  }

  const text = (await response.text()).slice(0, 5000);
  if (!text.trim()) {
    throw new Error(`Website extraction returned empty content for ${input.companyName}`);
  }

  return text;
}
