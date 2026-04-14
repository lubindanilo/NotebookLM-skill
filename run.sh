#!/bin/bash
# Start both backend and frontend dev servers

cd "$(dirname "$0")"

echo "Starting NotebookLM Forge..."

# Backend
echo "  Backend: http://localhost:8000"
uvicorn app.backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo "  Frontend: http://localhost:5173"
cd app/frontend && npm run dev &
FRONTEND_PID=$!

cd "$(dirname "$0")"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "Press Ctrl+C to stop both servers."
wait
