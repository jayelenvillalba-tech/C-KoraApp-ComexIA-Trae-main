import fetch from 'node-fetch';

async function check() {
  try {
    console.log('Testing /api/health...');
    const health = await fetch('http://localhost:3000/api/health').then(r => r.json());
    console.log('Health:', health);

    console.log('\nTesting /api/companies...');
    const companies = await fetch('http://localhost:3000/api/companies?limit=5').then(r => r.json());
    console.log('Companies status:', companies.length ? 'OK' : 'EMPTY');
    console.log('Count:', Array.isArray(companies) ? companies.length : companies);
    
    console.log('\nTesting /api/hs-codes/search?q=carne...');
    const hs = await fetch('http://localhost:3000/api/hs-codes/search?q=carne').then(r => r.json());
    console.log('HS Search status:', Array.isArray(hs) && hs.length > 0 ? 'OK' : 'FAIL');
    console.log('Count:', Array.isArray(hs) ? hs.length : hs);

  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
