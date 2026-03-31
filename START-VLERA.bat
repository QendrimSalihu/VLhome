@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%vlera-frontend"
set "BACKEND_HEALTH=http://localhost:4000/api/health"
set "FRONTEND_URL=http://localhost:5500/index.html"
set "ADMIN_URL=http://localhost:5500/admin.html"

where node >nul 2>&1
if errorlevel 1 (
  echo [VLERA] Node.js nuk u gjet. Instalo Node.js dhe provo perseri.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\node_modules" (
  echo [VLERA] Installing backend dependencies...
  cd /d "%BACKEND_DIR%"
  cmd /c npm install
)

echo [VLERA] Initializing database...
cd /d "%BACKEND_DIR%"
cmd /c npm run init-db

echo [VLERA] Checking backend status...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-RestMethod -Uri '%BACKEND_HEALTH%' -Method GET -TimeoutSec 2; if($r.success){ exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo [VLERA] Starting backend on http://localhost:4000 ...
  start "VLERA Backend" /d "%BACKEND_DIR%" cmd /k npm start
) else (
  echo [VLERA] Backend already running on port 4000.
)

echo [VLERA] Checking frontend port 5500...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue; if($c){ exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [VLERA] Starting frontend on http://localhost:5500 ...
  start "VLERA Frontend" /d "%FRONTEND_DIR%" cmd /k node server.js 5500
) else (
  echo [VLERA] Frontend already running on port 5500.
)

echo [VLERA] Waiting for backend health check...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0; $i -lt 30; $i++){ try { $r=Invoke-RestMethod -Uri '%BACKEND_HEALTH%' -Method GET -TimeoutSec 2; if($r.success){ $ok=$true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if($ok){ exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [VLERA] Backend nuk u ngrit ne portin 4000. Provo STOP-VLERA.bat dhe pastaj START-VLERA.bat.
  pause
  exit /b 1
)

echo [VLERA] Opening website...
start "" "%FRONTEND_URL%"

echo [VLERA] Opening admin panel...
start "" "%ADMIN_URL%"

echo.
echo Vlera Home is running.
echo - Website: %FRONTEND_URL%
echo - Admin:   %ADMIN_URL%
echo - API:     %BACKEND_HEALTH%
echo.
echo Nese admin kerkon login, perdor:
echo - Email: qendrim.salihu.tr@gmail.com
echo - Password: qendraternoc1
echo.
echo Per ndalim perdor STOP-VLERA.bat
pause

endlocal
