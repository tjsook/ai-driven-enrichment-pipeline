import { runInsightGeneration } from "@/lib/ai/runInsightGeneration";
import { runProfileExtraction } from "@/lib/ai/runProfileExtraction";
import { fetchCompanySignals } from "@/lib/external/fetchCompanySignals";
import { fetchNewsSignals } from "@/lib/external/fetchNewsSignals";
import { fetchWebsiteContext } from "@/lib/external/fetchWebsiteContext";
import type { CompanyInput, PipelineResult } from "@/types/enrichment";

function buildFailedResult(input: CompanyInput, reason: string): PipelineResult {
  return {
    input,
    enrichment: {
      industry: "Unavailable",
      subIndustry: "Unavailable",
      primaryProductService: "Unavailable",
      targetCustomerIcp: "Unavailable",
      estimatedCompanySize: "Unavailable",
      recentNewsSummary: reason,
      keyOfferingSummary: reason,
      salesAngles: ["Unavailable", "Unavailable", "Unavailable"],
      riskSignals: ["Unavailable", "Unavailable", "Unavailable"],
      dataSourcesUsed: "Processing failed"
    }
  };
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function enrichCompany(input: CompanyInput): Promise<PipelineResult> {
  try {
    const [websiteContext, companySignals, newsSignals] = await Promise.all([
      safe(
        () => fetchWebsiteContext(input),
        `Website extraction unavailable for ${input.companyName}.`
      ),
      safe(
        () => fetchCompanySignals(input),
        `Company search signals unavailable for ${input.companyName}.`
      ),
      safe(() => fetchNewsSignals(input), `News signals unavailable for ${input.companyName}.`)
    ]);

    const profile = await runProfileExtraction({
      companyName: input.companyName,
      websiteContext,
      companySignals
    });

    const insights = await runInsightGeneration({
      companyName: input.companyName,
      profile,
      newsSignals,
      websiteContext
    });

    return {
      input,
      enrichment: {
        industry: profile.industry,
        subIndustry: profile.subIndustry,
        primaryProductService: profile.primaryProductService,
        targetCustomerIcp: profile.targetCustomerIcp,
        estimatedCompanySize: profile.estimatedCompanySize,
        recentNewsSummary: insights.recentNewsSummary,
        keyOfferingSummary: profile.keyOfferingSummary,
        salesAngles: insights.salesAngles,
        riskSignals: insights.riskSignals,
        dataSourcesUsed: "Company Website (Jina Reader); NewsAPI; SerpAPI"
      }
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown enrichment failure";
    return buildFailedResult(input, `Enrichment failed: ${reason}`);
  }
}
