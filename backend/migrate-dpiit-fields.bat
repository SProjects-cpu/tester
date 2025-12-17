@echo off
echo ========================================
echo MAGIC - Database Migration
echo Adding DPIIT, Recognition Date, and Bhaskar ID fields
echo ========================================
echo.

echo Step 1: Running Prisma migration...
call npx prisma migrate dev --name add_dpiit_fields

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migration failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Prisma client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Prisma client generation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo New fields added:
echo   - dpiitNo (String)
echo   - recognitionDate (DateTime)
echo   - bhaskarId (String)
echo.
echo Please restart your backend server.
echo.
pause
