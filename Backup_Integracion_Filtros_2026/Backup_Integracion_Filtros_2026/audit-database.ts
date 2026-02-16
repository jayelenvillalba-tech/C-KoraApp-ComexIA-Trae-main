import { initDatabase, sqliteDb } from './database/db-sqlite.js';

console.log('=== AUDITORÍA COMPLETA DE BASE DE DATOS ===\n');

async function auditDatabase() {
  try {
    await initDatabase();
    
    console.log('📊 CÓDIGOS HS:');
    const sections = sqliteDb.exec('SELECT COUNT(*) as count FROM hs_sections');
    const chapters = sqliteDb.exec('SELECT COUNT(*) as count FROM hs_chapters');
    const partidas = sqliteDb.exec('SELECT COUNT(*) as count FROM hs_partidas');
    const subpartidas = sqliteDb.exec('SELECT COUNT(*) as count FROM hs_subpartidas');
    
    console.log(`  - Secciones: ${sections[0]?.values[0][0] || 0}`);
    console.log(`  - Capítulos: ${chapters[0]?.values[0][0] || 0}`);
    console.log(`  - Partidas: ${partidas[0]?.values[0][0] || 0}`);
    console.log(`  - Subpartidas: ${subpartidas[0]?.values[0][0] || 0}`);
    console.log(`  - TOTAL HS CODES: ${subpartidas[0]?.values[0][0] || 0}\n`);
    
    console.log('🌍 PAÍSES Y REGULACIONES:');
    const countries = sqliteDb.exec('SELECT COUNT(*) as count FROM countries');
    const countryReqs = sqliteDb.exec('SELECT COUNT(*) as count FROM country_requirements');
    const baseReqs = sqliteDb.exec('SELECT COUNT(*) as count FROM country_base_requirements');
    
    console.log(`  - Países: ${countries[0]?.values[0][0] || 0}`);
    console.log(`  - Requisitos por país: ${countryReqs[0]?.values[0][0] || 0}`);
    console.log(`  - Requisitos base: ${baseReqs[0]?.values[0][0] || 0}\n`);
    
    console.log('🏢 EMPRESAS Y USUARIOS:');
    const companiesCount = sqliteDb.exec('SELECT COUNT(*) as count FROM companies');
    const usersCount = sqliteDb.exec('SELECT COUNT(*) as count FROM users');
    const verifiedCompanies = sqliteDb.exec('SELECT COUNT(*) as count FROM companies WHERE verified = 1');
    
    console.log(`  - Empresas: ${companiesCount[0]?.values[0][0] || 0}`);
    console.log(`  - Empresas verificadas: ${verifiedCompanies[0]?.values[0][0] || 0}`);
    console.log(`  - Usuarios: ${usersCount[0]?.values[0][0] || 0}\n`);
    
    console.log('🛒 MARKETPLACE:');
    const posts = sqliteDb.exec('SELECT COUNT(*) as count FROM marketplace_posts');
    const activePosts = sqliteDb.exec('SELECT COUNT(*) as count FROM marketplace_posts WHERE status = "active"');
    
    console.log(`  - Publicaciones totales: ${posts[0]?.values[0][0] || 0}`);
    console.log(`  - Publicaciones activas: ${activePosts[0]?.values[0][0] || 0}\n`);
    
    console.log('💬 CHAT Y CONVERSACIONES:');
    const conversations = sqliteDb.exec('SELECT COUNT(*) as count FROM conversations');
    const messages = sqliteDb.exec('SELECT COUNT(*) as count FROM messages');
    
    console.log(`  - Conversaciones: ${conversations[0]?.values[0][0] || 0}`);
    console.log(`  - Mensajes: ${messages[0]?.values[0][0] || 0}\n`);
    
    console.log('💳 SUSCRIPCIONES:');
    const subscriptions = sqliteDb.exec('SELECT COUNT(*) as count FROM subscriptions');
    const activeSubscriptions = sqliteDb.exec('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    
    console.log(`  - Suscripciones totales: ${subscriptions[0]?.values[0][0] || 0}`);
    console.log(`  - Suscripciones activas: ${activeSubscriptions[0]?.values[0][0] || 0}\n`);
    
    console.log('✅ VERIFICACIONES:');
    const verifications = sqliteDb.exec('SELECT COUNT(*) as count FROM verifications');
    const pendingVerifications = sqliteDb.exec('SELECT COUNT(*) as count FROM verifications WHERE status = "pending"');
    
    console.log(`  - Verificaciones totales: ${verifications[0]?.values[0][0] || 0}`);
    console.log(`  - Verificaciones pendientes: ${pendingVerifications[0]?.values[0][0] || 0}\n`);
    
    console.log('📋 RESUMEN:');
    console.log(`  ✓ Base de datos: comexia_v2.db`);
    console.log(`  ✓ Total de tablas con datos: ${[sections, chapters, partidas, subpartidas, countries, companiesCount, posts, conversations, subscriptions].filter(r => r[0]?.values[0][0] > 0).length}`);
    
    // Verificar si hay datos premium
    const premiumUsers = sqliteDb.exec('SELECT COUNT(*) as count FROM users WHERE role = "premium"');
    console.log(`\n💎 FUNCIONES PREMIUM:`);
    console.log(`  - Usuarios premium: ${premiumUsers[0]?.values[0][0] || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

auditDatabase();
