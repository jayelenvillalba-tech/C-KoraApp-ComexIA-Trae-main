import React, { createContext, useContext, useState, useCallback } from 'react';

export type OperationType = 'import' | 'export' | 'all' | '';

export interface TradeContextState {
  originCountry: string;
  operationType: OperationType;
  hsCode: string;
  productName: string;
}

interface TradeContextValue extends TradeContextState {
  setTradeContext: (updates: Partial<TradeContextState>) => void;
  /** Call this once when a page mounts to hydrate context from URL search params */
  syncFromUrl: (search: string) => void;
}

const defaultState: TradeContextState = {
  originCountry: '',
  operationType: '',
  hsCode: '',
  productName: '',
};

const TradeContext = createContext<TradeContextValue | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TradeContextState>(defaultState);

  const setTradeContext = useCallback((updates: Partial<TradeContextState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };

      // Keep URL in sync (only on /analysis – the deep-link page)
      if (window.location.pathname.startsWith('/analysis')) {
        const p = new URLSearchParams(window.location.search);
        if (next.originCountry) p.set('country', next.originCountry);
        if (next.operationType) p.set('operation', next.operationType);
        if (next.hsCode)        p.set('code', next.hsCode);
        if (next.productName)   p.set('productName', encodeURIComponent(next.productName));
        const newUrl = `${window.location.pathname}?${p.toString()}`;
        if (newUrl !== window.location.pathname + window.location.search) {
          window.history.replaceState(null, '', newUrl);
        }
      }

      return next;
    });
  }, []);

  const syncFromUrl = useCallback((search: string) => {
    const p = new URLSearchParams(search);
    const updates: Partial<TradeContextState> = {};
    const country   = p.get('country');
    const operation = p.get('operation') as OperationType;
    const code      = p.get('code');
    const name      = p.get('productName');

    if (country)   updates.originCountry  = country;
    if (operation) updates.operationType  = operation;
    if (code)      updates.hsCode         = code;
    if (name)      updates.productName    = decodeURIComponent(name);

    if (Object.keys(updates).length > 0) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Listen for user login event to pre-fill originCountry from saved profile
  // URL params always take priority — this only fills empty state
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { originCountry?: string };
      if (detail?.originCountry) {
        setState(prev => ({
          ...prev,
          // Only hydrate if no URL or manual selection has set it yet
          originCountry: prev.originCountry || detail.originCountry!,
        }));
      }
    };
    window.addEventListener('user-profile-loaded', handler);
    return () => window.removeEventListener('user-profile-loaded', handler);
  }, []);

  return (
    <TradeContext.Provider value={{ ...state, setTradeContext, syncFromUrl }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrade must be used within a <TradeProvider>');
  return ctx;
}
