import { NextResponse } from "next/server";

import { buildEnrichedCsv } from "@/lib/csv/buildEnrichedCsv";
import { parseCsvToInputs } from "@/lib/csv/parseCsv";
import { sendEnrichedCsvEmail } from "@/lib/email/sendEnrichedCsvEmail";
import { enrichBatch } from "@/lib/enrichment/enrichBatch";
import { submitSchema } from "@/lib/validation/submitSchema";
import type { SubmitError, SubmitSuccess } from "@/types/api";

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
    const inputs = parseCsvToInputs(rawCsv);

    if (inputs.length === 0) {
      return NextResponse.json({ error: "CSV has no data rows." }, { status: 400 });
    }

    const enrichedRows = await enrichBatch(inputs);
    const enrichedCsv = buildEnrichedCsv(enrichedRows);

    await sendEnrichedCsvEmail({
      to: email,
      csvContent: enrichedCsv,
      filename: `enriched-${file.name}`
    });

    return NextResponse.json({
      message: "Submitted successfully. Check your email shortly.",
      rowsProcessed: inputs.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
