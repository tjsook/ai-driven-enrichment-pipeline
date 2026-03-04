"use client";

import { FormEvent, useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setElapsedSeconds(0);
    setLoading(true);
    setStatus("Loading...");

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
            <input name="file" type="file" accept=".csv,text/csv" required disabled={loading} />
          </label>

          <label>
            Recipient Email
            <input
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              disabled={loading}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? `Loading... ${elapsedSeconds}s` : "Submit"}
          </button>
        </form>

        {!loading && status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
