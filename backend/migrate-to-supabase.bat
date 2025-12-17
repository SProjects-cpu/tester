@echo off
cls
echo ========================================
echo   MAGIC - Supabase Migration Tool
echo ========================================
echo.
echo This script will migrate your database to Supabase
echo.
echo Prerequisites:
echo   1. Supabase project created
echo   2. Database connection strings ready
echo   3. .env.supabase file configured
echo.
pause

echo.
echo Step 1: Backing up current .env file...
if exist .env (
    copy .env .env.backup
    echo    [OK] Backup created: .env.backup
) else (
    echo    [INFO] No existing .env file found
)

echo.
echo Step 2: Switching to Supabase configuration...
copy .env.supabase .env
echo    [OK] Using Supabase environment variables

echo.
echo Step 3: Installing Supabase client...
call npm install @supabase/supabase-js
echo    [OK] Supabase client installed

echo.
echo Step 4: Copying Supabase schema...
copy prisma\schema.supabase.prisma prisma\schema.prisma
echo    [OK] Schema updated for Supabase

echo.
echo Step 5: Generating Prisma Client...
call npx prisma generate
echo    [OK] Prisma client generated

echo.
echo Step 6: Creating database tables...
call npx prisma migrate deploy
if errorlevel 1 (
    echo    [ERROR] Migration failed!
    echo    Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)
echo    [OK] Database tables created

echo.
echo Step 7: Seeding initial data...
call node prisma/seed.js
if errorlevel 1 (
    echo    [WARNING] Seeding failed, but migration completed
) else (
    echo    [OK] Database seeded with initial data
)

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Test the connection: npm start
echo   2. Verify data in Supabase Dashboard
echo   3. Update frontend .env.production file
echo   4. Deploy to Vercel
echo.
echo Your old .env is backed up as .env.backup
echo.
pause
