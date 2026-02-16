import { db, initDatabase } from './database/db-sqlite';
import { sql } from 'drizzle-orm';
import { 
  countries, hsSubpartidas, companies, marketplacePosts, 
  conversations, news, tradeAlerts, countryRequirements, countryBaseRequirements
} from './shared/schema-sqlite';

async function getStats() {
  try {
    await initDatabase();
    const counts = {
      countries: await db.select({ count: sql<number>`count(*)` }).from(countries),
      hsCodes: await db.select({ count: sql<number>`count(*)` }).from(hsSubpartidas),
      companies: await db.select({ count: sql<number>`count(*)` }).from(companies),
      posts: await db.select({ count: sql<number>`count(*)` }).from(marketplacePosts),
      conversations: await db.select({ count: sql<number>`count(*)` }).from(conversations),
      news: await db.select({ count: sql<number>`count(*)` }).from(news),
      requirements: await db.select({ count: sql<number>`count(*)` }).from(countryRequirements),
      baseRequirements: await db.select({ count: sql<number>`count(*)` }).from(countryBaseRequirements),
      ports: await db.all(sql`SELECT count(*) as count FROM global_ports`),
      routes: await db.all(sql`SELECT count(*) as count FROM logistics_routes`),
    };

    console.log('--- STATS START ---');
    console.log(`Countries: ${counts.countries[0].count}`);
    console.log(`HS Codes (Subpartidas): ${counts.hsCodes[0].count}`);
    console.log(`Companies: ${counts.companies[0].count}`);
    console.log(`Marketplace Posts: ${counts.posts[0].count}`);
    console.log(`Active Chats: ${counts.conversations[0].count}`);
    console.log(`News Items: ${counts.news[0].count}`);
    console.log(`Regulatory Requirements (Tier 2): ${counts.requirements[0].count}`);
    console.log(`Base Requirements (Tier 1): ${counts.baseRequirements[0].count}`);
    console.log(`Global Ports: ${counts.ports[0].count}`);
    console.log(`Logistics Routes: ${counts.routes[0].count}`);
    console.log('--- STATS END ---');
  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

getStats();
