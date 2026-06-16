@echo off
echo Iniciando Gestion de Calificaciones...
echo.

cd /d "%~dp0backend"
start "Backend" cmd /c "npx tsx src\index.ts & pause"

timeout /t 4 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend" cmd /c "npx vite --host 0.0.0.0 & pause"

echo.
echo Servidores iniciados:
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo Abriendo navegador...
timeout /t 3 /nobreak >nul
start http://localhost:5173
