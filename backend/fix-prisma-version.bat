@echo off
echo ========================================
echo Fixing Prisma Version Issue
echo ========================================
echo.

echo Step 1: Removing Prisma 7.x...
call npm uninstall prisma @prisma/client
echo.

echo Step 2: Installing Prisma 5.x (stable version)...
call npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact
echo.

echo Step 3: Generating Prisma Client...
call npx prisma generate
echo.

echo ========================================
echo Prisma version fixed!
echo ========================================
echo.
echo You can now run:
echo   npx prisma migrate dev --name init
echo.
pause
