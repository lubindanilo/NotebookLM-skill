#!/bin/bash
# Auth restoration is handled by app/backend/main.py on FastAPI startup.
# It reads NOTEBOOKLM_STORAGE_STATE (base64) or NOTEBOOKLM_AUTH_JSON (raw).
exec "$@"
