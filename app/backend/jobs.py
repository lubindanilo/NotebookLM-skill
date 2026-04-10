from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field

from .models import FileInfo, GenerateRequest, JobStatusResponse


@dataclass
class JobState:
    job_id: str
    status: str = "pending"
    progress: dict[str, str] = field(default_factory=dict)
    files: list[FileInfo] = field(default_factory=list)
    error: str | None = None
    created_at: float = field(default_factory=time.time)
    task: asyncio.Task | None = None


_jobs: dict[str, JobState] = {}


def create_job(request: GenerateRequest) -> str:
    job_id = uuid.uuid4().hex[:12]
    progress = {o.output_type.value: "pending" for o in request.outputs}
    _jobs[job_id] = JobState(job_id=job_id, progress=progress)
    return job_id


def get_job(job_id: str) -> JobState | None:
    return _jobs.get(job_id)


def update_job(job_id: str, **kwargs):
    job = _jobs.get(job_id)
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)


def get_status_response(job_id: str) -> JobStatusResponse | None:
    job = _jobs.get(job_id)
    if not job:
        return None
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        files=job.files,
        error=job.error,
        elapsed=round(time.time() - job.created_at, 1),
    )
