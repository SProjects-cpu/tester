@echo off
echo ========================================
echo   MAGIC - Starting Frontend + Backend
echo ========================================
echo.

REM Check if backend is already running
echo Checking backend...
curl -s http://localhost:5000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is already running on port 5000
) else (
    echo [INFO] Starting backend...
    start "MAGIC Backend" cmd /k "cd backend && npm run dev"
    timeout /t 3 /nobreak >nul
)

REM Check if frontend is already running
echo Checking frontend...
curl -s http://localhost:5173 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend is already running on port 5173
) else (
    echo [INFO] Starting frontend...
    start "MAGIC Frontend" cmd /k "npm run dev"
    timeout /t 3 /nobreak >nul
)

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173

echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
