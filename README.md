# NotebookLM Forge

Web app to generate podcasts, videos, quizzes, flashcards and more from any URL, PDF, or text — powered by Google NotebookLM.

![Screenshot](docs/screenshot.png)

## Quick start

```bash
# Install deps
pip install "notebooklm-py[browser]" fastapi uvicorn python-multipart
cd app/frontend && npm install && cd ../..

# Auth with Google (opens browser)
notebooklm login

# Run
./run.sh
```

Then open http://localhost:5173 — drop your files, pick what you want, hit Generate.

## How it works

A FastAPI backend wraps [notebooklm-py](https://github.com/teng-lin/notebooklm-py) to handle async generation jobs with retry logic and progress tracking. The React frontend (Vite + Tailwind) lets you manage sources, configure outputs, and download results.

**Sources** — URLs, YouTube, PDF, DOCX, Google Drive, plain text
**Outputs** — Podcast, Video, Slides, Quiz, Flashcards, Mind Map, Infographic, Report, Study Guide, Data Table

## API

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/api/auth-status` | Check Google session |
| POST | `/api/upload` | Upload source files |
| POST | `/api/generate` | Start a generation job |
| GET | `/api/status/:id` | Poll job progress |
| GET | `/api/download/:id/:file` | Download result |

## Tests

```bash
pytest tests/ -v
```

## License

MIT
