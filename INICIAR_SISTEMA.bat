@echo off
title KoraApp - ComexIA Launcher
color 0A

:: Change to the directory where this script is located
cd /d "%~dp0"

echo ===================================================
echo     INICIANDO SISTEMA COMEXIA - CHE.COMEX
echo ===================================================
echo.

:: Kill previous instances to avoid port conflicts
echo [0/3] Limpiando procesos anteriores...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM vite.exe /T >nul 2>&1

echo.
echo [1/3] Verificando entorno...
if not exist "node_modules" (
    echo Instalando dependencias (esto puede tardar unos minutos)...
    call npm install
)

echo.
echo [2/3] Iniciando Servidor Backend (Puerto 3000)...
start "ComexIA Backend" cmd /k "npm run server"

echo.
echo [3/3] Iniciando Frontend (Puerto 5173)...
echo.
echo    El navegador se abrira automaticamente en unos segundos...
echo.

start "ComexIA Frontend" cmd /k "npm run dev"

timeout /t 5 >nul

echo.
echo Abriendo navegador...
start http://localhost:5173

echo.
echo ===================================================
echo     SISTEMA ONLINE
echo     Para detener todo, cierre las ventanas negras.
echo ===================================================
echo.
