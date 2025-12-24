import fetch from 'node-fetch';
import { initDatabase, sqliteDb } from './database/db-sqlite.js';

console.log('🧪 === TESTING COMPLETO DE COMEXIA ===\n');

const BASE_URL = 'http://localhost:3000';
let testResults: { category: string; test: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];
let authToken = '';
let testUserId = '';
let testCompanyId = '';
let testConversationId = '';
let testPostId = '';

// Helper functions
function logTest(category: string, test: string, status: 'PASS' | 'FAIL', details?: string) {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} [${category}] ${test}${details ? `: ${details}` : ''}`);
  testResults.push({ category, test, status, details });
}

async function testEndpoint(method: string, endpoint: string, body?: any, headers?: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error: any) {
    return { ok: false, status: 0, error: error.message };
  }
}

// ========== 1. DATABASE TESTS ==========
async function testDatabase() {
  console.log('\n📊 === TESTING DATABASE ===\n');
  
  try {
    await initDatabase();
    logTest('Database', 'Initialize database', 'PASS');
  } catch (error: any) {
    logTest('Database', 'Initialize database', 'FAIL', error.message);
    return;
  }
  
  // Test HS Codes
  try {
    const hsCodesCount = sqliteDb.exec('SELECT COUNT(*) as count FROM hs_subpartidas');
    const count = hsCodesCount[0]?.values[0][0];
    if (count >= 2500) {
      logTest('Database', 'HS Codes count', 'PASS', `${count} codes found`);
    } else {
      logTest('Database', 'HS Codes count', 'FAIL', `Only ${count} codes, expected 2500+`);
    }
  } catch (error: any) {
    logTest('Database', 'HS Codes count', 'FAIL', error.message);
  }
  
  // Test Companies
  try {
    const companiesCount = sqliteDb.exec('SELECT COUNT(*) as count FROM companies');
    const count = companiesCount[0]?.values[0][0];
    if (count >= 50) {
      logTest('Database', 'Companies count', 'PASS', `${count} companies found`);
    } else {
      logTest('Database', 'Companies count', 'FAIL', `Only ${count} companies`);
    }
  } catch (error: any) {
    logTest('Database', 'Companies count', 'FAIL', error.message);
  }
  
  // Test Users
  try {
    const usersCount = sqliteDb.exec('SELECT COUNT(*) as count FROM users');
    const count = usersCount[0]?.values[0][0];
    if (count >= 200) {
      logTest('Database', 'Users/Employees count', 'PASS', `${count} users found`);
    } else {
      logTest('Database', 'Users/Employees count', 'FAIL', `Only ${count} users`);
    }
  } catch (error: any) {
    logTest('Database', 'Users/Employees count', 'FAIL', error.message);
  }
  
  // Test Marketplace Posts
  try {
    const postsCount = sqliteDb.exec('SELECT COUNT(*) as count FROM marketplace_posts');
    const count = postsCount[0]?.values[0][0];
    if (count >= 100) {
      logTest('Database', 'Marketplace posts count', 'PASS', `${count} posts found`);
    } else {
      logTest('Database', 'Marketplace posts count', 'FAIL', `Only ${count} posts`);
    }
  } catch (error: any) {
    logTest('Database', 'Marketplace posts count', 'FAIL', error.message);
  }
  
  // Test News
  try {
    const newsCount = sqliteDb.exec('SELECT COUNT(*) as count FROM news');
    const count = newsCount[0]?.values[0][0];
    if (count >= 50) {
      logTest('Database', 'News articles count', 'PASS', `${count} articles found`);
    } else {
      logTest('Database', 'News articles count', 'FAIL', `Only ${count} articles`);
    }
  } catch (error: any) {
    logTest('Database', 'News articles count', 'FAIL', error.message);
  }
  
  // Test Verifications
  try {
    const verificationsCount = sqliteDb.exec('SELECT COUNT(*) as count FROM verifications');
    const count = verificationsCount[0]?.values[0][0];
    if (count >= 20) {
      logTest('Database', 'Verifications count', 'PASS', `${count} verifications found`);
    } else {
      logTest('Database', 'Verifications count', 'FAIL', `Only ${count} verifications`);
    }
  } catch (error: any) {
    logTest('Database', 'Verifications count', 'FAIL', error.message);
  }
  
  // Test Subscriptions
  try {
    const subscriptionsCount = sqliteDb.exec('SELECT COUNT(*) as count FROM subscriptions');
    const count = subscriptionsCount[0]?.values[0][0];
    if (count >= 10) {
      logTest('Database', 'Subscriptions count', 'PASS', `${count} subscriptions found`);
    } else {
      logTest('Database', 'Subscriptions count', 'FAIL', `Only ${count} subscriptions`);
    }
  } catch (error: any) {
    logTest('Database', 'Subscriptions count', 'FAIL', error.message);
  }
}

// ========== 2. API HEALTH TESTS ==========
async function testHealth() {
  console.log('\n🏥 === TESTING API HEALTH ===\n');
  
  const result = await testEndpoint('GET', '/api/health');
  if (result.ok && result.data.status === 'ok') {
    logTest('API', 'Health check', 'PASS', `Services: ${JSON.stringify(result.data.services)}`);
  } else {
    logTest('API', 'Health check', 'FAIL', result.error || 'Unexpected response');
  }
}

// ========== 3. AUTHENTICATION TESTS ==========
async function testAuth() {
  console.log('\n🔐 === TESTING AUTHENTICATION ===\n');
  
  // Test Register
  const registerData = {
    name: 'Test User',
    email: `test${Date.now()}@test.com`,
    password: 'test123',
    companyName: 'Test Company'
  };
  
  const registerResult = await testEndpoint('POST', '/api/auth/register', registerData);
  if (registerResult.ok && registerResult.data.id) {
    testUserId = registerResult.data.id;
    testCompanyId = registerResult.data.companyId;
    logTest('Auth', 'Register user', 'PASS', `User ID: ${testUserId}`);
  } else {
    logTest('Auth', 'Register user', 'FAIL', registerResult.error || 'No user ID returned');
  }
  
  // Test Login
  const loginResult = await testEndpoint('POST', '/api/auth/login', {
    email: registerData.email,
    password: registerData.password
  });
  
  if (loginResult.ok && loginResult.data.id) {
    authToken = 'mock-token'; // In real app, would get JWT
    logTest('Auth', 'Login user', 'PASS', `Logged in as ${loginResult.data.name}`);
  } else {
    logTest('Auth', 'Login user', 'FAIL', loginResult.error || 'Login failed');
  }
}

// ========== 4. HS CODES TESTS ==========
async function testHSCodes() {
  console.log('\n🔍 === TESTING HS CODES ===\n');
  
  // Test Search
  const searchResult = await testEndpoint('GET', '/api/hs-codes/search?q=carne&limit=10');
  if (searchResult.ok && Array.isArray(searchResult.data) && searchResult.data.length > 0) {
    logTest('HS Codes', 'Search functionality', 'PASS', `Found ${searchResult.data.length} results`);
  } else {
    logTest('HS Codes', 'Search functionality', 'FAIL', 'No results or error');
  }
  
  // Test Get by Code
  const codeResult = await testEndpoint('GET', '/api/hs-codes/0201');
  if (codeResult.ok && codeResult.data) {
    logTest('HS Codes', 'Get by code', 'PASS', `Found code 0201`);
  } else {
    logTest('HS Codes', 'Get by code', 'FAIL', 'Code not found');
  }
}

// ========== 5. COMPANIES TESTS ==========
async function testCompanies() {
  console.log('\n🏢 === TESTING COMPANIES ===\n');
  
  // Test List Companies
  const listResult = await testEndpoint('GET', '/api/companies?limit=10');
  if (listResult.ok && Array.isArray(listResult.data) && listResult.data.length > 0) {
    logTest('Companies', 'List companies', 'PASS', `Found ${listResult.data.length} companies`);
    
    // Test Get Company Profile
    const companyId = listResult.data[0].id;
    const profileResult = await testEndpoint('GET', `/api/companies/${companyId}`);
    if (profileResult.ok && profileResult.data) {
      logTest('Companies', 'Get company profile', 'PASS', `Profile for ${profileResult.data.name}`);
    } else {
      logTest('Companies', 'Get company profile', 'FAIL', 'Profile not found');
    }
  } else {
    logTest('Companies', 'List companies', 'FAIL', 'No companies found');
  }
}

// ========== 6. MARKETPLACE TESTS ==========
async function testMarketplace() {
  console.log('\n🛒 === TESTING MARKETPLACE ===\n');
  
  // Test List Posts
  const listResult = await testEndpoint('GET', '/api/marketplace/posts?limit=10');
  if (listResult.ok && Array.isArray(listResult.data) && listResult.data.length > 0) {
    logTest('Marketplace', 'List posts', 'PASS', `Found ${listResult.data.length} posts`);
    testPostId = listResult.data[0].id;
    
    // Test Get Post Detail
    const detailResult = await testEndpoint('GET', `/api/marketplace/posts/${testPostId}`);
    if (detailResult.ok && detailResult.data) {
      logTest('Marketplace', 'Get post detail', 'PASS', `Post: ${detailResult.data.productName}`);
    } else {
      logTest('Marketplace', 'Get post detail', 'FAIL', 'Post not found');
    }
  } else {
    logTest('Marketplace', 'List posts', 'FAIL', 'No posts found');
  }
}

// ========== 7. CHAT TESTS ==========
async function testChat() {
  console.log('\n💬 === TESTING CHAT SYSTEM ===\n');
  
  // Test List Conversations
  const listResult = await testEndpoint('GET', '/api/chat/conversations');
  if (listResult.ok) {
    logTest('Chat', 'List conversations', 'PASS', `Found ${Array.isArray(listResult.data) ? listResult.data.length : 0} conversations`);
  } else {
    logTest('Chat', 'List conversations', 'FAIL', listResult.error);
  }
  
  // Test Create Conversation (if we have test user)
  if (testUserId && testCompanyId) {
    const createResult = await testEndpoint('POST', '/api/chat/conversations', {
      company1Id: testCompanyId,
      company2Id: testCompanyId, // Mock - same company for testing
      postId: testPostId
    });
    
    if (createResult.ok && createResult.data.id) {
      testConversationId = createResult.data.id;
      logTest('Chat', 'Create conversation', 'PASS', `Conversation ID: ${testConversationId}`);
      
      // Test Send Message
      const messageResult = await testEndpoint('POST', `/api/chat/conversations/${testConversationId}/messages`, {
        senderId: testUserId,
        content: 'Test message',
        messageType: 'text'
      });
      
      if (messageResult.ok) {
        logTest('Chat', 'Send message', 'PASS', 'Message sent successfully');
      } else {
        logTest('Chat', 'Send message', 'FAIL', messageResult.error);
      }
    } else {
      logTest('Chat', 'Create conversation', 'FAIL', createResult.error);
    }
  }
  
  // Test AI Endpoints
  const aiSuggestResult = await testEndpoint('POST', '/api/chat/ai/suggest', {
    conversationId: testConversationId || 'test',
    lastMessage: 'Hola'
  });
  
  if (aiSuggestResult.ok) {
    logTest('Chat', 'AI suggestions', 'PASS', 'AI suggestions working');
  } else {
    logTest('Chat', 'AI suggestions', 'FAIL', aiSuggestResult.error);
  }
}

// ========== 8. BILLING TESTS ==========
async function testBilling() {
  console.log('\n💳 === TESTING BILLING SYSTEM ===\n');
  
  // Test Checkout (requires auth, so might fail)
  const checkoutResult = await testEndpoint('POST', '/api/billing/checkout', {
    planId: 'pyme'
  });
  
  if (checkoutResult.ok || checkoutResult.status === 400) {
    // 400 is expected if not authenticated
    logTest('Billing', 'Checkout endpoint', 'PASS', 'Endpoint responding');
  } else {
    logTest('Billing', 'Checkout endpoint', 'FAIL', checkoutResult.error);
  }
}

// ========== 9. VERIFICATIONS TESTS ==========
async function testVerifications() {
  console.log('\n✅ === TESTING VERIFICATIONS ===\n');
  
  // Test List Verifications (admin endpoint)
  const listResult = await testEndpoint('GET', '/api/admin/verifications');
  if (listResult.ok && Array.isArray(listResult.data)) {
    logTest('Verifications', 'List verifications', 'PASS', `Found ${listResult.data.length} verifications`);
  } else {
    logTest('Verifications', 'List verifications', 'FAIL', listResult.error);
  }
}

// ========== 10. NEWS TESTS ==========
async function testNews() {
  console.log('\n📰 === TESTING NEWS ===\n');
  
  const newsResult = await testEndpoint('GET', '/api/news?category=regulacion');
  if (newsResult.ok && Array.isArray(newsResult.data) && newsResult.data.length > 0) {
    logTest('News', 'Get news articles', 'PASS', `Found ${newsResult.data.length} articles`);
  } else {
    logTest('News', 'Get news articles', 'FAIL', 'No news found');
  }
}

// ========== 11. COST CALCULATOR TESTS ==========
async function testCostCalculator() {
  console.log('\n💰 === TESTING COST CALCULATOR ===\n');
  
  const calcResult = await testEndpoint('POST', '/api/calculate-costs', {
    hsCode: '0201',
    origin: 'AR',
    destination: 'US',
    weight: 1000,
    value: 50000
  });
  
  if (calcResult.ok && calcResult.data) {
    logTest('Cost Calculator', 'Calculate costs', 'PASS', 'Calculation successful');
  } else {
    logTest('Cost Calculator', 'Calculate costs', 'FAIL', calcResult.error);
  }
}

// ========== MAIN TEST RUNNER ==========
async function runAllTests() {
  console.log('⏰ Starting tests at:', new Date().toISOString());
  console.log('🌐 Base URL:', BASE_URL);
  console.log('━'.repeat(60));
  
  try {
    await testDatabase();
    await testHealth();
    await testAuth();
    await testHSCodes();
    await testCompanies();
    await testMarketplace();
    await testChat();
    await testBilling();
    await testVerifications();
    await testNews();
    await testCostCalculator();
  } catch (error: any) {
    console.error('\n❌ Fatal error during testing:', error.message);
  }
  
  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 === TEST SUMMARY ===\n');
  
  const categories = [...new Set(testResults.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const passed = categoryTests.filter(r => r.status === 'PASS').length;
    const failed = categoryTests.filter(r => r.status === 'FAIL').length;
    const total = categoryTests.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    console.log(`${category}:`);
    console.log(`  ✅ Passed: ${passed}/${total} (${percentage}%)`);
    if (failed > 0) {
      console.log(`  ❌ Failed: ${failed}`);
    }
    console.log('');
  });
  
  const totalPassed = testResults.filter(r => r.status === 'PASS').length;
  const totalFailed = testResults.filter(r => r.status === 'FAIL').length;
  const totalTests = testResults.length;
  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log('━'.repeat(60));
  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)\n`);
  
  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready for backup and deployment.\n');
  } else {
    console.log(`⚠️  ${totalFailed} tests failed. Review failures before proceeding.\n`);
    console.log('Failed tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ [${r.category}] ${r.test}${r.details ? `: ${r.details}` : ''}`);
    });
    console.log('');
  }
  
  // Save results to file
  const fs = await import('fs');
  const resultsFile = `test-results-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      percentage: overallPercentage
    },
    results: testResults
  }, null, 2));
  
  console.log(`📄 Results saved to: ${resultsFile}\n`);
}

// Run tests
runAllTests().catch(console.error);
