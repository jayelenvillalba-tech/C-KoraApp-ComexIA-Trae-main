import { Request, Response } from 'express';
import { getTariffRate } from '../services/wtoTariff.js';
import { getPortsByCountry } from '../services/portDatabase.js';
import { getExchangeRates } from '../services/exchangeRate.js';

// ─── ISO2 → country name for display ─────────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', BR: 'Brasil', CL: 'Chile', UY: 'Uruguay', PE: 'Perú',
  CO: 'Colombia', MX: 'México', CN: 'China', JP: 'Japón', KR: 'Corea del Sur',
  SG: 'Singapur', DE: 'Alemania', NL: 'Países Bajos', ES: 'España', IT: 'Italia',
  BE: 'Bélgica', GB: 'Reino Unido', US: 'Estados Unidos', AE: 'Emiratos Árabes',
  EG: 'Egipto', ZA: 'Sudáfrica', MA: 'Marruecos', IN: 'India', VN: 'Vietnam',
};

// ─── Distance matrix (lat/lng based) ─────────────────────────────────────────
const PORT_COORDS: Record<string, [number, number]> = {
  AR: [-34.60, -58.37], BR: [-23.93, -46.33], CL: [-33.04, -71.62],
  UY: [-34.91, -56.21], PE: [-12.05, -77.15], CO: [3.89,  -77.02],
  MX: [17.95, -102.20], CN: [31.23,  121.47], JP: [35.44,  139.65],
  KR: [35.10,  129.04], SG: [1.29,   103.85], DE: [53.55,    9.99],
  NL: [51.92,    4.48], ES: [41.38,    2.18], IT: [44.41,    8.93],
  BE: [51.23,    4.40], GB: [51.50,   -0.13], US: [33.74, -118.27],
  AE: [24.98,   55.06], EG: [31.26,   32.28], ZA: [-29.87,  31.03],
  MA: [35.88,   -5.50], IN: [19.08,   72.88], VN: [10.77,  106.70],
};

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const ha = Math.sin(dLat / 2) ** 2
    + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1 - ha));
}

function getDistance(origin: string, dest: string): number {
  const a = PORT_COORDS[origin];
  const b = PORT_COORDS[dest];
  if (!a || !b) return 15000; // Default: transcontinental
  return Math.round(haversineKm(a, b));
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function estimateLogistics(req: Request, res: Response) {
  try {
    const origin      = ((req.query.origin      as string) || 'AR').toUpperCase();
    const destination = ((req.query.destination as string) || 'CN').toUpperCase();
    const hsCode      = (req.query.hsCode       as string) || '';
    const product     = (req.query.product      as string) || 'General cargo';

    // 1. Real distance between main ports
    const distanceKm = getDistance(origin, destination);

    // 2. Real tariff from WTO (non-blocking — fallback inside getTariffRate)
    let tariff = null;
    if (hsCode) {
      try {
        tariff = await getTariffRate(destination, origin, hsCode);
      } catch {}
    }

    // 3. Exchange rate (for ARS display)
    let usdToArs = 1187;
    try {
      const rates = await getExchangeRates();
      usdToArs = rates.rates['ARS'] ?? 1187;
    } catch {}

    // 4. Cost formulas (calibrated to market rates 2024)
    const seaCostBase = Math.round(800 + distanceKm * 0.085);
    const seaCostHigh = Math.round(seaCostBase * 1.3);
    const seaDays = Math.round(distanceKm / 650);  // ~650 km/day avg

    const airCostBase = Math.round(seaCostBase * 4.2);
    const airCostHigh = Math.round(airCostBase * 1.25);
    const airDays = Math.max(2, Math.round(distanceKm / 9000)) + 2; // + handling

    // 5. Get real ports
    const originPorts = getPortsByCountry(origin);
    const destPorts   = getPortsByCountry(destination);
    const originPort  = originPorts.find(p => p.portType === 'port')?.portName || `Puerto de ${COUNTRY_NAMES[origin] || origin}`;
    const destPort    = destPorts.find(p => p.portType === 'port')?.portName   || `Puerto de ${COUNTRY_NAMES[destination] || destination}`;
    const originAir   = originPorts.find(p => p.portType === 'airport')?.portName || `Aeropuerto de ${COUNTRY_NAMES[origin] || origin}`;
    const destAir     = destPorts.find(p => p.portType === 'airport')?.portName   || `Aeropuerto de ${COUNTRY_NAMES[destination] || destination}`;

    const routes = [
      {
        id: 'sea-standard',
        name: 'Flete Marítimo Estándar (LCL/FCL)',
        modes: [{ icon: 'ship', label: 'Buque Container', duration: `${seaDays} días` }],
        totalDuration: `${seaDays}–${seaDays + 5} días`,
        cost: `USD ${seaCostBase.toLocaleString()} – ${seaCostHigh.toLocaleString()}`,
        costArs: `ARS ${Math.round(seaCostBase * usdToArs).toLocaleString()}`,
        incoterm: 'CFR / CIF',
        recommended: true,
        details: {
          port: `${originPort} → ${destPort}`,
          portLocode: `${originPorts[0]?.locode || ''} → ${destPorts[0]?.locode || ''}`,
          insurance: '0.45% valor carga',
          customs: 'Destino',
          risk: 'Bajo',
          distanceKm,
        },
      },
      {
        id: 'air-express',
        name: 'Carga Aérea Express',
        modes: [{ icon: 'plane', label: 'Avión Carguero', duration: `${airDays} días` }],
        totalDuration: `${airDays}–${airDays + 2} días`,
        cost: `USD ${airCostBase.toLocaleString()} – ${airCostHigh.toLocaleString()}`,
        costArs: `ARS ${Math.round(airCostBase * usdToArs).toLocaleString()}`,
        incoterm: 'CPT / CIP',
        recommended: false,
        details: {
          port: `${originAir} → ${destAir}`,
          insurance: '0.30% valor carga',
          customs: 'Destino',
          risk: 'Muy Bajo',
          distanceKm,
        },
      },
    ];

    if (distanceKm > 5000) {
      const multiCostBase = Math.round((seaCostBase + airCostBase) * 0.55);
      routes.push({
        id: 'sea-air',
        name: 'Multimodal (Sea + Air)',
        modes: [
          { icon: 'ship', label: 'Buque', duration: `${Math.round(seaDays * 0.6)} días` },
          { icon: 'plane', label: 'Avión', duration: '3 días' },
        ],
        totalDuration: `${Math.round(seaDays * 0.6) + 5} días`,
        cost: `USD ${multiCostBase.toLocaleString()} – ${Math.round(multiCostBase * 1.25).toLocaleString()}`,
        costArs: `ARS ${Math.round(multiCostBase * usdToArs).toLocaleString()}`,
        incoterm: 'DAP',
        recommended: false,
        details: {
          port: 'Hub Intermedio (Dubai / Panamá)',
          portLocode: '',
          insurance: 'Incluido',
          customs: 'Simplificado',
          risk: 'Medio',
          distanceKm,
        },
      });
    }

    res.json({
      success: true,
      data: routes,
      parameters: { distanceKm, origin, destination, product },
      tariff: tariff ? {
        hsCode,
        mfnRate: tariff.mfnRate,
        effectiveRate: tariff.effectiveRate,
        treatyName: tariff.treatyName,
        source: 'WTO Tariff Database',
      } : null,
      exchangeRate: { USD_ARS: usdToArs },
    });

  } catch (error: any) {
    console.error('Error calculating logistics:', error);
    res.status(500).json({ error: error.message });
  }
}
