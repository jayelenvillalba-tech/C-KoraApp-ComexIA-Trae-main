#!/usr/bin/env node

console.log('🔍 DIAGNÓSTICO DEL BACKEND - ComexIA');
console.log('=====================================\n');

// Check 1: Verificar variables de entorno
console.log('1️⃣  VARIABLES DE ENTORNO:');
console.log('   PORT:', process.env.PORT || '(no definida, usando 3001 por defecto)');
console.log('   NODE_ENV:', process.env.NODE_ENV || '(no definida)');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Definida' : '❌ NO DEFINIDA');
console.log('');

// Check 2: Verificar módulos clave
console.log('2️⃣  MÓDULOS DISPONIBLES:');
try {
  require('express');
  console.log('   ✅ express');
} catch (e) {
  console.log('   ❌ express - NO ENCONTRADO');
}

try {
  require('mongoose');
  console.log('   ✅ mongoose');
} catch (e) {
  console.log('   ❌ mongoose - NO ENCONTRADO');
}

try {
  require('node-cron');
  console.log('   ✅ node-cron');
} catch (e) {
  console.log('   ❌ node-cron - NO ENCONTRADO');
}

try {
  require('dotenv');
  console.log('   ✅ dotenv');
} catch (e) {
  console.log('   ❌ dotenv - NO ENCONTRADO');
}
console.log('');

// Check 3: Intentar iniciar servidor simple
console.log('3️⃣  PRUEBA DE SERVIDOR:');
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Backend respondiendo' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`   ✅ Servidor HTTP simple CORRIENDO en puerto ${PORT}`);
  console.log('');
  console.log('📝 ACCIÓN REQUERIDA:');
  console.log(`   - Abre en tu navegador: http://localhost:${PORT}`);
  console.log('   - Si ves JSON, el servidor FUNCIONA');
  console.log('   - Si NO funciona, hay un problema de red/firewall');
  console.log('');
  console.log('Presiona Ctrl+C para detener este servidor...');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`   ❌ Puerto ${PORT} YA ESTÁ EN USO`);
    console.log('');
    console.log('SOLUCIÓN: Ejecuta en PowerShell:');
    console.log('   taskkill /F /IM node.exe');
  } else {
    console.log(`   ❌ ERROR: ${err.message}`);
  }
});

// Timeout
setTimeout(() => {
  console.log('');
  console.log('⏱️  Si el servidor está corriendo, presiona Ctrl+C');
}, 3000);
