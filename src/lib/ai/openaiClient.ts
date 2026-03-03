import OpenAI from "openai";

import { getEnv } from "@/config/env";

const MIN_OPENAI_CALL_INTERVAL_MS = 22_000;
const MAX_RETRIES = 3;

let requestChain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeStatus = (error as { status?: number }).status;
  const maybeMessage = (error as { message?: string }).message;

  if (maybeStatus === 429) {
    return true;
  }

  return typeof maybeMessage === "string" && maybeMessage.toLowerCase().includes("rate limit");
}

async function scheduleOpenAiCall<T>(task: () => Promise<T>): Promise<T> {
  const execute = requestChain.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, MIN_OPENAI_CALL_INTERVAL_MS - (now - lastRequestAt));

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastRequestAt = Date.now();
    return task();
  });

  requestChain = execute.then(
    () => undefined,
    () => undefined
  );

  return execute;
}

export async function runOpenAiCall<T>(task: (client: OpenAI) => Promise<T>): Promise<T> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt += 1;

    try {
      return await scheduleOpenAiCall(() => task(client));
    } catch (error) {
      if (!isRetryableRateLimitError(error) || attempt >= MAX_RETRIES) {
        throw error;
      }

      const backoffMs = attempt * 25_000;
      await sleep(backoffMs);
    }
  }

  throw new Error("OpenAI call failed after retries");
}
