/**
 * Logistics Routes — Phase 29B
 *
 * GET /api/logistics/calculate    — freight cost + tariffs + routes
 * GET /api/logistics/route-map    — waypoints array for map visualization
 * GET /api/logistics/ports        — list main ports by country
 */
import { Router, Request, Response } from 'express';
import { getTariffRate } from '../services/wtoTariff.js';
import { getExchangeRates } from '../services/exchangeRate.js';
import {
  calculateRoute,
  estimateFreight,
  transitDays,
  getPortByCountry,
  MAJOR_PORTS,
} from '../services/maritimeLogistics.js';
import { estimateLogistics } from './logistics-legacy.js';

const router = Router();

// ─── GET /api/logistics/calculate ────────────────────────────────────────────
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const origin        = ((req.query.origin      as string) || 'AR').toUpperCase();
    const destination   = ((req.query.destination as string) || 'CN').toUpperCase();
    const hsCode        = (req.query.hsCode       as string)?.replace(/\./g, '') || '';
    const product       = (req.query.product      as string) || 'General cargo';
    const containerType = (req.query.containerType as string) || '20GP';

    // 1. Sea route distance (preferring locode if passed)
    const originLocode = req.query.originLocode as string || origin;
    const destLocode   = req.query.destLocode   as string || destination;
    const route = calculateRoute(originLocode, destLocode);

    if (!route) {
      // Fallback to legacy handler for unknown routes
      return estimateLogistics(req, res);
    }

    // 2. Real tariff from WTO
    let tariff = null;
    if (hsCode) {
      try { tariff = await getTariffRate(destination, origin, hsCode); } catch {}
    }

    // 3. Exchange rates for multi-currency display
    let usdToArs = 1187;
    let usdToBrl = 5.85;
    try {
      const rates = await getExchangeRates();
      usdToArs = rates.rates['ARS'] ?? 1187;
      usdToBrl = rates.rates['BRL'] ?? 5.85;
    } catch {}

    // 4. Freight cost estimate per container type
    const freight  = estimateFreight(route.distanceNm, containerType);
    const seaDays  = transitDays(route.distanceNm);
    const airDays  = Math.max(2, Math.ceil(route.distanceNm / 5000)) + 2;

    // Air freight rate (always per container equivalent, much higher)
    const airFreight = estimateFreight(route.distanceNm, '20GP');
    const airLow     = Math.round(airFreight.low * 4.2);
    const airHigh    = Math.round(airFreight.high * 4.2);

    const routes = [
      {
        id: 'sea-standard',
        name: `Flete Marítimo — ${containerType}`,
        modes: [{ icon: 'ship', label: 'Buque Container', duration: `${seaDays} días` }],
        totalDuration: `${seaDays}–${seaDays + 5} días`,
        cost: `USD ${freight.low.toLocaleString('en-US')} – ${freight.high.toLocaleString('en-US')}`,
        costArs: `ARS ${Math.round(freight.midpoint * usdToArs).toLocaleString('es-AR')}`,
        incoterm: 'CFR / CIF',
        recommended: true,
        details: {
          port:          `${route.origin.name} → ${route.destination.name}`,
          portLocode:    `${route.origin.locode} → ${route.destination.locode}`,
          distanceNm:    route.distanceNm,
          insurance:     '0.45% valor carga',
          customs:       'Destino',
          risk:          'Bajo',
          perDayUsd:     freight.perDay,
        },
      },
      {
        id: 'air-express',
        name: 'Carga Aérea Express',
        modes: [{ icon: 'plane', label: 'Avión Carguero', duration: `${airDays} días` }],
        totalDuration: `${airDays}–${airDays + 2} días`,
        cost: `USD ${airLow.toLocaleString('en-US')} – ${airHigh.toLocaleString('en-US')}`,
        costArs: `ARS ${Math.round((airLow + airHigh) / 2 * usdToArs).toLocaleString('es-AR')}`,
        incoterm: 'CPT / CIP',
        recommended: false,
        details: {
          port:       `Aeropuerto de ${origin} → Aeropuerto de ${destination}`,
          distanceNm: route.distanceNm,
          insurance:  '0.30% valor carga',
          customs:    'Destino',
          risk:       'Muy Bajo',
        },
      },
    ];

    // Multimodal option for long-haul routes
    if (route.distanceNm > 5000) {
      const multiLow  = Math.round((freight.low + airLow) * 0.55);
      const multiHigh = Math.round((freight.high + airHigh) * 0.55);
      routes.push({
        id: 'sea-air',
        name: 'Multimodal (Sea + Air)',
        modes: [
          { icon: 'ship',  label: 'Buque', duration: `${Math.round(seaDays * 0.6)} días` },
          { icon: 'plane', label: 'Avión', duration: '3 días' },
        ],
        totalDuration: `${Math.round(seaDays * 0.6) + 5} días`,
        cost: `USD ${multiLow.toLocaleString('en-US')} – ${multiHigh.toLocaleString('en-US')}`,
        costArs: `ARS ${Math.round((multiLow + multiHigh) / 2 * usdToArs).toLocaleString('es-AR')}`,
        incoterm: 'DAP',
        recommended: false,
        details: {
          port:       'Hub Intermedio (Dubai / Panamá)',
          portLocode: '',
          distanceNm: route.distanceNm,
          insurance:  'Incluido',
          customs:    'Simplificado',
          risk:       'Medio',
        },
      });
    }

    return res.json({
      success: true,
      data: routes,
      route: {
        distanceNm:  route.distanceNm,
        transitDays: seaDays,
        origin:      route.origin,
        destination: route.destination,
        waypoints:   route.waypoints,
      },
      parameters: { origin, destination, product, containerType },
      tariff: tariff
        ? {
            hsCode,
            mfnRate: tariff.mfnRate,
            effectiveRate: tariff.effectiveRate,
            treatyName: tariff.treatyName,
            source: 'WTO Tariff Database',
          }
        : null,
      exchangeRates: { USD_ARS: usdToArs, USD_BRL: usdToBrl },
    });

  } catch (error: any) {
    console.error('[logistics/calculate]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/logistics/route-map ────────────────────────────────────────────
router.get('/route-map', (req: Request, res: Response) => {
  try {
    const originLocode = ((req.query.origin as string) || 'ARBUE').toUpperCase();
    const destLocode   = ((req.query.destination as string) || 'CNSHA').toUpperCase();

    const route = calculateRoute(originLocode, destLocode);
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found for these port codes' });
    }

    return res.json({
      success: true,
      data: {
        origin:      route.origin,
        destination: route.destination,
        distanceNm:  route.distanceNm,
        transitDays: transitDays(route.distanceNm),
        waypoints:   route.waypoints,
        routePath:   route.routePath,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/logistics/ports?country=AR ─────────────────────────────────────
router.get('/ports', (req: Request, res: Response) => {
  const country = (req.query.country as string)?.toUpperCase();
  const ports = Object.values(MAJOR_PORTS).filter(p =>
    !country || p.country === country
  );
  return res.json({ success: true, data: ports, total: ports.length });
});

// ─── Legacy handler passthrough (for older callers without locode) ────────────
router.get('/estimate', estimateLogistics);

export default router;
