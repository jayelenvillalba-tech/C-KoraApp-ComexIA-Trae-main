# Iniciar backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 3
# Iniciar frontend  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Write-Host "Abre http://localhost:5174"
