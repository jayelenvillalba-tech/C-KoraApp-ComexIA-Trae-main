import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AIChatPanelProps {
  context: {
    product: string;
    hsCode: string;
    country: string;
    operation: string;
  };
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPanel({ context, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message based on context
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `¡Hola! Soy Che.Comex AI. Estoy listo para ayudarte a analizar aranceles, logística y requisitos para la ${
            context.operation === 'export' ? 'exportación' : 'importación'
          } de **${context.product || 'tu producto'}** (HS: ${context.hsCode || 'N/A'}) hacia/desde **${
            context.country || 'Argentina'
          }**. ¿En qué te puedo ayudar?`,
        },
      ]);
    }
  }, [context]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Error de conexión con la IA');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, tuve un error de conexión. Por favor intentá de nuevo más tarde.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-[400px] bg-[#0A1929] border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D2137] border-b border-cyan-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-500/30">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Che.Comex AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium tracking-wide">ONLINE (CLAUDE)</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-sm'
                  : 'bg-[#132d46] text-cyan-50 border border-cyan-900/50 rounded-bl-sm whitespace-pre-wrap'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col max-w-[85%] mr-auto">
            <div className="px-4 py-3 bg-[#132d46] text-cyan-50 border border-cyan-900/50 rounded-2xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0D2137] border-t border-cyan-900/50">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntá sobre aranceles, logística..."
            className="bg-[#0A1929] border-cyan-900/50 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500 h-10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
