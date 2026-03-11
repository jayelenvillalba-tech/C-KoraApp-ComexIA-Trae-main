import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  BarChart3, Ship, FileText, Users, ChevronRight, Shield,
  Bell, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Map, MessageSquare, Zap, Box, Globe, Anchor,
} from 'lucide-react';
import PremiumGlobe3D from '@/components/premium-globe-3d';

// ─── Ticker data (static mock — replaceable with real API) ────────────────────
const TICKER_ITEMS = [
  { name: 'SOJA', val: '$347.20', chg: '+1.4%', up: true },
  { name: 'TRIGO', val: '$216.80', chg: '-0.6%', up: false },
  { name: 'MAÍZ', val: '$189.40', chg: '+2.1%', up: true },
  { name: 'USD/ARS', val: '$1.054', chg: '+0.3%', up: true },
  { name: 'EUR/USD', val: '$1.0812', chg: '-0.2%', up: false },
  { name: 'ORO', val: '$2.948', chg: '+0.8%', up: true },
  { name: 'COBRE', val: '$4.12', chg: '+1.1%', up: true },
  { name: 'PETRÓLEO WTI', val: '$71.40', chg: '-0.5%', up: false },
];

// ─── Verify score docs ─────────────────────────────────────────────────────────
const VERIFY_DOCS = [
  { id: 'fiscal', name: 'Registro Fiscal / RIE', hint: 'Constancia AFIP activa para exportación', pts: 20, docId: 'customs-declaration' },
  { id: 'firma', name: 'Firma Digital habilitada', hint: 'Necesaria para documentación electrónica aduanera', pts: 20, docId: null },
  { id: 'cert-origen', name: 'Certificado de Origen', hint: 'MERCOSUR o no preferencial según destino', pts: 20, docId: 'certificate-of-origin' },
  { id: 'habilitacion', name: 'Habilitación SENASA/INTI', hint: 'Para productos agropecuarios o industriales', pts: 20, docId: 'phytosanitary-certificate' },
  { id: 'cuenta', name: 'Cuenta bancaria habilitada divisas', hint: 'Para liquidación BCRA de cobros en USD/EUR', pts: 20, docId: null },
];

const FEATURES = [
  { icon: Search, title: 'HS Code + Mapa', path: '/analysis', threshold: 0, color: '#00d4f0' },
  { icon: FileText, title: 'Docs IA', path: '/analysis?tab=documentation', threshold: 20, color: '#f5a800' },
  { icon: Users, title: 'Marketplace B2B', path: '/marketplace', threshold: 40, color: '#8f40ff' },
  { icon: MessageSquare, title: 'Chat Seguro', path: '/chat', threshold: 60, color: '#00e878' },
  { icon: Bell, title: 'Alertas', path: '/alerts', threshold: 0, color: '#ff3e5a' },
  { icon: Zap, title: 'Blockchain', path: '#', threshold: 100, color: '#f0c040' },
];

const BUYERS = [
  { flag: '🇨🇳', name: 'China (Shanghai)', hs: '1201.90 · Soja', share: 38, val: '$54.2M', up: true },
  { flag: '🇮🇩', name: 'Indonesia (Jakarta)', hs: '1201.90 · Soja', share: 24, val: '$34.1M', up: true },
  { flag: '🇧🇷', name: 'Brasil (Santos)', hs: '1001.99 · Trigo', share: 18, val: '$25.6M', up: false },
];

const OPPS = [
  { country: '🇧🇬 Bulgaria → UE', val: '$48.200 USD', product: 'Aceite de soja refinado · NCM 1507.90', incoterm: 'DAP', treaty: 'SGP UE', color: '#00d4f0' },
  { country: '🇲🇾 Malasia', val: '$31.800 USD', product: 'Carne bovina congelada · NCM 0202.30', incoterm: 'CIF', treaty: 'ACE-58', color: '#f5a800' },
  { country: '🇧🇷 Brasil (MERCOSUR)', val: '$22.500 USD', product: 'Vino Malbec bot. 0.75L · NCM 2204.21', incoterm: 'FOB', treaty: 'MERCOSUR', color: '#00e878' },
];

const ALERTS = [
  { text: 'Argentina eleva retenciones soja: ROE obligatorio para exportaciones > 1.000 tn.', level: 'hi', time: 'Hace 1h' },
  { text: 'SENASA exige nuevo certificado fitosanitario para envíos a Indonesia desde Abr 2026.', level: 'md', time: 'Hace 3h' },
  { text: 'Tipo de cambio exportador unificado: BCRA Com. A7280 · 11/03/2026.', level: 'lo', time: 'Hace 6h' },
];

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
function TickerBar() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[26px] bg-[#020810] border-b border-[#152637] overflow-hidden flex items-center">
      <div className="flex-shrink-0 px-3 h-full flex items-center border-r border-[#152637] bg-[#03101c]">
        <span className="font-mono text-[9px] font-semibold text-[#00d4f0] tracking-[2px] uppercase">Live</span>
      </div>
      <div className="flex items-center gap-0 animate-[ticker_40s_linear_infinite] whitespace-nowrap hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-1.5 px-5 h-[26px] border-r border-[#152637]">
            <span className="font-mono text-[9px] text-[#3d6e92] tracking-[0.5px]">{item.name}</span>
            <span className="font-mono text-[10px] text-[#c4dcf4]">{item.val}</span>
            <span className={`font-mono text-[9px] ${item.up ? 'text-[#00e878]' : 'text-[#ff3e5a]'}`}>{item.chg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nav Topbar ───────────────────────────────────────────────────────────────
function Topbar({ score, onScoreClick }: { score: number; onScoreClick: () => void }) {
  const [, navigate] = useLocation();
  const pct = Math.min(100, score);
  const circumference = 2 * Math.PI * 9;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? '#00e878' : pct >= 50 ? '#00d4f0' : '#f5a800';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <Box className="w-3.5 h-3.5" />, active: true },
    { label: 'Análisis', path: '/analysis', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: 'HS Code', path: '/analysis', icon: <Search className="w-3.5 h-3.5" /> },
    { label: 'Marketplace', path: '/marketplace', icon: <Users className="w-3.5 h-3.5" />, badge: 3 },
    { label: 'Incoterms', path: '/analysis?tab=calculator', icon: <Anchor className="w-3.5 h-3.5" /> },
    { label: 'Chat', path: '/chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed top-[26px] left-0 right-0 z-[100] h-[46px] bg-[rgba(2,8,16,0.96)] backdrop-blur-[16px] border-b border-[#152637] flex items-center px-4 gap-0">
      <div className="font-['Barlow_Condensed',sans-serif] text-[19px] font-black tracking-[1.5px] text-[#eef6ff] flex items-baseline mr-6 flex-shrink-0">
        CHE.<span className="text-[#00d4f0]">COMEX</span>
        <sub className="font-mono text-[8px] text-[#1e3d56] tracking-[2px] ml-1 mb-0">v2</sub>
      </div>

      <div className="flex items-center gap-0.5 flex-1">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all ${
              item.active
                ? 'bg-[#00d4f0]/10 text-[#00d4f0]'
                : 'text-[#3d6e92] hover:bg-[#071525] hover:text-[#c4dcf4]'
            }`}
          >
            {item.icon}
            {item.label}
            {item.badge && (
              <span className="font-mono text-[8px] bg-[#ff3e5a] text-white px-1 py-0.5 rounded-full">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Score ring pill */}
        <button
          onClick={onScoreClick}
          className="flex items-center gap-1.5 bg-[#071525] border border-[#1c3448] rounded-full py-1 px-3 hover:border-[#264a68] transition-all"
        >
          <div className="relative w-[22px] h-[22px] flex-shrink-0">
            <svg viewBox="0 0 22 22" width="22" height="22" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="11" cy="11" r="9" fill="none" stroke="#1c3448" strokeWidth="2.5" />
              <circle
                cx="11" cy="11" r="9" fill="none"
                stroke={color} strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1), stroke .5s' }}
              />
            </svg>
          </div>
          <span className="font-mono text-[9px] text-[#3d6e92]">SCORE</span>
          <span className="font-mono text-[11px] font-semibold" style={{ color }}>{pct}</span>
        </button>

        <button className="relative w-[30px] h-[30px] flex items-center justify-center rounded text-[#3d6e92] hover:bg-[#071525] hover:text-[#c4dcf4] transition-all">
          <Bell className="w-4 h-4" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ff3e5a] shadow-[0_0_6px_#ff3e5a] animate-pulse" />
        </button>

        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#00d4f0] to-[#1a8aff] flex items-center justify-center font-mono text-[12px] font-black text-[#020810] cursor-pointer">
          JV
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Left ─────────────────────────────────────────────────────────────
function Sidebar({ score }: { score: number }) {
  const [, navigate] = useLocation();
  const items = [
    { section: 'Principal' },
    { icon: <Box className="w-3.5 h-3.5" />, label: 'Dashboard', path: '/', active: true },
    { icon: <Map className="w-3.5 h-3.5" />, label: 'Análisis de Mercado', path: '/analysis' },
    { icon: <Search className="w-3.5 h-3.5" />, label: 'HS Code', path: '/analysis' },
    { icon: <Users className="w-3.5 h-3.5" />, label: 'Marketplace', path: '/marketplace', badge: { val: 3, color: 'bg-[#ff3e5a]' } },
    { icon: <Anchor className="w-3.5 h-3.5" />, label: 'Incoterms 2020', path: '/analysis?tab=calculator' },
    { section: 'Información' },
    { icon: <Bell className="w-3.5 h-3.5" />, label: 'Alertas', path: '/alerts', badge: { val: 2, color: 'bg-[#f5a800]' } },
    { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Chat Seguro', path: '/chat' },
    { section: 'Mi cuenta' },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Perfil B2B', path: '/onboarding' },
    { icon: <FileText className="w-3.5 h-3.5" />, label: 'Documentación', path: '/analysis?tab=documentation' },
  ];

  return (
    <div className="flex flex-col h-full pt-2 pb-4 px-2 gap-0.5 overflow-y-auto">
      {items.map((item, i) => {
        if ('section' in item) return (
          <div key={i} className="font-mono text-[8px] font-semibold text-[#1e3d56] tracking-[1.5px] uppercase px-2 pt-4 pb-1.5 mt-2 first:mt-0">
            {item.section}
          </div>
        );
        return (
          <button
            key={i}
            onClick={() => navigate(item.path!)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded text-[12px] transition-all ${
              item.active
                ? 'bg-[#00d4f0]/10 text-[#00d4f0]'
                : 'text-[#3d6e92] hover:bg-[#071525] hover:text-[#c4dcf4]'
            }`}
          >
            <span className="text-[14px] w-4 text-center flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`font-mono text-[8px] ${item.badge.color} text-white px-1.5 py-0.5 rounded-full`}>{item.badge.val}</span>
            )}
          </button>
        );
      })}

      <div className="mt-auto pt-4 border-t border-[#0f1e2c] mx-2">
        <div className="font-mono text-[8px] text-[#1e3d56] leading-[1.8]">
          🇦🇷 Exportadora del Sur S.A.<br />
          <span className="text-[#1e3d56]">Plan:</span> <span className="text-[#00d4f0]">Pro PyME</span><br />
          CUIT: 30-12345678-9
        </div>
      </div>
    </div>
  );
}

// ─── Verify Score Widget ──────────────────────────────────────────────────────
function VerifyWidget({ score, done, onToggle }: { score: number; done: string[]; onToggle: (id: string, pts: number) => void }) {
  const pct = Math.min(100, score);
  const color = pct >= 100 ? '#00e878' : '#00d4f0';
  return (
    <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] font-semibold text-[#3d6e92] uppercase tracking-wider">Verificación de Perfil</div>
          <div className="text-[11px] text-[#3d6e92] mt-1">Completá documentos → desbloqueás features</div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-['Barlow_Condensed'] text-[48px] font-black leading-none transition-all" style={{ color }}>{pct}</span>
          <span className="font-mono text-[14px] text-[#3d6e92]">/100</span>
        </div>
      </div>
      <div className="h-[5px] bg-[#0f1e2c] rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #00d4f0, ${color})` }} />
      </div>
      <div className="flex justify-between mb-4">
        <span className="font-mono text-[9px] text-[#3d6e92]">{done.length} de {VERIFY_DOCS.length} documentos</span>
        <span className="font-mono text-[9px] text-[#00d4f0] cursor-pointer hover:underline">Ver guía →</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {VERIFY_DOCS.map(doc => {
          const isDone = done.includes(doc.id);
          return (
            <div
              key={doc.id}
              onClick={() => !isDone && onToggle(doc.id, doc.pts)}
              className={`flex items-center gap-2.5 p-2.5 border rounded cursor-pointer transition-all ${
                isDone
                  ? 'bg-[#00e878]/5 border-[#00e878]/20'
                  : 'bg-[#071525] border-[#0f1e2c] hover:border-[#1c3448]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] ${
                isDone ? 'bg-[#00e878]/15 text-[#00e878]' : 'bg-[#f5a800]/10 text-[#f5a800]'
              }`}>
                {isDone ? '✓' : '⏳'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[#c4dcf4]">{doc.name}</div>
                <div className="text-[9px] text-[#3d6e92] truncate">{doc.hint}</div>
              </div>
              <div className={`font-mono text-[9px] px-2 py-0.5 rounded border flex-shrink-0 ${
                isDone ? 'text-[#00e878] bg-[#00e878]/7 border-[#00e878]/20' : 'text-[#f5a800] bg-[#f5a800]/7 border-[#f5a800]/20'
              }`}>
                {isDone ? 'OK' : `+${doc.pts}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────
function KpiGrid({ docsPending }: { docsPending: number }) {
  const kpis = [
    { label: 'Búsquedas hoy', val: '7', sub: 'de 5 incluidas · Pro', trend: '+2 ↑', up: true, bar: '#00d4f0' },
    { label: 'Matches Marketplace', val: '3', sub: 'compradores interesados', trend: 'NEW ↑', up: true, bar: '#00e878' },
    { label: 'Alertas activas', val: '2', sub: 'regulatorias · AFIP + UE', trend: '⚠ LEER', up: null, bar: '#f5a800' },
    { label: 'Docs pendientes', val: String(docsPending), sub: 'para badge Verificado', trend: `${docsPending}/5 ↓`, up: false, bar: '#ff3e5a' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {kpis.map((k, i) => (
        <div key={i} className="bg-[#03101c] border border-[#152637] rounded-xl p-4 relative overflow-hidden hover:border-[#264a68] transition-all">
          <div className="font-mono text-[8px] text-[#1e3d56] uppercase tracking-[1px] mb-1.5">{k.label}</div>
          <div className="font-['Barlow_Condensed'] text-[26px] font-black text-[#eef6ff] leading-none">{k.val}</div>
          <div className="text-[10px] text-[#3d6e92] mt-1">{k.sub}</div>
          <div className={`absolute bottom-3 right-3 font-mono text-[10px] font-semibold ${
            k.up === true ? 'text-[#00e878]' : k.up === false ? 'text-[#ff3e5a]' : 'text-[#f5a800]'
          }`}>{k.trend}</div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${k.bar}, transparent)` }} />
        </div>
      ))}
    </div>
  );
}

// ─── Top Mercados ─────────────────────────────────────────────────────────────
function TopMercados() {
  return (
    <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] font-semibold text-[#3d6e92] uppercase tracking-wider">Top Mercados · Soja 1201.90</span>
        <span className="font-mono text-[9px] text-[#00d4f0] cursor-pointer hover:underline">Ver análisis →</span>
      </div>
      <svg viewBox="0 0 260 36" preserveAspectRatio="none" className="w-full h-9 mb-3">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4f0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4f0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,28 L28,22 L56,25 L84,18 L112,20 L140,14 L168,16 L196,10 L224,8 L260,6" fill="none" stroke="#00d4f0" strokeWidth="1.5" />
        <path d="M0,28 L28,22 L56,25 L84,18 L112,20 L140,14 L168,16 L196,10 L224,8 L260,6 L260,36 L0,36Z" fill="url(#sg)" />
        <circle cx="260" cy="6" r="3" fill="#00d4f0" />
      </svg>
      <div className="divide-y divide-[#0f1e2c]">
        {BUYERS.map((b, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2">
            <span className="font-mono text-[11px] text-[#3d6e92] w-4 text-right flex-shrink-0">{i + 1}</span>
            <span className="text-[16px] flex-shrink-0">{b.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-[#c4dcf4]">{b.name}</div>
              <div className="font-mono text-[9px] text-[#3d6e92]">{b.hs}</div>
            </div>
            <div className="w-[70px] flex-shrink-0">
              <div className="h-1 bg-[#0f1e2c] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#00d4f0] rounded-full" style={{ width: `${b.share}%` }} />
              </div>
              <div className="font-mono text-[9px] text-[#3d6e92] text-right">{b.val}</div>
            </div>
            {b.up ? <TrendingUp className="w-3.5 h-3.5 text-[#00e878] flex-shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff3e5a] flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Oportunidades ────────────────────────────────────────────────────────────
function Oportunidades() {
  const [, navigate] = useLocation();
  return (
    <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] font-semibold text-[#3d6e92] uppercase tracking-wider">Oportunidades detectadas</span>
        <span className="font-mono text-[8px] bg-[#00e878]/10 text-[#00e878] border border-[#00e878]/20 px-2 py-0.5 rounded-full">3 activas</span>
      </div>
      <div className="flex flex-col gap-2">
        {OPPS.map((opp, i) => (
          <div
            key={i}
            onClick={() => navigate('/marketplace')}
            className="relative flex flex-col gap-1 p-3 bg-[#071525] border border-[#0f1e2c] rounded-lg cursor-pointer hover:border-[#1c3448] hover:bg-[#091b2e] transition-all overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{ background: opp.color }} />
            <div className="flex items-center justify-between pl-2">
              <span className="font-mono text-[9px] text-[#3d6e92]">{opp.country}</span>
              <span className="font-['Barlow_Condensed'] text-[14px] font-black text-[#eef6ff]">{opp.val}</span>
            </div>
            <div className="text-[11px] text-[#7fb0d0] pl-2">{opp.product}</div>
            <div className="flex gap-1.5 pl-2">
              <span className="font-mono text-[8px] bg-[#00d4f0]/10 text-[#00d4f0] border border-[#00d4f0]/20 px-1.5 py-0.5 rounded-full">{opp.incoterm}</span>
              <span className="font-mono text-[8px] bg-[#00e878]/10 text-[#00e878] border border-[#00e878]/20 px-1.5 py-0.5 rounded-full">{opp.treaty}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Incoterm Quick View ──────────────────────────────────────────────────────
function IncotermQuick() {
  const [, navigate] = useLocation();
  return (
    <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] font-semibold text-[#3d6e92] uppercase tracking-wider">Incoterm recomendado</span>
        <button onClick={() => navigate('/analysis?tab=calculator')} className="font-mono text-[9px] text-[#00d4f0] hover:underline">Abrir simulador →</button>
      </div>
      <div className="bg-[#00d4f0]/5 border border-[#00d4f0]/15 rounded-xl p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="font-['Barlow_Condensed'] text-[32px] font-black text-[#00d4f0]">FOB</div>
          <div>
            <div className="text-[12px] font-semibold text-[#c4dcf4]">Free On Board</div>
            <div className="font-mono text-[9px] text-[#00e878]">★ Ideal para tu perfil</div>
          </div>
        </div>
        <p className="text-[10px] text-[#3d6e92] leading-[1.6]">
          Para soja / granos → Brasil/China: el comprador asume flete y seguro. Reducís costos y tu riesgo termina en puerto AR.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-[#071525] border border-[#0f1e2c] rounded-lg p-2.5">
          <div className="font-mono text-[8px] text-[#3d6e92] uppercase mb-1">Vendedor cubre</div>
          <div className="text-[#c4dcf4] leading-[1.5]">Hasta el puerto de embarque AR. Despacho de exportación.</div>
        </div>
        <div className="bg-[#071525] border border-[#0f1e2c] rounded-lg p-2.5">
          <div className="font-mono text-[8px] text-[#3d6e92] uppercase mb-1">Comprador cubre</div>
          <div className="text-[#c4dcf4] leading-[1.5]">Flete, seguro y despacho de importación en destino.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Alertas Feed ─────────────────────────────────────────────────────────────
function AlertasFeed() {
  const [, navigate] = useLocation();
  const dotColor = { hi: '#ff3e5a', md: '#f5a800', lo: '#264a68' };
  return (
    <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] font-semibold text-[#3d6e92] uppercase tracking-wider">Alertas regulatorias</span>
        <button onClick={() => navigate('/alerts')} className="font-mono text-[9px] text-[#00d4f0] hover:underline">Ver todas →</button>
      </div>
      <div className="divide-y divide-[#0f1e2c]">
        {ALERTS.map((a, i) => (
          <div key={i} onClick={() => navigate('/alerts')} className="flex gap-2.5 py-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: dotColor[a.level as keyof typeof dotColor] }} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-[#7fb0d0] leading-[1.5]">{a.text}</div>
              <div className="font-mono text-[9px] text-[#3d6e92] mt-0.5">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ score, done, onNextStep }: { score: number; done: string[]; onNextStep: () => void }) {
  const commodities = [
    { name: 'SOJA', val: '$347', chg: '+1.4%', up: true },
    { name: 'TRIGO', val: '$216', chg: '-0.6%', up: false },
    { name: 'USD/ARS', val: '$1.054', chg: '+0.3%', up: true },
    { name: 'ORO', val: '$2.948', chg: '+0.8%', up: true },
  ];
  const pct = Math.min(100, score);
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 px-3 overflow-y-auto h-full">
      {/* Commodities */}
      <div>
        <div className="font-mono text-[8px] font-semibold text-[#1e3d56] uppercase tracking-[1.5px] mb-2">Commodities Live</div>
        {commodities.map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2 bg-[#03101c] border border-[#152637] rounded mb-1.5">
            <span className="font-mono text-[9px] text-[#3d6e92]">{c.name}</span>
            <span className="font-['Barlow_Condensed'] text-[15px] font-black text-[#eef6ff]">{c.val}</span>
            <span className={`font-mono text-[9px] ${c.up ? 'text-[#00e878]' : 'text-[#ff3e5a]'}`}>{c.chg}</span>
          </div>
        ))}
      </div>

      {/* Feature unlocks */}
      <div>
        <div className="font-mono text-[8px] font-semibold text-[#1e3d56] uppercase tracking-[1.5px] mb-2">Features · Score {pct}/100</div>
        {FEATURES.map((f, i) => {
          const locked = pct < f.threshold;
          return (
            <div
              key={i}
              onClick={() => !locked && navigate(f.path)}
              className={`flex items-center gap-2 p-2 border rounded mb-1.5 transition-all ${
                locked ? 'border-[#0f1e2c] opacity-40 cursor-not-allowed' : 'border-[#152637] hover:border-[#264a68] cursor-pointer'
              }`}
            >
              <f.icon className="w-4 h-4 flex-shrink-0" style={{ color: locked ? '#3d6e92' : f.color }} />
              <span className={`text-[11px] font-medium flex-1 ${locked ? 'text-[#3d6e92]' : 'text-[#c4dcf4]'}`}>{f.title}</span>
              {locked
                ? <span className="text-[10px]">🔒</span>
                : <span className="text-[10px]" style={{ color: f.color }}>✓</span>
              }
            </div>
          );
        })}
      </div>

      {/* Próximo paso CTA */}
      {done.length < VERIFY_DOCS.length && (
        <button
          onClick={onNextStep}
          className="w-full py-2.5 bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020810] font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-all"
        >
          Próximo paso →
        </button>
      )}
      {done.length === VERIFY_DOCS.length && (
        <div className="w-full py-2.5 bg-[#00e878]/10 border border-[#00e878]/25 rounded-lg text-center font-mono text-[10px] font-bold text-[#00e878]">
          ✓ Perfil 100% verificado
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Home() {
  const [score, setScore] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const verifyRef = useRef<HTMLDivElement>(null);

  const toggleDoc = (id: string, pts: number) => {
    setDone(prev => [...prev, id]);
    setScore(prev => Math.min(100, prev + pts));
  };

  const nextStep = () => {
    const next = VERIFY_DOCS.find(d => !done.includes(d.id));
    if (next) toggleDoc(next.id, next.pts);
  };

  const focusVerify = () => {
    verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const docsPending = VERIFY_DOCS.length - done.length;

  return (
    <div className="min-h-screen bg-[#020810] text-[#7fb0d0] font-['Outfit',sans-serif] overflow-x-hidden">
      {/* Add ticker keyframes globally */}
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Global background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0,212,240,.018) 1px,transparent 1px), linear-gradient(90deg,rgba(0,212,240,.018) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 35% at 15% 15%,rgba(0,212,240,.055) 0%,transparent 70%),radial-gradient(ellipse 30% 50% at 85% 75%,rgba(26,138,255,.04) 0%,transparent 70%)`,
        }} />
        <PremiumGlobe3D className="w-full h-full opacity-25 mix-blend-screen" />
      </div>

      {/* Ticker + Topbar */}
      <TickerBar />
      <Topbar score={score} onScoreClick={focusVerify} />

      {/* Main layout: sidebar + main + right panel */}
      <div
        className="relative z-10 grid"
        style={{
          gridTemplateColumns: '200px 1fr 260px',
          minHeight: '100vh',
          paddingTop: '72px', // 26px ticker + 46px topbar
        }}
      >
        {/* Left sidebar */}
        <div className="bg-[#03101c] border-r border-[#0f1e2c] sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto">
          <Sidebar score={score} />
        </div>

        {/* Main content */}
        <div className="p-5 flex flex-col gap-4 min-w-0">
          {/* Welcome banner */}
          <div className="bg-[#03101c] border border-[#152637] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-[-40px] right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,212,240,.07) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between gap-4 relative">
              <div>
                <div className="font-['Barlow_Condensed'] text-[22px] font-black text-[#eef6ff] tracking-[0.5px]">Buen día, Jezabel 👋</div>
                <div className="text-[11px] text-[#3d6e92] mt-1">🇦🇷 Exportadora del Sur S.A. · Comerciante · Pro PyME · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className="flex gap-2 flex-wrap mt-2.5">
                  {['⏳ Verificación en progreso', 'Pro PyME', '✓ AFIP activo', 'MERCOSUR'].map((chip, i) => {
                    const colors = ['text-[#f5a800] bg-[#f5a800]/8 border-[#f5a800]/20', 'text-[#00d4f0] bg-[#00d4f0]/8 border-[#00d4f0]/20', 'text-[#00e878] bg-[#00e878]/8 border-[#00e878]/20', 'text-[#1a8aff] bg-[#1a8aff]/8 border-[#1a8aff]/20'];
                    return <span key={i} className={`inline-flex items-center font-mono text-[8px] px-2 py-0.5 rounded-full border ${colors[i]}`}>{chip}</span>;
                  })}
                </div>
              </div>
              <div className="flex gap-5 flex-shrink-0">
                {[{ val: '3', label: 'Oportunidades', color: '#00d4f0' }, { val: '$142K', label: 'USD Potencial', color: '#00e878' }, { val: String(score), label: 'Score', color: '#f5a800' }].map((s, i) => (
                  <div key={i} className="text-right">
                    <div className="font-['Barlow_Condensed'] text-[22px] font-black" style={{ color: s.color }}>{s.val}</div>
                    <div className="font-mono text-[8px] text-[#1e3d56] uppercase tracking-[1px] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <KpiGrid docsPending={docsPending} />

          {/* Verify + Markets */}
          <div className="grid grid-cols-2 gap-4">
            <div ref={verifyRef}>
              <VerifyWidget score={score} done={done} onToggle={toggleDoc} />
            </div>
            <TopMercados />
          </div>

          {/* Opps + Incoterm */}
          <div className="grid grid-cols-2 gap-4">
            <Oportunidades />
            <IncotermQuick />
          </div>

          {/* Alerts */}
          <AlertasFeed />
        </div>

        {/* Right panel */}
        <div className="bg-[#03101c] border-l border-[#0f1e2c] sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto">
          <RightPanel score={score} done={done} onNextStep={nextStep} />
        </div>
      </div>
    </div>
  );
}
