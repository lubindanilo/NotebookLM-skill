from __future__ import annotations

import asyncio
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from .models import AuthStatusResponse, GenerateRequest
from . import jobs
from .notebooklm_runner import run_generation

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path("./uploads")
OUTPUT_DIR = Path("./output")
STORAGE_STATE = Path.home() / ".notebooklm" / "storage_state.json"


@router.get("/auth-status")
async def auth_status() -> AuthStatusResponse:
    if not STORAGE_STATE.exists():
        return AuthStatusResponse(authenticated=False)

    import time
    age_seconds = time.time() - STORAGE_STATE.stat().st_mtime
    age_days = int(age_seconds / 86400)
    warning = None
    if age_days > 7:
        warning = f"Session is {age_days} days old and may have expired. Re-run `notebooklm login` if you get errors."
    return AuthStatusResponse(authenticated=True, age_days=age_days, warning=warning)


@router.post("/upload")
async def upload_file(file: UploadFile):
    UPLOAD_DIR.mkdir(exist_ok=True)
    safe_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    dest = UPLOAD_DIR / safe_name
    content = await file.read()
    dest.write_bytes(content)
    return {"filename": safe_name, "original_name": file.filename, "size": len(content)}


@router.post("/generate")
async def generate(request: GenerateRequest):
    if not request.sources:
        raise HTTPException(400, "At least one source is required")
    if not request.outputs:
        raise HTTPException(400, "At least one output type is required")

    job_id = jobs.create_job(request)
    task = asyncio.create_task(run_generation(job_id, request))
    jobs.update_job(job_id, task=task)
    return {"job_id": job_id}


@router.get("/status/{job_id}")
async def status(job_id: str):
    resp = jobs.get_status_response(job_id)
    if not resp:
        raise HTTPException(404, "Job not found")
    return resp


@router.get("/download/{job_id}/{filename}")
async def download(job_id: str, filename: str):
    from fastapi.responses import FileResponse

    file_path = OUTPUT_DIR / job_id / filename
    if not file_path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(
        str(file_path),
        filename=filename,
        media_type="application/octet-stream",
    )
