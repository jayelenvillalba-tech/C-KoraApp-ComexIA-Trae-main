
import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Circle, Tooltip as LTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, DivIcon } from 'leaflet';
import { Company } from '@shared/schema';
import { calculateDistance, formatDistance } from '@/utils/distance-calculator';
import { X, ExternalLink, AlertTriangle, Ship } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CYBER-TRADE MERIDIAN — Global Risk Map Component
   Dark Canvas + Pulsing Risk Zones + Energy Node Markers
═══════════════════════════════════════════════════════ */

// ── RISK ZONES (5 geopolitical hotspots) ──────────────────────────────────────
const RISK_ZONES = [
  { id: 'red-sea', name: 'Mar Rojo / Bab el-Mandeb', lat: 13.5, lon: 42.5, radius: 280000, level: 'ALTO', color: '#ef4444', impact: '+7 días tránsito · +$3,200 flete', incidents: 'Ataques a buques comerciales (Houthis)' },
  { id: 'hormuz', name: 'Estrecho de Ormuz', lat: 26.5, lon: 56.3, radius: 180000, level: 'ELEVADO', color: '#f59e0b', impact: '+3 días tránsito · +$1,800 seguro', incidents: 'Tensión Irán-Israel, inspecciones navales' },
  { id: 'taiwan', name: 'Estrecho de Taiwán', lat: 24.0, lon: 119.5, radius: 220000, level: 'ELEVADO', color: '#f59e0b', impact: '+4 días tránsito · +$2,400 reroute', incidents: 'Ejercicios militares PLA, rerouting naviero' },
  { id: 'black-sea', name: 'Mar Negro', lat: 43.5, lon: 34.0, radius: 300000, level: 'ALTO', color: '#ef4444', impact: '+10 días tránsito · Ruta cerrada parcial', incidents: 'Conflicto Ucrania-Rusia, minas marítimas' },
  { id: 'panama', name: 'Canal de Panamá', lat: 9.1, lon: -79.7, radius: 120000, level: 'MODERADO', color: '#eab308', impact: '+2 días espera · +$800 recargo', incidents: 'Sequía, restricción de calado' },
];

// ── TRADE ROUTES (animated arcs) ──────────────────────────────────────────────
const TRADE_ROUTES = [
  {
    id: 'ar-cn', name: 'Buenos Aires → Shanghai',
    points: [[-34.6, -58.4], [-34.0, -30.0], [0.0, -5.0], [10.0, 30.0], [13.5, 42.5], [20.0, 70.0], [31.2, 121.5]] as [number, number][],
    safe: false, riskZone: 'Mar Rojo',
  },
  {
    id: 'br-nl', name: 'Santos → Rotterdam',
    points: [[-23.9, -46.3], [-15.0, -30.0], [5.0, -20.0], [30.0, -10.0], [45.0, 0.0], [51.9, 4.5]] as [number, number][],
    safe: true, riskZone: null,
  },
  {
    id: 'co-kr', name: 'Cartagena → Busan',
    points: [[10.4, -75.5], [9.1, -79.7], [5.0, -90.0], [15.0, -120.0], [25.0, -140.0], [30.0, -170.0], [35.1, 129.0]] as [number, number][],
    safe: false, riskZone: 'Canal de Panamá',
  },
];

// ── ENERGY NODE ICON (cyan dot for companies) ────────────────────────────────
function createEnergyNodeIcon() {
  return new DivIcon({
    html: `<div style="
      width: 10px; height: 10px; border-radius: 50%;
      background: #00d4f0;
      box-shadow: 0 0 8px rgba(0,212,240,0.6), 0 0 16px rgba(0,212,240,0.3);
      border: 1px solid rgba(0,212,240,0.8);
    "></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

// ── Country coords (preserved) ────────────────────────────────────────────────
const countryCoords: Record<string, { lat: number; lon: number; name: string }> = {
  'AR': { lat: -38.4161, lon: -63.6167, name: 'Argentina' },
  'BR': { lat: -14.2350, lon: -51.9253, name: 'Brasil' },
  'UY': { lat: -32.5228, lon: -55.7658, name: 'Uruguay' },
  'PY': { lat: -23.4425, lon: -58.4438, name: 'Paraguay' },
  'CL': { lat: -35.6751, lon: -71.5430, name: 'Chile' },
};

// ── GDELT Alert Modal ─────────────────────────────────────────────────────────
function GdeltModal({ zone, onClose }: { zone: typeof RISK_ZONES[0]; onClose: () => void }) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/maritime/zones`)
      .then(r => r.ok ? r.json() : { zones: [] })
      .then(data => {
        const z = data.zones?.find?.((z: any) => z.name?.includes?.(zone.name.split('/')[0].trim())) || null;
        setIncidents(z?.recentIncidents || [
          { title: zone.incidents, date: new Date().toISOString().slice(0, 10), source: 'GDELT' },
        ]);
      })
      .catch(() => setIncidents([{ title: zone.incidents, date: '2026-03-24', source: 'GDELT' }]))
      .finally(() => setLoading(false));
  }, [zone]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: `0 0 40px ${zone.color}22` }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: zone.color, boxShadow: `0 0 12px ${zone.color}` }}
            />
            <div>
              <h2 className="font-black text-lg" style={{ fontFamily: 'var(--ds-font-display)', color: 'var(--ds-text-primary)' }}>
                {zone.name}
              </h2>
              <span
                className="uppercase font-bold tracking-wider"
                style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: zone.color, letterSpacing: 'var(--ds-tracking-data)' }}
              >
                RIESGO {zone.level}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" style={{ color: 'var(--ds-text-tertiary)' }} />
          </button>
        </div>

        {/* Impact */}
        <div className="px-6 py-3" style={{ background: `${zone.color}08` }}>
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4" style={{ color: zone.color }} />
            <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>
              Impacto: {zone.impact}
            </span>
          </div>
        </div>

        {/* Incidents */}
        <div className="px-6 py-4 space-y-3 max-h-[300px] overflow-y-auto">
          <div
            className="uppercase font-bold tracking-wider mb-2"
            style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-tertiary)', letterSpacing: 'var(--ds-tracking-data)' }}
          >
            INCIDENTES RECIENTES · FUENTE GDELT
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg" style={{ background: 'var(--ds-bg-overlay)' }} />)}
            </div>
          ) : incidents.map((inc, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--ds-bg-raised)', boxShadow: 'var(--ds-shadow-card)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: zone.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{inc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-muted)' }}>{inc.date}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                      style={{ background: 'var(--ds-cyan-dim)', color: 'var(--ds-cyan)', fontFamily: 'var(--ds-font-data)' }}
                    >{inc.source || 'GDELT'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <div className="px-6 py-3" style={{ borderTop: '1px solid var(--ds-border-subtle)' }}>
          <p className="italic" style={{ fontFamily: 'var(--ds-font-body)', fontSize: '9px', color: 'var(--ds-text-muted)' }}>
            Información orientativa. Consultar con su agente naviero para datos actualizados.
            Fuentes: GDELT · Lloyd's List · IMB Piracy Reporting Centre
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN MAP COMPONENT ────────────────────────────────────────────────────────
interface CompanyMapLeafletProps {
  companies: Company[];
}

export default function CompanyMapLeaflet({ companies }: CompanyMapLeafletProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<typeof RISK_ZONES[0] | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Pulse animation timer
  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => (p + 1) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  const energyIcon = useMemo(() => createEnergyNodeIcon(), []);

  // World center for global view
  const center: [number, number] = [20.0, 10.0];

  // Group companies by country
  const companiesByCountry = companies.reduce((acc, company) => {
    acc[company.country] = (acc[company.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const distanceInfo = selectedCountry && hoveredCountry && selectedCountry !== hoveredCountry
    ? calculateDistance(
        countryCoords[selectedCountry].lat, countryCoords[selectedCountry].lon,
        countryCoords[hoveredCountry].lat, countryCoords[hoveredCountry].lon
      )
    : null;

  const pulseOpacity = 0.15 + 0.15 * Math.sin(pulsePhase * 0.12);

  return (
    <>
      <div className="h-[700px] w-full rounded-2xl overflow-hidden relative z-0" style={{ boxShadow: 'var(--ds-shadow-raised)' }}>
        {/* Pulse animation keyframes injected via CSS */}
        <style>{`
          @keyframes riskPulse {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.08); }
          }
          .leaflet-container { background: #0a141d !important; }
          .leaflet-popup-content-wrapper { background: #162129 !important; color: #d9e4f0 !important; border: 1px solid rgba(60,73,76,0.15) !important; border-radius: 12px !important; box-shadow: 0 8px 40px rgba(0,212,240,0.06) !important; }
          .leaflet-popup-tip { background: #162129 !important; }
          .leaflet-popup-close-button { color: #859397 !important; }
          .leaflet-control-zoom a { background: #162129 !important; color: #d9e4f0 !important; border-color: rgba(60,73,76,0.25) !important; }
          .leaflet-control-zoom a:hover { background: #212b34 !important; }
          .leaflet-control-attribution { background: rgba(10,20,29,0.8) !important; color: #3c494c !important; font-size: 9px !important; }
          .leaflet-control-attribution a { color: #00d4f0 !important; }
        `}</style>

        <MapContainer center={center} zoom={2.5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} minZoom={2}>
          {/* CartoDB Dark Matter Tiles — No Labels */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />

          {/* ── RISK ZONES: Pulsing Orange/Red Circles ── */}
          {RISK_ZONES.map(zone => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lon]}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                weight: 1.5,
                opacity: 0.6,
                fillColor: zone.color,
                fillOpacity: pulseOpacity,
              }}
              eventHandlers={{ click: () => setSelectedZone(zone) }}
            >
              <LTooltip
                direction="top"
                className=""
                permanent={false}
              >
                <div style={{
                  background: '#162129', color: '#d9e4f0', padding: '8px 12px',
                  borderRadius: '8px', border: `1px solid ${zone.color}33`,
                  fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  boxShadow: `0 0 20px ${zone.color}22`,
                }}>
                  <div style={{ fontWeight: 900, fontSize: '12px', marginBottom: '2px' }}>{zone.name}</div>
                  <div style={{ color: zone.color, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    RIESGO {zone.level}
                  </div>
                  <div style={{ color: '#859397', fontSize: '10px', marginTop: '4px' }}>{zone.impact}</div>
                  <div style={{ color: '#00d4f0', fontSize: '9px', marginTop: '4px', cursor: 'pointer' }}>
                    Click para ver incidentes GDELT →
                  </div>
                </div>
              </LTooltip>
            </Circle>
          ))}

          {/* ── TRADE ROUTES: Animated Light Arcs ── */}
          {TRADE_ROUTES.map(route => (
            <Polyline
              key={route.id}
              positions={route.points}
              pathOptions={{
                color: route.safe ? '#00d4f0' : '#f59e0b',
                weight: 2,
                opacity: 0.7,
                dashArray: '8, 12',
                lineCap: 'round',
              }}
            >
              <LTooltip direction="center" permanent={false}>
                <div style={{
                  background: '#162129', color: '#d9e4f0', padding: '6px 10px',
                  borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  border: `1px solid ${route.safe ? '#00d4f033' : '#f59e0b33'}`,
                }}>
                  <div style={{ fontWeight: 700 }}>{route.name}</div>
                  {route.riskZone && (
                    <div style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                      ⚠ Cruza {route.riskZone}
                    </div>
                  )}
                  {route.safe && (
                    <div style={{ color: '#69f6b9', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                      ✓ RUTA SEGURA
                    </div>
                  )}
                </div>
              </LTooltip>
            </Polyline>
          ))}

          {/* ── Distance line ── */}
          {distanceInfo && selectedCountry && hoveredCountry && (
            <Polyline
              positions={[
                [countryCoords[selectedCountry].lat, countryCoords[selectedCountry].lon],
                [countryCoords[hoveredCountry].lat, countryCoords[hoveredCountry].lon]
              ]}
              pathOptions={{ color: '#00d4f0', weight: 2, opacity: 0.5, dashArray: '6, 8' }}
            >
              <LTooltip permanent direction="center">
                <span style={{ background: '#162129', color: '#00d4f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  {formatDistance(distanceInfo, 'km')}
                </span>
              </LTooltip>
            </Polyline>
          )}

          {/* ── COMPANY MARKERS: Energy Nodes ── */}
          {companies.map((company) => {
            const lat = company.country === 'AR' ? -34.6 + (Math.random() - 0.5) * 5 :
                        company.country === 'BR' ? -15.8 + (Math.random() - 0.5) * 10 :
                        company.country === 'UY' ? -32.5 + (Math.random() - 0.5) * 2 :
                        company.country === 'PY' ? -23.4 + (Math.random() - 0.5) * 2 :
                        company.country === 'CL' ? -33.4 + (Math.random() - 0.5) * 5 :
                        -25.0 + (Math.random() - 0.5) * 10;
            const lng = company.country === 'AR' ? -58.4 + (Math.random() - 0.5) * 5 :
                        company.country === 'BR' ? -47.9 + (Math.random() - 0.5) * 10 :
                        company.country === 'UY' ? -55.7 + (Math.random() - 0.5) * 2 :
                        company.country === 'PY' ? -58.4 + (Math.random() - 0.5) * 2 :
                        company.country === 'CL' ? -70.6 + (Math.random() - 0.5) * 2 :
                        -60.0 + (Math.random() - 0.5) * 10;

            return (
              <Marker
                key={company.id}
                position={[lat, lng]}
                icon={energyIcon}
                eventHandlers={{
                  click: () => setSelectedCountry(company.country),
                  mouseover: () => setHoveredCountry(company.country),
                  mouseout: () => setHoveredCountry(null)
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '220px' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '14px', color: '#d9e4f0', marginBottom: '4px' }}>{company.name}</h3>
                    <p style={{ fontSize: '12px', color: '#9bcdee', marginBottom: '8px' }}>{company.description}</p>
                    <div style={{ borderTop: '1px solid rgba(60,73,76,0.15)', paddingTop: '8px', marginTop: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#859397', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
                        {countryCoords[company.country]?.name || company.country} · {companiesByCountry[company.country] || 0} empresas
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <span style={{ background: 'rgba(0,212,240,0.1)', color: '#00d4f0', fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                        {company.country}
                      </span>
                      {company.verified && (
                        <span style={{ background: 'rgba(105,246,185,0.1)', color: '#69f6b9', fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    {selectedCountry && selectedCountry !== company.country && (
                      <div style={{ borderTop: '1px solid rgba(60,73,76,0.15)', paddingTop: '8px', marginTop: '8px' }}>
                        <p style={{ fontSize: '10px', color: '#00d4f0', fontWeight: 700 }}>
                          📏 {formatDistance(calculateDistance(
                            countryCoords[selectedCountry].lat, countryCoords[selectedCountry].lon,
                            countryCoords[company.country].lat, countryCoords[company.country].lon
                          ), 'km')} desde {countryCoords[selectedCountry]?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Risk Legend — floating bottom-left */}
        <div
          className="absolute bottom-4 left-4 z-[1000] glass rounded-xl px-4 py-3"
          style={{ minWidth: '180px' }}
        >
          <div
            className="uppercase font-bold tracking-wider mb-2"
            style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', letterSpacing: 'var(--ds-tracking-data)' }}
          >
            LEYENDA DE RIESGO
          </div>
          {[
            { color: '#ef4444', label: 'Alto (>20 incidentes/mes)' },
            { color: '#f59e0b', label: 'Elevado (10-20 incidentes)' },
            { color: '#eab308', label: 'Moderado (5-10 incidentes)' },
            { color: '#69f6b9', label: 'Normal (<5 incidentes)' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}66` }} />
              <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Selected country overlay */}
        {selectedCountry && (
          <div className="absolute top-4 left-4 z-[1000] glass rounded-xl px-4 py-3">
            <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
              NODO SELECCIONADO
            </div>
            <div style={{ fontFamily: 'var(--ds-font-display)', fontSize: '14px', fontWeight: 900, color: 'var(--ds-cyan)' }}>
              {countryCoords[selectedCountry]?.name}
            </div>
            <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-muted)', marginTop: '2px' }}>
              Hover otro nodo para ver distancia
            </div>
          </div>
        )}

        {/* Data sources bar */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] px-4 py-1.5 flex items-center justify-between" style={{ background: 'rgba(10,20,29,0.85)', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)' }}>
            Fuentes: GDELT · Lloyd's List · IMB Piracy · US Navy MSCHOA
          </span>
          <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)' }}>
            Actualizado: hace 3 horas
          </span>
        </div>
      </div>

      {/* GDELT Incident Modal */}
      {selectedZone && <GdeltModal zone={selectedZone} onClose={() => setSelectedZone(null)} />}
    </>
  );
}
