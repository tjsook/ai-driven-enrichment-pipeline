export type ProfileExtraction = {
  industry: string;
  subIndustry: string;
  primaryProductService: string;
  targetCustomerIcp: string;
  estimatedCompanySize: string;
  keyOfferingSummary: string;
};

export async function runProfileExtraction(context: {
  companyName: string;
  websiteContext: string;
  companySignals: string;
}): Promise<ProfileExtraction> {
  // TODO: First AI call with structured JSON response.
  return {
    industry: "Unknown",
    subIndustry: "Unknown",
    primaryProductService: "Unknown",
    targetCustomerIcp: "Unknown",
    estimatedCompanySize: "Unknown",
    keyOfferingSummary: `Placeholder summary for ${context.companyName}`
  };
}
