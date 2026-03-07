@echo off
echo ========================================
echo   ComexIA - Sistema de Inicio Estable
echo ========================================
echo.

REM Verificar que Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Verificando conexion a MongoDB...
npx tsx scripts/verify-database-state.ts
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo conectar a MongoDB Atlas
    echo Verifica tu archivo .env y la variable MONGODB_URI
    pause
    exit /b 1
)

echo.
echo [2/4] Iniciando Backend (puerto 3001)...
start "ComexIA Backend" cmd /k "npm run server"
timeout /t 5 /nobreak >nul

echo [3/4] Iniciando Frontend (puerto 5173)...
start "ComexIA Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Verificando servicios...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   ✅ SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend:  http://localhost:3001
echo 📊 Health:   http://localhost:3001/health
echo.
echo Presiona cualquier tecla para abrir la aplicacion...
pause >nul

start http://localhost:5173

echo.
echo Para detener el sistema, cierra las ventanas de Backend y Frontend
echo.
pause
