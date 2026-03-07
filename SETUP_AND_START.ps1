# Script para instalar dependencias y levantar el sistema
Write-Host "🔧 Iniciando setup de ComexIA..." -ForegroundColor Green

# 1. Instalar dependencias del backend
Write-Host "`n📦 Instalando dependencias del backend..." -ForegroundColor Cyan
Set-Location "C:\KoraApp\ComexIA-Trae-main\backend"
npm install --no-save
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green

# 2. Instalar dependencias del frontend
Write-Host "`n📦 Instalando dependencias del frontend..." -ForegroundColor Cyan
Set-Location "C:\KoraApp\ComexIA-Trae-main"
npm install --no-save
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green

Write-Host "`n🎉 Setup completado exitosamente!" -ForegroundColor Green
Write-Host "Ahora abre DOS terminales PowerShell separadas y ejecuta en cada una:" -ForegroundColor Yellow
Write-Host "Terminal 1 (Backend): cd C:\KoraApp\ComexIA-Trae-main ; npm run server" -ForegroundColor Cyan
Write-Host "Terminal 2 (Frontend): cd C:\KoraApp\ComexIA-Trae-main ; npm run dev" -ForegroundColor Cyan
