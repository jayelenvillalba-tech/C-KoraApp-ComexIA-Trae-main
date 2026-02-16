@echo off
title Activar Autoinicio - ComexIA
color 0B

echo ===================================================
echo     ACTIVANDO AUTOINICIO PARA COMEXIA
echo ===================================================
echo.
echo Este script configurara Windows para que el sistema
echo se inicie automaticamente al encender la PC.
echo.

set "SCRIPT_PATH=%~dp0INICIAR_SISTEMA.bat"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ComexIA_AutoStart.lnk"

echo Creando acceso directo en:
echo %SHORTCUT_PATH%
echo.
echo Apuntando a:
echo %SCRIPT_PATH%
echo.

powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%SHORTCUT_PATH%'); $SC.TargetPath = '%SCRIPT_PATH%'; $SC.WorkingDirectory = '%~dp0'; $SC.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [EXITO] Autoinicio configurado correctamente!
    echo El sistema arrancara solo cuando reinicies la PC.
) else (
    echo.
    echo [ERROR] No se pudo crear el acceso directo.
    echo Ejecuta este archivo como Administrador.
)

echo.
pause
