@echo off
echo ========================================
echo MAGIC Incubation System - Database Setup
echo ========================================
echo.

echo Step 1: Installing Prisma dependencies...
call npm install prisma @prisma/client
echo.

echo Step 2: Generating Prisma Client...
call npx prisma generate
echo.

echo Step 3: Running database migration...
echo Make sure your .env file has the correct DATABASE_URL!
echo.
pause
call npx prisma migrate dev --name init
echo.

echo Step 4: Seeding initial data...
call npm run prisma:seed
echo.

echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo You can now:
echo - Run 'npm run prisma:studio' to view your database
echo - Run 'npm start' to start the backend server
echo.
pause
