import { useState, useRef, useEffect } from 'react';
import { Bot, X, Eye, Send, FileText, DollarSign, Ship } from 'lucide-react';

interface GodModeAIProps {
  context?: {
    product?: string;
    hsCode?: string;
    country?: string;
    operation?: string;
  };
}

export default function GodModeAI({ context }: GodModeAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'ai' | 'user', content: React.ReactNode}>>([
    {
      role: 'ai',
      content: (
        <>
          Hola. Estoy viendo que analizás <strong>{context?.product || 'este producto'}</strong> hacia <strong>{context?.country || 'este destino'}</strong>. ¿Querés que evaluemos juntos si conviene entrar por <span className="text-green-400 font-mono text-[10px] font-bold">MERCOSUR (0%)</span> o esperar el acuerdo con la UE para posicionarte en Europa?
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

  const sendMsg = (text: string = inputValue) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setShowSuggestions(false);

    // Simulated AI response
    setTimeout(() => {
      let reply: React.ReactNode = `Entendido. Analizando tu consulta en el contexto de ${context?.product || 'tu producto'}... Revisá también el Trade Calculator para los números precisos.`;
      
      if (text.toLowerCase().includes('documentos')) {
        reply = <>Para exportar {context?.product?.toLowerCase() || 'este producto'} vas a necesitar: <strong>Permiso de Embarque</strong>, Certificado Fitosanitario SENASA, Certificado de Origen MERCOSUR, Factura Comercial y Bill of Lading. La gestión tarda entre 3-5 días hábiles. ¿Querés que genere el checklist completo?</>;
      } else if (text.toLowerCase().includes('costa') || text.toLowerCase().includes('retención')) {
        reply = <>Para {context?.product?.toLowerCase() || 'este producto'}, la <span className="text-green-400 font-mono text-[10px] font-bold">retención es 12% sobre FOB</span>. El despacho de aduana cuesta ~USD 350 y el certificado de origen ~USD 80. ¿Abrimos el Trade Calculator para verlo completo?</>;
      } else if (text.toLowerCase().includes('incoterm')) {
        reply = <>Para {context?.country || 'este destino'} vía marítimo te recomiendo <strong>FOB</strong> o <strong>CIF</strong>. FOB es el más usado en AR y te da control del precio; CIF es exigido en cartas de crédito. ¿Abrimos comparativa de los 11 Incoterms?</>;
      }

      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    }, 700);
  };

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

      <div className={`fixed bottom-[88px] right-6 w-[380px] bg-[#03080f] border border-[#203548] rounded-[6px_6px_0_0] shadow-[0_-8px_60px_rgba(0,212,240,0.08),_0_0_0_1px_#1a2e42] flex flex-col z-[499] transition-all duration-300 origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="p-[12px_14px_10px] bg-[#060d16] border-b border-[#1a2e42] flex items-start gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007899] to-[#2878e8] border border-[#00a8c8] flex items-center justify-center text-white shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-cond text-[15px] font-bold text-[#f0f8ff] tracking-[0.3px]">Che.Comex IA</div>
            <div className="font-mono text-[9px] text-[#2a4a68] flex items-center gap-[5px] mt-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e878] animate-[pulse_2s_ease-in-out_infinite]"></div>
              Online · Modo Asistente Global
            </div>
            {context && (
              <div className="bg-[#00d4f010] border border-[#00d4f020] rounded-[3px] p-[6px_10px] mt-2 text-[11px] text-[#00a8c8] flex items-start gap-[7px] leading-relaxed">
                <Eye className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                <span>Veo que estás analizando <strong>{context.product || 'un producto'}</strong> para {context.operation === 'import' ? 'importar de' : 'exportar a'} <strong>{context.country || 'un mercado'}</strong>. Puedo guiarte.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-[12px_14px] flex flex-col gap-2.5 max-h-[260px] min-h-[120px] scrollbar-thin scrollbar-thumb-[#203548] scrollbar-track-[#060d16]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-[26px] h-[26px] rounded-full bg-[#111f2e] border border-[#203548] flex items-center justify-center text-[11px] shrink-0 mt-0.5 text-white/70">
                {msg.role === 'user' ? '👤' : <Bot className="w-3 h-3 text-cyan-400" />}
              </div>
              <div className={`max-w-[80%] p-[8px_11px] text-[11px] leading-[1.55] text-[#8aafcc] 
                ${msg.role === 'user' 
                  ? 'bg-[#00d4f012] border border-[#00d4f025] text-[#c8dff0] rounded-[4px_0_4px_4px]' 
                  : 'bg-[#0d1a27] border border-[#1a2e42] rounded-[0_4px_4px_4px]'
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
            <button onClick={() => sendMsg('¿Qué documentos necesito para exportar a Brasil?')} className="text-[10px] text-[#4a7090] bg-[#0d1a27] border border-[#1a2e42] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[#00d4f0] hover:bg-[#00d4f010]">
              <FileText className="w-3 h-3 shrink-0" /> ¿Qué documentos necesito para este destino?
            </button>
            <button onClick={() => sendMsg('¿Cuánto me cuesta el despacho + retención?')} className="text-[10px] text-[#4a7090] bg-[#0d1a27] border border-[#1a2e42] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[#00d4f0] hover:bg-[#00d4f010]">
              <DollarSign className="w-3 h-3 shrink-0" /> ¿Cuánto me cuesta despacho y retenciones?
            </button>
            <button onClick={() => sendMsg('¿Qué Incoterm conviene para este destino?')} className="text-[10px] text-[#4a7090] bg-[#0d1a27] border border-[#1a2e42] p-[6px_10px] text-left transition-all duration-150 rounded-[2px] flex items-center gap-1.5 hover:border-[#00a8c8] hover:text-[#00d4f0] hover:bg-[#00d4f010]">
              <Ship className="w-3 h-3 shrink-0" /> ¿Qué Incoterm conviene para esta ruta?
            </button>
          </div>
        )}

        <div className="p-[8px_10px] border-t border-[#1a2e42] flex gap-2 items-center bg-[#03080f] shrink-0">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Preguntá sobre aranceles, logística..."
            className="flex-1 bg-[#0d1a27] border border-[#203548] rounded-[2px] p-[8px_11px] font-sans text-[11px] text-[#c8dff0] outline-none transition-colors duration-150 placeholder:text-[#2a4a68] focus:border-[#00a8c8]"
          />
          <button 
            onClick={() => sendMsg()}
            className="w-8 h-8 bg-[#00d4f0] hover:bg-[#00a8c8] text-[#03080f] border-none flex items-center justify-center cursor-pointer shrink-0 rounded-[2px] transition-colors duration-150"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}
