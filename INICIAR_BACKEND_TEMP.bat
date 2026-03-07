@echo off
title COMEXIA - Backend Server (Servidor Temporal)
color 0A

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║  🚀 COMEXIA BACKEND - SERVIDOR TEMPORAL            ║
echo ║  (usando servidor mínimo mientras arreglamos)      ║
echo ║                                                    ║
echo ║  Backend: http://localhost:3001                    ║
echo ║  Health:  http://localhost:3001/api/health         ║
echo ║                                                    ║
echo ║  NO CIERRES ESTA VENTANA                           ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Matar procesos node previos
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Cambiar a carpeta del backend
cd /d C:\KoraApp\ComexIA-Trae-main\backend

REM Ejecutar servidor mínimo
node minimal-server.mjs

REM Si el servidor se detiene
echo.
echo El servidor se ha detenido
pause
