
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Bot, FileText, Newspaper, Plus, Send,
  AlertTriangle, ShieldCheck, TrendingUp, Ship, Loader2, X,
  ExternalLink, Zap, CheckCircle2, Clock
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

/* ═══════════════════════════════════════════════════════
   CYBER-TRADE MERIDIAN — Deal Room Intelligence Sidebar
   40% Split-View: Riesgo Real (API) + GDELT News + AI Bot
═══════════════════════════════════════════════════════ */

interface ChatSidebarProps {
  deal: any;
  onProposePrice?: () => void;
}

// ─── Sub-component: AI Bot Panel ─────────────────────────────────────────────
function AiBotPanel({ deal }: { deal: any }) {
  const [botMessages, setBotMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: `Hola! Soy el asistente de Che.Comex. Estoy listo para ayudarte con dudas sobre este deal: **${deal?.product || 'el producto'}** (${deal?.origin || '?'} → ${deal?.destination || '?'}). ¿En qué puedo ayudarte?` }
  ]);
  const [botInput, setBotInput] = useState('');
  const [sending, setSending] = useState(false);
  const botBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    botBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botMessages]);

  const sendToBot = useCallback(async () => {
    if (!botInput.trim() || sending) return;
    const userMsg = botInput.trim();
    setBotInput('');
    setBotMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...botMessages.filter(m => m.role !== 'assistant' || botMessages.indexOf(m) > 0)
              .map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ],
          context: {
            product: deal?.product,
            hsCode: deal?.hs_code,
            country: deal?.origin,
            operation: 'exportación',
            targetCountry: deal?.destination
          }
        })
      });
      const data = await res.json();
      setBotMessages(prev => [...prev, { role: 'assistant', content: data.content || 'No pude obtener respuesta.' }]);
    } catch {
      setBotMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error conectando con la IA. Intentá de nuevo.' }]);
    } finally {
      setSending(false);
    }
  }, [botInput, botMessages, deal, sending]);

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ minHeight: 0 }}>
        {botMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="rounded-xl px-3 py-2 text-xs leading-relaxed"
              style={{
                maxWidth: '85%',
                background: msg.role === 'user'
                  ? 'rgba(0,212,240,0.12)'
                  : 'var(--ds-bg-raised)',
                border: msg.role === 'user'
                  ? '1px solid rgba(0,212,240,0.25)'
                  : '1px solid var(--ds-border-subtle)',
                color: 'var(--ds-text-primary)',
                fontFamily: 'var(--ds-font-body)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2" style={{ background: 'var(--ds-bg-raised)', border: '1px solid var(--ds-border-subtle)' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--ds-cyan)' }} />
            </div>
          </div>
        )}
        <div ref={botBottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3 flex-shrink-0">
        <input
          value={botInput}
          onChange={e => setBotInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendToBot()}
          placeholder="Consultá tratados, aranceles, docs..."
          className="flex-1 rounded-lg px-3 py-2 text-xs outline-none transition-all"
          style={{
            background: 'var(--ds-bg-input)',
            border: '1px solid var(--ds-border-subtle)',
            color: 'var(--ds-text-primary)',
            fontFamily: 'var(--ds-font-body)'
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--ds-cyan)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--ds-border-subtle)'; }}
        />
        <button
          onClick={sendToBot}
          disabled={sending || !botInput.trim()}
          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            background: botInput.trim() ? 'var(--ds-cyan)' : 'var(--ds-border-subtle)',
            opacity: sending ? 0.6 : 1
          }}
        >
          <Send size={12} color="var(--ds-bg-base)" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChatSidebar({ deal, onProposePrice }: ChatSidebarProps) {
  const { language } = useLanguage();
  const [activePanel, setActivePanel] = useState<"intelligence" | "participants" | "news" | "bot">("intelligence");

  // ── Real maritime risk from API ──────────────────────────────────────────────
  const [riskData, setRiskData] = useState<any>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  useEffect(() => {
    if (!deal?.origin || !deal?.destination) return;
    setRiskLoading(true);
    const cargo = deal.price_usd && deal.quantity ? deal.price_usd * deal.quantity : 50000;
    fetch(`/api/maritime/route-risk?origin=${deal.origin}&destination=${deal.destination}&cargoValue=${cargo}`)
      .then(r => r.json())
      .then(d => setRiskData(d))
      .catch(() => setRiskData(null))
      .finally(() => setRiskLoading(false));
  }, [deal?.origin, deal?.destination, deal?.price_usd, deal?.quantity]);

  // ── Real GDELT news relevant to the deal ────────────────────────────────────
  const [dealNews, setDealNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (!deal?.hs_code) return;
    setNewsLoading(true);
    // Fetch news relevant to origin/destination countries and product
    const originCountry = deal.origin?.substring(0, 2) || '';
    const destCountry = deal.destination?.substring(0, 2) || '';
    const newsUrl = `/api/news?limit=6&period=30&lang=es`
      + (destCountry ? `&countries=${destCountry}` : '');
    fetch(newsUrl)
      .then(r => r.json())
      .then(d => {
        const items = d.news || d.data || d.items || [];
        setDealNews(items.slice(0, 6));
      })
      .catch(() => setDealNews([]))
      .finally(() => setNewsLoading(false));
  }, [deal?.hs_code, deal?.origin, deal?.destination]);

  // ── Participants from deal ───────────────────────────────────────────────────
  const participants = deal?.participants || [];

  // ── Compute risk display values ──────────────────────────────────────────────
  const hasHighRisk = riskData?.highestRisk === 'high';
  const hasMedRisk = riskData?.highestRisk === 'medium';
  const riskColor = hasHighRisk ? 'var(--ds-red)' : hasMedRisk ? 'var(--ds-amber)' : 'var(--ds-green)';
  const extraCost = riskData?.totalImpact?.totalExtraCostUsd || 0;
  const extraDays = riskData?.totalImpact?.extraDays || 0;

  const tabs = [
    { id: 'intelligence', icon: TrendingUp, label: 'Inteligencia' },
    { id: 'participants', icon: Users, label: 'Nodos' },
    { id: 'news', icon: Newspaper, label: 'Radar GDELT' },
    { id: 'bot', icon: Bot, label: 'Asistente IA' },
  ];

  return (
    <div className="flex flex-col h-full w-full" style={{ background: 'var(--ds-bg-base)', borderLeft: '1px solid var(--ds-border-subtle)', fontFamily: 'var(--ds-font-body)' }}>
      {/* ── Tabs ── */}
      <div className="flex border-b" style={{ borderColor: 'var(--ds-border-subtle)', flexShrink: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            className="flex-1 py-3 flex justify-center items-center transition-all relative"
            style={{
              background: activePanel === tab.id ? 'var(--ds-cyan-dim)' : 'transparent',
              color: activePanel === tab.id ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
              borderBottom: `2px solid ${activePanel === tab.id ? 'var(--ds-cyan)' : 'transparent'}`,
            }}
            title={tab.label}
          >
            <tab.icon className="w-4 h-4" />
            {/* Red dot for active risk */}
            {tab.id === 'intelligence' && hasHighRisk && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            {/* News count badge */}
            {tab.id === 'news' && dealNews.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: 'var(--ds-cyan)', color: 'var(--ds-bg-base)' }}>
                {dealNews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>

        {/* ── INTELLIGENCE PANEL ── */}
        {activePanel === "intelligence" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: 'var(--ds-cyan)' }} />
              <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                {language === 'es' ? 'Inteligencia de Ruta' : 'Route Intelligence'}
              </h3>
            </div>

            {/* Propose Price CTA */}
            {!deal?.price_usd && (
              <button
                onClick={onProposePrice}
                className="w-full relative overflow-hidden rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,240,0.15) 0%, rgba(0,102,255,0.15) 100%)',
                  border: '1px solid rgba(0,212,240,0.4)',
                  animation: 'proposePulse 2s infinite'
                }}
              >
                <style>{`
                  @keyframes proposePulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(0,212,240,0.1); }
                    50% { box-shadow: 0 0 40px rgba(0,212,240,0.3); }
                  }
                `}</style>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--ds-cyan)' }} />
                <span style={{ fontFamily: 'var(--ds-font-data)', letterSpacing: '0.1em', fontWeight: 800, fontSize: '11px', color: 'var(--ds-cyan)' }}>
                  PROPONER PRECIO
                </span>
              </button>
            )}

            {/* Maritime Risk Card — REAL DATA */}
            <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'var(--ds-bg-raised)', border: `1px solid ${riskColor}30` }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ds-text-muted)' }}>
                  RIESGO MARÍTIMO
                </span>
                {riskLoading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: riskColor }} /> : <Ship className="w-4 h-4" style={{ color: riskColor }} />}
              </div>

              {riskLoading ? (
                <div style={{ color: 'var(--ds-text-muted)', fontSize: 11 }}>Calculando ruta...</div>
              ) : riskData ? (
                <>
                  <div style={{ fontFamily: 'var(--ds-font-display)', fontSize: '18px', fontWeight: 900, color: 'var(--ds-text-primary)' }}>
                    {extraCost > 0 ? `+ USD ${extraCost.toLocaleString()}` : 'Sin sobrecosto'}
                    {extraDays > 0 && <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginLeft: 8 }}>+{extraDays}d</span>}
                  </div>
                  <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '11px', color: 'var(--ds-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {riskData.recommendation}
                  </p>
                  {riskData.zonesAffected?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {riskData.zonesAffected.map((z: any) => (
                        <span key={z.id} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: `${z.color}20`, color: z.color, border: `1px solid ${z.color}40` }}>
                          {z.nameEn}
                        </span>
                      ))}
                    </div>
                  )}
                  {riskData.totalImpact?.hasOpportunity && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(0,232,120,0.08)', border: '1px solid rgba(0,232,120,0.2)' }}>
                      <p style={{ fontSize: 10, color: 'var(--ds-green)', fontFamily: 'var(--ds-font-data)', fontWeight: 700 }}>
                        {riskData.totalImpact.opportunityNote}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: 9, color: 'var(--ds-text-muted)', marginTop: 6, fontFamily: 'var(--ds-font-data)' }}>
                    Fuente: IMO / UKMTO / BIMCO
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>Seleccioná un deal con origen y destino para ver el análisis.</p>
              )}
            </div>

            {/* Compliance Check */}
            <div className="rounded-xl p-4" style={{ background: 'var(--ds-bg-raised)', border: '1px solid var(--ds-border-subtle)' }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" style={{ color: 'var(--ds-cyan)' }} />
                <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ds-text-muted)' }}>
                  DOCUMENTACIÓN
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', fontFamily: 'var(--ds-font-body)', lineHeight: 1.4 }}>
                Usá el Asistente IA para consultar qué documentos necesitás para esta operación.
              </p>
              <button
                onClick={() => setActivePanel('bot')}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-white/5"
                style={{ border: '1px solid var(--ds-border-subtle)', color: 'var(--ds-cyan)', fontFamily: 'var(--ds-font-data)', letterSpacing: '0.05em' }}
              >
                <Bot className="w-3 h-3" /> CONSULTAR IA
              </button>
            </div>
          </div>
        )}

        {/* ── PARTICIPANTS PANEL ── */}
        {activePanel === "participants" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                {language === 'es' ? 'Nodos Conectados' : 'Connected Nodes'}
              </h3>
              <Plus className="w-4 h-4" style={{ color: 'var(--ds-cyan)', cursor: 'pointer' }} />
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ds-text-muted)', opacity: 0.4 }} />
                <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', fontFamily: 'var(--ds-font-data)' }}>
                  Sin participantes aún
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((u: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5" style={{ background: 'var(--ds-bg-raised)' }}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: 'var(--ds-bg-input)', color: 'var(--ds-text-primary)', border: '1px solid var(--ds-border-subtle)' }}>
                        {(u.name || u.user_id || '?').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--ds-text-primary)' }} className="truncate">
                          {u.name || u.user_id}
                        </p>
                      </div>
                      <p style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-muted)' }} className="truncate">
                        {u.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEWS / RADAR GDELT PANEL ── */}
        {activePanel === "news" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--ds-amber)' }} />
              <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                {language === 'es' ? 'Radar GDELT' : 'GDELT Radar'}
              </h3>
              {newsLoading && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: 'var(--ds-cyan)' }} />}
            </div>

            {!newsLoading && dealNews.length === 0 && (
              <div className="text-center py-6">
                <Newspaper className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ds-text-muted)', opacity: 0.4 }} />
                <p style={{ fontSize: 12, color: 'var(--ds-text-muted)', fontFamily: 'var(--ds-font-data)' }}>
                  Sin noticias recientes para este producto/ruta
                </p>
              </div>
            )}

            <div className="space-y-3">
              {dealNews.map((item: any, i: number) => {
                const isRisk = item.alert_type === 'warning' || item.alert_type === 'critical' || item.severity === 'high';
                const isOpportunity = item.alert_type === 'opportunity';
                const accentColor = isRisk ? 'var(--ds-amber)' : isOpportunity ? 'var(--ds-green)' : 'var(--ds-cyan)';
                const title = item.title || item.title_es || item.title_en || 'Sin título';
                const source = item.source_name || item.source || 'GDELT';
                const url = item.source_url || item.url || null;
                const dateTs = item.published_at || item.publish_date;
                const dateStr = dateTs ? new Date(dateTs * 1000).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '';

                return (
                  <div key={i}
                    className="p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                    style={{ background: 'var(--ds-bg-raised)', borderLeft: `2px solid ${accentColor}` }}
                    onClick={() => url && window.open(url, '_blank')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: accentColor }}>
                        {source.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)' }}>{dateStr}</span>
                        {url && <ExternalLink className="w-2.5 h-2.5" style={{ color: 'var(--ds-text-muted)' }} />}
                      </div>
                    </div>
                    <h4 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--ds-text-primary)', lineHeight: 1.4 }}>
                      {title}
                    </h4>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 9, color: 'var(--ds-text-muted)', fontFamily: 'var(--ds-font-data)', textAlign: 'center' }}>
              Fuente: GDELT Project · WTO · USDA FAS · GACC China
            </p>
          </div>
        )}

        {/* ── AI BOT PANEL ── */}
        {activePanel === "bot" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300" style={{ minHeight: '400px' }}>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <Bot className="w-4 h-4" style={{ color: 'var(--ds-cyan)' }} />
              <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                Asistente Che.Comex
              </h3>
              <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(0,212,240,0.1)', color: 'var(--ds-cyan)', border: '1px solid rgba(0,212,240,0.2)', fontFamily: 'var(--ds-font-data)', letterSpacing: '0.05em' }}>
                GROQ AI
              </span>
            </div>
            <AiBotPanel deal={deal} />
          </div>
        )}
      </div>
    </div>
  );
}
