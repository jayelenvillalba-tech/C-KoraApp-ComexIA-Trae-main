import Ably from 'ably';
const key = 'ZMYUAQ.B8qE8g:w7NcUeFp1oXahc47cSL2PUyHCrLvi--JzuL4oV4MwUA';
const ably = new Ably.Rest({ key });
try {
  const req = await ably.auth.createTokenRequest({ clientId: 'test' }, { key });
  console.log('Success:', req);
} catch (err) {
  console.error('Error:', err);
}
