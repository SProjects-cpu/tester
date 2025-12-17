@echo off
color 0E
title MAGIC System Health Check

echo ========================================
echo   MAGIC System Health Check
echo ========================================
echo.

:: Check Node.js
echo [1] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js not installed
    set /a errors+=1
) else (
    echo [PASS] Node.js installed
    node --version
)
echo.

:: Check npm
echo [2] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] npm not installed
    set /a errors+=1
) else (
    echo [PASS] npm installed
    npm --version
)
echo.

:: Check backend dependencies
echo [3] Checking backend dependencies...
if exist backend\node_modules (
    echo [PASS] Backend dependencies installed
) else (
    echo [FAIL] Backend dependencies missing
    echo Run: cd backend ^&^& npm install
    set /a errors+=1
)
echo.

:: Check frontend dependencies
echo [4] Checking frontend dependencies...
if exist node_modules (
    echo [PASS] Frontend dependencies installed
) else (
    echo [FAIL] Frontend dependencies missing
    echo Run: npm install
    set /a errors+=1
)
echo.

:: Check admin user
echo [5] Checking admin user...
if exist backend\data\users.json (
    echo [PASS] User database exists
    findstr /C:"admin" backend\data\users.json >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Admin user not found
        echo Run: cd backend ^&^& node setup-admin.js
    ) else (
        echo [PASS] Admin user exists
    )
) else (
    echo [FAIL] User database not found
    echo Run: cd backend ^&^& node setup-admin.js
    set /a errors+=1
)
echo.

:: Check backend server
echo [6] Checking backend server...
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Backend not running on port 5000
    echo Run: cd backend ^&^& npm start
    set /a errors+=1
) else (
    echo [PASS] Backend running on port 5000
    curl -s http://localhost:5000/health >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Backend not responding to health check
    ) else (
        echo [PASS] Backend health check OK
    )
)
echo.

:: Check frontend server
echo [7] Checking frontend server...
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Frontend not running on port 5173
    echo Run: npm run dev
    set /a errors+=1
) else (
    echo [PASS] Frontend running on port 5173
)
echo.

:: Check environment file
echo [8] Checking environment configuration...
if exist backend\.env (
    echo [PASS] Environment file exists
    findstr /C:"JWT_SECRET" backend\.env >nul 2>&1
    if errorlevel 1 (
        echo [WARN] JWT_SECRET not configured
    ) else (
        echo [PASS] JWT_SECRET configured
    )
) else (
    echo [FAIL] Environment file missing
    echo Copy backend\.env.example to backend\.env
    set /a errors+=1
)
echo.

:: Summary
echo ========================================
echo   Health Check Summary
echo ========================================
echo.
if defined errors (
    echo [RESULT] System has %errors% issue(s)
    echo.
    echo Recommended actions:
    echo 1. Fix the issues listed above
    echo 2. Run: COMPLETE-SETUP.bat
    echo 3. Or run: START-MAGIC.bat
) else (
    echo [RESULT] All checks passed!
    echo.
    echo Your system is healthy and ready to use.
    echo.
    echo Access your application at:
    echo http://localhost:5173
    echo.
    echo Login with:
    echo Username: admin
    echo Password: magic2024
)
echo.
echo ========================================
pause
