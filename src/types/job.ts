export const JOB_STAGES = [
  "queued",
  "parsing_csv",
  "enriching_companies",
  "generating_csv",
  "sending_email",
  "completed",
  "failed"
] as const;

export type JobStage = (typeof JOB_STAGES)[number];

export type JobRecord = {
  id: string;
  stage: JobStage;
  progress: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
};
