@echo off
echo.
echo ╔═══════════════════════════════════════════╗
echo ║     COMEXIA - Levantando Frontend        ║
echo ╚═══════════════════════════════════════════╝
echo.

REM Ir a la carpeta raíz
cd /d C:\KoraApp\ComexIA-Trae-main

echo Iniciando servidor frontend...
echo.

REM Ejecutar el frontend
npm run dev

REM Si falla, mantener la ventana abierta
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR al iniciar el frontend
    echo Presiona cualquier tecla para cerrar
    pause
)
