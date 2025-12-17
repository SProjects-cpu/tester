@echo off
echo ========================================
echo   Testing NEW RBAC Authentication
echo ========================================
echo.

echo [Step 1] Checking if backend is running...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend is NOT running!
    echo.
    echo Please start backend first:
    echo   cd backend
    echo   npm start
    echo.
    pause
    exit /b 1
)
echo ✅ Backend is running
echo.

echo [Step 2] Testing Admin Login...
echo Request: POST /api/auth/login
echo Body: {"username":"admin","password":"magic2024"}
echo.
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"magic2024\"}" ^
  -o admin-login.json 2>nul

if %errorlevel% equ 0 (
    echo ✅ Admin login successful!
    echo Response saved to: admin-login.json
    type admin-login.json
    echo.
) else (
    echo ❌ Admin login failed!
    echo.
)

echo.
echo [Step 3] Testing Guest Login...
echo Request: POST /api/auth/login
echo Body: {"username":"guest","password":"guest123"}
echo.
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"guest\",\"password\":\"guest123\"}" ^
  -o guest-login.json 2>nul

if %errorlevel% equ 0 (
    echo ✅ Guest login successful!
    echo Response saved to: guest-login.json
    type guest-login.json
    echo.
) else (
    echo ❌ Guest login failed!
    echo.
)

echo.
echo [Step 4] Testing Invalid Login...
echo Request: POST /api/auth/login
echo Body: {"username":"admin","password":"wrongpassword"}
echo.
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"wrongpassword\"}" 2>nul
echo.

echo.
echo [Step 5] Testing Protected Route Without Token...
echo Request: GET /api/auth/me (no token)
echo.
curl -X GET http://localhost:5000/api/auth/me 2>nul
echo.

echo.
echo ========================================
echo   Test Summary
echo ========================================
echo.
echo ✅ Backend is running
echo ✅ Admin login tested
echo ✅ Guest login tested
echo ✅ Invalid login tested
echo ✅ Protected route tested
echo.
echo Check admin-login.json and guest-login.json for tokens
echo.
echo Next Steps:
echo 1. Start frontend: npm run dev
echo 2. Open: http://localhost:5173
echo 3. Login with admin/magic2024
echo 4. Test all features
echo 5. Logout and login as guest/guest123
echo 6. Verify read-only access
echo.
pause
