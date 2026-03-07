@echo off
setlocal enabledelayedexpansion

title COMEXIA - Backend Debug

cd /d C:\KoraApp\ComexIA-Trae-main\backend

REM Crear archivo de log
set LOGFILE=%CD%\backend-debug.log
echo %date% %time% - Iniciando backend > %LOGFILE%

echo.
echo Iniciando backend con log en: %LOGFILE%
echo.

REM Ejecutar y capturar salida
node minimal-server.mjs >> %LOGFILE% 2>&1

REM Si falla, mostrar el archivo de log
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Error durante la ejecución
    echo.
    echo Contenido del log:
    echo ==================
    type %LOGFILE%
    echo ==================
    pause
)
