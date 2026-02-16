@echo off
title Reparar Autoinicio - ComexIA
color 0B

echo ===================================================
echo     REPARANDO Y CONFIGURANDO AUTOINICIO
echo ===================================================
echo.

set "SCRIPT_PATH=c:\KoraApp\ComexIA-Trae-main\SILENT_LAUNCHER.vbs"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ComexIA_AutoStart.lnk"

echo 1. Eliminando configuracion anterior...
if exist "%SHORTCUT_PATH%" del "%SHORTCUT_PATH%"

echo.
echo 2. Creando nuevo acceso directo al sistema silencioso...
echo Apuntando a: %SCRIPT_PATH%

powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%SHORTCUT_PATH%'); $SC.TargetPath = '%SCRIPT_PATH%'; $SC.WorkingDirectory = 'c:\KoraApp\ComexIA-Trae-main'; $SC.Description = 'ComexIA AutoStart'; $SC.Save()"

echo.
if exist "%SHORTCUT_PATH%" (
    echo [EXITO] Autoinicio reparado correctamente!
    echo El sistema iniciara automaticamente y EN SILENCIO (sin ventanas negras).
) else (
    echo [ERROR] No se pudo crear el acceso directo.
)

echo.
echo ===================================================
echo PROBANDO INICIO AHORA MISMO...
echo ===================================================
cscript //nologo "%SCRIPT_PATH%"

echo.
echo Sistema iniciado en segundo plano.
echo Puede cerrar esta ventana.
pause
