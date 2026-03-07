# Official News Sources - World Trade Pulse

## Active RSS Feeds

### Global Organizations

#### WTO (World Trade Organization)
- **URL:** https://www.wto.org/english/news_e/news_e.rss
- **Coverage:** Global trade policy, dispute settlements, negotiations
- **Update Frequency:** Daily
- **Default Tags:** WTO, multilateral trade

#### WCO (World Customs Organization)
- **URL:** http://www.wcoomd.org/en/media/newsroom.aspx (Manual scraping if no RSS)
- **Coverage:** Customs procedures, HS Code updates, harmonization
- **Update Frequency:** Weekly

### Regional Blocs

#### AfCFTA Secretariat
- **URL:** https://au-afcfta.org/news/ (Manual scraping - no official RSS)
- **Coverage:** African Continental Free Trade Area updates
- **Default Tags:** AfCFTA, Africa, regional integration

#### EU ECHA (European Chemicals Agency)
- **URL:** https://echa.europa.eu/rss
- **Coverage:** REACH, EUDR, chemical regulations
- **Default Countries:** DE, FR, ES, IT, NL
- **Default Laws:** REACH, EUDR

#### EU TARIC
- **URL:** https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp (Manual)
- **Coverage:** EU tariff classifications, suspensions

### National Authorities

#### USDA FAS (Foreign Agricultural Service)
- **URL:** https://www.fas.usda.gov/rss.xml
- **Coverage:** Agricultural trade, GAIN reports, market access
- **Default Countries:** US

#### GACC (China Customs)
- **URL:** http://english.customs.gov.cn/rss
- **Coverage:** Import/export regulations, registration requirements
- **Default Countries:** CN

#### CBN (Central Bank of Nigeria)
- **URL:** https://www.cbn.gov.ng/documents/news.asp (Manual)
- **Coverage:** Foreign exchange, import duties, trade finance
- **Default Countries:** NG

#### SENASA (Argentina)
- **URL:** https://www.argentina.gob.ar/senasa (Manual)
- **Coverage:** Phytosanitary, veterinary certificates
- **Default Countries:** AR

#### USDA APHIS
- **URL:** https://www.aphis.usda.gov/aphis/newsroom/news (Manual)
- **Coverage:** Animal/plant health, import permits
- **Default Countries:** US

## Fetch Strategy

### Automated (RSS)
- WTO, USDA FAS, EU ECHA, GACC China
- **Frequency:** Every 12 hours (cron: `0 */12 * * *`)
- **Rate Limit:** 2 seconds between sources

### Manual/Scraping (Future)
- AfCFTA, CBN Nigeria, SENASA, WCO, EU TARIC
- **Implementation:** Phase 2 (web scraping service)

## Classification Logic

### AI-Powered (OpenAI GPT-4o-mini)
Extracts from title + content:
- **HS Codes:** 4 or 6-digit patterns
- **Countries:** ISO 2-letter codes
- **Treaties:** AfCFTA, USMCA, RCEP, EU, GCC, etc.
- **Laws:** GDPR, REACH, EUDR, FSMA, CBAM, etc.
- **Type:** critical/warning/info/opportunity
- **Tags:** Keywords (tariff, sanitary, digital trade, etc.)

### Fallback (Keyword Matching)
If AI fails, uses simple regex/keyword detection.

## Deduplication
- **Key:** `fullUrl` (unique index in MongoDB)
- **Strategy:** Check existence before insert
- **Retention:** Unlimited (historical archive)

## Error Handling
- Failed sources logged but don't block others
- Timeout: 10 seconds per source
- Retry: Not implemented (next cron cycle will retry)
