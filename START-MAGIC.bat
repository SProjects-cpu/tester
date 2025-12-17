@echo off
color 0B
title MAGIC Incubation System - Startup

echo.
echo  ███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗
echo  ████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝
echo  ██╔████╔██║███████║██║  ███╗██║██║     
echo  ██║╚██╔╝██║██╔══██║██║   ██║██║██║     
echo  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗
echo  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝
echo.
echo  Incubation Management System
echo  ================================
echo.

:: Check if this is first run
if not exist backend\data\users.json (
    echo [FIRST RUN DETECTED]
    echo Setting up database and admin user...
    echo.
    cd backend
    node setup-admin.js
    cd ..
    echo.
)

:: Kill existing processes
echo [1] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start backend
echo [2] Starting backend server...
cd backend
start "MAGIC Backend" cmd /k "color 0A && title MAGIC Backend Server && npm start"
cd ..
timeout /t 5 /nobreak >nul

:: Start frontend
echo [3] Starting frontend application...
start "MAGIC Frontend" cmd /k "color 0B && title MAGIC Frontend App && npm run dev"
timeout /t 5 /nobreak >nul

:: Open browser
echo [4] Opening application...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ================================
echo  MAGIC System Started!
echo ================================
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo.
echo  Login Credentials:
echo  ------------------
echo  Username: admin
echo  Password: magic2024
echo.
echo  Two windows opened:
echo  - MAGIC Backend Server
echo  - MAGIC Frontend App
echo.
echo  Keep them running!
echo ================================
echo.
pause
