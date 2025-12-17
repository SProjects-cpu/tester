@echo off
echo ========================================
echo Testing All Website Features
echo ========================================
echo.

echo Step 1: Checking if Next.js server is running...
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 (
    echo ERROR: Next.js server is not running!
    echo Please run: npm run dev
    pause
    exit /b 1
)
echo ✓ Server is running

echo.
echo Step 2: Testing API endpoints...
echo.

echo Testing /api/auth/login...
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin@magic.com\",\"password\":\"magic2024\"}" -s | findstr "token"
if %errorlevel% equ 0 (
    echo ✓ Login endpoint working
) else (
    echo ✗ Login endpoint failed
)

echo.
echo Step 3: Database connection test...
echo.
echo Testing Prisma connection...
npx prisma db pull --force > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Database connection successful
) else (
    echo ✗ Database connection failed
)

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Open browser: http://localhost:3000
echo 2. Press Ctrl+Shift+R to hard refresh
echo 3. Login with: admin@magic.com / magic2024
echo 4. Test admin features in Settings
echo.
pause
