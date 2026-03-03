export type CompanyInput = {
  companyName: string;
  website: string;
};

export type CompanyEnrichment = {
  industry: string;
  subIndustry: string;
  primaryProductService: string;
  targetCustomerIcp: string;
  estimatedCompanySize: string;
  recentNewsSummary: string;
  keyOfferingSummary: string;
  salesAngles: [string, string, string];
  riskSignals: [string, string, string];
  dataSourcesUsed: string;
};

export type PipelineResult = {
  input: CompanyInput;
  enrichment: CompanyEnrichment;
};
