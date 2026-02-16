import { initDatabase } from './database/db-sqlite';
import { sql } from 'drizzle-orm';

async function getStats() {
  try {
    const db = await initDatabase();
    
    const users = await db.get(sql`SELECT COUNT(*) as count FROM users`);
    const companies = await db.get(sql`SELECT COUNT(*) as count FROM companies`);
    // Assuming 'hs_subpartidas' or similar based on schema check
    const products = await db.get(sql`SELECT COUNT(*) as count FROM hs_subpartidas`); 
    const regulations = await db.get(sql`SELECT COUNT(*) as count FROM regulatory_rules`);
    const posts = await db.get(sql`SELECT COUNT(*) as count FROM marketplace_posts`);
    const news = await db.get(sql`SELECT COUNT(*) as count FROM news`);
    
    // Check company types distribution if possible
    const companyTypes = await db.all(sql`SELECT type, COUNT(*) as count FROM companies GROUP BY type`);

    console.log(JSON.stringify({
      users: users.count,
      companies: companies.count,
      hs_codes: products.count,
      regulations: regulations.count,
      posts: posts.count,
      news: news.count,
      company_types: companyTypes
    }, null, 2));

    process.exit(0);

  } catch (error) {
    console.error("Error fetching stats:", error);
    process.exit(1);
  }
}

getStats();
