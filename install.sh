#!/bin/bash
# Script para instalar dependencias sin interacción

cd /d C:\KoraApp\ComexIA-Trae-main\backend

echo "[1/2] Limpiando package-lock.json..."
if exist package-lock.json del package-lock.json

echo "[2/2] Ejecutando npm install..."
npm install

echo ""
echo "================================"
echo "Instalación completada"
echo "================================"
echo ""
echo "Ahora ejecuta:"
echo "  cd C:\KoraApp\ComexIA-Trae-main"
echo "  npm run server"
