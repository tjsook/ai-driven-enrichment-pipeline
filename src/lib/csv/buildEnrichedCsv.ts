import { stringify } from "csv-stringify/sync";

import { REQUIRED_HEADERS } from "@/types/csv";
import type { PipelineResult } from "@/types/enrichment";

export function buildEnrichedCsv(results: PipelineResult[]): string {
  const rows = results.map(({ input, enrichment }) => ({
    "Company Name": input.companyName,
    Website: input.website,
    Industry: enrichment.industry,
    "Sub-Industry": enrichment.subIndustry,
    "Primary Product / Service": enrichment.primaryProductService,
    "Target Customer (ICP)": enrichment.targetCustomerIcp,
    "Estimated Company Size": enrichment.estimatedCompanySize,
    "Recent News Summary": enrichment.recentNewsSummary,
    "Key Offering Summary": enrichment.keyOfferingSummary,
    "Sales Angle 1": enrichment.salesAngles[0],
    "Sales Angle 2": enrichment.salesAngles[1],
    "Sales Angle 3": enrichment.salesAngles[2],
    "Risk Signal 1": enrichment.riskSignals[0],
    "Risk Signal 2": enrichment.riskSignals[1],
    "Risk Signal 3": enrichment.riskSignals[2],
    "Data Sources Used": enrichment.dataSourcesUsed
  }));

  return stringify(rows, {
    header: true,
    columns: REQUIRED_HEADERS
  });
}
