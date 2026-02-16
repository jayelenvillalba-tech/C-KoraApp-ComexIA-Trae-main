-- Verificar datos de Trigo (HS 1001)

-- Market Data
SELECT 'MARKET DATA' as tipo, COUNT(*) as cantidad FROM market_data WHERE hs_code LIKE '1001%';
SELECT destination_country, volume, value_usd FROM market_data WHERE hs_code LIKE '1001%' ORDER BY volume DESC;

-- Treaties
SELECT 'TREATIES' as tipo, COUNT(*) as cantidad FROM country_opportunities WHERE hs_code LIKE '1001%';
SELECT country_name, trade_agreements, avg_tariff_rate FROM country_opportunities WHERE hs_code LIKE '1001%';

-- Marketplace
SELECT 'MARKETPLACE' as tipo, COUNT(*) as cantidad FROM marketplace_posts WHERE hs_code LIKE '1001%' AND type = 'buy' AND status = 'active';
SELECT origin_country, quantity, product_name FROM marketplace_posts WHERE hs_code LIKE '1001%' AND type = 'buy' AND status = 'active';
