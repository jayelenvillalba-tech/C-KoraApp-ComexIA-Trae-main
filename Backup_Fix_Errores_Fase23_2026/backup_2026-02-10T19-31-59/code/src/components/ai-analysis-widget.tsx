import { useState, useRef, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { Bot, Send, Sparkles, User, X } from 'lucide-react';

interface AiAnalysisWidgetProps {
  hsCode: string;
  originCountry: string;
  targetCountry: string;
  productName?: string;
  className?: string;
  compact?: boolean;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export function AiAnalysisWidget({ 
  hsCode, 
  originCountry, 
  targetCountry, 
  productName,
  className = "",
  compact = false
}: AiAnalysisWidgetProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
      if (messages.length === 0) {
          setMessages([{
              role: 'assistant',
              content: language === 'es' 
                ? `Hola. Soy Che.Comex, tu asistente de inteligencia comercial. Estoy listo para analizar aranceles, logística y requisitos para ${productName || hsCode || 'tu producto'}.` 
                : `Hello. I am Che.Comex, your trade intelligence assistant. I am ready to analyze tariffs, logistics, and requirements for ${productName || hsCode || 'your product'}.`
          }]);
      }
  }, [hsCode, targetCountry, language]);

  // AI Chat Mutation
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }],
          context: { hsCode, originCountry, targetCountry, productName }
        })
      });
      if (!res.ok) throw new Error('Failed to get response');
      return res.json();
    },
    onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    },
    onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: language === 'es' ? 'Lo siento, tuve un error de conexión.' : 'Sorry, connection error.' }]);
    }
  });

  const handleSend = () => {
      if (!inputValue.trim()) return;
      
      const msg = inputValue;
      setInputValue("");
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
      chatMutation.mutate(msg);
  };

  return (
    <div className={`flex flex-col bg-[#0f172a]/95 backdrop-blur border border-cyan-500/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] ${className} ${compact ? 'h-[350px]' : 'h-[500px]'}`}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-400/50">
                    <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Che.Comex AI</h3>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-cyan-200">Online</span>
                    </div>
                </div>
            </div>
            {/* Optional actions */}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-cyan-400/50 hover:text-cyan-400">
                <Sparkles className="w-4 h-4" />
            </Button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                        ? 'bg-cyan-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-gray-100 border border-slate-700 rounded-bl-none'
                }`}>
                    {msg.content}
                </div>
            </div>
        ))}
        {chatMutation.isPending && (
            <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 rounded-bl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900/50 border-t border-cyan-500/20">
        <div className="flex gap-2">
            <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={language === 'es' ? "Pregunta sobre aranceles, logística..." : "Ask about tariffs, logistics..."}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50"
            />
            <Button 
                onClick={handleSend} 
                disabled={chatMutation.isPending || !inputValue.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
                <Send className="w-4 h-4" />
            </Button>
        </div>
      </div>

    </div>
  );
}
