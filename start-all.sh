#!/bin/bash

echo "========================================"
echo "  MAGIC - Starting Frontend + Backend"
echo "========================================"
echo ""

# Check if backend is running
echo "Checking backend..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "[OK] Backend is already running on port 5000"
else
    echo "[INFO] Starting backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    sleep 3
fi

# Check if frontend is running
echo "Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "[OK] Frontend is already running on port 5173"
else
    echo "[INFO] Starting frontend..."
    npm run dev &
    FRONTEND_PID=$!
    sleep 3
fi

echo ""
echo "========================================"
echo "  Both servers are running!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Opening browser..."

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5173
fi

echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
wait
