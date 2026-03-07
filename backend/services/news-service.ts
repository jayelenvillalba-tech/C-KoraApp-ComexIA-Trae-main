import Parser from 'rss-parser';
import { NewsItem } from '../models/NewsItem';
import OpenAI from 'openai';

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
  {
    name: 'WTO',
    url: 'https://www.wto.org/english/news_e/news_e.rss',
    type: 'official',
    defaultTreaties: ['WTO']
  },
  {
    name: 'USDA FAS',
    url: 'https://www.fas.usda.gov/rss.xml',
    type: 'official',
    defaultCountries: ['US']
  },
  {
    name: 'EU ECHA (REACH)',
    url: 'https://echa.europa.eu/rss',
    type: 'official',
    defaultCountries: ['DE', 'FR', 'ES', 'IT'],
    defaultTreaties: ['EU'],
    defaultLaws: ['REACH']
  },
  {
    name: 'GACC China',
    url: 'http://english.customs.gov.cn/rss',
    type: 'official',
    defaultCountries: ['CN']
  }
];

export class NewsService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'ComexIA-NewsBot/1.0'
      }
    });
  }

  async fetchAllSources(): Promise<{ added: number; skipped: number; errors: string[] }> {
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
        
        // Rate limiting: wait 2 seconds between sources
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        const errorMsg = `${source.name}: ${error.message}`;
        console.error(`[NewsService] Error:`, errorMsg);
        errors.push(errorMsg);
        // Continue with other sources
      }
    }

    console.log(`[NewsService] Complete. Added: ${added}, Skipped: ${skipped}, Errors: ${errors.length}`);
    return { added, skipped, errors };
  }

  private async fetchSource(source: RSSSource): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    const feed = await this.parser.parseURL(source.url);

    for (const item of feed.items.slice(0, 10)) { // Limit to 10 most recent per source
      if (!item.link) continue;

      // Check if already exists
      const exists = await NewsItem.findOne({ fullUrl: item.link });
      if (exists) {
        skipped++;
        continue;
      }

      // Classify content using AI
      const classification = await this.classifyContent(
        item.title || '',
        item.contentSnippet || item.content || ''
      );

      // Create news item
      await NewsItem.create({
        title: item.title || 'Untitled',
        summary: (item.contentSnippet || item.content || '').substring(0, 500),
        fullUrl: item.link,
        source: source.name,
        sourceType: 'official',
        publishedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        hsCodes: classification.hsCodes,
        countries: [...(source.defaultCountries || []), ...classification.countries],
        treaties: [...(source.defaultTreaties || []), ...classification.treaties],
        laws: classification.laws,
        type: classification.type,
        tags: classification.tags
      });

      added++;
    }

    return { added, skipped };
  }

  private async classifyContent(title: string, content: string): Promise<{
    hsCodes: string[];
    countries: string[];
    treaties: string[];
    laws: string[];
    type: 'critical' | 'warning' | 'info' | 'opportunity';
    tags: string[];
  }> {
    try {
      const prompt = `Analyze this trade news and extract:
1. HS Codes mentioned (4 or 6 digit codes, e.g., "1001", "220421")
2. Country codes (ISO 2-letter, e.g., "US", "CN", "NG")
3. Treaties/Trade Blocs (e.g., "AfCFTA", "USMCA", "RCEP", "EU")
4. Laws/Regulations (e.g., "GDPR", "REACH", "FSMA")
5. Alert type: "critical" (bans, urgent deadlines), "warning" (upcoming changes), "info" (general updates), or "opportunity" (new markets/agreements)
6. Tags (keywords like "tariff", "sanitary", "digital trade", etc.)

Title: ${title}
Content: ${content.substring(0, 1000)}

Return ONLY valid JSON:
{
  "hsCodes": ["1001"],
  "countries": ["US", "CN"],
  "treaties": ["USMCA"],
  "laws": ["FSMA"],
  "type": "warning",
  "tags": ["food safety", "registration"]
}`;

      const OpenAIClient = getOpenAI();
      const response = await OpenAIClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        hsCodes: result.hsCodes || [],
        countries: result.countries || [],
        treaties: result.treaties || [],
        laws: result.laws || [],
        type: result.type || 'info',
        tags: result.tags || []
      };
    } catch (error) {
      console.error('[NewsService] AI Classification failed:', error);
      // Fallback to basic keyword matching
      return this.basicClassification(title, content);
    }
  }

  private basicClassification(title: string, content: string): {
    hsCodes: string[];
    countries: string[];
    treaties: string[];
    laws: string[];
    type: 'critical' | 'warning' | 'info' | 'opportunity';
    tags: string[];
  } {
    const text = (title + ' ' + content).toLowerCase();
    
    // Simple keyword matching
    const treaties = ['afcfta', 'usmca', 'rcep', 'eu', 'gcc', 'asean'].filter(t => text.includes(t.toLowerCase()));
    const laws = ['gdpr', 'reach', 'eudr', 'fsma', 'cbam'].filter(l => text.includes(l.toLowerCase()));
    
    let type: 'critical' | 'warning' | 'info' | 'opportunity' = 'info';
    if (text.includes('ban') || text.includes('urgent') || text.includes('deadline')) type = 'critical';
    else if (text.includes('warning') || text.includes('change') || text.includes('update')) type = 'warning';
    else if (text.includes('opportunity') || text.includes('agreement') || text.includes('new market')) type = 'opportunity';

    return {
      hsCodes: [],
      countries: [],
      treaties: treaties.map(t => t.toUpperCase()),
      laws: laws.map(l => l.toUpperCase()),
      type,
      tags: []
    };
  }
}

export const newsService = new NewsService();
