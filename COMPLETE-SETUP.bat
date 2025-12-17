@echo off
setlocal enabledelayedexpansion
color 0A

echo ========================================
echo   MAGIC Incubation System - Complete Setup
echo ========================================
echo.
echo This script will:
echo [1] Check all dependencies
echo [2] Setup database with admin user
echo [3] Clear any invalid tokens
echo [4] Start backend server
echo [5] Start frontend application
echo [6] Open application in browser
echo.
echo Press any key to start...
pause >nul
cls

:: Step 1: Check Node.js
echo ========================================
echo [1/6] Checking Node.js...
echo ========================================
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
node --version
echo.

:: Step 2: Check npm
echo ========================================
echo [2/6] Checking npm...
echo ========================================
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm is installed
npm --version
echo.

:: Step 3: Install dependencies
echo ========================================
echo [3/6] Installing dependencies...
echo ========================================

echo Installing backend dependencies...
cd backend
if not exist node_modules (
    echo Running npm install in backend...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] Backend dependencies already installed
)
cd ..

echo.
echo Installing frontend dependencies...
if not exist node_modules (
    echo Running npm install in root...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies already installed
)
echo.

:: Step 4: Setup database and create admin user
echo ========================================
echo [4/6] Setting up database...
echo ========================================
cd backend
echo Creating admin user...
call node setup-admin.js
if errorlevel 1 (
    echo [WARNING] Admin setup had issues, but continuing...
)
cd ..
echo.

:: Step 5: Kill any existing processes on ports
echo ========================================
echo [5/6] Cleaning up ports...
echo ========================================
echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000...
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5173...
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Ports cleaned
echo.

:: Step 6: Start backend server
echo ========================================
echo [6/6] Starting servers...
echo ========================================
echo Starting backend server on port 5000...
cd backend
start "MAGIC Backend Server" cmd /k "npm start"
cd ..

:: Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Check if backend is running
echo Checking backend health...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend might not be ready yet, waiting more...
    timeout /t 5 /nobreak >nul
)

echo.
echo Starting frontend application on port 5173...
start "MAGIC Frontend App" cmd /k "npm run dev"

:: Wait for frontend to start
echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: magic2024
echo   Email:    admin@magic.com
echo.
echo Opening application in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo ========================================
echo   Important Notes:
echo ========================================
echo.
echo 1. Two command windows will open:
echo    - MAGIC Backend Server (port 5000)
echo    - MAGIC Frontend App (port 5173)
echo.
echo 2. DO NOT CLOSE these windows!
echo    They are running your servers.
echo.
echo 3. To stop the application:
echo    - Close both server windows
echo    - Or press Ctrl+C in each window
echo.
echo 4. To restart:
echo    - Run this script again: COMPLETE-SETUP.bat
echo.
echo 5. If you see "Session expired":
echo    - Just login again with admin/magic2024
echo.
echo ========================================
echo   Troubleshooting:
echo ========================================
echo.
echo If you see errors:
echo 1. Close all server windows
echo 2. Run: COMPLETE-SETUP.bat again
echo 3. Check README.md for more help
echo.
echo Press any key to close this window...
pause >nul
