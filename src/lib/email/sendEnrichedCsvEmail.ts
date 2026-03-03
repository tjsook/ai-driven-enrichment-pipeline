import { Resend } from "resend";

import { getEnv } from "@/config/env";

export async function sendEnrichedCsvEmail(params: {
  to: string;
  csvContent: string;
  filename?: string;
}): Promise<void> {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Missing required email env vars: RESEND_API_KEY and EMAIL_FROM");
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const filename = params.filename ?? "enriched-companies.csv";

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: "Your enriched company CSV is ready",
    text: "Attached is your enriched CSV.",
    attachments: [
      {
        filename,
        content: Buffer.from(params.csvContent).toString("base64")
      }
    ]
  });
}
