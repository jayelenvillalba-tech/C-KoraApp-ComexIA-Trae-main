# ============================================================
# 🚀 COMEXIA — ONE-CLICK STARTUP SCRIPT
# Ejecutar con: .\INICIAR_COMEXIA.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "🔧 Iniciando Che.Comex desde: $ROOT" -ForegroundColor Cyan

# --- Matar cualquier proceso anterior en puertos usados ---
Write-Host "🧹 Limpiando puertos 3001 y 5174..." -ForegroundColor Yellow
$portsToKill = @(3001, 5174, 5173)
foreach ($port in $portsToKill) {
    try {
        $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
        foreach ($pid in $pids) {
            if ($pid -gt 0) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ Puerto $port liberado (PID $pid)" -ForegroundColor Green
            }
        }
    } catch {}
}

Start-Sleep -Milliseconds 500

# --- Iniciar Backend (Puerto 3001) ---
Write-Host "" 
Write-Host "🖥️  Iniciando Backend (puerto 3001)..." -ForegroundColor Cyan
$backend = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit -NoProfile -Command `"cd '$ROOT'; npx tsx backend/server-sqlite.ts`"" `
    -PassThru -WindowStyle Normal
Write-Host "   Backend PID: $($backend.Id)" -ForegroundColor Gray

# Esperar que el backend arranque
Write-Host "   Esperando 4 segundos para que el backend esté listo..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# Verificar backend
try {
    $check = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  ✅ Backend en línea: http://localhost:3001/api/health" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Backend no respondió aún (puede tardar unos segundos más)" -ForegroundColor Yellow
}

# --- Iniciar Frontend (Puerto 5174) ---
Write-Host ""
Write-Host "🌐 Iniciando Frontend (Vite, puerto 5174)..." -ForegroundColor Cyan
$frontend = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit -NoProfile -Command `"cd '$ROOT'; npm run dev`"" `
    -PassThru -WindowStyle Normal
Write-Host "   Frontend PID: $($frontend.Id)" -ForegroundColor Gray

Start-Sleep -Seconds 4

# --- Abrir el navegador ---
Write-Host ""
Write-Host "🌍 Abriendo navegador en http://localhost:5174 ..." -ForegroundColor Green
Start-Process "http://localhost:5174"

# --- Resumen final ---
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ✅ COMEXIA ESTÁ CORRIENDO" -ForegroundColor Green
Write-Host "  Frontend → http://localhost:5174" -ForegroundColor White
Write-Host "  Backend  → http://localhost:3001" -ForegroundColor White
Write-Host "  API Test → http://localhost:3001/api/health" -ForegroundColor White
Write-Host "  ⚠️  No cierres las ventanas de PowerShell" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
