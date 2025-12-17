@echo off
echo ========================================
echo   Clear JWT Token - Fix Malformed Error
echo ========================================
echo.
echo This will open a tool to clear your invalid JWT token.
echo.
echo After clearing the token:
echo 1. Go to http://localhost:5173
echo 2. Login with: admin / magic2024
echo 3. Error should be gone!
echo.
pause
echo.
echo Opening token clearing tool...
start clear-token.html
echo.
echo ========================================
echo   Instructions:
echo ========================================
echo 1. Click "Clear Invalid Token" button
echo 2. Go to your application
echo 3. Login again
echo.
echo If the tool doesn't open, manually open:
echo   clear-token.html
echo.
pause
