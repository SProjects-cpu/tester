@echo off
echo ========================================
echo  Clear Old Authentication Tokens
echo ========================================
echo.
echo This will open a page to clear old tokens from your browser.
echo After clearing, you'll need to login again.
echo.
pause

start "" "clear-token.html"

echo.
echo Token clearing page opened in your browser.
echo Follow the instructions on the page.
echo.
pause
