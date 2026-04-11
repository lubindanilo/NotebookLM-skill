import type { AuthStatus, JobStatus, SourceInput, OutputConfig } from "./types";

const BASE = "/api";

export async function getAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${BASE}/auth-status`);
  return res.json();
}

export async function uploadFile(file: File): Promise<{ filename: string; original_name: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function generate(
  sources: SourceInput[],
  outputs: OutputConfig[],
  notebookTitle?: string
): Promise<{ job_id: string }> {
  const body = {
    sources: sources.map(({ id, originalName, ...rest }) => rest),
    outputs,
    notebook_title: notebookTitle,
  };
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Generation failed");
  }
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/status/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}

export function getDownloadUrl(jobId: string, filename: string): string {
  return `${BASE}/download/${jobId}/${filename}`;
}
