import fetch from 'node-fetch';

async function check() {
  try {
    const BASE_URL = 'http://localhost:3000';
    
    // 1. Register User
    console.log('1. Registering User...');
    const userRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Chat Tester',
            email: `chat${Date.now()}@test.com`,
            password: 'pass',
            companyName: 'Chat Company'
        })
    });
    const user: any = await userRes.json();
    console.log('User status:', userRes.status);
    console.log('User object:', JSON.stringify(user, null, 2));
    
    if (!user.id) return;
    
    // 2. Create Conversation
    console.log('\n2. Creating Conversation...');
    const chatRes = await fetch(`${BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: user.id,
            otherCompanyId: user.companyId, // Self-chat for testing
            initialMessage: 'Hello World'
        })
    });
    
    const chat: any = await chatRes.json();
    console.log('Chat:', chatRes.status);
    console.log('Response:', JSON.stringify(chat, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
