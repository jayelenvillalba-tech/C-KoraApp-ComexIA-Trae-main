@echo off
echo ===========================================
echo Starting n8n Automation Server
echo ===========================================
echo.
echo [Method 1] Launching via npx (auto-download)...
echo.
call npx -y n8n start --tunnel

if %errorlevel% neq 0 (
    echo.
    echo [Method 1 Failed] Trying Method 2: Global Install...
    echo.
    call npm install -g n8n
    echo.
    echo Starting n8n...
    call n8n start --tunnel
)

echo.
echo If n8n closes immediately, try running this as Administrator.
pause
