import nodemailer from "nodemailer";

import { getEnv } from "@/config/env";

export async function sendEnrichedCsvEmail(params: {
  to: string;
  csvContent: string;
  filename?: string;
}): Promise<void> {
  const env = getEnv();
  if (!env.EMAIL_FROM || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error(
      "Missing required SMTP env vars: EMAIL_FROM, SMTP_USER, and SMTP_PASS"
    );
  }
  const filename = params.filename ?? "enriched-companies.csv";
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: "Your enriched company CSV is ready",
    text: "Attached is your enriched CSV.",
    attachments: [{ filename, content: params.csvContent }]
  });
}
