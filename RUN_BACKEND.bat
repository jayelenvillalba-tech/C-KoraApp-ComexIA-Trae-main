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
echo ╚════════════════════════════════════════════════════╝
echo.

REM Matar procesos node previos
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak

REM Cambiar a la carpeta del proyecto
cd /d C:\KoraApp\ComexIA-Trae-main

REM Ejecutar el servidor usando tsx directamente
echo [%time%] Iniciando Backend...
npx tsx backend/server.ts

REM Si el servidor se detiene, mostrar mensaje
echo.
echo ❌ El servidor se ha detenido
echo [%time%] Si ves un error arriba, ese es el problema
echo.
pause
