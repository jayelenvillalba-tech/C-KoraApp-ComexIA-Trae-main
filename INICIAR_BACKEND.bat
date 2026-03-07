@echo off
title COMEXIA Backend Server
color 0A

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║   🚀 COMEXIA BACKEND SERVER                        ║
echo ║                                                    ║
echo ║   Iniciando... por favor espera                    ║
echo ║                                                    ║
echo ║   Una vez listo veras:                             ║
echo ║   "🚀 Server running on http://localhost:3001"     ║
echo ║                                                    ║
echo ║   NO CIERRES ESTA VENTANA MIENTRAS USES COMEXIA    ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Cambiar a la carpeta del backend
cd /d C:\KoraApp\ComexIA-Trae-main\backend

REM Matar procesos node previos
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Ejecutar el servidor
echo [%date% %time%] Iniciando Backend...
echo.
npm run server

REM Si el servidor se detiene, mostrar mensaje
echo.
echo ❌ El servidor se ha detenido
echo [%date% %time%] Si ves un error arriba, ese es el problema
echo.
pause
