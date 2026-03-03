import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  APP_BASE_URL: z.string().url().optional(),
  JINA_API_KEY: z.string().min(1).optional(),
  NEWS_API_KEY: z.string().min(1),
  SERPAPI_API_KEY: z.string().min(1)
});

export const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  APP_BASE_URL: process.env.APP_BASE_URL,
  JINA_API_KEY: process.env.JINA_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY
});
