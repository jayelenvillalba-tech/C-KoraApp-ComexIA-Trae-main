# Script para iniciar ambos servidores de ComexIA
Write-Host "Iniciando servidores de ComexIA..." -ForegroundColor Cyan
Write-Host ""

# Función para verificar puerto
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Función para liberar puerto
function Kill-ProcessOnPort {
    param([int]$Port)
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pid in $processes) {
            Write-Host "Deteniendo proceso en puerto $Port..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

# Limpiar puertos
Write-Host "Verificando puertos..." -ForegroundColor Yellow
if (Test-Port 3000) {
    Kill-ProcessOnPort 3000
}
if (Test-Port 5173) {
    Kill-ProcessOnPort 5173
}

Write-Host "Puertos libres" -ForegroundColor Green
Write-Host ""

# Iniciar backend
Write-Host "Iniciando BACKEND (puerto 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

Write-Host "Esperando backend..." -ForegroundColor Gray
Start-Sleep -Seconds 5

$backendReady = $false
for ($i = 1; $i -le 10; $i++) {
    if (Test-Port 3000) {
        $backendReady = $true
        Write-Host "Backend listo!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $backendReady) {
    Write-Host "Error: Backend no inicio" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Iniciar frontend
Write-Host "Iniciando FRONTEND (puerto 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "Esperando frontend..." -ForegroundColor Gray
Start-Sleep -Seconds 8

$frontendReady = $false
for ($i = 1; $i -le 15; $i++) {
    if (Test-Port 5173) {
        $frontendReady = $true
        Write-Host "Frontend listo!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $frontendReady) {
    Write-Host "Error: Frontend no inicio" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SERVIDORES INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abriendo navegador..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
