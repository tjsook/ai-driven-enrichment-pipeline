import { enrichCompany } from "@/lib/enrichment/enrichCompany";
import { getEnv } from "@/config/env";
import type { CompanyInput, PipelineResult } from "@/types/enrichment";

async function mapWithConcurrency<TInput, TOutput>(
  values: TInput[],
  concurrency: number,
  fn: (value: TInput) => Promise<TOutput>
): Promise<TOutput[]> {
  const results: TOutput[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < values.length) {
      const current = index;
      index += 1;
      results[current] = await fn(values[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

export async function enrichBatch(inputs: CompanyInput[]): Promise<PipelineResult[]> {
  const env = getEnv();
  return mapWithConcurrency(inputs, env.ENRICH_CONCURRENCY, enrichCompany);
}
