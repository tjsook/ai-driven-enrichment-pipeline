import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  APP_BASE_URL: z.string().url().optional(),
  NEWS_API_KEY: z.string().min(1).optional(),
  SEARCH_API_KEY: z.string().min(1).optional()
});

export const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  APP_BASE_URL: process.env.APP_BASE_URL,
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  SEARCH_API_KEY: process.env.SEARCH_API_KEY
});
