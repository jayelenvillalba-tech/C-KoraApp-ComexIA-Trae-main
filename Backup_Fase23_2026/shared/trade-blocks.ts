// Trade Blocks and Regional Agreements Data
// Based on WTO RTA Database 2025 and major trade agreements

export interface TradeBlock {
  id: string;
  name: string;
  nameEs: string;
  countries: string[];
  icon: string;
  tariffBenefit: string;
}

export const tradeBlocks: TradeBlock[] = [
  {
    id: 'MERCOSUR',
    name: 'MERCOSUR',
    nameEs: 'MERCOSUR',
    countries: ['AR', 'BR', 'UY', 'PY'],
    icon: '🇦🇷',
    tariffBenefit: '0% intra-block, 60% regional content required'
  },
  {
    id: 'EU',
    name: 'European Union',
    nameEs: 'Unión Europea',
    countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
    icon: '🇪🇺',
    tariffBenefit: '0% intra-block'
  },
  {
    id: 'RCEP',
    name: 'Regional Comprehensive Economic Partnership',
    nameEs: 'RCEP (Asia-Pacífico)',
    countries: ['AU', 'BN', 'KH', 'CN', 'ID', 'JP', 'LA', 'MY', 'MM', 'NZ', 'PH', 'SG', 'KR', 'TH', 'VN'],
    icon: '🌏',
    tariffBenefit: 'Progressive tariff reduction (0-10%)'
  },
  {
    id: 'AfCFTA',
    name: 'African Continental Free Trade Area',
    nameEs: 'AfCFTA (África)',
    countries: ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
    icon: '🌍',
    tariffBenefit: '90% tariff elimination by 2030'
  },
  {
    id: 'USMCA',
    name: 'United States-Mexico-Canada Agreement',
    nameEs: 'T-MEC',
    countries: ['US', 'MX', 'CA'],
    icon: '🇺🇸',
    tariffBenefit: '0% for qualifying goods'
  },
  {
    id: 'ASEAN',
    name: 'Association of Southeast Asian Nations',
    nameEs: 'ASEAN',
    countries: ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN'],
    icon: '🌏',
    tariffBenefit: '0-5% intra-block'
  },
  {
    id: 'CPTPP',
    name: 'Comprehensive and Progressive Trans-Pacific Partnership',
    nameEs: 'CPTPP',
    countries: ['AU', 'BN', 'CA', 'CL', 'JP', 'MY', 'MX', 'NZ', 'PE', 'SG', 'VN'],
    icon: '🌊',
    tariffBenefit: '0% for most goods'
  },
  {
    id: 'PACIFIC_ALLIANCE',
    name: 'Pacific Alliance',
    nameEs: 'Alianza del Pacífico',
    countries: ['CL', 'CO', 'MX', 'PE'],
    icon: '🌎',
    tariffBenefit: '92% tariff elimination'
  }
];

export interface TradePreference {
  agreement: string;
  tariffRate: number;
  regionalContentRequired?: number;
  applicable: boolean;
  notes?: string;
}

export function getTradeBlock(countryCode: string): TradeBlock | null {
  return tradeBlocks.find(block => block.countries.includes(countryCode)) || null;
}

export function getTradeBlockById(blockId: string): TradeBlock | null {
  return tradeBlocks.find(block => block.id === blockId) || null;
}

export function calculateTradePreferences(
  hsCode: string,
  originCountry: string,
  destinationCountry: string
): TradePreference[] {
  const preferences: TradePreference[] = [];

  // MERCOSUR (AR, BR, UY, PY)
  const mercosurCountries = ['AR', 'BR', 'UY', 'PY'];
  if (mercosurCountries.includes(originCountry) && mercosurCountries.includes(destinationCountry)) {
    preferences.push({
      agreement: 'MERCOSUR',
      tariffRate: 0,
      regionalContentRequired: 60,
      applicable: true,
      notes: 'Libre comercio intra-MERCOSUR con 60% contenido regional'
    });
  }

  // EU (27 countries)
  const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
  if (euCountries.includes(originCountry) && euCountries.includes(destinationCountry)) {
    preferences.push({
      agreement: 'EU',
      tariffRate: 0,
      applicable: true,
      notes: 'Mercado único europeo - libre circulación'
    });
  }

  // EU-MERCOSUR (if applicable for agricultural products)
  if (mercosurCountries.includes(originCountry) && euCountries.includes(destinationCountry)) {
    // Agricultural products (HS Chapter 01-24)
    const hsChapter = parseInt(hsCode.substring(0, 2));
    if (hsChapter >= 1 && hsChapter <= 24) {
      preferences.push({
        agreement: 'EU-MERCOSUR',
        tariffRate: 0,
        regionalContentRequired: 50,
        applicable: true,
        notes: 'Acuerdo EU-MERCOSUR para productos agrícolas (pendiente ratificación)'
      });
    }
  }

  // USMCA (US, MX, CA)
  const usmcaCountries = ['US', 'MX', 'CA'];
  if (usmcaCountries.includes(originCountry) && usmcaCountries.includes(destinationCountry)) {
    preferences.push({
      agreement: 'USMCA',
      tariffRate: 0,
      applicable: true,
      notes: 'T-MEC - Libre comercio América del Norte'
    });
  }

  // RCEP (15 Asia-Pacific countries)
  const rcepCountries = ['AU', 'BN', 'KH', 'CN', 'ID', 'JP', 'LA', 'MY', 'MM', 'NZ', 'PH', 'SG', 'KR', 'TH', 'VN'];
  if (rcepCountries.includes(originCountry) && rcepCountries.includes(destinationCountry)) {
    preferences.push({
      agreement: 'RCEP',
      tariffRate: 5, // Average, varies by product
      applicable: true,
      notes: 'Reducción arancelaria progresiva RCEP'
    });
  }

  // Pacific Alliance (CL, CO, MX, PE)
  const pacificAllianceCountries = ['CL', 'CO', 'MX', 'PE'];
  if (pacificAllianceCountries.includes(originCountry) && pacificAllianceCountries.includes(destinationCountry)) {
    preferences.push({
      agreement: 'PACIFIC_ALLIANCE',
      tariffRate: 0,
      applicable: true,
      notes: 'Alianza del Pacífico - 92% productos sin arancel'
    });
  }

  return preferences;
}

export function getCountriesByBlock(blockId: string): string[] {
  const block = getTradeBlockById(blockId);
  return block ? block.countries : [];
}
