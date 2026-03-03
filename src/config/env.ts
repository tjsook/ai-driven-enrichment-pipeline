import { z } from "zod";

const asOptional = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}, z.string().min(1).optional());

const envSchema = z.object({
  OPENAI_API_KEY: asOptional,
  OPENAI_MODEL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).default("gpt-4.1-mini")
  ),
  RESEND_API_KEY: asOptional,
  EMAIL_FROM: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional()
  ),
  APP_BASE_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional()
  ),
  JINA_API_KEY: asOptional,
  NEWS_API_KEY: asOptional,
  SERPAPI_API_KEY: asOptional
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    APP_BASE_URL: process.env.APP_BASE_URL,
    JINA_API_KEY: process.env.JINA_API_KEY,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY
  });

  return cachedEnv;
}
