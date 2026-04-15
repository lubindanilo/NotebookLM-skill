import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
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
