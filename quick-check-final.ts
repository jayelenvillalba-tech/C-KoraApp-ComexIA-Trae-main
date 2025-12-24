import fetch from 'node-fetch';

async function check() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('--- Checking Billing ---');
  try {
      const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'test' })
      });
      console.log(`Billing: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log('Body:', text.substring(0, 200));
  } catch(e) { console.error('Billing Error:', e.message); }

  console.log('\n--- Checking Cost Calc ---');
  try {
      const res = await fetch(`${BASE_URL}/api/calculate-costs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hsCode: '010111',
            origin: 'AR',
            destination: 'US',
            weight: 1000,
            fobValue: 50000,
            transport: 'maritime',
            incoterm: 'FOB',
            urgency: 'standard'
          })
      });
      console.log(`Calc: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log('Body:', text.substring(0, 200));
  } catch(e) { console.error('Calc Error:', e.message); }
}

check();
