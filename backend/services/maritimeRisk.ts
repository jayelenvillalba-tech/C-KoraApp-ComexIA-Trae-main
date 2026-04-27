import { logger } from '../services/logger.js';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'comexia_v2.db'));

export interface ConflictZone {
  id: string;
  name: string;
  nameEn: string;
  namePt?: string;
  riskLevel: 'high' | 'medium' | 'low';
  color: string;
  bounds: { north: number; south: number; east: number; west: number };
  centerLat: number;
  centerLng: number;
  affectedDestinations: string[];
  impact: {
    extraDays: number;
    extraCostUsdPer40GP: number;
    insurancePremiumPct: number;
    isOpportunityForLatam?: boolean;
    opportunityNote?: string;
  };
  context: string;
  contextEn: string;
  warningMessage: string;
  officialSources: { name: string; url: string }[];
  lastUpdated: string;
  activeIncidents: number;
  disclaimer: string;
}

export const CONFLICT_ZONES: ConflictZone[] = [
  {
    id: 'red_sea',
    name: 'Mar Rojo / Bab-el-Mandeb',
    nameEn: 'Red Sea / Bab-el-Mandeb Strait',
    namePt: 'Mar Vermelho / Estreito de Bab-el-Mandeb',
    riskLevel: 'high',
    color: '#ff3e5a',
    bounds: { north: 15.5, south: 11.5, east: 44.0, west: 41.0 },
    centerLat: 12.5, centerLng: 43.3,
    affectedDestinations: ['DE', 'NL', 'BE', 'ES', 'IT', 'FR', 'GB', 'IN', 'SG', 'CN', 'JP', 'KR'],
    impact: { extraDays: 14, extraCostUsdPer40GP: 2800, insurancePremiumPct: 0.5 },
    context: 'Ataques a buques comerciales en el Mar Rojo afectan la ruta por el Canal de Suez. Las principales navieras (Maersk, MSC, CMA-CGM) desvían por el Cabo de Buena Esperanza. Esto agrega 12-16 días de tránsito y entre USD 2.000-4.000 por contenedor de 40\' en costos adicionales de flete. El seguro de carga requiere cobertura de guerra específica.',
    contextEn: 'Attacks on commercial vessels in the Red Sea affect the Suez Canal route. Major carriers are rerouting via the Cape of Good Hope, adding 12-16 transit days and USD 2,000-4,000 per 40\' container in additional freight costs.',
    warningMessage: 'Ruta por Suez afectada — desvío por Cabo de Buena Esperanza: +14 días, +USD 2.800/40GP',
    officialSources: [
      { name: 'UKMTO Maritime Security', url: 'https://www.ukmto.org' },
      { name: 'IMO Maritime Safety', url: 'https://www.imo.org/en/MediaCentre/PressBriefings' },
      { name: 'MSCHOA', url: 'https://www.mschoa.org' },
      { name: 'BIMCO', url: 'https://www.bimco.org/news-and-trends/safety-and-operations' },
    ],
    lastUpdated: '2026-03-22',
    activeIncidents: 3,
    disclaimer: 'Información de carácter orientativo basada en fuentes oficiales. Verificar con tu naviera y aseguradora antes de confirmar el embarque.',
  },
  {
    id: 'strait_hormuz',
    name: 'Estrecho de Ormuz',
    nameEn: 'Strait of Hormuz',
    namePt: 'Estreito de Ormuz',
    riskLevel: 'medium',
    color: '#f5a800',
    bounds: { north: 26.5, south: 24.0, east: 57.5, west: 55.5 },
    centerLat: 26.5, centerLng: 56.3,
    affectedDestinations: ['AE', 'QA', 'KW', 'SA', 'BH', 'OM', 'IR'],
    impact: { extraDays: 0, extraCostUsdPer40GP: 0, insurancePremiumPct: 0.3 },
    context: 'El Estrecho de Ormuz concentra el 20% del tráfico mundial de petróleo y GNL. La tensión geopolítica en la región genera riesgo de cierre esporádico. Actualmente operativo, pero las primas de seguro de carga tienen un recargo de guerra de 0.3-0.5% del valor del cargamento.',
    contextEn: 'The Strait of Hormuz handles 20% of global oil and LNG traffic. Geopolitical tension in the region creates risk of sporadic closure. Currently operational, but cargo insurance has a 0.3-0.5% war risk premium.',
    warningMessage: 'Zona de tensión activa — recargo de seguro de guerra aplicable',
    officialSources: [
      { name: 'UKMTO Maritime Security', url: 'https://www.ukmto.org' },
      { name: 'IMO', url: 'https://www.imo.org' },
    ],
    lastUpdated: '2026-03-22',
    activeIncidents: 1,
    disclaimer: 'Información orientativa. Consultar con aseguradora y naviera para condiciones actuales.',
  },
  {
    id: 'taiwan_strait',
    name: 'Estrecho de Taiwán',
    nameEn: 'Taiwan Strait',
    namePt: 'Estreito de Taiwan',
    riskLevel: 'medium',
    color: '#f5a800',
    bounds: { north: 25.5, south: 21.5, east: 121.5, west: 119.0 },
    centerLat: 24.0, centerLng: 119.5,
    affectedDestinations: ['JP', 'KR', 'TW', 'PH'],
    impact: { extraDays: 3, extraCostUsdPer40GP: 500, insurancePremiumPct: 0.15 },
    context: 'Tensión geopolítica persistente en el área. Actualmente sin impacto operativo directo en el tráfico comercial. Un escenario de escalada podría interrumpir el suministro global de semiconductores y electrónica, afectando cadenas de valor que incluyen productos latinoamericanos.',
    contextEn: 'Persistent geopolitical tension in the area. Currently no direct operational impact on commercial traffic. An escalation scenario could disrupt global semiconductor and electronics supply, affecting value chains including Latin American products.',
    warningMessage: 'Zona de tensión geopolítica — monitorear evolución para rutas hacia Japón y Corea',
    officialSources: [
      { name: 'IMO', url: 'https://www.imo.org' },
      { name: 'BIMCO', url: 'https://www.bimco.org' },
    ],
    lastUpdated: '2026-03-22',
    activeIncidents: 0,
    disclaimer: 'Información orientativa basada en fuentes oficiales. Sin impacto operativo confirmado a la fecha.',
  },
  {
    id: 'black_sea',
    name: 'Mar Negro',
    nameEn: 'Black Sea',
    namePt: 'Mar Negro',
    riskLevel: 'high',
    color: '#ff3e5a',
    bounds: { north: 46.5, south: 41.0, east: 41.0, west: 28.0 },
    centerLat: 43.0, centerLng: 34.0,
    affectedDestinations: ['UA', 'RU', 'RO', 'BG', 'TR', 'GE'],
    impact: {
      extraDays: 0,
      extraCostUsdPer40GP: 0,
      insurancePremiumPct: 1.5,
      isOpportunityForLatam: true,
      opportunityNote: '⚡ OPORTUNIDAD: La reducción de exportaciones de granos de la región genera mayor demanda para AR y BR en mercados como Egipto, Turquía e Indonesia.',
    },
    context: 'Conflicto armado activo en la región del Mar Negro. Puertos del Mar de Azov con operatividad muy reducida. Exportaciones de trigo y maíz de la zona significativamente afectadas. Prima de seguro de guerra: 1.5-3% del valor del cargamento. Exportadores argentinos y brasileños de cereales tienen oportunidad de cubrir la demanda.',
    contextEn: 'Active armed conflict in the Black Sea region. Ports with very reduced operability. Wheat and corn exports from the area significantly affected. Argentine and Brazilian cereal exporters have an opportunity to cover demand.',
    warningMessage: 'Conflicto activo — puertos con operatividad reducida. Oportunidad para exportadores AR/BR de granos.',
    officialSources: [
      { name: 'BIMCO Black Sea Advisory', url: 'https://www.bimco.org' },
      { name: 'IMO', url: 'https://www.imo.org' },
      { name: 'USDA FAS Report', url: 'https://www.fas.usda.gov' },
    ],
    lastUpdated: '2026-03-22',
    activeIncidents: 8,
    disclaimer: 'Información orientativa. La situación cambia rápidamente. Verificar con naviera y aseguradora antes de operar.',
  },
  {
    id: 'panama_canal',
    name: 'Canal de Panamá',
    nameEn: 'Panama Canal',
    namePt: 'Canal do Panamá',
    riskLevel: 'low',
    color: '#00e878',
    bounds: { north: 9.5, south: 8.5, east: -79.0, west: -80.0 },
    centerLat: 9.0, centerLng: -79.5,
    affectedDestinations: ['US', 'CA', 'CN', 'JP', 'KR', 'SG'],
    impact: { extraDays: 1, extraCostUsdPer40GP: 200, insurancePremiumPct: 0 },
    context: 'El Canal de Panamá recuperó niveles normales de operación en 2025 tras la sequía de 2023-2024. Actualmente sin restricciones de calado significativas. Tiempos de espera normalizados: 1-2 días.',
    contextEn: 'The Panama Canal returned to normal operation levels in 2025 after the 2023-2024 drought. Currently no significant draft restrictions. Waiting times normalized: 1-2 days.',
    warningMessage: 'Operación normalizada — sin restricciones activas',
    officialSources: [
      { name: 'Autoridad del Canal de Panamá', url: 'https://www.pancanal.com' },
      { name: 'MarineTraffic AIS', url: 'https://www.marinetraffic.com' },
    ],
    lastUpdated: '2026-03-22',
    activeIncidents: 0,
    disclaimer: 'Información orientativa. Verificar condiciones actuales con tu agente naviero.',
  },
];

export function getZonesForRoute(
  originCountry: string,
  destCountry: string
): ConflictZone[] {
  // Extract country code from LOCODE if necessary (e.g. ARBUE → AR)
  const orig = originCountry.length > 2 ? originCountry.substring(0, 2).toUpperCase() : originCountry.toUpperCase();
  const dest = destCountry.length > 2 ? destCountry.substring(0, 2).toUpperCase() : destCountry.toUpperCase();

  const routeZoneMap: Record<string, string[]> = {
    'AR-DE': ['red_sea'], 'AR-NL': ['red_sea'], 'AR-ES': ['red_sea'],
    'AR-IT': ['red_sea'], 'AR-FR': ['red_sea'], 'AR-BE': ['red_sea'],
    'AR-GB': ['red_sea'],
    'BR-DE': ['red_sea'], 'BR-NL': ['red_sea'], 'BR-ES': ['red_sea'],
    'AR-IN': ['red_sea', 'strait_hormuz'],
    'AR-CN': ['red_sea'],
    'AR-JP': ['red_sea', 'taiwan_strait'],
    'AR-KR': ['red_sea', 'taiwan_strait'],
    'AR-SG': ['red_sea'],
    'BR-CN': ['red_sea'],
    'BR-IN': ['red_sea', 'strait_hormuz'],
    'AR-US': ['panama_canal'],
    'BR-US': ['panama_canal'],
    'CL-US': ['panama_canal'],
    'MX-US': [],
    'AR-AE': ['strait_hormuz'],
    'BR-AE': ['strait_hormuz'],
    'AR-QA': ['strait_hormuz'],
    'AR-EG': ['black_sea'],
    'AR-TR': ['black_sea'],
    'BR-EG': ['black_sea'],
    'BR-TR': ['black_sea'],
  };

  const routeKey = `${orig}-${dest}`;
  const reverseKey = `${dest}-${orig}`;
  const zoneIds = routeZoneMap[routeKey] ?? routeZoneMap[reverseKey] ?? [];

  return CONFLICT_ZONES.filter(z => zoneIds.includes(z.id));
}

export function calculateRiskImpact(
  zones: ConflictZone[],
  cargoValueUsd: number
): {
  extraDays: number;
  extraFreightUsd: number;
  warRiskInsuranceUsd: number;
  totalExtraCostUsd: number;
  highestRisk: 'high' | 'medium' | 'low' | null;
  hasOpportunity: boolean;
  opportunityNote: string | null;
} {
  if (zones.length === 0) {
    return {
      extraDays: 0, extraFreightUsd: 0, warRiskInsuranceUsd: 0,
      totalExtraCostUsd: 0, highestRisk: null,
      hasOpportunity: false, opportunityNote: null,
    };
  }

  const maxExtraDays = Math.max(...zones.map(z => z.impact.extraDays));
  const totalExtraFreight = zones.reduce((sum, z) => sum + z.impact.extraCostUsdPer40GP, 0);
  const maxInsurancePct = Math.max(...zones.map(z => z.impact.insurancePremiumPct));
  const warRiskInsurance = Math.round(cargoValueUsd * (maxInsurancePct / 100));

  const riskPriority: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const highestRisk = zones.reduce(
    (highest: 'high' | 'medium' | 'low' | null, z) =>
      !highest || riskPriority[z.riskLevel] > riskPriority[highest]
        ? z.riskLevel : highest,
    null
  );

  const opportunityZone = zones.find(z => z.impact.isOpportunityForLatam);

  return {
    extraDays: maxExtraDays,
    extraFreightUsd: totalExtraFreight,
    warRiskInsuranceUsd: warRiskInsurance,
    totalExtraCostUsd: Math.round(totalExtraFreight + warRiskInsurance),
    highestRisk,
    hasOpportunity: !!opportunityZone,
    opportunityNote: opportunityZone?.impact.opportunityNote ?? null,
  };
}

// ─── PHASE 33C: LAND RISK ZONES ─────────────────────────────────────────────

export interface LandRiskZone {
  id: string;
  name: string;
  nameEn: string;
  transportMode: 'land';
  riskLevel: 'high' | 'medium' | 'low';
  color: string;
  coordinates: { lat: number; lng: number }[];  // polyline path
  seasonalRisk: boolean;
  highRiskMonths?: number[];                      // 1=Jan … 12=Dec
  impact: {
    extraDays: number;
    extraCostUsd: number;
    alternativeRoute?: string;
  };
  warningMessage: string;
  context: string;
  sources: { name: string; url: string }[];
  lastUpdated: string;
  disclaimer: string;
}

export const LAND_RISK_ZONES: LandRiskZone[] = [
  {
    id: 'paso_libertadores',
    name: 'Paso Los Libertadores (AR–CL)',
    nameEn: 'Los Libertadores Pass (AR–CL)',
    transportMode: 'land',
    riskLevel: 'medium',
    color: '#f5a800',
    coordinates: [
      { lat: -32.83, lng: -70.06 },
      { lat: -32.84, lng: -70.09 },
      { lat: -32.85, lng: -70.11 },
    ],
    seasonalRisk: true,
    highRiskMonths: [5, 6, 7, 8],
    impact: {
      extraDays: 2,
      extraCostUsd: 300,
      alternativeRoute: 'Paso Cardenal Samoré (Ruta 231, Neuquén)',
    },
    warningMessage: 'Cierre frecuente mayo–agosto por nieve. Alternativa: Paso Cardenal Samoré.',
    context: 'El principal paso fronterizo entre Argentina y Chile concentra el 60% del comercio terrestre bilateral. Las nevadas invernales (mayo–agosto) generan cierres de 24 a 72 horas recurrentes, afectando fletes de frutas, manufacturas y commodities con temperatura controlada.',
    sources: [
      { name: 'Gendarmería Nacional AR', url: 'https://www.gendarmeria.gob.ar' },
      { name: 'Aduanas Chile', url: 'https://www.aduana.cl' },
      { name: 'CIARAMEX', url: 'https://www.ciaramex.com.ar' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Verificar estado del paso en tiempo real con Gendarmería Nacional.',
  },
  {
    id: 'paso_jama',
    name: 'Paso de Jama (AR–CL–Bolivia)',
    nameEn: 'Jama Pass (AR–CL–Bolivia)',
    transportMode: 'land',
    riskLevel: 'low',
    color: '#00e878',
    coordinates: [
      { lat: -23.20, lng: -67.08 },
      { lat: -23.19, lng: -67.10 },
    ],
    seasonalRisk: true,
    highRiskMonths: [1, 2, 12],
    impact: {
      extraDays: 1,
      extraCostUsd: 150,
      alternativeRoute: 'Paso Socompa (más al sur)',
    },
    warningMessage: 'Riesgo de cortes en época de lluvias (dic–feb) por deslizamientos. Corredor estratégico para litio.',
    context: 'Paso puna a 4.200 msnm. Conecta el Noroeste Argentino (NOA) con el norte de Chile y Bolivia. Relevante para minerales, litio y commodities del norte. Las lluvias de verano (dic–feb) pueden generar deslizamientos.',
    sources: [
      { name: 'Gendarmería Nacional AR', url: 'https://www.gendarmeria.gob.ar' },
      { name: 'FIATA', url: 'https://www.fiata.org' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Verificar condiciones con transportista antes del despacho.',
  },
  {
    id: 'trans_siberian',
    name: 'Corredor Trans-Siberiano (CN–EU)',
    nameEn: 'Trans-Siberian Corridor (CN–EU)',
    transportMode: 'land',
    riskLevel: 'high',
    color: '#ff3e5a',
    coordinates: [
      { lat: 39.9, lng: 116.4 },
      { lat: 52.0, lng: 80.0 },
      { lat: 55.7, lng: 37.6 },
      { lat: 52.5, lng: 13.4 },
    ],
    seasonalRisk: false,
    impact: {
      extraDays: 15,
      extraCostUsd: 800,
      alternativeRoute: 'Corredor Trans-Caspio (TITR): CN → Kazakhstan → Georgia → UE, evita Rusia',
    },
    warningMessage: 'Corredor afectado por sanciones a Rusia desde 2022. Usar rutas alternativas vía Mar Caspio.',
    context: 'Las sanciones internacionales a Rusia desde febrero de 2022 generan riesgos legales, de seguro y de cumplimiento para cargas que transiten por territorio ruso. El corredor Trans-Caspio (TITR) via Kazakhstan, Azerbaiyán y Georgia se consolidó como alternativa viable con +15 días y USD 800/TEU de sobrecosto.',
    sources: [
      { name: 'FIATA', url: 'https://www.fiata.org' },
      { name: 'OECD Trade Facilitation', url: 'https://www.oecd.org/trade' },
      { name: 'Comisión Europea — Sanciones', url: 'https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures_en' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Verificar compliance con asesores legales antes de usar este corredor.',
  },
  {
    id: 'darien_gap',
    name: 'Tapón del Darién (PA–CO)',
    nameEn: 'Darién Gap (PA–CO)',
    transportMode: 'land',
    riskLevel: 'high',
    color: '#ff3e5a',
    coordinates: [
      { lat: 7.9, lng: -77.1 },
      { lat: 7.5, lng: -77.3 },
    ],
    seasonalRisk: false,
    impact: {
      extraDays: 0,
      extraCostUsd: 0,
      alternativeRoute: 'Transporte marítimo/aéreo — no existe ruta terrestre continua',
    },
    warningMessage: 'No hay ruta terrestre practicable entre Panamá y Colombia. Toda carga debe usar modo marítimo o aéreo.',
    context: 'El Tapón del Darién interrumpe la Carretera Panamericana entre Colombia y Panamá. No existe conexión terrestre viable para carga comercial. El corredor Andino (AR/CL/PE/EC/CO) termina en Colombia y requiere transbordo marítimo o aéreo para continuar hacia Centroamérica y México.',
    sources: [
      { name: 'IIRSA — Iniciativa para la Integración de la Infraestructura Regional Suramericana', url: 'https://www.iirsa.org' },
      { name: 'CAF Banco de Desarrollo', url: 'https://www.caf.com' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa sobre conectividad de infraestructura regional.',
  },
];

// ─── PHASE 33C: AIR RISK ZONES ──────────────────────────────────────────────

export interface AirRiskZone {
  id: string;
  name: string;
  nameEn: string;
  transportMode: 'air';
  riskLevel: 'high' | 'medium' | 'low';
  color: string;
  bounds: { north: number; south: number; east: number; west: number };
  centerLat: number;
  centerLng: number;
  impact: {
    extraDays: number;
    extraHours: number;
    extraCostUsd: number;
  };
  affectedRoutes: string[];   // e.g. ['EU-JP', 'EU-KR']
  warningMessage: string;
  context: string;
  sources: { name: string; url: string }[];
  lastUpdated: string;
  disclaimer: string;
}

export const AIR_RISK_ZONES: AirRiskZone[] = [
  {
    id: 'russian_airspace',
    name: 'Espacio Aéreo Ruso',
    nameEn: 'Russian Airspace',
    transportMode: 'air',
    riskLevel: 'high',
    color: '#ff3e5a',
    bounds: { north: 77.0, south: 41.0, east: 180.0, west: 19.0 },
    centerLat: 61.5, centerLng: 105.0,
    impact: { extraDays: 0, extraHours: 4, extraCostUsd: 800 },
    affectedRoutes: ['EU-JP', 'EU-KR', 'EU-CN', 'EU-SG', 'EU-HK', 'EU-AU'],
    warningMessage: 'Cerrado para aerolíneas occidentales desde feb. 2022. Rutas Europa–Asia: +3–4 horas y USD 800/vuelo.',
    context: 'Desde la invasión de Ucrania en febrero de 2022, Rusia cerró su espacio aéreo a aerolíneas de países sancionados (UE, USA, CA, UK, JP, KR, AU). Las rutas Europa–Extremo Oriente deben rodear por el Sur o el Polo Norte, aumentando el tiempo de vuelo 3–4 horas y el consumo de combustible ~15%, con impacto directo en tarifas de carga aérea.',
    sources: [
      { name: 'ICAO Safety', url: 'https://www.icao.int/safety/Pages/default.aspx' },
      { name: 'IATA Air Cargo', url: 'https://www.iata.org/en/programs/cargo' },
      { name: 'Eurocontrol NOTAMs', url: 'https://www.eurocontrol.int/notam' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Verificar NOTAMs vigentes con la aerolínea o agente de carga antes de cada envío.',
  },
  {
    id: 'middle_east_airspace',
    name: 'Espacio Aéreo Medio Oriente',
    nameEn: 'Middle East Airspace',
    transportMode: 'air',
    riskLevel: 'medium',
    color: '#f5a800',
    bounds: { north: 37.0, south: 12.0, east: 59.0, west: 35.0 },
    centerLat: 25.0, centerLng: 45.0,
    impact: { extraDays: 0, extraHours: 2, extraCostUsd: 400 },
    affectedRoutes: ['EU-IN', 'EU-AE', 'AR-AE', 'BR-AE', 'EU-PK', 'EU-SG'],
    warningMessage: 'Restricciones activas en Irak, Siria y Yemen. Verificar NOTAMs antes de cada operación.',
    context: 'Los conflictos en Siria, Iraq y Yemen generan restricciones de espacio aéreo que obligan a rodeos sobre el Golfo Pérsico. Las rutas entre Europa y Asia del Sur o el Golfo pueden requerir desvíos de 1–2 horas. Las aerolíneas de carga ajustan rutas dinámicamente según los NOTAMs activos.',
    sources: [
      { name: 'ICAO iSTARS NOTAMs', url: 'https://www.icao.int/safety/iStars' },
      { name: 'IATA', url: 'https://www.iata.org' },
      { name: 'UKMTO Maritime & Air Security', url: 'https://www.ukmto.org' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Los NOTAMs cambian frecuentemente. Verificar con aerolínea antes de cada despacho.',
  },
  {
    id: 'ukraine_airspace',
    name: 'Espacio Aéreo de Ucrania',
    nameEn: 'Ukrainian Airspace',
    transportMode: 'air',
    riskLevel: 'high',
    color: '#ff3e5a',
    bounds: { north: 52.4, south: 44.4, east: 40.2, west: 22.1 },
    centerLat: 49.0, centerLng: 31.0,
    impact: { extraDays: 0, extraHours: 1, extraCostUsd: 200 },
    affectedRoutes: ['EU-TR', 'EU-GE', 'EU-KZ', 'EU-UZ', 'PL-CN'],
    warningMessage: 'Espacio aéreo cerrado por conflicto armado activo. Toda carga aérea debe evitar zona.',
    context: 'El espacio aéreo ucraniano está cerrado para vuelos civiles desde febrero de 2022 por el conflicto armado. El impacto en carga aérea es menor que el del espacio ruso, pero afecta rutas de Polonia y países bálticos hacia Turquía, Cáucaso y Asia Central.',
    sources: [
      { name: 'ICAO NOTAMs Ukraine', url: 'https://www.icao.int/safety/iStars' },
      { name: 'Eurocontrol', url: 'https://www.eurocontrol.int' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Información orientativa. Situación dinámica. Verificar NOTAMs antes de cada operación.',
  },
  {
    id: 'south_china_sea_air',
    name: 'Mar del Sur de China (Espacio Aéreo)',
    nameEn: 'South China Sea Airspace',
    transportMode: 'air',
    riskLevel: 'low',
    color: '#00e878',
    bounds: { north: 22.0, south: 3.0, east: 120.0, west: 105.0 },
    centerLat: 12.0, centerLng: 113.0,
    impact: { extraDays: 0, extraHours: 0, extraCostUsd: 0 },
    affectedRoutes: ['AU-CN', 'AU-JP', 'SG-CN', 'PH-CN'],
    warningMessage: 'Sin restricciones activas. Monitorear ante posible escalada geopolítica.',
    context: 'El espacio aéreo sobre el Mar del Sur de China está actualmente operativo para carga aérea civil. Las disputas territoriales entre China, Vietnam, Filipinas y otros países generan tensión geopolítica que podría en escenarios de escalada afectar rutas de carga. Se recomienda monitoreo periódico.',
    sources: [
      { name: 'ICAO', url: 'https://www.icao.int' },
      { name: 'IATA Safety Audit', url: 'https://www.iata.org/en/programs/safety/audit' },
    ],
    lastUpdated: '2026-04-01',
    disclaimer: 'Sin impacto operativo confirmado a la fecha. Monitorear evolución geopolítica.',
  },
];

export async function syncMaritimeAlerts(): Promise<void> {
  const MARITIME_QUERIES = [
    '"Red Sea" attack ship OR vessel',
    '"Strait of Hormuz" tension OR closure',
    '"Taiwan Strait" military OR exercises',
    '"Black Sea" grain OR shipping OR port',
    '"Panama Canal" drought OR restriction',
  ];

  for (const query of MARITIME_QUERIES) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=artlist&maxrecords=5&format=json&timespan=24h`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const data = await response.json();
      const articles = data?.articles || [];

      for (const article of articles) {
        try {
          db.prepare(`
            INSERT OR IGNORE INTO trade_news
              (source_name, source_url, source_language, title_original,
               title_en, body_en, alert_type, countries, hs_codes, published_at)
            VALUES (?, ?, 'en', ?, ?, ?, 'warning', '[]', '[]', ?)
          `).run(
            article.domain || 'Maritime Alert',
            article.url,
            article.title,
            article.title,
            (article.title || '').substring(0, 300),
            Math.floor(Date.now() / 1000)
          );
        } catch { /* skip dups */ }
      }
    } catch (error) {
      logger.warn('[maritime] Sync error', { error: (error as Error).message });
    }
  }

  logger.info('[maritime] ✅ Alertas marítimas sincronizadas');
}
