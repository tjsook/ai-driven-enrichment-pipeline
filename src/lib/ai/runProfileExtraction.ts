import { z } from "zod";

import { getEnv } from "@/config/env";
import { runOpenAiCall } from "@/lib/ai/openaiClient";

const profileSchema = z.object({
  industry: z.string().min(1),
  subIndustry: z.string().min(1),
  primaryProductService: z.string().min(1),
  targetCustomerIcp: z.string().min(1),
  estimatedCompanySize: z.string().min(1),
  keyOfferingSummary: z.string().min(1)
});

export type ProfileExtraction = z.infer<typeof profileSchema>;

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON object");
  }
  return text.slice(start, end + 1);
}

export async function runProfileExtraction(context: {
  companyName: string;
  websiteContext: string;
  companySignals: string;
}): Promise<ProfileExtraction> {
  const env = getEnv();
  const completion = await runOpenAiCall((client) =>
    client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a B2B sales research analyst. Return only valid JSON with fields: industry, subIndustry, primaryProductService, targetCustomerIcp, estimatedCompanySize, keyOfferingSummary. Keep each field concise and factual."
        },
        {
          role: "user",
          content: [
            `Company: ${context.companyName}`,
            "Website context:",
            context.websiteContext,
            "External company signals:",
            context.companySignals
          ].join("\n\n")
        }
      ]
    })
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Model returned empty response for profile extraction");
  }

  const parsed = JSON.parse(extractJsonObject(content));
  return profileSchema.parse(parsed);
}
