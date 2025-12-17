@echo off
REM MAGIC Backend Setup Script for Windows
REM This script automates the backend setup process

echo.
echo ================================
echo   MAGIC Backend Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo [OK] .env file created
    echo.
    echo [WARNING] Please update the following in .env:
    echo    - MONGODB_URI if not using localhost
    echo    - JWT_SECRET with a secure random string
    echo    - SMTP settings if using email notifications
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

REM Create uploads directory
if not exist uploads mkdir uploads
echo [OK] Created uploads directory

REM Create logs directory
if not exist logs mkdir logs
echo [OK] Created logs directory

echo.
echo Seeding database...
call npm run seed

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to seed database
    echo    Make sure MongoDB is running and MONGODB_URI is correct in .env
    exit /b 1
)

echo.
echo [OK] Database seeded successfully!
echo.
echo ================================
echo   Setup Complete!
echo ================================
echo.
echo Default credentials:
echo    Admin - username: admin, password: magic2024
echo    Guest - username: guest, password: guest123
echo.
echo To start the server:
echo    Development: npm run dev
echo    Production:  npm start
echo.
echo Documentation:
echo    - README.md - Quick start guide
echo    - API_REFERENCE.md - Complete API documentation
echo.
echo Server will run on: http://localhost:5000
echo Health check: http://localhost:5000/health
echo.
pause
