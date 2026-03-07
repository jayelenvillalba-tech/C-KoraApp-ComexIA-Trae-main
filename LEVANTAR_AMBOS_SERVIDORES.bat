@echo off
REM Script para levantar Backend y Frontend automáticamente en dos ventanas separadas
REM Requiere que npm install ya haya sido ejecutado

echo.
echo ╔════════════════════════════════════════════╗
echo ║   LEVANTANDO COMEXIA (Backend + Frontend)  ║
echo ╚════════════════════════════════════════════╝
echo.

echo Verificando que estamos en el directorio correcto...
if not exist "C:\KoraApp\ComexIA-Trae-main\backend\package.json" (
    echo ERROR: No se encontró el proyecto en C:\KoraApp\ComexIA-Trae-main
    pause
    exit /b 1
)

echo ✅ Proyecto encontrado

echo.
echo Levantando BACKEND en puerto 3001...
start cmd /k "cd /d C:\KoraApp\ComexIA-Trae-main && npm run server"

echo ⏳ Esperando a que el backend inicie (5 segundos)...
timeout /t 5 /nobreak

echo.
echo Levantando FRONTEND en puerto 5174...
start cmd /k "cd /d C:\KoraApp\ComexIA-Trae-main && npm run dev"

echo.
echo ╔════════════════════════════════════════════╗
echo ║         ✅ AMBOS SERVIDORES INICIANDO     ║
echo ╚════════════════════════════════════════════╝
echo.
echo BACKEND:  http://localhost:3001
echo FRONTEND: http://localhost:5174
echo.
echo Las ventanas se abrirán automáticamente.
echo Espera a ver los mensajes:
echo   - En Backend: "🚀 Server running on..."
echo   - En Frontend: "➜ Local: http://localhost:5174"
echo.
echo Una vez que ambos muestren esos mensajes, abre en tu navegador:
echo   http://localhost:5174
echo.
pause
