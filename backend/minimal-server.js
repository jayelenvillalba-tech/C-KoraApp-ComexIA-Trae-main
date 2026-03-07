#!/usr/bin/env node
// Servidor COMEXIA - Versión Mínima
// Este archivo está diseñado para funcionar incluso si faltan módulos

const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;
const HOST = '127.0.0.1';

console.clear();
console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║                                                    ║');
console.log('║   🚀 COMEXIA BACKEND SERVER - INICIANDO             ║');
console.log('║                                                    ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Verificar .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
  
  // Cargar .env manualmente
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
  console.log('✅ Variables de entorno cargadas\n');
} else {
  console.log('⚠️  Archivo .env NO encontrado\n');
}

// Crear servidor
const server = http.createServer((req, res) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Opciones CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  // Rutas básicas
  const url = req.url.split('?')[0];

  if (url === '/' || url === '/health' || url === '/api/health') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'ComexIA Backend está funcionando',
      port: PORT,
      timestamp: new Date().toISOString(),
      mongodb: process.env.MONGODB_URI ? 'configurado' : 'no configurado'
    }, null, 2));
  } else {
    res.writeHead(404, headers);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: url,
      availableRoutes: [
        'GET  /health',
        'GET  /api/health'
      ]
    }, null, 2));
  }
});

// Iniciar servidor
server.listen(PORT, HOST, () => {
  console.log('════════════════════════════════════════════════════');
  console.log(`✅ Servidor escuchando en: http://${HOST}:${PORT}`);
  console.log('════════════════════════════════════════════════════\n');
  console.log('📝 API DISPONIBLE:');
  console.log(`   GET /health              → http://localhost:${PORT}/health`);
  console.log(`   GET /api/health          → http://localhost:${PORT}/api/health\n`);
  console.log('⏹️  Para detener: Presiona Ctrl+C\n');
});

server.on('error', (err) => {
  console.log('\n❌ ERROR AL INICIAR SERVIDOR:');
  if (err.code === 'EADDRINUSE') {
    console.log(`   Puerto ${PORT} ya está en uso`);
    console.log('\n💡 SOLUCIÓN: Ejecuta en PowerShell:');
    console.log('   taskkill /F /IM node.exe');
    console.log('   Luego intenta de nuevo');
  } else if (err.code === 'EACCES') {
    console.log(`   Permisos insuficientes para escuchar en puerto ${PORT}`);
    console.log('\n💡 SOLUCIÓN: Usa un puerto diferente:');
    console.log('   $env:PORT=8001');
    console.log('   node backend/minimal-server.js');
  } else {
    console.log(`   ${err.message}`);
  }
  process.exit(1);
});

// Manejo de CTRL+C
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Servidor detenido');
  process.exit(0);
});
