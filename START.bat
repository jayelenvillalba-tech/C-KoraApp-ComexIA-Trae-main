@echo off
echo Iniciando backend...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
echo Iniciando frontend...
start cmd /k "npm run dev"
echo Listo! Abre http://localhost:5174
