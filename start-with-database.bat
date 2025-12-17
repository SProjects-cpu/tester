@echo off
echo ========================================
echo MAGIC Incubation System with PostgreSQL
echo ========================================
echo.

echo Starting services...
echo.

echo [1/3] Starting Prisma Studio...
start "Prisma Studio" cmd /k "cd backend && npm run prisma:studio"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend...
start "Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Services running:
echo   - Prisma Studio: http://localhost:5555
echo   - Backend API: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping services...
taskkill /FI "WINDOWTITLE eq Prisma Studio*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F > nul 2>&1

echo Services stopped.
pause
