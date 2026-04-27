import { useState, useRef, useEffect } from 'react';
import { Bot, X, Eye, Send, FileText, DollarSign, Ship, Sparkles } from 'lucide-react';
import { useGodMode } from '@/context/godmode-context';

export default function GodModeAI() {
  const { state } = useGodMode();
  
  // Backwards compatibility for the UI mapping
  const context = {
    product: state.viewingProduct,
    country: state.viewingCountry,
    operation: state.operationType
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'ai' | 'user', content: React.ReactNode}>>([
    {
      role: 'ai',
      content: (
        <>
          Hola. Estoy viendo que analizás <strong>{context?.product || 'este producto'}</strong> hacia <strong>{context?.country || 'este destino'}</strong>. ¿Querés que evaluemos juntos si conviene entrar por <span className="text-green-400 font-data text-[10px] font-bold">MERCOSUR (0%)</span> o esperar el acuerdo con la UE para posicionarte en Europa?
        </>
      )
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMsg = async (text: string = inputValue) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: text } as const];
    setMessages(newMessages);
    setInputValue('');
    setShowSuggestions(false);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : 'Consulta' })),
          context: {
             hsCode: state.viewingHsCode,
             productName: state.viewingProduct,
             targetCountry: state.viewingCountry,
             originCountry: 'Argentina', // Hardcoded base origin for now
             page: state.currentPage
          }
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.content || 'Disculpas, no pude procesar tu solicitud.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error with GodMode AI.' }]);
    }
  };

  // Watch for proactive triggers from the global context engine
  useEffect(() => {
    if (state.proactiveTrigger) {
      setIsOpen(true);
      // Only process if it's the latest message (avoid duplicate injects on re-render)
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (typeof lastMsg.content === 'string' && lastMsg.content === state.proactiveTrigger!.message) return prev;
        return [...prev, { role: 'ai', content: state.proactiveTrigger!.message }];
      });
    }
  }, [state.proactiveTrigger]);

  return (
    <>
      {/* ═══ AI ASSISTANT — FLOATING GOD MODE ═══ */}
      <div className="fixed bottom-6 right-6 z-[500]">
        {!isOpen && (
           <div className="absolute -inset-1.5 rounded-full border border-cyan-400/20 animate-[ping_3s_ease-in-out_infinite] opacity-40"></div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#007899] to-[#2878e8] border border-[#00a8c8] flex items-center justify-center text-white shadow-[0_0_24px_rgba(0,212,240,0.3),_0_0_60px_rgba(0,212,240,0.1)] transition-all duration-300 hover:shadow-[0_0_36px_rgba(0,212,240,0.5),_0_0_80px_rgba(0,212,240,0.2)] hover:scale-110
            ${isOpen ? 'scale-110 shadow-[0_0_36px_rgba(0,212,240,0.5),_0_0_80px_rgba(0,212,240,0.2)]' : 'animate-[pulse_3s_ease-in-out_infinite]'}
          `}
          title="Che.Comex IA"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </button>
      </div>

      <div className={`fixed bottom-[88px] right-6 w-[380px] bg-[#03080f] border border-[#203548] rounded-[6px_6px_0_0] shadow-[0_-8px_60px_rgba(0,212,240,0.08),_0_0_0_1px_var(--ds-border-default)] flex flex-col z-[499] transition-all duration-300 origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="p-[12px_14px_10px] bg-[var(--ds-bg-overlay)] border-b border-[var(--ds-border-default)] flex items-start gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007899] to-[#2878e8] border border-[#00a8c8] flex items-center justify-center text-white shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-cond text-[15px] font-bold text-[#f0f8ff] tracking-[0.3px] flex items-center gap-1">Che.Comex AI <Sparkles size={12} className="text-gold" /></div>
            <div className="font-data text-[9px] text-[#2a4a68] flex items-center gap-[5px] mt-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ds-green)] animate-[pulse_2s_ease-in-out_infinite]"></div>
              Online · GodMode
            </div>
            {context && context.product && (
              <div className="bg-[var(--ds-cyan)10] border border-[var(--ds-cyan)20] rounded-[3px] p-[6px_10px] mt-2 text-[11px] text-[#00a8c8] flex items-start gap-[7px] leading-relaxed">
                <Eye className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                <span>Veo que estás analizando <strong>{context.product}</strong> para {context.operation === 'import' ? 'importar de' : 'exportar a'} <strong>{context.country || 'un mercado'}</strong>. Puedo guiarte.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-[12px_14px] flex flex-col gap-2.5 max-h-[260px] min-h-[120px] scrollbar-thin scrollbar-thumb-[#203548] scrollbar-track-[var(--ds-bg-overlay)]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-[26px] h-[26px] rounded-full bg-[#111f2e] border border-[#203548] flex items-center justify-center text-[11px] shrink-0 mt-0.5 text-white/70">
                {msg.role === 'user' ? '👤' : <Bot className="w-3 h-3 text-cyan-400" />}
              </div>
              <div className={`max-w-[80%] p-[8px_11px] text-[11px] leading-[1.55] text-[#8aafcc] 
                ${msg.role === 'user' 
                  ? 'bg-[var(--ds-cyan)12] border border-[var(--ds-cyan)25] text-[#c8dff0] rounded-[4px_0_4px_4px]' 
                  : 'bg-[var(--ds-bg-raised)] border border-[var(--ds-border-default)] rounded-[0_4px_4px_4px]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && (
          <div className="px-[14px] pb-[10px] flex flex-col gap-[5px]">
            <button onClick={() => sendMsg('¿Qué documentos necesito para exportar a Brasil?')} className="text-[10px] text-[#4a7090] bg-[var(--ds-bg-raised)] border border-[var(--ds-border-default)] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[var(--ds-cyan)] hover:bg-[var(--ds-cyan)10]">
              <FileText className="w-3 h-3 shrink-0" /> ¿Qué documentos necesito para este destino?
            </button>
            <button onClick={() => sendMsg('¿Cuánto me cuesta el despacho + retención?')} className="text-[10px] text-[#4a7090] bg-[var(--ds-bg-raised)] border border-[var(--ds-border-default)] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[var(--ds-cyan)] hover:bg-[var(--ds-cyan)10]">
              <DollarSign className="w-3 h-3 shrink-0" /> ¿Cuánto me cuesta despacho y retenciones?
            </button>
            <button onClick={() => sendMsg('¿Qué Incoterm conviene para este destino?')} className="text-[10px] text-[#4a7090] bg-[var(--ds-bg-raised)] border border-[var(--ds-border-default)] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[var(--ds-cyan)] hover:bg-[var(--ds-cyan)10]">
              <Ship className="w-3 h-3 shrink-0" /> ¿Qué Incoterm conviene para esta ruta?
            </button>
          </div>
        )}

        <div className="p-[8px_10px] border-t border-[var(--ds-border-default)] flex gap-2 items-center bg-[#03080f] shrink-0">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Preguntá sobre aranceles, logística..."
            className="flex-1 bg-[var(--ds-bg-raised)] border border-[#203548] rounded-[2px] p-[8px_11px] font-body text-[11px] text-[#c8dff0] outline-none transition-colors duration-150 placeholder:text-[#2a4a68] focus:border-[#00a8c8]"
          />
          <button 
            onClick={() => sendMsg()}
            className="w-8 h-8 bg-[var(--ds-cyan)] hover:bg-[#00a8c8] text-[#03080f] border-none flex items-center justify-center cursor-pointer shrink-0 rounded-[2px] transition-colors duration-150"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}
