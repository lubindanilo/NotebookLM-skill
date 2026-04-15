#!/bin/bash
set -e

# Decode storage state from env var (base64-encoded storage_state.json)
if [ -n "$NOTEBOOKLM_STORAGE_STATE" ]; then
    mkdir -p ~/.notebooklm
    python -c "
import base64, os
data = base64.b64decode(os.environ['NOTEBOOKLM_STORAGE_STATE'])
with open(os.path.expanduser('~/.notebooklm/storage_state.json'), 'wb') as f:
    f.write(data)
print(f'NotebookLM auth loaded ({len(data)} bytes)')
"
fi

exec "$@"
