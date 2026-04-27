import { Router } from 'express';
import {
  CONFLICT_ZONES,
  LAND_RISK_ZONES,
  AIR_RISK_ZONES,
  getZonesForRoute,
  calculateRiskImpact,
} from '../services/maritimeRisk.js';

const router = Router();

// GET /api/maritime/zones — 5 zonas de riesgo marítimo
router.get('/zones', (req, res) => {
  res.json({
    zones: CONFLICT_ZONES,
    total: CONFLICT_ZONES.length,
    lastUpdated: '2026-04-01',
    source: 'IMO / UKMTO / BIMCO',
    disclaimer: 'Información orientativa basada en fuentes oficiales IMO, UKMTO y BIMCO. Verificar con naviera y aseguradora antes de operar.',
  });
});

// GET /api/maritime/land-zones — zonas de riesgo terrestre (Phase 33C)
router.get('/land-zones', (req, res) => {
  const currentMonth = new Date().getMonth() + 1; // 1–12

  const zonesWithSeasonalStatus = LAND_RISK_ZONES.map(zone => ({
    ...zone,
    isHighRiskNow: zone.seasonalRisk
      ? (zone.highRiskMonths?.includes(currentMonth) ?? false)
      : zone.riskLevel === 'high',
    currentMonth,
  }));

  res.json({
    zones: zonesWithSeasonalStatus,
    total: LAND_RISK_ZONES.length,
    lastUpdated: '2026-04-01',
    source: 'Gendarmería Nacional AR / FIATA / OECD',
    disclaimer: 'Información de carácter orientativo sobre rutas terrestres. Verificar condiciones en tiempo real con Gendarmería Nacional y transportista.',
  });
});

// GET /api/maritime/air-zones — espacios aéreos restringidos (Phase 33C)
router.get('/air-zones', (req, res) => {
  res.json({
    zones: AIR_RISK_ZONES,
    total: AIR_RISK_ZONES.length,
    lastUpdated: '2026-04-01',
    source: 'ICAO NOTAMs / IATA / Eurocontrol',
    disclaimer: 'Información orientativa sobre espacios aéreos. Los NOTAMs cambian frecuentemente. Verificar con aerolínea o agente de carga antes de cada operación.',
  });
});

// GET /api/maritime/route-risk?origin=ARBUE&destination=DEHAM&cargoValue=62500
router.get('/route-risk', (req, res) => {
  const { origin, destination, cargoValue = '50000' } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin y destination requeridos' });
  }

  const zones = getZonesForRoute(origin as string, destination as string);
  const impact = calculateRiskImpact(zones, parseFloat(cargoValue as string));

  res.json({
    origin, destination,
    zonesAffected: zones.map(z => ({
      id: z.id,
      name: z.name,
      nameEn: z.nameEn,
      riskLevel: z.riskLevel,
      color: z.color,
      warningMessage: z.warningMessage,
      context: z.context,
      impact: z.impact,
      sources: z.officialSources,
      activeIncidents: z.activeIncidents,
      disclaimer: z.disclaimer,
    })),
    totalImpact: impact,
    hasRisk: zones.length > 0,
    highestRisk: impact.highestRisk,
    recommendation: getRecommendation(zones, impact),
    disclaimer: 'Información orientativa. Verificar con naviera y aseguradora.',
  });
});

function getRecommendation(zones: any[], impact: any): string {
  if (zones.length === 0) return 'Ruta sin alertas de riesgo marítimo activas.';
  if (impact.highestRisk === 'high') {
    return `⚠️ Ruta con zonas de alto riesgo activas. Recomendaciones: 1) Solicitar cotización de seguro de guerra. 2) Confirmar ruta alternativa con tu naviera. 3) Ajustar precio del deal para absorber${impact.totalExtraCostUsd > 0 ? ` USD ${impact.totalExtraCostUsd.toLocaleString()} de costos adicionales` : ' prima de seguro adicional'}.`;
  }
  if (impact.highestRisk === 'medium') {
    return '📊 Ruta con zonas de riesgo moderado. Verificar cobertura de seguro e incluir cláusula de guerra si corresponde.';
  }
  return 'Ruta con riesgo bajo. Operación normal.';
}

export default router;
