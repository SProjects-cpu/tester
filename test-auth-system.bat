@echo off
echo ========================================
echo   MAGIC Admin Authentication Test
echo ========================================
echo.

REM Check if backend is running
echo [1/5] Checking if backend is running...
curl -s http://localhost:5000/api/auth/me >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend is not running!
    echo Please start backend: cd backend ^&^& npm start
    pause
    exit /b 1
)
echo ✅ Backend is running

echo.
echo [2/5] Testing login with valid credentials...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"magic2024\"}" ^
  -o login-response.json
if %errorlevel% equ 0 (
    echo ✅ Login successful
    type login-response.json
) else (
    echo ❌ Login failed
)

echo.
echo [3/5] Testing login with invalid credentials...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"wrongpassword\"}"
echo.

echo.
echo [4/5] Testing protected route without token...
curl -X GET http://localhost:5000/api/auth/me
echo.

echo.
echo [5/5] Testing protected route with token...
echo Please extract token from login-response.json and test manually
echo Example: curl -X GET http://localhost:5000/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"

echo.
echo ========================================
echo   Test Complete!
echo ========================================
echo.
echo Check login-response.json for token
echo.
pause
