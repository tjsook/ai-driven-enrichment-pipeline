import { Resend } from "resend";

import { env } from "@/config/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEnrichedCsvEmail(params: {
  to: string;
  csvContent: string;
  filename?: string;
}): Promise<void> {
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
