/**
 * Freight Calculator Service — Che.Comex
 * Integra Searates API (free tier: 1000 req/mes) para cotizaciones reales.
 * Fallback automático con cálculo dinámico offline basado en distancias reales entre puertos.
 *
 * Searates Docs: https://searates.com/reference/logistics-explorer/
 * API Key: configurar SEARATES_API_KEY en .env
 */

import { getPortByLocode, Port } from './portDatabase.js';
import { getSqliteDb } from '../../database/db-sqlite.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransportMode = 'maritime' | 'air' | 'road';
export type ContainerType = '20DC' | '40DC' | '40HC' | 'LCL' | 'BULK';
export type UrgencyLevel = 'standard' | 'express' | 'urgent';

export interface FreightQuoteRequest {
  originLocode: string;       // ARBUE
  destinationLocode: string;  // NLRTM
  transportMode: TransportMode;
  weightKg: number;
  volumeCbm?: number;
  containerType?: ContainerType;
  urgency: UrgencyLevel;
  cargoValue?: number;        // USD, for insurance calc
}

export interface FreightSurcharge {
  code: string;
  name: string;
  amountUsd: number;
  reason: string;
}

export interface FreightQuoteResult {
  originPort: string;
  destinationPort: string;
  transportMode: TransportMode;
  distanceKm: number;
  transitDays: number;
  baseFreightUsd: number;
  insuranceUsd: number;
  surcharges: FreightSurcharge[];
  totalFreightUsd: number;
  ratePerKg: number;
  ratePerCbm?: number;
  source: 'searates' | 'offline';
  riskZones: RiskZone[];
  alternatives?: FreightAlternative[];
}

export interface RiskZone {
  name: string;
  severity: 'low' | 'medium' | 'high';
  surchargePercent: number;
  description: string;
}

export interface FreightAlternative {
  routeDescription: string;
  savingsUsd: number;
  extraDays: number;
}

// ─── Risk Zones Database ──────────────────────────────────────────────────────
const RISK_ZONES: Array<{
  name: string;
  severity: RiskZone['severity'];
  surchargePercent: number;
  description: string;
  affectedRoutes: Array<{ lat: [number, number]; lng: [number, number] }>;
}> = [
  {
    name: 'Mar Rojo / Estrecho de Babel-Mandeb',
    severity: 'high',
    surchargePercent: 18,
    description: 'Ataques Houthi activos. Redireccionamiento por El Cabo de Buena Esperanza (+14 días).',
    affectedRoutes: [{ lat: [12, 30], lng: [43, 55] }],
  },
  {
    name: 'Canal de Suez',
    severity: 'high',
    surchargePercent: 15,
    description: 'Tráfico reducido por crisis del Mar Rojo. Surcharge de guerra activo.',
    affectedRoutes: [{ lat: [29, 32], lng: [32, 33] }],
  },
  {
    name: 'Estrecho de Ormuz',
    severity: 'medium',
    surchargePercent: 8,
    description: 'Tensiones geopolíticas Iran-Occidente. Incremento de primas de seguro marítimo.',
    affectedRoutes: [{ lat: [26, 28], lng: [56, 58] }],
  },
  {
    name: 'Mar Negro',
    severity: 'high',
    surchargePercent: 22,
    description: 'Conflicto Rusia-Ucrania activo. Mayoría de aseguradoras rechazan cobertura estándar.',
    affectedRoutes: [{ lat: [41, 47], lng: [28, 40] }],
  },
];

// ─── Searates Rate Tables (Base market rates Q2-2025) ─────────────────────────
// Fuente: Freightos Baltic Index + Drewry WCI promedios
const MARITIME_BASE_RATES: Record<string, number> = {
  // USD por TEU (20' container) por ruta clave
  'ARBUE-NLRTM': 2800, 'ARBUE-DEHAM': 2750, 'ARBUE-CNSHA': 3200,
  'ARBUE-USLAX': 1900, 'ARBUE-USNYC': 2200, 'ARBUE-SGSIN': 3100,
  'BRSNT-NLRTM': 2600, 'BRSNT-DEHAM': 2550, 'BRSNT-CNSHA': 2900,
  'BRSNT-USLAX': 1800, 'BRSNT-USNYC': 2000, 'BRSNT-SGSIN': 2800,
  'CLVAL-CNSHA': 3500, 'CLVAL-USLAX': 1200, 'CLVAL-NLRTM': 3200,
  'UYMVD-NLRTM': 2900, 'UYMVD-CNSHA': 3300, 'PECLL-CNSHA': 3400,
  // Fallback: ~2400 USD/TEU global average
};

const AIR_RATES_PER_KG: Record<string, number> = {
  // USD/kg promedio IATA por corredor
  'LATAM-EU': 4.20, 'LATAM-ASIA': 5.80, 'LATAM-NA': 2.90,
  'LATAM-LATAM': 2.10, 'DEFAULT': 4.50,
};

// ─── Haversine Distance Calculator ───────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Maritime distance adds ~40% overhead (not straight line)
function maritimeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2) * 1.4;
}

// ─── Risk Zone Detection ──────────────────────────────────────────────────────
function detectRiskZones(origin: Port, destination: Port): RiskZone[] {
  const zones: RiskZone[] = [];

  // Check if route passes through Red Sea / Suez
  const goesEast = destination.longitude > 30;
  const crossesMediterranean =
    (origin.latitude < 10 && destination.latitude > 30) ||
    (origin.latitude > 30 && destination.latitude < 10);

  if (crossesMediterranean && goesEast) {
    zones.push({
      name: RISK_ZONES[0].name,
      severity: RISK_ZONES[0].severity,
      surchargePercent: RISK_ZONES[0].surchargePercent,
      description: RISK_ZONES[0].description,
    });
  }

  // Check if route goes through Hormuz (Asia/Middle East bound)
  if (destination.countryCode === 'AE' || destination.countryCode === 'SA' || destination.countryCode === 'IQ') {
    zones.push({
      name: RISK_ZONES[2].name,
      severity: RISK_ZONES[2].severity,
      surchargePercent: RISK_ZONES[2].surchargePercent,
      description: RISK_ZONES[2].description,
    });
  }

  return zones;
}

// ─── Offline freight calculator ───────────────────────────────────────────────
function calcOffline(req: FreightQuoteRequest, origin: Port, destination: Port): FreightQuoteResult {
  const distKm = req.transportMode === 'air'
    ? haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude)
    : maritimeDistanceKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

  const riskZones = detectRiskZones(origin, destination);
  const riskSurchargePercent = riskZones.reduce((sum, z) => sum + z.surchargePercent, 0);

  let baseFreightUsd = 0;
  let transitDays = 0;
  const surcharges: FreightSurcharge[] = [];

  if (req.transportMode === 'maritime') {
    const routeKey = `${req.originLocode}-${req.destinationLocode}`;
    const teuRate = MARITIME_BASE_RATES[routeKey] || Math.round(distKm * 0.18 + 600);

    // Convert TEU rate to weight/volume basis (LCL)
    const cbm = req.volumeCbm || req.weightKg / 500; // W/M ratio
    const chargeableWeight = Math.max(req.weightKg / 1000, cbm); // in CBM equivalent
    baseFreightUsd = chargeableWeight * (teuRate / 28); // ~28 CBM per TEU

    // Standard maritime surcharges
    surcharges.push({ code: 'BAF', name: 'Bunker Adjustment Factor', amountUsd: baseFreightUsd * 0.12, reason: 'Combustible marítimo' });
    surcharges.push({ code: 'CAF', name: 'Currency Adjustment Factor', amountUsd: baseFreightUsd * 0.03, reason: 'Fluctuación USD/EUR' });
    surcharges.push({ code: 'THC', name: 'Terminal Handling Charge', amountUsd: 185, reason: 'Manejo en terminal de origen' });
    surcharges.push({ code: 'BL',  name: 'Bill of Lading Fee',       amountUsd: 75,  reason: 'Emisión conocimiento de embarque' });

    // Urgency
    if (req.urgency === 'express') { surcharges.push({ code: 'EXP', name: 'Express Surcharge', amountUsd: baseFreightUsd * 0.20, reason: 'Prioridad de embarque' }); }
    if (req.urgency === 'urgent')  { surcharges.push({ code: 'URG', name: 'Urgent Booking',    amountUsd: baseFreightUsd * 0.40, reason: 'Reserva urgente' }); }

    transitDays = Math.round(distKm / 450) + (req.urgency === 'urgent' ? -3 : req.urgency === 'express' ? -1 : 0);
    transitDays = Math.max(transitDays, 5);

  } else if (req.transportMode === 'air') {
    // Determine corridor
    const LATAM = ['AR','BR','CL','UY','PE','CO','MX','BO','PY','EC','VE'];
    const EU    = ['DE','NL','ES','IT','FR','BE','PT','GB'];
    const ASIA  = ['CN','JP','KR','SG','HK','TH','VN','IN'];
    const NA    = ['US','CA','MX'];

    const getRegion = (cc: string) =>
      LATAM.includes(cc) ? 'LATAM' : EU.includes(cc) ? 'EU' : ASIA.includes(cc) ? 'ASIA' : NA.includes(cc) ? 'NA' : 'DEFAULT';

    const originRegion = getRegion(origin.countryCode);
    const destRegion = getRegion(destination.countryCode);
    const corridorKey = originRegion === destRegion ? `${originRegion}-${originRegion}` : `${originRegion}-${destRegion}`;
    
    const ratePerKg = AIR_RATES_PER_KG[corridorKey] || AIR_RATES_PER_KG[`${destRegion}-${originRegion}`] || AIR_RATES_PER_KG.DEFAULT;
    const chargeableKg = Math.max(req.weightKg, (req.volumeCbm || req.weightKg / 500) * 167); // air volumetric
    
    baseFreightUsd = chargeableKg * ratePerKg;
    surcharges.push({ code: 'FSC', name: 'Fuel Surcharge',     amountUsd: baseFreightUsd * 0.22, reason: 'Precio combustible IATA' });
    surcharges.push({ code: 'SSC', name: 'Security Surcharge', amountUsd: req.weightKg * 0.12,   reason: 'Seguridad IATA' });
    
    if (req.urgency === 'express') surcharges.push({ code: 'EXP', name: 'Express Air', amountUsd: baseFreightUsd * 0.30, reason: 'Vuelo directo/prioritario' });
    if (req.urgency === 'urgent')  surcharges.push({ code: 'URG', name: 'Urgent Air',  amountUsd: baseFreightUsd * 0.60, reason: 'Courier express' });

    transitDays = Math.ceil(distKm / 800) + 1;
    transitDays = req.urgency === 'urgent' ? 1 : req.urgency === 'express' ? 2 : Math.max(transitDays, 2);

  } else {
    // Road freight (LatAm)
    baseFreightUsd = distKm * 1.80;
    surcharges.push({ code: 'TOLL', name: 'Peajes/Tarifas',       amountUsd: distKm * 0.08, reason: 'Peajes transfronterizos' });
    surcharges.push({ code: 'CUST', name: 'Derechos de Aduana',   amountUsd: 250,            reason: 'Cruce de frontera terrestre' });
    transitDays = Math.ceil(distKm / 500) + 1;
  }

  // Risk zone surcharges
  if (riskSurchargePercent > 0) {
    riskZones.forEach(z => {
      surcharges.push({
        code: 'WAR',
        name: `War Risk Surcharge (${z.name})`,
        amountUsd: baseFreightUsd * (z.surchargePercent / 100),
        reason: z.description,
      });
    });
  }

  // Insurance (0.35%-0.8% of cargo value, or 0.5% of freight if no value declared)
  const insuredValue = req.cargoValue || (baseFreightUsd * 10);
  const insuranceRate = riskZones.some(z => z.severity === 'high') ? 0.008 : 0.004;
  const insuranceUsd = insuredValue * insuranceRate;

  const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amountUsd, 0);
  const totalFreightUsd = baseFreightUsd + totalSurcharges + insuranceUsd;

  return {
    originPort: origin.portName,
    destinationPort: destination.portName,
    transportMode: req.transportMode,
    distanceKm: Math.round(distKm),
    transitDays,
    baseFreightUsd: Math.round(baseFreightUsd * 100) / 100,
    insuranceUsd: Math.round(insuranceUsd * 100) / 100,
    surcharges: surcharges.map(s => ({ ...s, amountUsd: Math.round(s.amountUsd * 100) / 100 })),
    totalFreightUsd: Math.round(totalFreightUsd * 100) / 100,
    ratePerKg: Math.round((totalFreightUsd / req.weightKg) * 100) / 100,
    ratePerCbm: req.volumeCbm ? Math.round((totalFreightUsd / req.volumeCbm) * 100) / 100 : undefined,
    source: 'offline',
    riskZones,
    alternatives: riskZones.length > 0 ? [{
      routeDescription: 'Ruta alternativa vía El Cabo de Buena Esperanza (evita zonas de conflicto)',
      savingsUsd: Math.round(totalFreightUsd * (riskSurchargePercent / 100)),
      extraDays: 14,
    }] : undefined,
  };
}

// ─── Searates API integration ─────────────────────────────────────────────────
async function calcSearates(req: FreightQuoteRequest, origin: Port, destination: Port): Promise<FreightQuoteResult | null> {
  const apiKey = process.env.SEARATES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL('https://sirius.searates.com/reference/logistics');
    url.searchParams.set('from_id',   origin.locode);
    url.searchParams.set('to_id',     destination.locode);
    url.searchParams.set('type',      req.transportMode === 'maritime' ? 'sea' : req.transportMode);
    url.searchParams.set('weight',    String(req.weightKg));
    url.searchParams.set('volume',    String(req.volumeCbm || (req.weightKg / 500)));
    url.searchParams.set('currency',  'USD');

    const res = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;

    const offer = data?.data?.[0];
    if (!offer) return null;

    const riskZones = detectRiskZones(origin, destination);
    const distKm = offer.distance_km || haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const baseFreight = offer.rate || offer.price || 0;
    const insuranceUsd = (req.cargoValue || baseFreight * 10) * 0.004;

    return {
      originPort: origin.portName,
      destinationPort: destination.portName,
      transportMode: req.transportMode,
      distanceKm: Math.round(distKm),
      transitDays: offer.transit_time || offer.days || Math.round(distKm / 450),
      baseFreightUsd: Math.round(baseFreight * 100) / 100,
      insuranceUsd: Math.round(insuranceUsd * 100) / 100,
      surcharges: (offer.charges || []).map((c: any) => ({
        code: c.code || 'MISC',
        name: c.name || 'Cargo adicional',
        amountUsd: c.amount || 0,
        reason: c.description || '',
      })),
      totalFreightUsd: Math.round((baseFreight + insuranceUsd) * 100) / 100,
      ratePerKg: Math.round((baseFreight / req.weightKg) * 100) / 100,
      source: 'searates',
      riskZones,
    };
  } catch {
    return null;
  }
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCachedQuote(key: string): FreightQuoteResult | null {
  const db = getSqliteDb();
  if (!db) return null;
  try {
    const sixHoursAgo = Date.now() - CACHE_TTL_MS;
    const row = db.prepare(
      `SELECT result FROM freight_cache WHERE cache_key = ? AND updated_at > ?`
    ).get(key, Math.floor(sixHoursAgo / 1000)) as any;
    return row ? JSON.parse(row.result) : null;
  } catch { return null; }
}

function setCachedQuote(key: string, result: FreightQuoteResult): void {
  const db = getSqliteDb();
  if (!db) return;
  try {
    db.prepare(
      `INSERT OR REPLACE INTO freight_cache (cache_key, result, updated_at) VALUES (?, ?, ?)`
    ).run(key, JSON.stringify(result), Math.floor(Date.now() / 1000));
  } catch { /* non-fatal */ }
}

// ─── Main exported function ───────────────────────────────────────────────────
export async function getFreightQuote(req: FreightQuoteRequest): Promise<FreightQuoteResult> {
  const origin = getPortByLocode(req.originLocode);
  const destination = getPortByLocode(req.destinationLocode);

  if (!origin || !destination) {
    throw new Error(`Puerto no encontrado: ${!origin ? req.originLocode : req.destinationLocode}`);
  }

  const cacheKey = `${req.originLocode}:${req.destinationLocode}:${req.transportMode}:${req.urgency}:${Math.ceil(req.weightKg / 100)}`;
  const cached = getCachedQuote(cacheKey);
  if (cached) return cached;

  // SEARATES API - Comentado temporalmente para la Fase 6.0 (Demo / Inversores)
  // Descomentar la siguiente línea para activar la integración real en producción:
  // const result = (await calcSearates(req, origin, destination)) || calcOffline(req, origin, destination);

  // Usar siempre el calculador offline (Mock de alta calidad con distancias reales y zonas de riesgo)
  const result = calcOffline(req, origin, destination);

  setCachedQuote(cacheKey, result);
  return result;
}

// ─── Port lookup helpers for the route ───────────────────────────────────────
export { getPortByLocode };
