import base64
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router


def _restore_auth_from_env() -> None:
    """Write NotebookLM session cookies to disk from env var (for cloud deploy).

    Supports two env vars:
    - NOTEBOOKLM_STORAGE_STATE: base64-encoded storage_state.json
    - NOTEBOOKLM_AUTH_JSON: raw JSON (natively supported by notebooklm-py)
    """
    storage_path = Path.home() / ".notebooklm" / "storage_state.json"
    if storage_path.exists():
        return

    b64 = os.getenv("NOTEBOOKLM_STORAGE_STATE")
    raw = os.getenv("NOTEBOOKLM_AUTH_JSON")
    payload = None

    if b64:
        try:
            payload = base64.b64decode(b64).decode("utf-8")
            json.loads(payload)  # validate
        except Exception as e:
            print(f"[auth] NOTEBOOKLM_STORAGE_STATE decode failed: {e}")
            payload = None
    elif raw:
        try:
            json.loads(raw)
            payload = raw
        except Exception as e:
            print(f"[auth] NOTEBOOKLM_AUTH_JSON parse failed: {e}")
            payload = None

    if payload:
        storage_path.parent.mkdir(parents=True, exist_ok=True)
        storage_path.write_text(payload)
        print(f"[auth] Restored storage_state.json to {storage_path}")
    else:
        print("[auth] No auth env var found — web app will show 'not authenticated'")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _restore_auth_from_env()
    Path("./output").mkdir(exist_ok=True)
    Path("./uploads").mkdir(exist_ok=True)
    yield


app = FastAPI(title="NotebookLM Forge", lifespan=lifespan)

cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
allowed_origins = ["*"] if cors_env == "*" else cors_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
