@echo off
title COMEXIA Frontend Server
color 0B

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║   🚀 COMEXIA FRONTEND SERVER                       ║
echo ║                                                    ║
echo ║   Iniciando... por favor espera                    ║
echo ║                                                    ║
echo ║   Una vez listo veras:                             ║
echo ║   "➜ Local: http://localhost:5174/"                ║
echo ║                                                    ║
echo ║   Luego abre en tu navegador:                       ║
echo ║   http://localhost:5174                            ║
echo ║                                                    ║
echo ║   NO CIERRES ESTA VENTANA MIENTRAS USES COMEXIA    ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Cambiar a la carpeta del proyecto
cd /d C:\KoraApp\ComexIA-Trae-main

REM Ejecutar vite
echo [%date% %time%] Iniciando Frontend...
echo.
npm run dev

REM Si el servidor se detiene, mostrar mensaje
echo.
echo ❌ El servidor se ha detenido
echo.
pause
