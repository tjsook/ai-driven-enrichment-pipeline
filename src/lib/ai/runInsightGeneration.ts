import { z } from "zod";

import { getEnv } from "@/config/env";
import { runOpenAiCall } from "@/lib/ai/openaiClient";
import type { ProfileExtraction } from "@/lib/ai/runProfileExtraction";

const insightSchema = z.object({
  salesAngles: z.array(z.string().min(1)).length(3),
  riskSignals: z.array(z.string().min(1)).length(3),
  recentNewsSummary: z.string().min(1)
});

export type InsightGeneration = {
  salesAngles: [string, string, string];
  riskSignals: [string, string, string];
  recentNewsSummary: string;
};

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON object");
  }
  return text.slice(start, end + 1);
}

export async function runInsightGeneration(context: {
  companyName: string;
  profile: ProfileExtraction;
  newsSignals: string;
  websiteContext: string;
}): Promise<InsightGeneration> {
  const env = getEnv();
  const completion = await runOpenAiCall((client) =>
    client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a B2B outbound strategist. Return only valid JSON with fields: salesAngles (3 strings), riskSignals (3 strings), recentNewsSummary (string). Angles must be actionable and different. Risk signals should be realistic buying risks or account risks."
        },
        {
          role: "user",
          content: [
            `Company: ${context.companyName}`,
            `Profile: ${JSON.stringify(context.profile)}`,
            "Recent news signals:",
            context.newsSignals,
            "Website context:",
            context.websiteContext
          ].join("\n\n")
        }
      ]
    })
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Model returned empty response for insight generation");
  }

  const parsed = insightSchema.parse(JSON.parse(extractJsonObject(content)));
  return {
    salesAngles: [parsed.salesAngles[0], parsed.salesAngles[1], parsed.salesAngles[2]],
    riskSignals: [parsed.riskSignals[0], parsed.riskSignals[1], parsed.riskSignals[2]],
    recentNewsSummary: parsed.recentNewsSummary
  };
}
