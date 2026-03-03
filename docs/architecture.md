# Architecture Outline

## Request Flow
1. User uploads CSV and email in UI.
2. `POST /api/submit` validates request.
3. CSV is parsed into `CompanyInput[]`.
4. Batch enrichment runs with controlled concurrency.
5. Enriched rows are converted to CSV.
6. CSV is emailed to user via Resend.

## Enrichment Stages
1. Website context fetch
2. External source #1 fetch
3. External source #2 fetch
4. AI call #1: profile extraction
5. AI call #2: insights generation
6. Final row mapping to assignment schema

## Notes
- API call currently performs inline processing.
- For stronger delivery guarantees, move batch execution to background queue.
