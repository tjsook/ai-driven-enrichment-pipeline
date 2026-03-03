"use client";

import { FormEvent, useEffect, useState } from "react";

const LOADING_STEPS = [
  "Parsing CSV",
  "Validating company rows",
  "Fetching website context",
  "Loading external data sources",
  "Running AI enrichment",
  "Building enriched CSV",
  "Sending email"
] as const;

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % LOADING_STEPS.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setStatus("Submitting job...");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus(payload.error ?? "Submission failed.");
        return;
      }

      setStatus(payload.message ?? "Submitted. Check your email shortly.");
      form.reset();
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>AI-Driven Lead Enrichment</h1>
        <p>Upload the CSV template and recipient email. We will enrich it and email the result.</p>

        <form onSubmit={onSubmit}>
          <label>
            CSV File
            <input name="file" type="file" accept=".csv,text/csv" required />
          </label>

          <label>
            Recipient Email
            <input name="email" type="email" placeholder="you@company.com" required />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Submit"}
          </button>
        </form>

        {loading ? (
          <p className="status loading-status">
            {LOADING_STEPS[loadingStepIndex]}
            <span className="dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        ) : null}

        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
