# World Trade Pulse - System Documentation

## Overview

**World Trade Pulse** is ComexIA's official regulatory news aggregation and alert system. It automatically fetches, classifies, and displays trade-related news from official sources worldwide.

## Architecture

### Components

1. **NewsItem Model** (`backend/models/NewsItem.ts`)
   - MongoDB schema for storing news articles
   - Fields: title, summary, source, hsCodes, countries, treaties, laws, type, tags
   - Indexes: fullUrl (unique), hsCodes, countries, treaties, publishedDate

2. **NewsService** (`backend/services/news-service.ts`)
   - RSS feed parser and fetcher
   - AI-powered content classification (OpenAI GPT-4o-mini)
   - Deduplication logic
   - Error handling and rate limiting

3. **API Routes** (`backend/routes/news.ts`)
   - `GET /api/news` - Fetch news with filters (hsCode, country, treaty, type, search)
   - `GET /api/news/latest` - Quick summary for dashboard
   - Pagination support

4. **Frontend Components**
   - `WorldTradePulse` (`src/components/world-trade-pulse.tsx`) - Main news dashboard
   - `RelatedNewsWidget` (`src/components/related-news-widget.tsx`) - Contextual news display

5. **Cron Job** (`backend/server.ts`)
   - Automated fetching every 12 hours
   - Runs at 00:00 and 12:00 UTC
   - Non-blocking (doesn't affect server startup)

## Data Flow

```
RSS Sources → NewsService.fetchAllSources()
                    ↓
            Parse RSS Feed (rss-parser)
                    ↓
            AI Classification (OpenAI)
                    ↓
            Deduplication Check (MongoDB)
                    ↓
            Save to NewsItem Collection
                    ↓
            Display in UI (WorldTradePulse)
```

## AI Classification

### Input
- **Title:** News headline
- **Content:** First 1000 characters of article

### Output (JSON)
```json
{
  "hsCodes": ["1001", "220421"],
  "countries": ["US", "CN", "NG"],
  "treaties": ["AfCFTA", "USMCA"],
  "laws": ["GDPR", "REACH"],
  "type": "critical",
  "tags": ["tariff", "sanitary"]
}
```

### Alert Types
- **critical:** Bans, urgent deadlines, immediate action required
- **warning:** Upcoming regulatory changes, compliance updates
- **info:** General updates, policy announcements
- **opportunity:** New trade agreements, market openings

### Fallback Strategy
If AI classification fails (API error, timeout, invalid JSON):
- Uses keyword matching for treaties and laws
- Assigns default type based on keywords (ban → critical, etc.)
- Logs error but continues processing

## RSS Sources

See [NEWS_SOURCES.md](./NEWS_SOURCES.md) for complete list.

**Active Automated Sources:**
- WTO (World Trade Organization)
- USDA FAS (Foreign Agricultural Service)
- EU ECHA (European Chemicals Agency - REACH)
- GACC (China General Administration of Customs)

**Planned (Manual Scraping):**
- AfCFTA Secretariat
- CBN Nigeria
- SENASA Argentina
- WCO (World Customs Organization)
- EU TARIC

## Cron Schedule

### Production
- **Frequency:** Every 12 hours
- **Schedule:** `0 */12 * * *` (00:00 UTC, 12:00 UTC)
- **Execution Time:** ~30-60 seconds (depends on source availability)

### Development
- **Manual Trigger:** `npm run fetch-news` (runs `scripts/fetch-news-manual.ts`)
- **On-Demand:** Call `newsService.fetchAllSources()` from any script

## Error Handling

### Source Failures
- Individual source errors don't block others
- Errors logged with source name and message
- Next cron cycle will retry failed sources

### Rate Limiting
- 2-second delay between sources
- 10-second timeout per source
- User-Agent header: `ComexIA-NewsBot/1.0`

### Deduplication
- **Key:** `fullUrl` (unique index)
- **Strategy:** Check existence before insert
- **Result:** Skipped count incremented, no error thrown

## Frontend Integration

### World Trade Pulse Page (`/news`)
- Full news dashboard with search and filters
- Filter by: HS Code, Country, Treaty, Alert Type
- Pagination (20 items per page)
- Direct links to official sources

### Related News Widgets
- **RequiredDocuments:** Shows news related to selected HS code and country
- **Marketplace (Future):** Shows news related to post's product and destination
- **Dashboard (Future):** Personalized feed based on user's interested HS codes

### UI Features
- Color-coded badges (critical=red, warning=yellow, info=blue, opportunity=green)
- Publication date formatting
- Source attribution
- External link icons
- Responsive design

## API Examples

### Fetch All News
```bash
GET /api/news?limit=20&page=1
```

### Filter by HS Code
```bash
GET /api/news?hsCode=1001&limit=10
```

### Filter by Country
```bash
GET /api/news?country=NG&limit=10
```

### Filter by Treaty
```bash
GET /api/news?treaty=AfCFTA&limit=10
```

### Search
```bash
GET /api/news?search=REACH+chemicals&limit=10
```

### Multiple Filters
```bash
GET /api/news?hsCode=2204&country=DE&type=warning
```

## Monitoring

### Logs
- `[NewsService] Starting RSS fetch from X sources...`
- `[NewsService] Fetching: {source name}`
- `[NewsService] Complete. Added: X, Skipped: Y, Errors: Z`
- `[NewsService] AI Classification failed: {error}` (fallback activated)

### Metrics to Track
- Articles added per fetch
- Duplicate rate (skipped/total)
- Error rate per source
- AI classification success rate
- Average fetch time

## Maintenance

### Adding New Sources
1. Add to `RSS_SOURCES` array in `news-service.ts`
2. Test with manual fetch: `npm run fetch-news`
3. Update `NEWS_SOURCES.md` documentation

### Updating Classification Logic
- Modify `classifyContent()` prompt in `news-service.ts`
- Test with sample articles
- Monitor AI classification logs

### Troubleshooting
- **No new articles:** Check RSS feed URLs (may have changed)
- **AI errors:** Verify `OPENAI_API_KEY` in `.env`
- **Duplicate articles:** Check `fullUrl` uniqueness (some sources reuse URLs)
- **Slow fetching:** Increase timeout or reduce sources per batch

## Security

- **API Keys:** OpenAI key stored in `.env` (never committed)
- **Rate Limiting:** Prevents abuse of official sources
- **Input Validation:** RSS content sanitized before storage
- **Official Sources Only:** No third-party news aggregators

## Future Enhancements

1. **Web Scraping:** For sources without RSS (AfCFTA, CBN, etc.)
2. **Email Alerts:** Notify users of critical news matching their profile
3. **Push Notifications:** Browser notifications for urgent alerts
4. **Sentiment Analysis:** Classify news as positive/negative for markets
5. **Translation:** Auto-translate non-English sources
6. **Historical Trends:** Analytics dashboard for regulatory changes over time
