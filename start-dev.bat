@echo off
echo ============================================================================
echo   Iniciando Constructora Del Valle S.A. - Entorno Full-Stack
echo ============================================================================
echo.
echo 1. Iniciando Backend en puerto 4000 (Node.js/Express)...
start "Backend - Puerto 4000" cmd /k "cd backend && npm run dev"

echo 2. Iniciando Frontend en puerto 5173 (React/Vite)...
start "Frontend - Puerto 5173" cmd /k "cd frontend && npm run dev"

echo.
echo Ambos servicios han sido lanzados en terminales independientes:
echo - Backend:  http://localhost:4000/api
echo - Frontend: http://localhost:5173
echo.
echo Presione cualquier tecla para salir de este lanzador...
pause >nul

