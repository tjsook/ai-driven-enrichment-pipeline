# AI-Driven Lead Enrichment Pipeline

Minimal skeleton for the take-home assignment workflow:
- Upload CSV
- Enter recipient email
- Enrich each company using website + external sources + multi-step AI
- Email enriched CSV back to user

## Tech Stack
- Next.js (App Router) + TypeScript
- `csv-parse` + `csv-stringify`
- `zod` validation
- `resend` for email delivery

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp .env.example .env.local
   ```
3. Set required values in `.env.local`:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
4. Run:
   ```bash
   npm run dev
   ```

## Current State
This is a scaffold with provider placeholders. The end-to-end wiring is in place:
- UI: `/app/page.tsx`
- API entrypoint: `/app/api/submit/route.ts`
- Pipeline orchestration: `/src/lib/enrichment/*`
- CSV parse/write: `/src/lib/csv/*`
- Email send: `/src/lib/email/sendEnrichedCsvEmail.ts`

## Next Implementation Steps
1. Replace external source stubs under `/src/lib/external`.
2. Implement real AI calls in `/src/lib/ai` with strict JSON schema outputs.
3. Add row-level retries and fallback text when provider calls fail.
4. Add tests for CSV parsing and pipeline mapping.
