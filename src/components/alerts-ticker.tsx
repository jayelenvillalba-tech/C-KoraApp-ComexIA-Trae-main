import { useState, useEffect } from "react";

const COMMODITY_FALLBACK = [
  { label: 'SOJA (CBE)',       value: '412.80',   change: '-1.5%',  up: false },
  { label: 'MAÍZ (CBE)',       value: '198.20',   change: '+0.8%',  up: true  },
  { label: 'TRIGO (CBE)',      value: '284.50',   change: '+4.2%',  up: true  },
  { label: 'ACEITE SOJA',      value: '1,042',    change: '+2.1%',  up: true  },
  { label: 'GIRASOL',         value: '398.60',   change: '-0.3%',  up: false },
];

interface TickerItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
  color: string;
}

export function AlertsTicker() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString('es-AR'));
  const [items, setItems] = useState<TickerItem[]>([
    ...COMMODITY_FALLBACK.map(c => ({ ...c, color: c.up ? 'text-[var(--ds-green)]' : 'text-[var(--ds-red)]' })),
    { label: 'USD/ARS OFICIAL', value: '...', change: '',     up: true,  color: 'text-[var(--ds-amber)]' },
    { label: 'USD/ARS CCL',     value: '...', change: '',     up: true,  color: 'text-[var(--ds-amber)]' },
    { label: 'USD/BRL',         value: '...',  change: '',    up: true,  color: 'text-[var(--ds-cyan)]'  },
    { label: 'EUR/USD',         value: '...',  change: '',    up: true,  color: 'text-[var(--ds-cyan)]'  },
  ]);

  const fetchRates = async () => {
    try {
      // DolarAPI — tipo de cambio Argentina
      const [ar, rates] = await Promise.all([
        fetch('/api/exchange/argentina').then(r => r.json()).catch(() => null),
        fetch('/api/exchange/rates').then(r => r.json()).catch(() => null),
      ]);

      setItems(prev => prev.map(item => {
        if (item.label === 'USD/ARS OFICIAL' && ar?.oficial) {
          return { ...item, value: `$${ar.oficial.venta?.toLocaleString('es-AR') ?? '—'}` };
        }
        if (item.label === 'USD/ARS CCL' && ar?.ccl) {
          return { ...item, value: `$${ar.ccl.venta?.toLocaleString('es-AR') ?? '—'}` };
        }
        if (item.label === 'USD/BRL' && rates?.rates?.BRL) {
          return { ...item, value: rates.rates.BRL.toFixed(4) };
        }
        if (item.label === 'EUR/USD' && rates?.rates?.EUR) {
          return { ...item, value: (1 / rates.rates.EUR).toFixed(4) };
        }
        return item;
      }));
    } catch {
      // Silently keep fallback values
    }
  };

  useEffect(() => {
    fetchRates();
    const rateTimer  = setInterval(fetchRates, 5 * 60 * 1000); // every 5 min
    const clockTimer = setInterval(() => setTimestamp(new Date().toLocaleTimeString('es-AR')), 60000);
    return () => { clearInterval(rateTimer); clearInterval(clockTimer); };
  }, []);

  return (
    <div
      className="ticker-bar bg-[var(--ds-bg-void)] border-b border-[var(--ds-border-subtle)] flex items-center overflow-hidden"
    >
      {/* LIVE badge */}
      <div className="flex items-center gap-2 shrink-0 z-10 bg-[var(--ds-bg-void)] h-full px-4 border-r border-[var(--ds-border-subtle)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-cyan)] animate-pulse shadow-[var(--ds-glow-cyan)]" />
        <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-cyan)] tracking-[var(--ds-tracking-label)] uppercase">
          LIVE
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex flex-1 overflow-hidden relative h-full items-center">
        <div className="flex whitespace-nowrap items-center animate-ticker min-w-full" style={{ fontFamily: 'var(--ds-font-data)' }}>
          {[...items, ...items, ...items].map((item, idx) => (
            <div key={idx} className="flex items-center h-full px-5 border-r border-[var(--ds-border-subtle)]">
              <span className="text-[10px] text-[var(--ds-text-muted)] tracking-widest mr-2 uppercase">
                {item.label}
              </span>
              <span className="text-[10px] text-[var(--ds-text-primary)] mr-1.5 font-medium">
                {item.value}
              </span>
              {item.change && (
                <span className={`text-[10px] ${item.color}`}>
                  {item.change}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clock */}
      <div className="flex items-center shrink-0 z-10 bg-[var(--ds-bg-void)] h-full px-4 border-l border-[var(--ds-border-subtle)]">
        <span className="text-[10px] text-[var(--ds-text-muted)] font-data tracking-widest">
          {timestamp}
        </span>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        .animate-ticker { animation: ticker 50s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
