import { NextResponse } from "next/server";

import { buildEnrichedCsv } from "@/lib/csv/buildEnrichedCsv";
import { parseCsvToInputs } from "@/lib/csv/parseCsv";
import { sendEnrichedCsvEmail } from "@/lib/email/sendEnrichedCsvEmail";
import { enrichBatch } from "@/lib/enrichment/enrichBatch";
import { completeJob, createJob, failJob, updateJob } from "@/lib/jobs/store";
import { submitSchema } from "@/lib/validation/submitSchema";
import type { SubmitError, SubmitSuccess } from "@/types/api";

async function runJob(params: {
  jobId: string;
  email: string;
  rawCsv: string;
  filename: string;
}): Promise<void> {
  const { jobId, email, rawCsv, filename } = params;

  try {
    updateJob(jobId, "parsing_csv", 10, "Parsing CSV...");
    const inputs = parseCsvToInputs(rawCsv);

    if (inputs.length === 0) {
      throw new Error("CSV has no data rows.");
    }

    updateJob(jobId, "enriching_companies", 20, `Enriching 0/${inputs.length} companies...`);
    const enrichedRows = await enrichBatch(inputs, {
      onProgress: (completed, total) => {
        const progress = Math.min(85, 20 + Math.floor((completed / total) * 60));
        updateJob(
          jobId,
          "enriching_companies",
          progress,
          `Enriching ${completed}/${total} companies...`
        );
      }
    });

    updateJob(jobId, "generating_csv", 90, "Generating enriched CSV...");
    const enrichedCsv = buildEnrichedCsv(enrichedRows);

    updateJob(jobId, "sending_email", 95, "Sending email...");
    await sendEnrichedCsvEmail({
      to: email,
      csvContent: enrichedCsv,
      filename: `enriched-${filename}`
    });

    completeJob(jobId, "Done. Enriched CSV emailed successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected job error";
    failJob(jobId, message);
  }
}

export async function POST(request: Request): Promise<NextResponse<SubmitSuccess | SubmitError>> {
  try {
    const formData = await request.formData();
    const email = formData.get("email");
    const file = formData.get("file");

    if (!(file instanceof File) || typeof email !== "string") {
      return NextResponse.json({ error: "Both file and email are required." }, { status: 400 });
    }

    submitSchema.parse({
      email,
      filename: file.name
    });

    const rawCsv = await file.text();
    const job = createJob("Job queued.");

    void runJob({
      jobId: job.id,
      email,
      rawCsv,
      filename: file.name
    });

    return NextResponse.json({
      message: "Submission received. Processing has started.",
      jobId: job.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
