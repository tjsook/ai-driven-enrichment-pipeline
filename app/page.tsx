"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const DISPLAY_STEPS = [
  { key: "queued", label: "Job queued" },
  { key: "parsing_csv", label: "Parsing CSV" },
  { key: "enriching_companies", label: "Enriching companies" },
  { key: "generating_csv", label: "Generating CSV" },
  { key: "sending_email", label: "Sending email" },
  { key: "completed", label: "Completed" }
] as const;

type UiJobStage =
  | "queued"
  | "parsing_csv"
  | "enriching_companies"
  | "generating_csv"
  | "sending_email"
  | "completed"
  | "failed";

type JobResponse = {
  id: string;
  stage: UiJobStage;
  progress: number;
  message: string;
  error?: string;
};

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch job status");
        }

        const payload = (await response.json()) as JobResponse;
        if (cancelled) {
          return;
        }

        setJob(payload);

        if (payload.stage === "completed") {
          setLoading(false);
          setStatus(payload.message);
          setJobId(null);
          return;
        }

        if (payload.stage === "failed") {
          setLoading(false);
          setStatus(payload.error ? `Failed: ${payload.error}` : "Processing failed.");
          setJobId(null);
          return;
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setStatus("Unable to fetch job status.");
          setJobId(null);
        }
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  const currentStepIndex = useMemo(() => {
    const stage = job?.stage;
    if (!stage) {
      return -1;
    }

    if (stage === "failed") {
      const fallbackIndex = DISPLAY_STEPS.findIndex((step) => step.key === "enriching_companies");
      return fallbackIndex === -1 ? 0 : fallbackIndex;
    }

    return DISPLAY_STEPS.findIndex((step) => step.key === stage);
  }, [job]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setStatus("Starting job...");
    setJob(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        jobId?: string;
      };

      if (!response.ok || !payload.jobId) {
        setLoading(false);
        setStatus(payload.error ?? "Submission failed.");
        return;
      }

      setStatus(payload.message ?? "Processing started.");
      setJobId(payload.jobId);
      form.reset();
    } catch {
      setLoading(false);
      setStatus("Network error. Please try again.");
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
            {loading ? "Processing..." : "Submit"}
          </button>
        </form>

        {loading && job ? (
          <section className="progress-panel" aria-live="polite">
            <p className="status">{job.message}</p>
            <p className="status progress-percent">Progress: {job.progress}%</p>
            <ul className="steps">
              {DISPLAY_STEPS.map((step, index) => {
                const state =
                  index < currentStepIndex ? "done" : index === currentStepIndex ? "active" : "pending";

                return (
                  <li key={step.key} className={`step step-${state}`}>
                    <span className="step-dot" aria-hidden="true" />
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {status ? <p className="status">{status}</p> : null}
      </section>
    </main>
  );
}
