import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'comexia_v2.db');
const db = new Database(dbPath, { readonly: true });

console.log('=== DIAGNOSTIC REPORT ===\n');

// 1. Check Users
console.log('1. USERS TABLE:');
const users = db.prepare('SELECT id, email, name, role, verified FROM users LIMIT 10').all();
console.log(`   Total users: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
console.log('   Sample users:', JSON.stringify(users, null, 2));

// 2. Check Marketplace Posts
console.log('\n2. MARKETPLACE POSTS:');
const posts = db.prepare('SELECT id, type, product_name, status FROM marketplace_posts LIMIT 5').all();
console.log(`   Total posts: ${db.prepare('SELECT COUNT(*) as count FROM marketplace_posts').get().count}`);
console.log('   Sample posts:', JSON.stringify(posts, null, 2));

// 3. Check Companies
console.log('\n3. COMPANIES:');
const companies = db.prepare('SELECT id, name, country, type FROM companies LIMIT 5').all();
console.log(`   Total companies: ${db.prepare('SELECT COUNT(*) as count FROM companies').get().count}`);
console.log('   Sample companies:', JSON.stringify(companies, null, 2));

// 4. Check Trade Opportunities (for country recommendations)
console.log('\n4. TRADE OPPORTUNITIES:');
const opportunities = db.prepare('SELECT * FROM trade_opportunities LIMIT 3').all();
console.log(`   Total opportunities: ${db.prepare('SELECT COUNT(*) as count FROM trade_opportunities').get().count}`);
console.log('   Sample:', JSON.stringify(opportunities, null, 2));

// 5. Check Country Requirements
console.log('\n5. COUNTRY REQUIREMENTS:');
const requirements = db.prepare('SELECT country_code, hs_code FROM country_requirements LIMIT 5').all();
console.log(`   Total requirements: ${db.prepare('SELECT COUNT(*) as count FROM country_requirements').get().count}`);
console.log('   Sample:', JSON.stringify(requirements, null, 2));

// 6. Check Messages (Corporate Chat)
console.log('\n6. MESSAGES (Corporate Chat):');
const messages = db.prepare('SELECT id, sender_id, content FROM messages LIMIT 3').all();
console.log(`   Total messages: ${db.prepare('SELECT COUNT(*) as count FROM messages').get().count}`);
console.log('   Sample:', JSON.stringify(messages, null, 2));

db.close();
