import Parser from 'rss-parser';
import OpenAI from 'openai';
import { sqliteDb } from '../../database/db-sqlite';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_key' });
  }
  return _openai;
}

interface RSSSource {
  name: string;
  url: string;
  type: 'official';
  defaultCountries?: string[];
  defaultTreaties?: string[];
}

const RSS_SOURCES: RSSSource[] = [
  { name: 'WTO', url: 'https://www.wto.org/english/news_e/news_e.rss', type: 'official', defaultTreaties: ['WTO'] },
  { name: 'USDA FAS', url: 'https://www.fas.usda.gov/rss.xml', type: 'official', defaultCountries: ['US'] },
  { name: 'EU ECHA', url: 'https://echa.europa.eu/rss', type: 'official', defaultCountries: ['EU'] },
  { name: 'GACC China', url: 'http://english.customs.gov.cn/rss', type: 'official', defaultCountries: ['CN'] }
];

export class NewsService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: { 'User-Agent': 'ComexIA-NewsBot/2.0' }
    });
  }

  async fetchAllSources(): Promise<{ added: number; skipped: number; errors: string[] }> {
    if (!sqliteDb) {
      console.warn('[NewsService] Database not ready, skipping fetch');
      return { added: 0, skipped: 0, errors: ['DB not ready'] };
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    console.log(`[NewsService] Starting RSS fetch from ${RSS_SOURCES.length} sources...`);

    for (const source of RSS_SOURCES) {
      try {
        console.log(`[NewsService] Fetching: ${source.name}`);
        const result = await this.fetchSource(source);
        added += result.added;
        skipped += result.skipped;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        const errorMsg = `${source.name}: ${error.message}`;
        console.error(`[NewsService] Error:`, errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`[NewsService] Complete. Added: ${added}, Skipped: ${skipped}, Errors: ${errors.length}`);
    return { added, skipped, errors };
  }

  private async fetchSource(source: RSSSource): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    const feed = await this.parser.parseURL(source.url);

    for (const item of feed.items.slice(0, 10)) {
      if (!item.link) continue;

      // Check if already exists in SQLite
      const existing = sqliteDb.prepare('SELECT id FROM trade_news WHERE source_url = ?').get(item.link);
      if (existing) {
        skipped++;
        continue;
      }

      // Classify and Translate content using AI
      const classification = await this.classifyAndTranslate(
        item.title || '',
        item.contentSnippet || item.content || ''
      );

      const id = `news_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const pubDate = item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000);
      
      const combinedCountries = [...new Set([...(source.defaultCountries || []), ...classification.countries])];
      
      try {
        sqliteDb.prepare(`
          INSERT INTO trade_news 
          (id, title, title_en, source, source_url, type, severity, affected_countries, affected_hs_codes, publish_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          classification.titleEs || item.title || 'Untitled',
          classification.titleEn || item.title || 'Untitled',
          source.name,
          item.link,
          classification.type,
          'medium', // Default severity
          JSON.stringify(combinedCountries),
          JSON.stringify(classification.hsCodes),
          pubDate
        );
        added++;
      } catch (err) {
        console.error('[NewsService] Failed to insert row into SQLite:', err);
      }
    }

    return { added, skipped };
  }

  private async classifyAndTranslate(title: string, content: string): Promise<{
    titleEs: string;
    titleEn: string;
    hsCodes: string[];
    countries: string[];
    type: 'critical' | 'warning' | 'info' | 'opportunity' | 'regulation' | 'treaty' | 'market';
  }> {
    try {
      const prompt = `Analyze this trade news and extract:
1. A concise translation of the title to Spanish (titleEs)
2. A concise translation of the title to English (titleEn)
3. HS Codes mentioned (4 or 6 digit codes, e.g., "1001", "220421")
4. Country codes (ISO 2-letter, e.g., "US", "CN", "AR")
5. Alert type: "critical", "warning", "info", "opportunity", "regulation", "treaty", or "market"

Title: ${title}
Content: ${content.substring(0, 1000)}

Return ONLY valid JSON:
{
  "titleEs": "El título en español",
  "titleEn": "The title in English",
  "hsCodes": ["1001"],
  "countries": ["US", "CN"],
  "type": "warning"
}`;

      const OpenAIClient = getOpenAI();
      const response = await OpenAIClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        titleEs: result.titleEs || title,
        titleEn: result.titleEn || title,
        hsCodes: result.hsCodes || [],
        countries: result.countries || [],
        type: result.type || 'info',
      };
    } catch (error) {
      console.error('[NewsService] AI Classification failed:', error);
      return {
        titleEs: title,
        titleEn: title,
        hsCodes: [],
        countries: [],
        type: 'info'
      };
    }
  }
}

export const newsService = new NewsService();
