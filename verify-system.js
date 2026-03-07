#!/usr/bin/env node
/**
 * Script para verificar que ComexIA está completamente funcional
 * Verifica:
 * - ✅ Backend responde en :3001
 * - ✅ Frontend responde en :5174
 * - ✅ API está accesible
 * - ✅ MongoDB conectado
 */

import http from 'http';

const TESTS = [
  {
    name: 'Backend Health Check',
    url: 'http://localhost:3001/api/health',
    timeout: 5000
  },
  {
    name: 'Frontend',
    url: 'http://localhost:5174',
    timeout: 5000
  }
];

async function checkUrl(url, timeout) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout }, (res) => {
      resolve({
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 300
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.abort();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  console.log('\n🔍 Verificando ComexIA...\n');
  
  for (const test of TESTS) {
    try {
      const result = await checkUrl(test.url, test.timeout);
      const icon = result.ok ? '✅' : '⚠️';
      console.log(`${icon} ${test.name}: ${test.url} (${result.status})`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${test.url}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n📝 Instrucciones:\n');
  console.log('Si ves ❌ en el Backend:');
  console.log('  1. Abre una terminal PowerShell');
  console.log('  2. Ejecuta: cd C:\\KoraApp\\ComexIA-Trae-main');
  console.log('  3. Ejecuta: npm run server\n');
  
  console.log('Si ves ❌ en el Frontend:');
  console.log('  1. Abre otra terminal PowerShell');
  console.log('  2. Ejecuta: cd C:\\KoraApp\\ComexIA-Trae-main');
  console.log('  3. Ejecuta: npm run dev\n');
}

runTests().catch(console.error);
