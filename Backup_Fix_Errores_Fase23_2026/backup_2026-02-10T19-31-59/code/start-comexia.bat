@echo off
echo ==========================================
echo    COMEXIA - INICIANDO SISTEMA
echo ==========================================
echo.
echo 1. Iniciando Backend (MongoDB Atlas + IA)...
start cmd /k "npm run server"
echo.
echo 2. Iniciando Frontend (Vite)...
start cmd /k "npm run dev"
echo.
echo ==========================================
echo    SISTEMA INICIADO
echo    - Backend: http://localhost:3001
echo    - Frontend: http://localhost:5173
echo ==========================================
echo.
echo Puedes minimizar esta ventana, pero no la cierres.
pause
