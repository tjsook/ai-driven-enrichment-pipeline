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
- `nodemailer` + Gmail SMTP for email delivery

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
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional override, default `gpt-4.1-mini`)
   - `EMAIL_FROM`
   - `SMTP_HOST` (default `smtp.gmail.com`)
   - `SMTP_PORT` (default `465`)
   - `SMTP_SECURE` (`true` for Gmail 465)
   - `SMTP_USER` (your Gmail address)
   - `SMTP_PASS` (Gmail App Password)
   - `OPENAI_RPM` (OpenAI requests-per-minute limit for throttling, default `3`)
   - `ENRICH_CONCURRENCY` (row processing concurrency, default `1`)
   - `NEWS_API_KEY`
   - `SERPAPI_API_KEY`
   - `JINA_API_KEY` (optional)
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
1. Add retries/backoff around provider calls for production reliability.
2. Add tests for CSV parsing and pipeline mapping.
3. Move processing to a background queue for larger CSVs.
