/**
 * GET /api/geo/locate
 * IP-based geolocation using geoip-lite (offline, no API key needed)
 * Returns: { countryCode, countryName, city, lat, lon, nearestPort }
 */

import { Router } from 'express';
import { getPortsByCountry } from '../services/portDatabase.js';

const router = Router();

// Haversine distance in km
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

// All country centroids (lat, lon) — comprehensive global list
const COUNTRY_CENTROIDS: Record<string, { name: string; lat: number; lon: number }> = {
  AR: { name: 'Argentina',          lat: -34.60,  lon: -58.38 },
  BR: { name: 'Brasil',             lat: -15.79,  lon: -47.88 },
  CL: { name: 'Chile',              lat: -33.46,  lon: -70.65 },
  UY: { name: 'Uruguay',            lat: -34.90,  lon: -56.19 },
  PY: { name: 'Paraguay',           lat: -25.28,  lon: -57.63 },
  BO: { name: 'Bolivia',            lat: -16.50,  lon: -68.15 },
  PE: { name: 'Perú',               lat: -12.05,  lon: -77.04 },
  CO: { name: 'Colombia',           lat:   4.71,  lon: -74.07 },
  VE: { name: 'Venezuela',          lat:  10.49,  lon: -66.90 },
  EC: { name: 'Ecuador',            lat:  -0.22,  lon: -78.51 },
  MX: { name: 'México',             lat:  19.43,  lon: -99.13 },
  US: { name: 'Estados Unidos',     lat:  38.91,  lon: -77.04 },
  CA: { name: 'Canadá',             lat:  45.42,  lon: -75.70 },
  CN: { name: 'China',              lat:  39.91,  lon: 116.39 },
  JP: { name: 'Japón',              lat:  35.68,  lon: 139.69 },
  KR: { name: 'Corea del Sur',      lat:  37.57,  lon: 126.98 },
  IN: { name: 'India',              lat:  28.61,  lon: 77.21  },
  SG: { name: 'Singapur',           lat:   1.35,  lon: 103.82 },
  ID: { name: 'Indonesia',          lat:  -6.21,  lon: 106.85 },
  VN: { name: 'Vietnam',            lat:  21.03,  lon: 105.85 },
  TH: { name: 'Tailandia',          lat:  13.75,  lon: 100.52 },
  MY: { name: 'Malasia',            lat:   3.14,  lon: 101.69 },
  AU: { name: 'Australia',          lat: -35.28,  lon: 149.13 },
  NZ: { name: 'Nueva Zelanda',      lat: -41.29,  lon: 174.78 },
  ZA: { name: 'Sudáfrica',          lat: -25.74,  lon:  28.19 },
  NG: { name: 'Nigeria',            lat:   9.06,  lon:   7.49 },
  KE: { name: 'Kenia',              lat:  -1.28,  lon:  36.82 },
  MA: { name: 'Marruecos',          lat:  33.99,  lon:  -6.85 },
  EG: { name: 'Egipto',             lat:  30.06,  lon:  31.25 },
  AE: { name: 'Emiratos Árabes',    lat:  24.47,  lon:  54.37 },
  SA: { name: 'Arabia Saudita',     lat:  24.69,  lon:  46.72 },
  TR: { name: 'Turquía',            lat:  39.92,  lon:  32.85 },
  IL: { name: 'Israel',             lat:  31.77,  lon:  35.22 },
  RU: { name: 'Rusia',              lat:  55.75,  lon:  37.62 },
  UA: { name: 'Ucrania',            lat:  50.45,  lon:  30.52 },
  PL: { name: 'Polonia',            lat:  52.23,  lon:  21.01 },
  DE: { name: 'Alemania',           lat:  52.52,  lon:  13.40 },
  FR: { name: 'Francia',            lat:  48.85,  lon:   2.35 },
  GB: { name: 'Reino Unido',        lat:  51.51,  lon:  -0.13 },
  ES: { name: 'España',             lat:  40.42,  lon:  -3.70 },
  IT: { name: 'Italia',             lat:  41.90,  lon:  12.50 },
  PT: { name: 'Portugal',           lat:  38.72,  lon:  -9.14 },
  NL: { name: 'Países Bajos',       lat:  52.37,  lon:   4.89 },
  BE: { name: 'Bélgica',            lat:  50.85,  lon:   4.35 },
  CH: { name: 'Suiza',              lat:  46.95,  lon:   7.44 },
  SE: { name: 'Suecia',             lat:  59.33,  lon:  18.07 },
  NO: { name: 'Noruega',            lat:  59.91,  lon:  10.75 },
  DK: { name: 'Dinamarca',          lat:  55.68,  lon:  12.57 },
  GR: { name: 'Grecia',             lat:  37.98,  lon:  23.73 },
  AT: { name: 'Austria',            lat:  48.21,  lon:  16.37 },
  HU: { name: 'Hungría',            lat:  47.50,  lon:  19.04 },
  CZ: { name: 'República Checa',    lat:  50.09,  lon:  14.42 },
  RO: { name: 'Rumanía',            lat:  44.43,  lon:  26.11 },
  PH: { name: 'Filipinas',          lat:  14.60,  lon: 120.98 },
  PK: { name: 'Pakistán',           lat:  33.72,  lon:  73.06 },
  BD: { name: 'Bangladesh',         lat:  23.73,  lon:  90.40 },
  MM: { name: 'Myanmar',            lat:  16.87,  lon:  96.17 },
  IQ: { name: 'Irak',               lat:  33.34,  lon:  44.40 },
  IR: { name: 'Irán',               lat:  35.69,  lon:  51.42 },
};

// GET /api/geo/locate — detect from IP (geoip-lite) or accept lat/lon override
router.get('/locate', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    let detectedLat: number;
    let detectedLon: number;
    let detectedCountryCode: string;
    let city = 'Desconocida';

    if (lat && lon) {
      // Client provided explicit coordinates (from navigator.geolocation)
      detectedLat = parseFloat(lat as string);
      detectedLon = parseFloat(lon as string);

      // Find closest country centroid
      let minDist = Infinity;
      let closestCode = 'AR';
      for (const [code, c] of Object.entries(COUNTRY_CENTROIDS)) {
        const d = haversineKm(detectedLat, detectedLon, c.lat, c.lon);
        if (d < minDist) { minDist = d; closestCode = code; }
      }
      detectedCountryCode = closestCode;

    } else {
      // IP-based detection using geoip-lite (offline DB, no API key)
      let geoip: any;
      try {
        geoip = await import('geoip-lite');
      } catch {
        // geoip-lite not installed — use AR as safe fallback
        return res.json({
          countryCode: 'AR',
          countryName: 'Argentina',
          city: 'Buenos Aires',
          lat: -34.60,
          lon: -58.38,
          source: 'fallback',
          nearestPorts: getPortsByCountry('AR').slice(0, 3)
        });
      }

      // Extract real IP (handles proxies/load balancers)
      const forwardedFor = req.headers['x-forwarded-for'];
      const rawIp = forwardedFor
        ? (forwardedFor as string).split(',')[0].trim()
        : req.socket.remoteAddress || '';
      const ip = rawIp.replace('::ffff:', '').replace('::1', '');

      const geo = ip ? geoip.default.lookup(ip) : null;

      if (geo) {
        detectedLat = geo.ll[0];
        detectedLon = geo.ll[1];
        detectedCountryCode = geo.country || 'AR';
        city = geo.city || 'Desconocida';
      } else {
        // localhost/private IP — use AR fallback
        detectedLat = -34.60;
        detectedLon = -58.38;
        detectedCountryCode = 'AR';
        city = 'Buenos Aires';
      }
    }

    const centroid = COUNTRY_CENTROIDS[detectedCountryCode];
    const countryName = centroid?.name || detectedCountryCode;

    // Get nearest ports for the user's country
    const ports = getPortsByCountry(detectedCountryCode).slice(0, 3);

    // If no ports found for this country, find nearest ports by coordinates
    let nearestPorts = ports;
    if (ports.length === 0) {
      const allPortCandidates: Array<{ port: any; dist: number }> = [];
      for (const code of Object.keys(COUNTRY_CENTROIDS)) {
        const countryPorts = getPortsByCountry(code);
        for (const p of countryPorts) {
          allPortCandidates.push({
            port: p,
            dist: haversineKm(detectedLat, detectedLon, p.latitude, p.longitude)
          });
        }
      }
      nearestPorts = allPortCandidates
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
        .map(x => x.port);
    }

    res.json({
      countryCode: detectedCountryCode,
      countryName,
      city,
      lat: detectedLat,
      lon: detectedLon,
      source: lat && lon ? 'browser_gps' : 'ip_detection',
      nearestPorts
    });

  } catch (err: any) {
    console.error('[geo/locate]', err.message);
    res.status(500).json({
      countryCode: 'AR',
      countryName: 'Argentina',
      city: 'Buenos Aires',
      lat: -34.60,
      lon: -58.38,
      source: 'error_fallback',
      nearestPorts: []
    });
  }
});

// GET /api/geo/countries — full country list with centroids
router.get('/countries', (_req, res) => {
  const list = Object.entries(COUNTRY_CENTROIDS).map(([code, c]) => ({
    code,
    name: c.name,
    lat: c.lat,
    lon: c.lon
  }));
  res.json({ countries: list, total: list.length });
});

export default router;
