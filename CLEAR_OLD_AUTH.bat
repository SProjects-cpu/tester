@echo off
echo ========================================
echo   Clear Old Authentication Data
echo ========================================
echo.

echo This script will clear old authentication data from localStorage
echo.
echo Creating HTML file to clear localStorage...

(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<title^>Clear Old Auth Data^</title^>
echo     ^<style^>
echo         body {
echo             font-family: Arial, sans-serif;
echo             max-width: 600px;
echo             margin: 50px auto;
echo             padding: 20px;
echo             background: linear-gradient^(135deg, #667eea 0%%, #764ba2 100%%^);
echo             color: white;
echo         }
echo         .container {
echo             background: white;
echo             color: #333;
echo             padding: 30px;
echo             border-radius: 10px;
echo             box-shadow: 0 10px 30px rgba^(0,0,0,0.3^);
echo         }
echo         h1 { color: #667eea; }
echo         button {
echo             background: #667eea;
echo             color: white;
echo             border: none;
echo             padding: 12px 24px;
echo             border-radius: 5px;
echo             cursor: pointer;
echo             font-size: 16px;
echo             margin: 10px 5px;
echo         }
echo         button:hover { background: #764ba2; }
echo         .success { color: #10b981; font-weight: bold; }
echo         .info { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
echo         ul { text-align: left; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<h1^>🔐 Clear Old Authentication Data^</h1^>
echo         ^<p^>This will remove old localStorage authentication data and prepare for the new RBAC system.^</p^>
echo         
echo         ^<div class="info"^>
echo             ^<strong^>What will be cleared:^</strong^>
echo             ^<ul^>
echo                 ^<li^>adminSession^</li^>
echo                 ^<li^>token^</li^>
echo                 ^<li^>tokenExpiry^</li^>
echo                 ^<li^>Any old auth data^</li^>
echo             ^</ul^>
echo             ^<strong^>What will be kept:^</strong^>
echo             ^<ul^>
echo                 ^<li^>darkMode setting^</li^>
echo                 ^<li^>Other app settings^</li^>
echo             ^</ul^>
echo         ^</div^>
echo         
echo         ^<button onclick="clearOldAuth^(^)"^>Clear Old Auth Data^</button^>
echo         ^<button onclick="clearAll^(^)"^>Clear Everything^</button^>
echo         ^<button onclick="showData^(^)"^>Show Current Data^</button^>
echo         
echo         ^<div id="result" style="margin-top: 20px;"^>^</div^>
echo     ^</div^>
echo     
echo     ^<script^>
echo         function clearOldAuth^(^) {
echo             // Remove old auth data
echo             localStorage.removeItem^('adminSession'^);
echo             localStorage.removeItem^('token'^);
echo             localStorage.removeItem^('tokenExpiry'^);
echo             
echo             document.getElementById^('result'^).innerHTML = 
echo                 '^<p class="success"^>✅ Old authentication data cleared!^</p^>' +
echo                 '^<p^>You can now use the new RBAC system.^</p^>' +
echo                 '^<p^>^<a href="http://localhost:5173"^>Go to Login^</a^>^</p^>';
echo         }
echo         
echo         function clearAll^(^) {
echo             localStorage.clear^(^);
echo             document.getElementById^('result'^).innerHTML = 
echo                 '^<p class="success"^>✅ All localStorage data cleared!^</p^>' +
echo                 '^<p^>^<a href="http://localhost:5173"^>Go to Login^</a^>^</p^>';
echo         }
echo         
echo         function showData^(^) {
echo             let html = '^<h3^>Current localStorage Data:^</h3^>^<ul style="text-align: left;"^>';
echo             for ^(let i = 0; i ^< localStorage.length; i++^) {
echo                 const key = localStorage.key^(i^);
echo                 const value = localStorage.getItem^(key^);
echo                 html += `^<li^>^<strong^>${key}:^</strong^> ${value.substring^(0, 50^)}...^</li^>`;
echo             }
echo             html += '^</ul^>';
echo             document.getElementById^('result'^).innerHTML = html;
echo         }
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > clear-old-auth.html

echo ✅ Created: clear-old-auth.html
echo.
echo Opening in browser...
start clear-old-auth.html
echo.
echo ========================================
echo   Instructions
echo ========================================
echo.
echo 1. Click "Clear Old Auth Data" in the browser
echo 2. Close the browser tab
echo 3. Start the application:
echo    - Backend: cd backend ^&^& npm start
echo    - Frontend: npm run dev
echo 4. Login with new RBAC system
echo.
pause
