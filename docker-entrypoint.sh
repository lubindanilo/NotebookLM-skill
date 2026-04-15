#!/bin/bash
set -e

# Decode storage state from env var (base64-encoded storage_state.json)
if [ -n "$NOTEBOOKLM_STORAGE_STATE" ]; then
    mkdir -p ~/.notebooklm
    printf '%s' "$NOTEBOOKLM_STORAGE_STATE" | base64 -d > ~/.notebooklm/storage_state.json
    echo "NotebookLM auth loaded from env"
fi

exec "$@"
