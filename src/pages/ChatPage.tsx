
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useUser } from '@/context/user-context';
import Header from '@/components/header';
import ChatSidebar from '@/components/chat/chat-sidebar';
import { Send, Plus, ArrowLeft, Check, X, ShieldCheck, DollarSign } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CYBER-TRADE MERIDIAN — Deal Room (Split-View 60/40)
   Glassmorphism chat + Cost Intelligence Panel
═══════════════════════════════════════════════════════ */

const DS = {
  bg: 'var(--ds-bg-base)', 
  bg2: 'var(--ds-bg-input)', 
  bd: 'var(--ds-border-subtle)',
  cyan: 'var(--ds-cyan)', 
  green: 'var(--ds-green)', 
  amber: 'var(--ds-amber)', 
  red: 'var(--ds-red)'
};

const CSS = `
  .chat-app { background: ${DS.bg}; min-height: 100vh; display:flex; flex-direction:column; overflow: hidden; }
  .chat-panel { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 60px); }
  
  /* Layout: 240px Left | 60% Center | 40% Right */
  .chat-left { width: 260px; flex-shrink: 0; border-right: 1px solid ${DS.bd}; background: var(--ds-bg-base); overflow-y: auto; }
  .chat-center { flex: 0.6; display: flex; flex-direction: column; overflow: hidden; }
  .chat-right { flex: 0.4; min-width: 320px; overflow-y: auto; background: var(--ds-bg-base); }
  
  .deal-item { padding: 12px 16px; border-bottom: 1px solid ${DS.bd}; cursor: pointer; transition: all .2s; }
  .deal-item:hover { background: var(--ds-bg-raised); }
  .deal-item.active { background: rgba(0,212,240,.05); border-left: 3px solid ${DS.cyan}; }
  
  /* Message Aesthetics */
  .msg-bubble { padding: 12px 16px; border-radius: 12px; max-width: 75%; font-size: 13px; line-height: 1.5; font-family: var(--ds-font-body); }
  .msg-own { 
    background: rgba(0,212,240,0.08); backdrop-filter: blur(10px); 
    border: 1px solid rgba(0,212,240,0.15); align-self: flex-end; 
    color: var(--ds-text-primary); border-radius: 12px 0 12px 12px;
    box-shadow: 0 0 15px rgba(0,212,240,0.05); 
  }
  .msg-other { 
    background: var(--ds-bg-raised); align-self: flex-start; 
    color: var(--ds-text-secondary); border-radius: 0 12px 12px 12px;
    font-weight: 300; /* Inter 300 requirement */
    border: 1px solid var(--ds-border-subtle);
  }
  .msg-system { text-align: center; font-family: var(--ds-font-data); font-size: 10px; color: var(--ds-text-muted); padding: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
  
  /* Glass Modal */
  .glass-modal {
    background: rgba(10, 20, 29, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0,212,240,0.2);
    box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
  }

  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-thumb { background: var(--ds-border-subtle); border-radius: 4px; }
`;

interface ChatMessage {
  id: string; deal_id: string; sender_id: string; sender_name: string;
  sender_role?: string; content: string; message_type: string;
  metadata?: string; created_at: number;
}
interface Deal {
  id: string; product: string; hs_code: string; origin: string; destination: string;
  status: string; price_usd?: number; quantity?: number; unit?: string; incoterm?: string;
  vendor_id: string; initiator_id: string; created_at: number; last_message?: string;
  participants?: any[];
}
const FLAG: Record<string, string> = { AR: '🇦🇷', BR: '🇧🇷', CN: '🇨🇳', US: '🇺🇸', UY: '🇺🇾', CL: '🇨🇱' };

function PriceProposalCard({ meta, ownMessage, onAccept, onReject }: { meta: any; ownMessage: boolean; onAccept?: () => void; onReject?: () => void }) {
  return (
    <div className="rounded-xl p-4 mt-1" style={{ background: 'var(--ds-bg-raised)', border: `1px solid ${DS.green}40`, minWidth: '240px' }}>
      <div className="flex items-center gap-2 mb-2">
        <DollarSign size={14} color={DS.green} />
        <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: DS.green, fontWeight: 700, letterSpacing: '0.1em' }}>PROPUESTA DE PRECIO</span>
      </div>
      <p style={{ margin: '0 0 4px', fontFamily: 'var(--ds-font-display)', fontSize: 24, fontWeight: 900, color: 'var(--ds-text-primary)' }}>
        ${meta?.proposedPrice?.toLocaleString() || '—'} USD/{meta?.unit || 'tn'}
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--ds-text-secondary)', fontFamily: 'var(--ds-font-data)', letterSpacing: '0.05em' }}>INCOTERM: {meta?.incoterm || 'FOB'}</p>
      
      {!ownMessage && (
        <div className="flex gap-2">
          <button onClick={onAccept} className="flex-1 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-bold text-xs flex items-center justify-center gap-1">
            <Check size={12} /> Aceptar
          </button>
          <button onClick={onReject} className="flex-1 py-1.5 rounded text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all font-bold text-xs flex items-center justify-center gap-1">
            <X size={12} /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  useDocumentTitle('Chat Seguro B2B');
  const { user } = useUser();
  const params = useParams<{ id?: string }>();
  const activeDealId = params?.id || null;
  const [, navigate] = useLocation();

  const [myDeals, setMyDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastTs, setLastTs] = useState(0);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [incotermInput, setIncotermInput] = useState('FOB');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = (user as any)?.id || (user as any)?.userId || 'user-demo';
  const userName = (user as any)?.name || 'Usuario';
  const userRole = (user as any)?.role || 'exporter';
  const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/deals/user/${userId}`, { headers: authHeader })
      .then(r => r.json())
      .then(d => { if (d.success) setMyDeals(d.data); })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!activeDealId) return;
    fetch(`/api/deals/${activeDealId}`).then(r => r.json()).then(d => { if (d.success) setActiveDeal(d.data); }).catch(console.error);
    fetch(`/api/chat/messages/${activeDealId}?since=0`).then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) { setMessages(d.data); setLastTs(d.data[d.data.length - 1].created_at); }
    }).catch(console.error);
  }, [activeDealId]);

  useEffect(() => {
    if (!activeDealId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages/${activeDealId}?since=${lastTs}`);
        const d = await res.json();
        if (d.success && d.data.length > 0) {
          setMessages(prev => [...prev, ...d.data]); setLastTs(d.data[d.data.length - 1].created_at);
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(pollRef.current!);
  }, [activeDealId, lastTs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeDealId]);

  const sendMsg = useCallback(async (content: string, type: string = 'text', meta?: any) => {
    if (!content.trim() || !activeDealId || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: activeDealId, senderId: userId, senderName: userName,
          senderRole: userRole, content, messageType: type, metadata: meta || null
        })
      });
      const d = await res.json();
      if (d.success) {
        setMessages(prev => [...prev, d.data]); setLastTs(d.data.created_at); setInput('');
      }
    } catch (err) { console.error(err); } finally { setSending(false); }
  }, [activeDealId, userId, userName, userRole, sending]);

  const handleSendPriceProposal = () => {
    const price = parseFloat(priceInput);
    if (isNaN(price)) return;
    sendMsg(`Propuesta de precio: $${price.toLocaleString()} USD · ${incotermInput}`, 'price_proposal', { proposedPrice: price, incoterm: incotermInput, unit: activeDeal?.unit || 'tn' });
    setPriceInput(''); setShowPriceModal(false);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="chat-app">
        <Header />
        <div className="chat-panel">

          {/* ── 240px LEFT: Deal List ── */}
          <div className="chat-left">
            <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
              <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                MIS DEALS
              </span>
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-1 rounded bg-white/5 hover:bg-white/10 px-2 py-1 transition-colors"
                style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-secondary)', border: '1px solid var(--ds-border-subtle)' }}
              >
                <Plus size={10} /> NUEVO
              </button>
            </div>
            {myDeals.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--ds-text-muted)' }}>Sin deals activos.</div>
            ) : (
              myDeals.map(deal => (
                <div key={deal.id} className={`deal-item ${deal.id === activeDealId ? 'active' : ''}`} onClick={() => navigate(`/chat/${deal.id}`)}>
                  <p style={{ margin: 0, fontFamily: 'var(--ds-font-display)', fontSize: 14, fontWeight: 800, color: 'var(--ds-text-primary)' }} className="truncate">
                    {deal.product.toUpperCase()}
                  </p>
                  <p style={{ margin: '4px 0 0', fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-secondary)' }} className="truncate">
                    {FLAG[deal.origin] || ''} {deal.origin} → {FLAG[deal.destination] || ''} {deal.destination}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* ── 60% CENTER: Chat Area ── */}
          <div className="chat-center">
            {!activeDeal ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <span style={{ fontSize: 40, opacity: 0.2 }}>💬</span>
                <p style={{ fontFamily: 'var(--ds-font-data)', color: 'var(--ds-text-muted)', letterSpacing: '0.1em' }}>CENTRO DE NEGOCIACIÓN</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 flex items-center gap-4" style={{ borderBottom: '1px solid var(--ds-border-subtle)', background: 'var(--ds-bg-base)', flexShrink: 0 }}>
                  <button onClick={() => navigate('/chat')} className="text-gray-400 hover:text-white sm:hidden"><ArrowLeft size={16} /></button>
                  <div className="flex-1">
                    <h2 style={{ fontFamily: 'var(--ds-font-display)', fontSize: 18, fontWeight: 900, color: 'var(--ds-text-primary)', margin: 0 }}>
                      {activeDeal.product.toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-3 mt-1" style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-muted)', letterSpacing: '0.05em' }}>
                      <span>HS: {activeDeal.hs_code}</span>
                      <span>{FLAG[activeDeal.origin] || ''} {activeDeal.origin} → {FLAG[activeDeal.destination] || ''} {activeDeal.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === userId;
                    const meta = msg.metadata ? JSON.parse(msg.metadata) : null;
                    if (msg.message_type === 'system') return <div key={msg.id} className="msg-system">── {msg.content} ──</div>;

                    // Counterparty verified badge
                    const isVerified = !isOwn && (msg.sender_role === 'Seller - Global Trade Ltd.' || msg.sender_name.includes('Chen'));

                    return (
                      <div key={msg.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Sender Info Label */}
                          <div>
                            <div className={`flex items-center gap-1.5 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: 11, fontWeight: 700, color: isOwn ? 'var(--ds-cyan)' : 'var(--ds-text-secondary)' }}>
                                {msg.sender_name}
                              </span>
                              {isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--ds-green)', filter: 'drop-shadow(0 0 4px rgba(105,246,185,0.4))' }} />
                              )}
                              <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: 9, color: 'var(--ds-text-muted)' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {/* Message Body */}
                            {msg.message_type === 'price_proposal' && meta ? (
                              <PriceProposalCard meta={meta} ownMessage={isOwn} onAccept={() => {}} onReject={() => {}} />
                            ) : (
                              <div className={`msg-bubble ${isOwn ? 'msg-own' : 'msg-other'}`}>{msg.content}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--ds-border-subtle)', background: 'var(--ds-bg-base)' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg(input)}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 rounded-xl outline-none transition-all px-4 py-3"
                    style={{ 
                      background: 'var(--ds-bg-input)', 
                      border: '1px solid var(--ds-border-subtle)', 
                      color: 'var(--ds-text-primary)', 
                      fontFamily: 'var(--ds-font-body)', fontSize: 14 
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--ds-cyan)'; e.target.style.boxShadow = '0 0 20px rgba(0,212,240,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--ds-border-subtle)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={() => sendMsg(input)}
                    disabled={sending || !input.trim()}
                    className="w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center transition-all"
                    style={{ 
                      background: input.trim() ? 'var(--ds-cyan)' : 'var(--ds-border-subtle)', 
                      opacity: sending ? 0.7 : 1,
                      boxShadow: input.trim() ? '0 0 20px rgba(0,212,240,0.4)' : 'none'
                    }}
                  >
                    <Send size={18} color="var(--ds-bg-base)" style={{ marginLeft: input.trim() ? 2 : 0 }} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── 40% RIGHT: Intelligence Panel ── */}
          <div className="chat-right">
            {activeDeal && <ChatSidebar deal={activeDeal} onProposePrice={() => setShowPriceModal(true)} />}
          </div>
        </div>
      </div>

      {/* ── 100% Glassmorphism Price Proposal Modal ── */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPriceModal(false)} />
          <div className="relative glass-modal rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: 24, fontWeight: 900, color: 'var(--ds-text-primary)', marginBottom: 20 }}>
              Generar Propuesta
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-muted)', letterSpacing: '0.1em' }} className="block mb-1.5 uppercase">Precio Objetivo (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                  <input 
                    type="number"
                    value={priceInput} onChange={e => setPriceInput(e.target.value)} 
                    placeholder="Ej. 1200"
                    className="w-full pl-9 pr-4 py-3 rounded-lg outline-none transition-all"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,240,0.3)', color: '#fff', fontFamily: 'var(--ds-font-body)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--ds-cyan)'; e.target.style.boxShadow = '0 0 15px rgba(0,212,240,0.2)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,212,240,0.3)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ fontFamily: 'var(--ds-font-data)', fontSize: 10, color: 'var(--ds-text-muted)', letterSpacing: '0.1em' }} className="block mb-1.5 uppercase">Términos (Incoterm)</label>
                <select 
                  value={incotermInput} onChange={e => setIncotermInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg outline-none cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,240,0.3)', color: '#fff', fontFamily: 'var(--ds-font-body)' }}
                >
                  {['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(i => <option key={i} value={i} style={{ background: '#0a141d' }}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPriceModal(false)}
                className="flex-1 py-3 rounded-lg font-bold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ds-text-secondary)', border: '1px solid var(--ds-border-subtle)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSendPriceProposal}
                className="flex-1 py-3 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--ds-cyan) 0%, rgba(0,102,255,1) 100%)', color: 'var(--ds-bg-base)', boxShadow: '0 0 20px rgba(0,212,240,0.3)' }}
              >
                <Send size={16} /> Enviar Propuesta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
