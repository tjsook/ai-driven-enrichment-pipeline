import { runInsightGeneration } from "@/lib/ai/runInsightGeneration";
import { runProfileExtraction } from "@/lib/ai/runProfileExtraction";
import { fetchCompanySignals } from "@/lib/external/fetchCompanySignals";
import { fetchNewsSignals } from "@/lib/external/fetchNewsSignals";
import { fetchWebsiteContext } from "@/lib/external/fetchWebsiteContext";
import type { CompanyInput, PipelineResult } from "@/types/enrichment";

export async function enrichCompany(input: CompanyInput): Promise<PipelineResult> {
  const [websiteContext, companySignals, newsSignals] = await Promise.all([
    fetchWebsiteContext(input),
    fetchCompanySignals(input),
    fetchNewsSignals(input)
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
      dataSourcesUsed: "Company Website; External Source #1; External Source #2"
    }
  };
}
