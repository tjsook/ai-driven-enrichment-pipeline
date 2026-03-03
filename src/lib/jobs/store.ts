import { randomUUID } from "crypto";

import type { JobRecord, JobStage } from "@/types/job";

const jobs = new Map<string, JobRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

export function createJob(initialMessage = "Job queued."): JobRecord {
  const timestamp = nowIso();
  const job: JobRecord = {
    id: randomUUID(),
    stage: "queued",
    progress: 0,
    message: initialMessage,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  jobs.set(job.id, job);
  return job;
}

export function updateJob(id: string, stage: JobStage, progress: number, message: string): void {
  const existing = jobs.get(id);
  if (!existing) {
    return;
  }

  jobs.set(id, {
    ...existing,
    stage,
    progress,
    message,
    updatedAt: nowIso()
  });
}

export function failJob(id: string, error: string): void {
  const existing = jobs.get(id);
  if (!existing) {
    return;
  }

  jobs.set(id, {
    ...existing,
    stage: "failed",
    progress: 100,
    message: "Job failed.",
    error,
    updatedAt: nowIso()
  });
}

export function completeJob(id: string, message = "Job completed."): void {
  const existing = jobs.get(id);
  if (!existing) {
    return;
  }

  jobs.set(id, {
    ...existing,
    stage: "completed",
    progress: 100,
    message,
    updatedAt: nowIso()
  });
}

export function getJob(id: string): JobRecord | undefined {
  return jobs.get(id);
}
