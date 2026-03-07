@echo off
echo.
echo ╔═══════════════════════════════════════════╗
echo ║     COMEXIA - Levantando Backend         ║
echo ╚═══════════════════════════════════════════╝
echo.

REM Matar procesos node previos
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak

REM Ir a la carpeta del backend
cd /d C:\KoraApp\ComexIA-Trae-main\backend

echo Iniciando servidor backend...
echo.

REM Ejecutar el servidor
npm run server

REM Si falla, mantener la ventana abierta
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR al iniciar el servidor
    echo Presiona cualquier tecla para cerrar
    pause
)
