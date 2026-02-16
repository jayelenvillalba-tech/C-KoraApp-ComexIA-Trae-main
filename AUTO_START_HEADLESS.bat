@echo off
cd /d "c:\KoraApp\ComexIA-Trae-main"

:: Log start
echo %DATE% %TIME% - Starting ComexIA > startup_log.txt

:: 1. Start Backend (Background)
echo Starting Backend... >> startup_log.txt
start /B cmd /c "npm run server >> backend_log.txt 2>&1"

:: Wait 10 seconds for backend to initialize
timeout /t 10 /nobreak >nul

:: 2. Start Frontend (Background)
echo Starting Frontend... >> startup_log.txt
start /B cmd /c "npm run dev >> frontend_log.txt 2>&1"

:: Wait 5 seconds
timeout /t 5 /nobreak >nul

exit
