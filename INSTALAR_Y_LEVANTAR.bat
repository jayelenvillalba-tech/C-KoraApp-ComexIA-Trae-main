@echo off
REM Instalar dependencias del backend
cd /d C:\KoraApp\ComexIA-Trae-main\backend
echo [1/2] Instalando dependencias del backend...
npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Falló la instalación del backend
    pause
    exit /b 1
)

REM Instalar dependencias del frontend
cd /d C:\KoraApp\ComexIA-Trae-main
echo [2/2] Instalando dependencias del frontend...
npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Falló la instalación del frontend
    pause
    exit /b 1
)

echo.
echo =============================================
echo ✓ SETUP COMPLETADO EXITOSAMENTE
echo =============================================
echo.
echo Ahora abre DOS ventanas CMD SEPARADAS:
echo.
echo VENTANA 1 - Backend:
echo C:\KoraApp\ComexIA-Trae-main
echo npm run server
echo.
echo VENTANA 2 - Frontend:
echo C:\KoraApp\ComexIA-Trae-main
echo npm run dev
echo.
pause
