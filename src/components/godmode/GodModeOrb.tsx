import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { useGodMode } from '@/context/godmode-context';
import { useTranslation } from 'react-i18next';

// ─── Keyframe animations — all colors via DS tokens ─────────────────────────
const ORB_CSS = `
  @keyframes orb-pulse-slow {
    0%,100% { box-shadow: 0 0 20px var(--ds-cyan-glow), 0 0 40px color-mix(in srgb, var(--ds-cyan) 6%, transparent); transform: scale(1); }
    50%      { box-shadow: 0 0 35px var(--ds-cyan-glow), 0 0 60px color-mix(in srgb, var(--ds-cyan) 12%, transparent); transform: scale(1.05); }
  }
  @keyframes orb-pulse-alert {
    0%,100% { box-shadow: 0 0 15px var(--ds-amber-glow), 0 0 35px var(--ds-red-glow); transform: scale(1); }
    50%      { box-shadow: 0 0 28px var(--ds-amber-glow), 0 0 55px var(--ds-red-glow); transform: scale(1.08); }
  }
  @keyframes orb-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes badge-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(10px) scaleY(.97); }
    to   { opacity: 1; transform: translateY(0) scaleY(1); }
  }
  @keyframes orb-thinking-pulse {
    0%,100% { box-shadow: 0 0 20px var(--ds-green-glow); transform: scale(1); }
    50%      { box-shadow: 0 0 35px var(--ds-green-glow); transform: scale(1.04); }
  }

  .orb-idle {
    background: radial-gradient(circle at 35% 35%, var(--ds-cyan) 0%, var(--ds-blue) 100%);
    animation: orb-pulse-slow 3s ease-in-out infinite;
  }
  .orb-thinking {
    background: radial-gradient(circle at 35% 35%, var(--ds-green) 0%, var(--ds-cyan) 100%);
    animation: orb-thinking-pulse 1.2s ease-in-out infinite;
  }
  .orb-alert {
    background: radial-gradient(circle at 35% 35%, var(--ds-amber) 0%, var(--ds-red) 100%);
    animation: orb-pulse-alert 1s ease-in-out infinite;
  }
  .orb-open {
    background: radial-gradient(circle at 35% 35%, var(--ds-cyan) 0%, var(--ds-blue) 100%);
    box-shadow: var(--ds-glow-cyan);
  }
  .orb-badge {
    position: absolute;
    top: -2px; right: -2px;
    width: 11px; height: 11px;
    border-radius: 50%;
    background: var(--ds-red);
    border: 2px solid var(--ds-bg-base);
    animation: badge-blink 1.5s step-end infinite;
    z-index: 2;
  }
  .orb-panel {
    animation: slide-up var(--ds-ease-fast) forwards;
    transform-origin: bottom right;
  }
  .orb-scrollbar::-webkit-scrollbar { width: 3px; }
  .orb-scrollbar::-webkit-scrollbar-thumb { background: var(--ds-border-strong); border-radius: 2px; }
`;

// ─── Thinking Spinner ─────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 'var(--ds-space-1)', alignItems: 'center', padding: 'var(--ds-space-2) var(--ds-space-3)' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--ds-cyan)',
          animation: `badge-blink 1.2s ease-in-out ${i * 0.4}s infinite`
        }} />
      ))}
    </div>
  );
}

// ─── Main Orb Component ──────────────────────────────────────────────────────
export default function GodModeOrb() {
  const { state, setOrbState } = useGodMode();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOpen = state.orbState === 'open';
  const isAlert = state.orbState === 'alert';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  useEffect(() => {
    if (isOpen && !initialized) {
      setInitialized(true);
      let welcomeMsg = '';

      if (state.proactiveMessage?.type === 'route_alert') {
        const pm = state.proactiveMessage;
        const pub = state.viewingPublication;
        welcomeMsg = t('godmode.autoMessage.routeAlert', {
          count: pm.alertCount ?? 1,
          product: pub?.product ?? 'este producto',
          origin: pub?.origin ?? '?',
          destination: pub?.destination ?? '?',
          alertTitle: pm.alertTitle ?? 'Alerta regulatoria',
          defaultValue: `Detecté ${pm.alertCount ?? 1} alerta regulatoria activa para ${pub?.product ?? 'este producto'} (${pub?.origin ?? '?'}→${pub?.destination ?? '?'}): "${pm.alertTitle ?? ''}". ¿Querés que analice el impacto en esta operación?`,
        });
      } else if (state.proactiveMessage?.type === 'score_block') {
        const pm = state.proactiveMessage;
        const pub = state.viewingPublication;
        welcomeMsg = t('godmode.autoMessage.scoreBlock', {
          product: pub?.product ?? 'esta oferta',
          compatibility: pm.compatibility ?? 0,
          firstMissingDoc: pm.missingDocs?.[0]?.name ?? 'un documento',
          defaultValue: `Tu compatibilidad con esta oferta es del ${pm.compatibility ?? 0}%. El primer documento que necesitás es el ${pm.missingDocs?.[0]?.name ?? 'un documento'}. ¿Querés que te explique cómo obtenerlo paso a paso?`,
        });
      } else {
        if (state.viewingPublication) {
          welcomeMsg = `Veo que estás analizando **${state.viewingPublication.product}** hacia **${state.viewingPublication.destination}**. ¿Querés que evalúe aranceles, documentos requeridos o costos logísticos?`;
        } else {
          welcomeMsg = `Hola. Soy el asistente de comercio exterior de Che.Comex. ¿En qué te puedo ayudar hoy?`;
        }
      }

      setMessages([{ role: 'ai', content: welcomeMsg }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setInitialized(false);
  }, [isOpen]);

  const toggleOpen = () => {
    setOrbState(isOpen ? 'idle' : 'open');
  };

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isAiLoading) return;
    const userMsg = { role: 'user' as const, content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsAiLoading(true);
    setOrbState('thinking' as any);
    setTimeout(() => setOrbState('open'), 1500);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
          context: {
            hsCode: state.viewingHsCode,
            productName: state.viewingProduct,
            targetCountry: state.viewingCountry,
            originCountry: 'Argentina',
            page: state.currentPage,
          }
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.content || data.message || 'No pude procesar tu consulta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error de conexión. Verificá que el servidor esté corriendo.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickActions = [
    '¿Qué documentos necesito para esta operación?',
    '¿Cuánto me cuesta el despacho + retención?',
    '¿Qué Incoterm conviene para esta ruta?',
  ];

  const tooltipLabel = isAlert
    ? t('godmode.orbTooltip.alert', { defaultValue: 'Tengo información importante sobre esta operación' })
    : t('godmode.orbTooltip.idle', { defaultValue: 'Asistente de comercio exterior' });

  return (
    <>
      <style>{ORB_CSS}</style>

      {/* ── Floating Orb Button ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 'var(--ds-space-6)', right: 'var(--ds-space-6)', zIndex: 500 }}>
        {/* Ping ring — only when not open */}
        {!isOpen && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: `1px solid color-mix(in srgb, ${isAlert ? 'var(--ds-amber)' : 'var(--ds-cyan)'} 30%, transparent)`,
            animation: 'orb-pulse-slow 3s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}

        {/* Alert badge */}
        {isAlert && !isOpen && <div className="orb-badge" />}

        <button
          onClick={toggleOpen}
          title={tooltipLabel}
          className={`orb-${isOpen ? 'open' : state.orbState}`}
          style={{
            position: 'relative',
            width: 52, height: 52, borderRadius: '50%',
            border: `1px solid color-mix(in srgb, ${isAlert ? 'var(--ds-amber)' : 'var(--ds-cyan)'} 50%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
            transition: `transform var(--ds-ease-spring)`,
            outline: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {state.orbState === 'thinking' ? (
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid #fff', borderTopColor: 'transparent',
              animation: 'orb-spin .6s linear infinite'
            }} />
          ) : isOpen ? (
            <X size={20} />
          ) : isAlert ? (
            <AlertTriangle size={20} />
          ) : (
            <Bot size={20} />
          )}
        </button>
      </div>

      {/* ── Chat Panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="orb-panel"
          style={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 499,
            width: 380, maxHeight: 520,
            background: 'var(--ds-bg-surface)',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-lg) var(--ds-radius-lg) 0 0',
            boxShadow: 'var(--ds-shadow-modal)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: 'var(--ds-space-3) var(--ds-space-4)',
            background: 'var(--ds-bg-raised)',
            borderBottom: '1px solid var(--ds-border-default)',
            display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'radial-gradient(circle, var(--ds-cyan) 0%, var(--ds-blue) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: 'var(--ds-glow-cyan)',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--ds-font-display)',
                fontWeight: 700,
                fontSize: 'var(--ds-text-md)',
                color: 'var(--ds-text-primary)',
                letterSpacing: 0.3,
              }}>
                Che.Comex AI
              </div>
              <div style={{
                fontFamily: 'var(--ds-font-data)',
                fontSize: 'var(--ds-text-xs)',
                color: 'var(--ds-text-tertiary)',
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 2,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--ds-green)',
                  animation: 'badge-blink 2s ease-in-out infinite',
                }} />
                Online · GodMode
                {state.viewingProduct && <span>· {state.viewingProduct.slice(0, 20)}…</span>}
              </div>
            </div>
            {isAlert && (
              <div style={{
                padding: '2px 8px',
                background: 'var(--ds-amber-dim)',
                border: '1px solid color-mix(in srgb, var(--ds-amber) 60%, transparent)',
                borderRadius: 'var(--ds-radius-sm)',
                fontSize: 'var(--ds-text-xs)',
                fontFamily: 'var(--ds-font-data)',
                color: 'var(--ds-amber)',
                fontWeight: 700,
              }}>
                ⚠ ALERTA
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="orb-scrollbar" style={{
            flex: 1, overflowY: 'auto',
            padding: 'var(--ds-space-3) var(--ds-space-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--ds-space-2)', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: msg.role === 'user' ? 'var(--ds-cyan-dim)' : 'var(--ds-bg-overlay)',
                  border: `1px solid ${msg.role === 'user' ? 'color-mix(in srgb, var(--ds-cyan) 40%, transparent)' : 'var(--ds-border-default)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, flexShrink: 0,
                }}>
                  {msg.role === 'user' ? '👤' : '✦'}
                </div>
                <div style={{
                  maxWidth: '80%', padding: 'var(--ds-space-2) var(--ds-space-3)',
                  fontSize: 'var(--ds-text-sm)', lineHeight: 1.55,
                  fontFamily: 'var(--ds-font-body)',
                  background: msg.role === 'user' ? 'var(--ds-cyan-dim)' : 'var(--ds-bg-overlay)',
                  border: `1px solid ${msg.role === 'user' ? 'color-mix(in srgb, var(--ds-cyan) 25%, transparent)' : 'var(--ds-border-default)'}`,
                  borderRadius: msg.role === 'user' ? 'var(--ds-radius-md) 0 var(--ds-radius-md) var(--ds-radius-md)' : '0 var(--ds-radius-md) var(--ds-radius-md) var(--ds-radius-md)',
                  color: msg.role === 'user' ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div style={{ display: 'flex', gap: 'var(--ds-space-2)', alignItems: 'center' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--ds-bg-overlay)',
                  border: '1px solid var(--ds-border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, flexShrink: 0,
                }}>✦</div>
                <ThinkingDots />
              </div>
            )}
            {messages.length === 1 && !isAiLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-1)' }}>
                {quickActions.map(qa => (
                  <button
                    key={qa}
                    onClick={() => sendMessage(qa)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--ds-border-default)',
                      borderRadius: 'var(--ds-radius-sm)',
                      padding: 'var(--ds-space-2) var(--ds-space-3)',
                      color: 'var(--ds-text-tertiary)',
                      fontSize: 'var(--ds-text-xs)',
                      fontFamily: 'var(--ds-font-data)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `all var(--ds-ease-fast)`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = 'color-mix(in srgb, var(--ds-cyan) 60%, transparent)';
                      el.style.color = 'var(--ds-cyan)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = 'var(--ds-border-default)';
                      el.style.color = 'var(--ds-text-tertiary)';
                    }}
                  >
                    {qa}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: 'var(--ds-space-2) var(--ds-space-3)',
            borderTop: '1px solid var(--ds-border-default)',
            display: 'flex', gap: 'var(--ds-space-2)', alignItems: 'center',
            background: 'var(--ds-bg-surface)', flexShrink: 0,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Preguntá sobre aranceles, docs, logística..."
              style={{
                flex: 1,
                background: 'var(--ds-bg-input)',
                border: '1px solid var(--ds-border-default)',
                borderRadius: 'var(--ds-radius-sm)',
                padding: 'var(--ds-space-2) var(--ds-space-3)',
                fontSize: 'var(--ds-text-sm)',
                fontFamily: 'var(--ds-font-body)',
                color: 'var(--ds-text-primary)',
                outline: 'none',
                transition: `border-color var(--ds-ease-fast)`,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--ds-border-focus)')}
              onBlur={e => (e.target.style.borderColor = 'var(--ds-border-default)')}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isAiLoading}
              style={{
                width: 32, height: 32,
                borderRadius: 'var(--ds-radius-sm)',
                background: 'var(--ds-cyan)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                opacity: isAiLoading ? 0.5 : 1,
                transition: `opacity var(--ds-ease-fast)`,
              }}
            >
              <Send size={13} color="var(--ds-bg-base)" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
