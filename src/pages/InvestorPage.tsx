import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  TrendingUp, Users, Globe, DollarSign, Shield, Zap,
  ChevronRight, ArrowRight, Star, Check, BarChart3, Ship, FileText
} from 'lucide-react';

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ value, prefix = '', suffix = '', duration = 2000 }: {
  value: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString('es-AR')}{suffix}</span>;
}

// ─── Investor KPIs ────────────────────────────────────────────────────────────
const KPIS = [
  { label: 'Mercado Potencial', value: 850, suffix: 'M USD', icon: DollarSign, color: '#00d4f0', desc: 'TAM de PyMEs exportadoras en LATAM' },
  { label: 'PyMEs Activas AR', value: 18000, suffix: '+', icon: Users, color: '#69f6b9', desc: 'Exportadoras activas en Argentina' },
  { label: 'Reducción de Costos', value: 35, suffix: '%', icon: TrendingUp, color: '#ffb800', desc: 'Estimado vs. métodos tradicionales' },
  { label: 'Tiempo hasta 1er Cliente', value: 14, suffix: ' días', icon: Zap, color: '#ff6b35', desc: 'Onboarding rápido y guiado' },
];

// ─── Timeline ─────────────────────────────────────────────────────────────────
const ROADMAP = [
  { q: 'Q2 2025', label: 'MVP Lanzado', done: true, desc: 'Landed Cost, GodMode AI, Marketplace B2B, KYB.' },
  { q: 'Q3 2025', label: 'Beta Privada', done: true, desc: '50 PyMEs piloto en Argentina y Uruguay.' },
  { q: 'Q4 2025', label: 'Aceleradora BCR', done: false, desc: 'BCR Innova + Fundación Libertad. Inversión Seed.' },
  { q: 'Q1 2026', label: 'Expansión Mercosur', done: false, desc: 'Brasil, Chile, Perú. Partnership con AFIP/SUNAT.' },
  { q: 'Q2 2026', label: 'Series A', done: false, desc: 'Internacionalización y API pública para ERP.' },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcela Torres', role: 'Gerente de Exportaciones', company: 'AgroSol S.A.',
    text: 'Con Che.Comex redujimos el tiempo de cotización logística de 3 días a 20 minutos. El GodMode AI es como tener un despachante senior on-demand.',
    rating: 5, flag: '🇦🇷'
  },
  {
    name: 'Diego Fernández', role: 'Director Comercial', company: 'Viñedos del Valle',
    text: 'El Marketplace nos conectó con importadores en Alemania que de otra forma nunca hubiéramos encontrado. El proceso de verificación KYB nos dio confianza.',
    rating: 5, flag: '🇦🇷'
  },
  {
    name: 'Luciana Gómez', role: 'Fundadora', company: 'TechExport MX',
    text: 'La clasificación HS Code con IA eliminó los errores que teníamos con productos electrónicos. Ahorramos USD 12.000 en multas aduaneras.',
    rating: 5, flag: '🇲🇽'
  },
];

// ─── Feature comparison ───────────────────────────────────────────────────────
const COMPARE = [
  { feature: 'Clasificación HS Code con IA', us: true, traditional: false },
  { feature: 'Landed Cost tiempo real', us: true, traditional: false },
  { feature: 'KYB / Verificación automática', us: true, traditional: false },
  { feature: 'Marketplace B2B verificado', us: true, traditional: false },
  { feature: 'GodMode AI (memoria persistente)', us: true, traditional: false },
  { feature: 'Alertas regulatorias automáticas', us: true, traditional: false },
  { feature: 'Disponibilidad 24/7', us: true, traditional: false },
  { feature: 'Precio mensual accesible', us: true, traditional: false },
];

export default function InvestorPage() {
  const [, navigate] = useLocation();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020810', color: '#c8dff0', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      {/* Top nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(2,8,16,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,212,240,0.1)', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
          CHE.<span style={{ color: '#00d4f0' }}>COMEX</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#1e3d56', marginLeft: 6, letterSpacing: 2 }}>INVESTOR</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(0,212,240,0.3)', borderRadius: 6, padding: '7px 16px', color: '#00d4f0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Ver Demo
          </button>
          <button onClick={() => window.open('mailto:investors@checomex.com')} style={{ background: 'linear-gradient(135deg, #00d4f0, #0066ff)', border: 'none', borderRadius: 6, padding: '7px 18px', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Contacto Inversores
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,212,240,0.08) 0%, transparent 70%)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,240,0.08)', border: '1px solid rgba(0,212,240,0.25)', borderRadius: 999, padding: '6px 18px', marginBottom: 24, fontSize: 11, fontWeight: 700, color: '#00d4f0', letterSpacing: 2, textTransform: 'uppercase' }}>
            🚀 Ronda Seed Abierta · 2025-2026
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, color: '#eef6ff', lineHeight: 1.05, margin: '0 auto 20px', maxWidth: 800 }}>
            El Sistema Operativo del<br /><span style={{ color: '#00d4f0' }}>Comercio Exterior</span>
          </h1>
          <p style={{ fontSize: 18, color: '#8aafc0', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Che.Comex digitaliza y automatiza la operación de exportación/importación de PyMEs en LATAM usando Inteligencia Artificial. Reducimos fricciones, tiempo y costos en cada etapa del proceso.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/?demo=true')} style={{ background: 'linear-gradient(135deg, #00d4f0, #0066ff)', border: 'none', borderRadius: 8, padding: '14px 28px', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Ver Demo Interactivo <ArrowRight size={16} />
            </button>
            <button onClick={() => window.open('mailto:investors@checomex.com')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '14px 28px', color: '#eef6ff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Solicitar One-Pager
            </button>
          </div>
        </motion.div>
      </section>

      {/* KPIs */}
      <section style={{ padding: '60px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {KPIS.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ background: '#03101c', border: `1px solid ${k.color}25`, borderRadius: 16, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
              <k.icon size={24} style={{ color: k.color, marginBottom: 12 }} />
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 42, fontWeight: 900, color: k.color, lineHeight: 1 }}>
                <Counter value={k.value} suffix={k.suffix} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#eef6ff', marginTop: 8 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: '#4a7090', marginTop: 4 }}>{k.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: 16, padding: 28 }}>
            <h3 style={{ color: '#ff5050', fontWeight: 800, fontSize: 16, marginBottom: 16, letterSpacing: 1 }}>⚠️ EL PROBLEMA HOY</h3>
            {['Clasificación arancelaria incorrecta → multas', 'Falta de visibilidad de costos hasta cerrar el negocio', 'Documentación manual, propensa a errores', 'Acceso a compradores internacionales limitado', 'Regulaciones cambiantes sin alertas en tiempo real'].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 13, color: '#8aafc0' }}>
                <span style={{ color: '#ff5050', marginTop: 2 }}>✗</span> {p}
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(0,212,240,0.04)', border: '1px solid rgba(0,212,240,0.15)', borderRadius: 16, padding: 28 }}>
            <h3 style={{ color: '#00d4f0', fontWeight: 800, fontSize: 16, marginBottom: 16, letterSpacing: 1 }}>✅ NUESTRA SOLUCIÓN</h3>
            {['IA clasifica el HS Code en segundos', 'Landed Cost en tiempo real con SeaRates API', 'Generación automática de docs regulatorios', 'Marketplace B2B verificado + Chat Seguro', 'Alertas regulatorias automáticas y personalizadas'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 13, color: '#8aafc0' }}>
                <Check size={14} style={{ color: '#00d4f0', marginTop: 2, flexShrink: 0 }} /> {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive comparison */}
      <section style={{ padding: '60px 32px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#eef6ff', marginBottom: 8 }}>Ventaja Competitiva</h2>
        <p style={{ color: '#4a7090', fontSize: 13, marginBottom: 32 }}>vs. métodos tradicionales (consultoras, gestores manuales)</p>
        <div style={{ background: '#03101c', border: '1px solid #0f2030', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: '#071525', padding: '12px 20px', fontSize: 11, fontWeight: 800, color: '#4a7090', letterSpacing: 1, textTransform: 'uppercase' }}>
            <span>Característica</span>
            <span style={{ textAlign: 'center', color: '#00d4f0' }}>Che.Comex</span>
            <span style={{ textAlign: 'center' }}>Tradicional</span>
          </div>
          {COMPARE.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '13px 20px', borderTop: '1px solid #0f2030', fontSize: 13, color: '#8aafc0', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              <span>{row.feature}</span>
              <span style={{ textAlign: 'center', color: '#69f6b9', fontWeight: 800 }}>✓</span>
              <span style={{ textAlign: 'center', color: '#ff5050' }}>✗</span>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section style={{ padding: '60px 32px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#eef6ff', textAlign: 'center', marginBottom: 40 }}>Roadmap</h2>
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #00d4f0, rgba(0,212,240,0.1))' }} />
          {ROADMAP.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', gap: 24, marginBottom: 28, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -31, width: 20, height: 20, borderRadius: '50%', background: item.done ? '#00d4f0' : '#071525', border: `2px solid ${item.done ? '#00d4f0' : '#1a3a5a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {item.done ? '✓' : ''}
              </div>
              <div style={{ background: '#03101c', border: `1px solid ${item.done ? 'rgba(0,212,240,0.2)' : '#0f2030'}`, borderRadius: 12, padding: '16px 20px', flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: item.done ? '#00d4f0' : '#4a7090', fontWeight: 700 }}>{item.q}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: item.done ? '#eef6ff' : '#8aafc0' }}>{item.label}</span>
                  {item.done && <span style={{ background: 'rgba(0,212,240,0.1)', border: '1px solid rgba(0,212,240,0.3)', borderRadius: 4, padding: '1px 8px', fontSize: 9, fontWeight: 800, color: '#00d4f0', letterSpacing: 1 }}>DONE</span>}
                </div>
                <p style={{ fontSize: 12, color: '#4a7090', margin: 0 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '60px 32px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 36, fontWeight: 900, color: '#eef6ff', marginBottom: 32 }}>Qué dicen nuestros usuarios</h2>
        <div style={{ position: 'relative', height: 220 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
              style={{ position: 'absolute', inset: 0, background: '#03101c', border: '1px solid rgba(0,212,240,0.15)', borderRadius: 16, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 16 }}>
                {Array(TESTIMONIALS[activeTestimonial].rating).fill(0).map((_, i) => <Star key={i} size={14} fill="#ffb800" color="#ffb800" />)}
              </div>
              <p style={{ fontSize: 15, color: '#c8dff0', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 16px' }}>
                "{TESTIMONIALS[activeTestimonial].text}"
              </p>
              <div style={{ fontSize: 12, color: '#4a7090' }}>
                <strong style={{ color: '#eef6ff' }}>{TESTIMONIALS[activeTestimonial].name}</strong>
                {' · '}{TESTIMONIALS[activeTestimonial].role} @ {TESTIMONIALS[activeTestimonial].company} {TESTIMONIALS[activeTestimonial].flag}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActiveTestimonial(i)}
              style={{ width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === activeTestimonial ? '#00d4f0' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center', background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,212,240,0.06) 0%, transparent 70%)' }}>
        <h2 style={{ fontFamily: 'Barlow Condensed, Inter, sans-serif', fontSize: 42, fontWeight: 900, color: '#eef6ff', marginBottom: 12 }}>
          Inversores, únanse a la misión
        </h2>
        <p style={{ color: '#4a7090', fontSize: 15, marginBottom: 32 }}>
          Buscamos USD 500K en ronda seed para acelerar expansión en Mercosur.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.open('mailto:investors@checomex.com')} style={{ background: 'linear-gradient(135deg, #00d4f0, #0066ff)', border: 'none', borderRadius: 8, padding: '16px 32px', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            Agendar Reunión →
          </button>
          <button onClick={() => navigate('/?demo=true')} style={{ background: 'none', border: '1px solid rgba(0,212,240,0.3)', borderRadius: 8, padding: '16px 32px', color: '#00d4f0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Ver Demo en Vivo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #0f2030', padding: '24px 32px', textAlign: 'center', fontSize: 11, color: '#1e3d56', fontFamily: 'DM Mono, monospace' }}>
        © 2026 CHE.COMEX · Todos los derechos reservados · <a href="mailto:investors@checomex.com" style={{ color: '#00d4f0', textDecoration: 'none' }}>investors@checomex.com</a>
      </footer>
    </div>
  );
}
