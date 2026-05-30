import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    target: 'body',
    title: '👋 Bienvenido a Che.Comex',
    content: 'La plataforma integral para simplificar tus operaciones de comercio exterior en el Mercosur y el mundo. Vamos a hacer un recorrido rápido por las funciones clave.',
    placement: 'bottom',
  },
  {
    target: '.tour-step-search',
    title: '🔍 Buscador Inteligente HS Code',
    content: 'Clasificá tus productos en segundos usando IA. Encontrá tu código NCM/HS Code al instante y revisá los aranceles de tu destino.',
    placement: 'bottom',
  },
  {
    target: '.tour-step-calculator',
    title: '🚢 Landed Cost Real-Time',
    content: 'Cotizá fletes con SeaRates en tiempo real. Calculamos el costo aterrizado incluyendo seguro, aranceles y gastos de despacho.',
    placement: 'bottom',
  },
  {
    target: '.tour-step-godmode',
    title: '🤖 GodMode AI',
    content: 'Tu experto en comex disponible 24/7. Resuelve consultas complejas, recuerda tu historial y analiza normativa vigente de cada país.',
    placement: 'bottom',
  },
  {
    target: '.tour-step-marketplace',
    title: '🌐 Marketplace B2B Verificado',
    content: 'Conectá con compradores internacionales verificados por KYB. Todas las empresas pasan un filtro de reputación AFIP/ONU antes de aparecer aquí.',
    placement: 'bottom',
  },
];

function getElementRect(selector: string) {
  if (selector === 'body') return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export default function ProductTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Activate on ?demo=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      // Small delay so DOM is ready
      setTimeout(() => setActive(true), 1200);
    }
  }, []);

  // Recompute target rect on each step change
  useEffect(() => {
    if (!active) return;
    const update = () => setRect(getElementRect(STEPS[step].target));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active, step]);

  const close = useCallback(() => setActive(false), []);
  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else close();
  }, [step, close]);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  if (!active) return null;

  const current = STEPS[step];
  const isCenter = current.target === 'body' || !rect;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (isCenter) {
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 99999,
      maxWidth: 420,
      width: '90vw',
    };
  } else if (rect) {
    const GAP = 12;
    tooltipStyle = {
      position: 'fixed',
      top: rect.bottom + GAP,
      left: Math.min(rect.left, window.innerWidth - 440),
      zIndex: 99999,
      maxWidth: 420,
      width: '90vw',
    };
  }

  // Highlight ring around element
  const highlightStyle: React.CSSProperties | null = rect && !isCenter ? {
    position: 'fixed',
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
    borderRadius: 8,
    border: '2px solid rgba(0,212,240,0.9)',
    boxShadow: '0 0 0 4000px rgba(0,0,0,0.55), 0 0 20px rgba(0,212,240,0.4)',
    zIndex: 99998,
    pointerEvents: 'none',
  } : null;

  const backdropStyle: React.CSSProperties = isCenter ? {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 99997,
  } : {};

  return (
    <>
      {/* Backdrop / overlay */}
      {isCenter && <div style={backdropStyle} onClick={close} />}

      {/* Highlight ring */}
      {highlightStyle && (
        <motion.div
          key={`ring-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={highlightStyle}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          style={tooltipStyle}
        >
          <div
            style={{
              background: '#061422',
              border: '1px solid rgba(0,212,240,0.3)',
              borderRadius: 12,
              padding: '20px 22px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(0,212,240,0.08)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#e8f4ff' }}>{current.title}</span>
              <button
                onClick={close}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a7090', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <p style={{ fontSize: 13, color: '#8aafc0', lineHeight: 1.6, margin: '0 0 18px' }}>
              {current.content}
            </p>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 5 }}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? 'var(--ds-cyan, #00d4f0)' : 'rgba(255,255,255,0.12)',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 8 }}>
                {step > 0 && (
                  <button
                    onClick={prev}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '6px 14px',
                      color: '#8aafc0',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ChevronLeft size={13} /> Atrás
                  </button>
                )}
                <button
                  onClick={next}
                  style={{
                    background: 'linear-gradient(135deg, #00d4f0, #0066ff)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    color: '#000',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {step === STEPS.length - 1 ? 'Finalizar ✓' : (<>Siguiente <ChevronRight size={13} /></>)}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
