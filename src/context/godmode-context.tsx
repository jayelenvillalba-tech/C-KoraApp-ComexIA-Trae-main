import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

// ─── Types ────────────────────────────────────────────────────────────────────
export type OrbState = 'idle' | 'thinking' | 'alert' | 'open';

export interface ViewingPublication {
  id: string;
  product: string;
  hsCode: string;
  origin: string;
  destination: string;
  userId?: string;
  incoterm?: string;
  qty?: number;
  unit?: string;
  price?: number;
}

export interface ProactiveMessage {
  type: 'route_alert' | 'score_block';
  // route_alert fields
  alertCount?: number;
  alertTitle?: string;
  contextData?: any;
  // score_block fields
  missingDocs?: { name: string }[];
  compatibility?: number;
}

export interface GodModeContextState {
  currentPage: string;
  language: string;
  orbState: OrbState;
  viewingPublication?: ViewingPublication | null;
  proactiveMessage?: ProactiveMessage | null;
  // legacy compat
  viewingProduct?: string;
  viewingHsCode?: string;
  viewingCountry?: string;
  operationType?: 'import' | 'export';
  verificationScore?: number;
}

interface GodModeContextType {
  state: GodModeContextState;
  setContext: (updates: Partial<GodModeContextState>) => void;
  setOrbState: (orbState: OrbState) => void;
  openPublication: (pub: ViewingPublication, userDocsCompleted?: string[]) => void;
  closePublication: () => void;
}

const GodModeContext = createContext<GodModeContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GodModeProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const alertCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<GodModeContextState>({
    currentPage: location,
    language: localStorage.getItem('i18nextLng') || 'es',
    orbState: 'idle',
    viewingPublication: null,
    proactiveMessage: null,
  });

  // Track page changes & clear publication context on navigation
  useEffect(() => {
    setState(prev => ({ ...prev, currentPage: location }));
  }, [location]);

  // ── Trigger 1: Route Alert Check ──────────────────────────────────────────
  useEffect(() => {
    if (!state.viewingPublication) return;

    if (alertCheckRef.current) clearTimeout(alertCheckRef.current);

    // Debounce 800ms to avoid firing on every keystroke
    alertCheckRef.current = setTimeout(async () => {
      try {
        const { origin, hsCode, destination } = state.viewingPublication!;
        const res = await fetch(
          `/api/news/route-alerts?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&hsCode=${encodeURIComponent(hsCode)}`
        );
        const data = await res.json();
        const alerts = data.data || [];

        if (alerts.length > 0) {
          setState(prev => ({
            ...prev,
            orbState: prev.orbState === 'open' ? 'open' : 'alert',
            proactiveMessage: {
              type: 'route_alert',
              alertCount: alerts.length,
              alertTitle: alerts[0].title || alerts[0].title_en || '',
              contextData: alerts[0],
            },
          }));
        }
      } catch (err) {
        // Silent fail — don't interrupt the user
      }
    }, 800);

    return () => {
      if (alertCheckRef.current) clearTimeout(alertCheckRef.current);
    };
  }, [state.viewingPublication?.id]);

  // ── Trigger 2: Score Block Check ─────────────────────────────────────────
  const checkScoreBlock = (pub: ViewingPublication, userDocsCompleted: string[] = []) => {
    // Use onboarding requirements for a simple heuristic
    const minRequired = 3; // minimum docs needed to operate
    const userHas = userDocsCompleted.length;
    const pct = Math.min(userHas / minRequired, 1);

    if (pct < 0.4) {
      setState(prev => ({
        ...prev,
        orbState: prev.orbState === 'open' ? 'open' : 'alert',
        proactiveMessage: {
          type: 'score_block',
          compatibility: Math.round(pct * 100),
          missingDocs: [{ name: 'Registro AFIP (RIE)' }, { name: 'Certificado de Origen MERCOSUR' }],
        },
      }));
    }
  };

  // ── Public API ────────────────────────────────────────────────────────────
  const setContext = (updates: Partial<GodModeContextState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const setOrbState = (orbState: OrbState) => {
    setState(prev => ({ ...prev, orbState }));
  };

  const openPublication = (pub: ViewingPublication, userDocsCompleted?: string[]) => {
    setState(prev => ({
      ...prev,
      viewingPublication: pub,
      viewingProduct: pub.product,
      viewingHsCode: pub.hsCode,
      viewingCountry: pub.destination,
      operationType: 'export',
      proactiveMessage: null, // reset before new check
    }));
    if (userDocsCompleted) checkScoreBlock(pub, userDocsCompleted);
  };

  const closePublication = () => {
    setState(prev => ({
      ...prev,
      viewingPublication: null,
      proactiveMessage: null,
      orbState: 'idle',
    }));
  };

  return (
    <GodModeContext.Provider value={{ state, setContext, setOrbState, openPublication, closePublication }}>
      {children}
    </GodModeContext.Provider>
  );
}

export function useGodMode() {
  const context = useContext(GodModeContext);
  if (context === undefined) {
    throw new Error('useGodMode must be used within a GodModeProvider');
  }
  return context;
}
