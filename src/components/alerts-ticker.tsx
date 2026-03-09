import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export function AlertsTicker() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const marketData = [
    { label: "TRIGO (CBE)", value: "284.50", change: "+4.2%", trend: "up", color: "text-[#00e878]" },
    { label: "SOJA (CBE)", value: "412.80", change: "-1.5%", trend: "down", color: "text-[#ff4040]" },
    { label: "MAÍZ (CBE)", value: "198.20", change: "+0.8%", trend: "up", color: "text-[#00e878]" },
    { label: "USD/ARS (OFICIAL)", value: "1025.50", change: "+0.1%", trend: "up", color: "text-[#f5a800]" },
    { label: "USD/ARS (CCL)", value: "1240.00", change: "-0.5%", trend: "down", color: "text-[#f5a800]" },
  ];

  return (
    <div className="bg-[#03080f] border-b border-[#1a2e42] h-[32px] flex items-center px-4 overflow-hidden relative z-40">
      <div className="flex items-center gap-2 mr-6 shrink-0 z-10 bg-[#03080f] h-full pr-4 border-r border-[#1a2e42] shadow-[10px_0_10px_-5px_rgba(3,8,15,1)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e878] animate-pulse"></span>
        <span className="font-mono text-[9px] font-bold text-[#c8dff0] tracking-[1px] uppercase">
          Mercados en Vivo
        </span>
      </div>
      
      {/* Ticker Animation Container */}
      <div className="flex flex-1 overflow-hidden relative h-full items-center">
        {/* We duplicate the content to create an infinite scroll effect */}
        <div className="flex whitespace-nowrap animate-ticker items-center min-w-full">
          {[...marketData, ...marketData, ...marketData].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 mx-6">
              <span className="font-mono text-[10px] text-[#4a7090] font-bold tracking-[0.5px]">
                {item.label}
              </span>
              <span className="font-mono text-[11px] font-bold text-white">
                {item.value}
              </span>
              <span className={`font-mono text-[9px] font-bold flex items-center ${item.color}`}>
                {item.trend === 'up' ? '▲' : '▼'} {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0 z-10 bg-[#03080f] h-full pl-4 border-l border-[#1a2e42] shadow-[-10px_0_10px_-5px_rgba(3,8,15,1)]">
        <RefreshCw className="w-3 h-3 text-[#4a7090]" />
        <span className="font-mono text-[9px] text-[#4a7090]">
          {timestamp}
        </span>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
