import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUser } from '@/context/user-context';
import { useLanguage } from '@/hooks/use-language';
import Header from '@/components/header';
import CostAnalysisModal from '@/components/marketplace/CostAnalysisModal';
import { CheckCircle, AlertTriangle, XCircle, Clock, MessageSquare, TrendingUp, Plus, Search } from 'lucide-react';
import FilterPanel, { FilterState } from '@/components/marketplace/FilterPanel';
import { useGodMode } from '@/context/godmode-context';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const DS = {
  bg: 'var(--ds-bg-base)', bg2: '#090f18', bg3: 'var(--ds-bg-raised)', bd: '#0f2030',
  cyan: 'var(--ds-cyan)', green: 'var(--ds-green)', amber: 'var(--ds-amber)', red: 'var(--ds-red)', gold: 'var(--ds-gold)',
  t1: '#c8dff0', t2: '#8aafc0', t3: '#4a7090', 
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600&display=swap');
  .mkt { font-family: 'Outfit', sans-serif; background: ${DS.bg}; min-height: 100vh; color: ${DS.t1}; }
  .card { background: ${DS.bg3}; border: 1px solid ${DS.bd}; border-radius: 8px; transition: border-color .2s; }
  .card:hover { border-color: ${DS.cyan}30; }
  .badge { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: .8px; padding: 2px 8px; border-radius: 2px; text-transform: uppercase; }
  .chip { background: #0d2035; border: 1px solid #1a3a5a; border-radius: 3px; padding: 2px 8px; font-family: 'DM Mono', monospace; font-size: 10px; color: ${DS.t2}; }
  .btn-primary { background: linear-gradient(135deg, ${DS.cyan}, #0088cc); color: #000; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 700; font-family: 'Outfit', sans-serif; cursor: pointer; font-size: 13px; transition: opacity .2s; }
  .btn-primary:hover { opacity: .85; }
  .btn-ghost { background: none; border: 1px solid ${DS.bd}; color: ${DS.t2}; border-radius: 6px; padding: 8px 16px; font-family: 'Outfit', sans-serif; cursor: pointer; font-size: 13px; transition: all .2s; }
  .btn-ghost:hover { border-color: ${DS.cyan}50; color: ${DS.cyan}; }
  .filter-toggle { background: ${DS.bg3}; border: 1px solid ${DS.bd}; border-radius: 4px; padding: 6px 14px; font-family: 'DM Mono', monospace; font-size: 11px; color: ${DS.t2}; cursor: pointer; transition: all .2s; }
  .filter-toggle.active, .filter-toggle:hover { background: ${DS.cyan}15; border-color: ${DS.cyan}50; color: ${DS.cyan}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${DS.bg}; }
  ::-webkit-scrollbar-thumb { background: ${DS.bd}; border-radius: 2px; }

  /* Responsive Grid */
  .mkt-grid {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 16px 24px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media (min-width: 1024px) {
    .mkt-grid { grid-template-columns: 240px 1fr 280px; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .mkt-grid { grid-template-columns: 240px 1fr; }
    .mkt-pulse { display: none; } /* Hide right column on tablet */
  }
`;

// ─── Types ──────────────────────────────────────────────────────────────────
interface Publication {
  id: string; company: string; contact: string; contactRole: string; verified: boolean;
  type: 'sell' | 'buy'; product: string; hsCode: string; qty: number; unit: string;
  incoterm: string; price: number; currency: string; origin: string; destination?: string;
  certifications: string[]; docsCount: number; timeAgo: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_PUBLICATIONS: Publication[] = [
  {
    id: '1', company: 'Empresa AgroExport S.A.', contact: 'Miguel Martínez', contactRole: 'Export Manager',
    verified: true, type: 'sell', product: 'Porotos de Soja Orgánica Premium', hsCode: '120190',
    qty: 1000, unit: 'toneladas', incoterm: 'FOB', price: 450, currency: 'USD',
    origin: 'AR', destination: 'CN', certifications: ['SENASA', 'Orgánico Certificado', 'ISO 9001'],
    docsCount: 6, timeAgo: 'hace menos de 1 hora',
  },
  {
    id: '2', company: 'Molinos Pamperos S.A.', contact: 'Laura Suárez', contactRole: 'Gerente Comercial',
    verified: true, type: 'sell', product: 'Trigo Pan de Alta Proteína', hsCode: '100190',
    qty: 500, unit: 'toneladas', incoterm: 'CIF', price: 280, currency: 'USD',
    origin: 'AR', destination: 'CN', certifications: ['SENASA', 'AFIP-RIE'], docsCount: 5, timeAgo: 'hace 3 horas',
  },
  {
    id: '3', company: 'Viñedos del Valle', contact: 'Diego Fernández', contactRole: 'Director Export',
    verified: true, type: 'sell', product: 'Vino Malbec Reserva Mendoza', hsCode: '220421',
    qty: 20000, unit: 'litros', incoterm: 'DAP', price: 8, currency: 'USD',
    origin: 'AR', destination: 'DE', certifications: ['INAO', 'Organic Wine', 'DO Mendoza'], docsCount: 7, timeAgo: 'hace 5 horas',
  },
  {
    id: '4', company: 'AgroSol Exportadora', contact: 'Cecilia Ramos', contactRole: 'Head of Sales',
    verified: false, type: 'sell', product: 'Aceite de Girasol Alto Oleico', hsCode: '151219',
    qty: 300, unit: 'toneladas', incoterm: 'FOB', price: 1100, currency: 'USD',
    origin: 'AR', destination: 'EU', certifications: ['ISO 22000', 'HACCP'], docsCount: 4, timeAgo: 'hace 8 horas',
  },
  {
    id: '5', company: 'MetalTec Industries', contact: 'Pablo Quiroga', contactRole: 'Commercial Manager',
    verified: true, type: 'buy', product: 'Acero Inoxidable 304 en Bobinas', hsCode: '721911',
    qty: 50, unit: 'toneladas', incoterm: 'CFR', price: 2400, currency: 'USD',
    origin: 'CN', destination: 'AR', certifications: ['Mill Certificate', 'ISO 9001'], docsCount: 3, timeAgo: 'hace 12 horas',
  },
  {
    id: '6', company: 'ElectroTech Solutions', contact: 'Sebastián Gómez', contactRole: 'Sourcing Director',
    verified: true, type: 'buy', product: 'Componentes Electrónicos (Circuitos Integrados)', hsCode: '854231',
    qty: 50000, unit: 'unidades', incoterm: 'CIF', price: 2.5, currency: 'USD',
    origin: 'CN', destination: 'AR', certifications: ['RoHS', 'CE'], docsCount: 4, timeAgo: 'hace 14 horas',
  },
];

const FLAGS: Record<string, string> = {
  AR: '🇦🇷', BR: '🇧🇷', CN: '🇨🇳', DE: '🇩🇪', US: '🇺🇸', UY: '🇺🇾', EU: '🇪🇺', ES: '🇪🇸',
};

function getCompat(pub: Publication, userDocs: string[]) {
  // Simple: if user has SENASA and Origin cert, they're partially compatible
  const score = userDocs.length / (pub.docsCount + 2);
  if (score >= 0.8) return { pct: Math.round(score * 100), color: DS.green, label: '✅ Podés operar', icon: 'ok' };
  if (score >= 0.4) return { pct: Math.round(score * 100), color: DS.amber, label: `⚠️ Te faltan docs`, icon: 'warn' };
  return { pct: Math.round(score * 100), color: DS.red, label: '🔴 No podés operar', icon: 'no' };
}

// ─── Route Alerts Logic ──────────────────────────────────────────────────────
interface RouteAlert {
  id: string; title: string; routeOrigin: string | null; routeDestination: string | null; affectedHsCodes: string;
}

function getAlertForPub(pub: Publication, alerts: RouteAlert[]) {
  return alerts.find(a => {
    const originMatch = !a.routeOrigin || a.routeOrigin === pub.origin;
    const destMatch = !a.routeDestination || a.routeDestination === pub.destination;
    let hsMatch = true;
    if (a.affectedHsCodes) {
      try {
        const hsList = typeof a.affectedHsCodes === 'string' ? JSON.parse(a.affectedHsCodes) : a.affectedHsCodes;
        hsMatch = Array.isArray(hsList) ? hsList.some((hs: string) => pub.hsCode.startsWith(hs)) : true;
      } catch (e) {
        console.error('Error parsing HS codes for alert:', a.id, e);
        hsMatch = true; // Fallback to match if corrupted
      }
    }
    return originMatch && destMatch && hsMatch;
  });
}

// ─── Components ──────────────────────────────────────────────────────────────

function PublicationCard({ pub, onViewCosts, onContact, alert, userDocs }: {
  pub: Publication; onViewCosts: (p: Publication) => void; onContact: (p: Publication) => void; alert?: RouteAlert; userDocs: string[];
}) {
  const compat = getCompat(pub, userDocs);

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px', position: 'relative', border: alert ? `1px solid ${DS.red}50` : undefined }}>
      {alert && (
        <div style={{ position: 'absolute', top: '-10px', left: '16px', background: DS.red, color: DS.bg, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, fontFamily: 'Barlow Condensed', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: `0 0 10px ${DS.red}40` }}>
          <AlertTriangle size={10} /> ALERTA DE RUTA: {alert.title}
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${DS.cyan}, #0088cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '16px', fontFamily: 'Barlow Condensed', flexShrink: 0 }}>
            {pub.company[0]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff' }}>{pub.company}</span>
              {pub.verified
                ? <span className="badge" style={{ background: `${DS.green}20`, color: DS.green, border: `1px solid ${DS.green}40` }}>✓ VERIFICADA</span>
                : <span className="badge" style={{ background: `${DS.amber}20`, color: DS.amber, border: `1px solid ${DS.amber}40` }}>PENDIENTE</span>
              }
            </div>
            <div style={{ fontSize: '12px', color: DS.t3, fontFamily: 'DM Mono, monospace' }}>{pub.contact} · {pub.contactRole} · {pub.timeAgo}</div>
          </div>
        </div>
        {/* Type badge + Compat */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span className="badge" style={{ background: pub.type === 'sell' ? `${DS.cyan}20` : `${DS.amber}20`, color: pub.type === 'sell' ? DS.cyan : DS.amber, border: `1px solid ${pub.type === 'sell' ? DS.cyan : DS.amber}40` }}>
            {pub.type === 'sell' ? 'VENDO' : 'COMPRO'}
          </span>
          <div title={compat.label} style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: compat.color, fontWeight: 700 }}>
            {compat.label}
          </div>
        </div>
      </div>

      {/* Product */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: '#fff' }}>{pub.product}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: DS.cyan, marginLeft: '10px' }}>NCM {pub.hsCode}</span>
      </div>

      {/* Trade info pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span className="chip">📦 {pub.qty.toLocaleString('es-AR')} {pub.unit}</span>
        <span className="chip">⚓ {pub.incoterm}</span>
        <span className="chip" style={{ color: DS.green, borderColor: `${DS.green}30` }}>💲 {pub.price} {pub.currency}/{pub.unit.slice(0, -1)}</span>
        <span className="chip">{FLAGS[pub.origin] || '🌎'} {pub.origin}{pub.destination ? ` → ${FLAGS[pub.destination] || ''}${pub.destination}` : ''}</span>
      </div>

      {/* Certifications */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {pub.certifications.map(cert => (
          <span key={cert} style={{ background: `${DS.gold}12`, border: `1px solid ${DS.gold}30`, borderRadius: '3px', padding: '1px 8px', fontSize: '10px', color: DS.gold, fontFamily: 'DM Mono, monospace' }}>
            {cert}
          </span>
        ))}
        <span style={{ fontSize: '10px', color: DS.t3, fontFamily: 'DM Mono, monospace', alignSelf: 'center' }}>{pub.docsCount} docs</span>
      </div>

      {/* Compat bar */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: DS.t3, fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>Compatibilidad</span>
        <div style={{ flex: 1, height: '4px', background: '#0d2035', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${compat.pct}%`, background: compat.color, borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '11px', color: compat.color, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{compat.pct}%</span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => onContact(pub)}>
          💬 Contactar
        </button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onViewCosts(pub)}>
          Ver Costos →
        </button>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';

function WorldTradePulse() {
  const { language } = useLanguage();
  const { data: newsData, isLoading } = useQuery({
    queryKey: ['marketplace-news', language],
    queryFn: () => fetch(`/api/news?limit=3&period=30&lang=${language}`).then(r => r.json()),
    staleTime: 1000 * 60 * 15,
  });

  const newsItems = newsData?.news || [];

  function timeAgo(ts: number): string {
    if (!ts) return language === 'es' ? 'Reciente' : 'Recent';
    // Handle both seconds and milliseconds timestamps
    const seconds = ts > 2000000000 ? Math.floor(ts / 1000) : ts;
    const diff = Math.floor((Date.now() / 1000) - seconds);
    
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const events = [
    { name: 'Expo Agro Buenos Aires 2026', date: 'Mar 25', place: 'Buenos Aires' },
    { name: 'Webinar: Exportar a China', date: 'Mar 28', place: 'Online' },
  ];
  const groups = [
    { name: 'Exportadores LATAM', members: '12k' },
    { name: 'Importadores UE', members: '8.5k' },
    { name: 'Logística Internacional', members: '5k' },
  ];
  const tagColor: Record<string, string> = { regulation: DS.amber, treaty: DS.green, market: DS.cyan, warning: DS.red, info: DS.t2 };
  const tagLabel: Record<string, string> = { regulation: 'Regulación', treaty: 'Tratado', market: 'Mercado', warning: 'Alerta', info: 'Info' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#fff' }}>📰 World Trade Pulse</span>
          <a href="/news" style={{ fontSize: '11px', color: DS.cyan, textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}>Ver todo</a>
        </div>
        {isLoading ? (
          <div style={{ padding: '16px', color: DS.t3, fontSize: '12px' }}>
            Cargando actualizaciones...
          </div>
        ) : newsItems.length === 0 ? (
          <div style={{ padding: '16px', color: DS.t3, fontSize: '12px' }}>
            No hay noticias recientes para esta sección.
          </div>
        ) : (
          newsItems.map((n: any, idx: number) => {
            const title = language === 'es' 
              ? (n.title || n.title_es || n.title_original || n.title_en)
              : (n.title_en || n.title || n.title_original);
            
            return (
              <div key={idx} style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: `1px solid ${DS.bd}` }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: DS.t1, lineHeight: 1.4 }}>{title}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: tagColor[n.alert_type || n.type] || DS.t2 }}>{tagLabel[n.alert_type || n.type] || 'Info'}</span>
                  <span style={{ fontSize: '10px', color: DS.t3, fontFamily: 'DM Mono, monospace' }}>· {timeAgo(n.published_at || n.publish_date)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '12px' }}>Eventos de Comercio</span>
        {events.map(e => (
          <div key={e.name} style={{ padding: '8px', borderRadius: '4px', background: DS.bg2, marginBottom: '6px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: DS.t1 }}>{e.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: DS.t3, fontFamily: 'DM Mono, monospace' }}>{e.date} · {e.place}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '12px' }}>Grupos Sugeridos</span>
        {groups.map(g => (
          <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${DS.cyan}, #0088cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>{g.name[0]}</div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: DS.t1 }}>{g.name}</p>
                <p style={{ margin: 0, fontSize: '10px', color: DS.t3, fontFamily: 'DM Mono, monospace' }}>{g.members} miembros</p>
              </div>
            </div>
            <button style={{ background: 'none', border: `1px solid ${DS.bd}`, borderRadius: '50%', width: '26px', height: '26px', color: DS.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  useDocumentTitle('Marketplace B2B');
  const { user } = useUser();
  const { setContext } = useGodMode();
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<FilterState>({
    type: '', sector: '', verifiedOnly: false, minPrice: '', maxPrice: '', hsCode: '', country: '', aiQuery: '', documentState: ''
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [routeAlerts, setRouteAlerts] = useState<RouteAlert[]>([]);
  const [userDocs, setUserDocs] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/news/route-alerts')
      .then(r => r.json())
      .then(d => { if(d.success) setRouteAlerts(d.data); })
      .catch(console.error);

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/verifications/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : { docsCompleted: [] })
        .then(d => setUserDocs(d.docsCompleted || []))
        .catch(console.error);
    }
  }, []);

  const processAiFilter = async (query: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/marketplace/ai-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.success && data.filters) {
        setFilters(prev => ({
          ...prev,
          type: data.filters.type || prev.type,
          country: data.filters.country || prev.country,
          sector: data.filters.sector || prev.sector,
          hsCode: data.filters.hsCode || prev.hsCode,
          aiQuery: query
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredPubs = MOCK_PUBLICATIONS.filter(p => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.verifiedOnly && !p.verified) return false;
    if (filters.hsCode && !p.hsCode.startsWith(filters.hsCode)) return false;
    if (filters.country && p.origin !== filters.country && p.destination !== filters.country) return false;
    if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
    
    // Evaluate documentState compatibility
    const compat = getCompat(p, userDocs);
    if (filters.documentState === 'ready' && compat.pct < 80) return false;
    if (filters.documentState === 'partial' && compat.pct < 40) return false;

    if (search) {
      const s = search.toLowerCase();
      return p.product.toLowerCase().includes(s) || p.hsCode.includes(s) || p.company.toLowerCase().includes(s);
    }
    return true;
  });

  const openModal = (pub: Publication) => { 
    setSelectedPub(pub); 
    setShowModal(true); 
    setContext({
      viewingProduct: pub.product,
      viewingHsCode: pub.hsCode,
      viewingCountry: pub.destination,
      operationType: pub.type === 'sell' ? 'export' : 'import'
    });
  };
  const goChat = (pub: Publication) => navigate(`/chat/deal-${pub.id}`);

  return (
    <>
      <style>{CSS}</style>
      <div className="mkt">
        <Header />
        <div className="mkt-grid">

          {/* LEFT: Filters */}
          <aside>
            <FilterPanel 
              filters={filters} 
              onChange={setFilters} 
              onAiFilter={processAiFilter}
              isAiLoading={isAiLoading}
            />
          </aside>

          {/* CENTER: Feed */}
          <main>
            {/* Publish bar */}
            <div className="card" style={{ padding: '14px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${DS.cyan}, #0088cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                {user?.name?.[0] || 'U'}
              </div>
              <button onClick={() => navigate('/auth')} style={{ flex: 1, textAlign: 'left', background: DS.bg2, border: `1px solid ${DS.bd}`, borderRadius: '20px', padding: '10px 16px', color: DS.t3, fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                ¿Qué oportunidad comercial querés compartir?
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button className="chip whitespace-nowrap" style={{ cursor: 'pointer' }}>+ Agregar HS Code</button>
              <button className="chip whitespace-nowrap" style={{ cursor: 'pointer' }}>+ Documentos</button>
              <button className="chip whitespace-nowrap" style={{ cursor: 'pointer' }}>+ Contacto</button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: DS.t3 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos, HS codes, empresas..." style={{ width: '100%', padding: '10px 10px 10px 36px', background: DS.bg2, border: `1px solid ${DS.bd}`, borderRadius: '6px', color: DS.t1, fontSize: '13px', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' }} />
            </div>

            {/* Publications */}
            {filteredPubs.length === 0
              ? <div style={{ textAlign: 'center', padding: '48px', color: DS.t3, fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>Sin publicaciones para estos filtros.</div>
              : filteredPubs.map(pub => (
                <PublicationCard key={pub.id} pub={pub} onViewCosts={openModal} onContact={goChat} alert={getAlertForPub(pub, routeAlerts)} userDocs={userDocs} />
              ))
            }
          </main>

          {/* RIGHT: World Trade Pulse */}
          <aside className="mkt-pulse hidden lg:block">
            <WorldTradePulse />
          </aside>
        </div>
      </div>

      <CostAnalysisModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        publication={selectedPub}
        userProfile={{ docsCompleted: userDocs }}
      />
    </>
  );
}
