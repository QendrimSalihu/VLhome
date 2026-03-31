@echo off
setlocal

echo [VLERA] Stopping backend/frontend helper servers...
taskkill /FI "WINDOWTITLE eq VLERA Backend" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq VLERA Frontend" /T /F >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(4000,5500); foreach($port in $ports){ $cons=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach($c in $cons){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop } catch {} } }"

echo Done.
pause

endlocal
