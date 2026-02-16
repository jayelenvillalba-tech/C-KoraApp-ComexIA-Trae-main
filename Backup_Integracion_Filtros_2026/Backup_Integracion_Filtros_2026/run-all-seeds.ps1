
$seeds = @(
    "database/run-init.ts", # Reinicia y crea todas las tablas
    "database/seeds/seed-comprehensive-restoration.ts", # Países, Capítulos, Secciones, HS base
    "database/seeds/seed-agriculture-full.ts", # HS Agro reales
    "database/seeds/seed-final-hs-codes.ts", # HS Industriales reales
    "database/seeds/seed-massive-hs.ts", # Generador para llegar a 2500+
    "database/seeds/seed-product-layers.ts", # Capas de reglas específicas
    "database/seeds/seed-demo-companies.ts", # Empresas demo
    "database/seeds/seed-marketplace-posts.ts" # Posts demo
)

Write-Host "🛑 ELIMINANDO BASE DE DATOS ANTIGUA PARA EMPEZAR DE CERO" -ForegroundColor Yellow
if (Test-Path "comexia_v2.db") { Remove-Item "comexia_v2.db" }

foreach ($seed in $seeds) {
    Write-Host "🚀 Ejecutando script: $seed" -ForegroundColor Cyan
    npx tsx $seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error ejecutando script: $seed" -ForegroundColor Red
        # No paramos el proceso completo, intentamos continuar con el resto
    } else {
        Write-Host "✅ Completado: $seed" -ForegroundColor Green
    }
}

Write-Host "🏁 ¡Toda la restauración y siembra de datos completada!" -ForegroundColor Yellow
npx tsx database/verify-data.ts
