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
  EMAIL_FROM: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional()
  ),
  SMTP_HOST: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).default("smtp.gmail.com")
  ),
  SMTP_PORT: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return 465;
      }
      if (typeof value === "string") {
        return Number(value);
      }
      return value;
    },
    z.number().int().positive().default(465)
  ),
  SMTP_SECURE: z.preprocess(
    (value) => {
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        return value.toLowerCase() === "true";
      }
      return true;
    },
    z.boolean().default(true)
  ),
  SMTP_USER: asOptional,
  SMTP_PASS: asOptional,
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
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    APP_BASE_URL: process.env.APP_BASE_URL,
    JINA_API_KEY: process.env.JINA_API_KEY,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY
  });

  return cachedEnv;
}
