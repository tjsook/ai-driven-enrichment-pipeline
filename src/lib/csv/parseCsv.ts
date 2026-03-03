import { parse } from "csv-parse/sync";

import { REQUIRED_HEADERS, type CsvHeader, type CsvRow } from "@/types/csv";
import type { CompanyInput } from "@/types/enrichment";

function assertHeaders(headers: string[]): asserts headers is CsvHeader[] {
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw new Error(`Missing required headers: ${missing.join(", ")}`);
  }
}

export function parseCsvToInputs(rawCsv: string): CompanyInput[] {
  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as CsvRow[];

  if (records.length === 0) {
    return [];
  }

  assertHeaders(Object.keys(records[0]));

  return records.map((row) => ({
    companyName: row["Company Name"],
    website: row.Website
  }));
}
