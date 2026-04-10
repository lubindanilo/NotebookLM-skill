from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from notebooklm import NotebookLMClient
from notebooklm.rpc.types import (
    AudioFormat,
    AudioLength,
    VideoFormat,
    VideoStyle,
    ReportFormat,
    QuizDifficulty,
    QuizQuantity,
    InfographicOrientation,
    InfographicDetail,
    InfographicStyle,
    SlideDeckFormat,
    SlideDeckLength,
)

from .models import GenerateRequest, OutputConfig, OutputType, SourceType, FileInfo
from . import jobs

UPLOAD_DIR = Path("./uploads")
OUTPUT_DIR = Path("./output")

# Map string values to enum members
ENUM_MAP = {
    "audio_format": {v.name.lower(): v for v in AudioFormat},
    "audio_length": {v.name.lower(): v for v in AudioLength},
    "video_format": {v.name.lower(): v for v in VideoFormat},
    "video_style": {v.name.lower(): v for v in VideoStyle},
    "report_format": {v.name.lower(): v for v in ReportFormat},
    "quiz_difficulty": {v.name.lower(): v for v in QuizDifficulty},
    "quiz_quantity": {v.name.lower(): v for v in QuizQuantity},
    "infographic_orientation": {v.name.lower(): v for v in InfographicOrientation},
    "infographic_detail": {v.name.lower(): v for v in InfographicDetail},
    "infographic_style": {v.name.lower(): v for v in InfographicStyle},
    "slide_format": {v.name.lower(): v for v in SlideDeckFormat},
    "slide_length": {v.name.lower(): v for v in SlideDeckLength},
}

# Output type -> (extension, download method name)
DOWNLOAD_INFO = {
    OutputType.AUDIO: (".mp3", "download_audio"),
    OutputType.VIDEO: (".mp4", "download_video"),
    OutputType.CINEMATIC_VIDEO: (".mp4", "download_video"),
    OutputType.SLIDES: (".pptx", "download_slide_deck"),
    OutputType.QUIZ: (".md", "download_quiz"),
    OutputType.FLASHCARDS: (".md", "download_flashcards"),
    OutputType.MINDMAP: (".json", "download_mind_map"),
    OutputType.INFOGRAPHIC: (".png", "download_infographic"),
    OutputType.REPORT: (".md", "download_report"),
    OutputType.STUDY_GUIDE: (".md", "download_report"),
    OutputType.DATA_TABLE: (".csv", "download_data_table"),
}


def _resolve_enum(field: str, value: str | None):
    if value is None:
        return None
    mapping = ENUM_MAP.get(field, {})
    return mapping.get(value.lower())


async def _retry_download(fn, *args, max_retries=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return await fn(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** (attempt + 1))


async def _add_source(client, notebook_id: str, src):
    if src.type in (SourceType.URL, SourceType.YOUTUBE):
        return await client.sources.add_url(notebook_id, src.value)
    elif src.type == SourceType.FILE:
        file_path = UPLOAD_DIR / src.value
        return await client.sources.add_file(notebook_id, str(file_path))
    elif src.type == SourceType.TEXT:
        title = src.title or "Pasted text"
        return await client.sources.add_text(notebook_id, title, src.value)
    elif src.type == SourceType.DRIVE:
        mime = src.mime_type or "application/vnd.google-apps.document"
        title = src.title or "Drive document"
        file_id = src.file_id or src.value
        return await client.sources.add_drive(notebook_id, file_id, title, mime)


async def _generate_artifact(client, notebook_id: str, cfg: OutputConfig):
    ot = cfg.output_type
    if ot == OutputType.AUDIO:
        return await client.artifacts.generate_audio(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
            audio_format=_resolve_enum("audio_format", cfg.audio_format),
            audio_length=_resolve_enum("audio_length", cfg.audio_length),
        )
    elif ot == OutputType.VIDEO:
        return await client.artifacts.generate_video(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
            video_format=_resolve_enum("video_format", cfg.video_format),
            video_style=_resolve_enum("video_style", cfg.video_style),
        )
    elif ot == OutputType.CINEMATIC_VIDEO:
        return await client.artifacts.generate_cinematic_video(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
        )
    elif ot == OutputType.REPORT:
        return await client.artifacts.generate_report(
            notebook_id,
            report_format=_resolve_enum("report_format", cfg.report_format) or ReportFormat.BRIEFING_DOC,
            language=cfg.language,
            custom_prompt=cfg.custom_prompt,
            extra_instructions=cfg.extra_instructions or cfg.instructions,
        )
    elif ot == OutputType.STUDY_GUIDE:
        return await client.artifacts.generate_study_guide(
            notebook_id,
            language=cfg.language,
            extra_instructions=cfg.extra_instructions or cfg.instructions,
        )
    elif ot == OutputType.QUIZ:
        return await client.artifacts.generate_quiz(
            notebook_id,
            instructions=cfg.instructions,
            quantity=_resolve_enum("quiz_quantity", cfg.quiz_quantity),
            difficulty=_resolve_enum("quiz_difficulty", cfg.quiz_difficulty),
        )
    elif ot == OutputType.FLASHCARDS:
        return await client.artifacts.generate_flashcards(
            notebook_id,
            instructions=cfg.instructions,
            quantity=_resolve_enum("quiz_quantity", cfg.quiz_quantity),
            difficulty=_resolve_enum("quiz_difficulty", cfg.quiz_difficulty),
        )
    elif ot == OutputType.INFOGRAPHIC:
        return await client.artifacts.generate_infographic(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
            orientation=_resolve_enum("infographic_orientation", cfg.infographic_orientation),
            detail_level=_resolve_enum("infographic_detail", cfg.infographic_detail),
            style=_resolve_enum("infographic_style", cfg.infographic_style),
        )
    elif ot == OutputType.SLIDES:
        return await client.artifacts.generate_slide_deck(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
            slide_format=_resolve_enum("slide_format", cfg.slide_format),
            slide_length=_resolve_enum("slide_length", cfg.slide_length),
        )
    elif ot == OutputType.DATA_TABLE:
        return await client.artifacts.generate_data_table(
            notebook_id,
            language=cfg.language,
            instructions=cfg.instructions,
        )
    elif ot == OutputType.MINDMAP:
        return await client.artifacts.generate_mind_map(notebook_id)


async def run_generation(job_id: str, request: GenerateRequest):
    job_dir = OUTPUT_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        jobs.update_job(job_id, status="adding_sources")

        async with await NotebookLMClient.from_storage() as client:
            # Create notebook
            title = request.notebook_title or "NotebookLM Forge"
            notebook = await client.notebooks.create(title)
            notebook_id = notebook.notebook_id

            # Add all sources
            source_tasks = [_add_source(client, notebook_id, s) for s in request.sources]
            sources = await asyncio.gather(*source_tasks)
            source_ids = [s.source_id for s in sources if s]

            # Wait for sources to be ready
            if source_ids:
                await client.sources.wait_for_sources(notebook_id, source_ids, timeout=300)

            # Generate all artifacts
            jobs.update_job(job_id, status="generating")
            artifacts = {}

            for cfg in request.outputs:
                ot = cfg.output_type.value
                jobs.get_job(job_id).progress[ot] = "generating"
                try:
                    result = await _generate_artifact(client, notebook_id, cfg)
                    artifacts[ot] = result
                except Exception as e:
                    jobs.get_job(job_id).progress[ot] = f"failed: {e}"

            # Wait for completion + download
            jobs.update_job(job_id, status="downloading")

            for cfg in request.outputs:
                ot = cfg.output_type.value
                result = artifacts.get(ot)
                if not result:
                    continue

                # Mind map returns dict directly — write JSON
                if cfg.output_type == OutputType.MINDMAP:
                    filename = f"mindmap{DOWNLOAD_INFO[cfg.output_type][0]}"
                    out_path = str(job_dir / filename)
                    with open(out_path, "w") as f:
                        json.dump(result, f, indent=2)
                    size = os.path.getsize(out_path)
                    jobs.get_job(job_id).files.append(
                        FileInfo(filename=filename, output_type=ot, size=size)
                    )
                    jobs.get_job(job_id).progress[ot] = "completed"
                    continue

                # All other types: wait then download
                try:
                    jobs.get_job(job_id).progress[ot] = "waiting"
                    await client.artifacts.wait_for_completion(
                        notebook_id, result.artifact_id
                    )

                    jobs.get_job(job_id).progress[ot] = "downloading"
                    ext = DOWNLOAD_INFO[cfg.output_type][0]
                    dl_method_name = DOWNLOAD_INFO[cfg.output_type][1]
                    filename = f"{ot}{ext}"
                    out_path = str(job_dir / filename)

                    dl_method = getattr(client.artifacts, dl_method_name)

                    # Build download kwargs
                    dl_kwargs = {"output_path": out_path, "artifact_id": result.artifact_id}
                    if cfg.output_type == OutputType.SLIDES:
                        dl_kwargs["output_format"] = "pptx"
                    elif cfg.output_type in (OutputType.QUIZ, OutputType.FLASHCARDS):
                        dl_kwargs["output_format"] = "markdown"

                    await _retry_download(dl_method, notebook_id, **dl_kwargs)

                    size = os.path.getsize(out_path)
                    jobs.get_job(job_id).files.append(
                        FileInfo(filename=filename, output_type=ot, size=size)
                    )
                    jobs.get_job(job_id).progress[ot] = "completed"
                except Exception as e:
                    jobs.get_job(job_id).progress[ot] = f"failed: {e}"

        jobs.update_job(job_id, status="completed")

    except Exception as e:
        jobs.update_job(job_id, status="failed", error=str(e))
