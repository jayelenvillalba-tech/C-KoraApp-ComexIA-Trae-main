
import { useState, useEffect } from 'react';
import { Check, Zap, Building2, CreditCard, Shield, ArrowRight, ExternalLink, AlertCircle, TrendingUp } from 'lucide-react';

// Safe inline useUser — reads from localStorage to avoid missing module
function useUser() {
  const stored = localStorage.getItem('auth_token');
  const user = stored ? { id: 'local', name: 'User' } : null;
  return { user };
}
import { useLanguage } from '@/hooks/use-language';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ═══════════════════════════════════════════════════════
   CYBER-TRADE MERIDIAN — "The Power Grid" Plans
   Glassmorphism, ROI Widget, Tonal Hierarchy
═══════════════════════════════════════════════════════ */

interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  priceArs: number;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

interface PlansData {
  currency: string;
  paymentMethod: string;
  note: string;
  plans: Plan[];
}

export default function SubscriptionPage() {
  useDocumentTitle('Planes y Suscripción');
  const { user } = useUser();
  const { language } = useLanguage();
  const [plans, setPlans] = useState<PlansData | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [loading, setLoading] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'instruments'>('plans');
  const [instruments, setInstruments] = useState<any>(null);

  useEffect(() => {
    fetch('/api/payments/plans', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPlans(data); });

    fetch('/api/payments/trade-instruments')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setInstruments(data); });

    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/payments/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setSubStatus(data); });
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) { window.location.href = '/auth'; return; }
    const token = localStorage.getItem('auth_token') || '';
    setLoading(planId);
    try {
      const isLatam = plans?.paymentMethod === 'mercadopago';
      if (isLatam) {
        const res = await fetch('/api/payments/mp/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: planId }),
        });
        const data = await res.json();
        if (data.initPoint) window.location.href = data.initPoint;
      } else {
        const res = await fetch('/api/payments/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ plan: planId }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {
      alert('Error al iniciar el pago. Por favor, intentá de nuevo.');
    } finally {
      setLoading('');
    }
  };

  const handleManageBilling = async () => {
    const token = localStorage.getItem('auth_token') || '';
    const res = await fetch('/api/payments/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const riskColors: Record<string, string> = {
    'Bajo': 'var(--ds-green)', 'Medio': 'var(--ds-amber)',
    'Medio-bajo': 'var(--ds-amber)', 'Alto para el vendedor': 'var(--ds-red)',
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a141d', color: 'var(--ds-text-primary)', fontFamily: 'var(--ds-font-body)' }}>
      {/* ── Header ── */}
      <div className="relative overflow-hidden py-16 px-4 text-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top, rgba(0,212,240,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ background: 'var(--ds-cyan-dim)', borderColor: 'rgba(0,212,240,0.2)', color: 'var(--ds-cyan)', fontFamily: 'var(--ds-font-data)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {language === 'es' ? 'Plataforma de Inteligencia Comercial' : 'Trade Intelligence Platform'}
          </div>
          <h1 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '42px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ds-text-primary)', marginBottom: '12px' }}>
            {language === 'es' ? 'Elegí tu Plan' : 'Choose Your Plan'}
          </h1>
          <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '15px', color: 'var(--ds-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {language === 'es'
              ? 'Accedé a datos reales. Conectá con importadores globales. Reducí el costo de exportar.'
              : 'Access real data. Connect with global importers. Reduce your export cost.'}
          </p>
          {plans?.note && (
            <p className="mt-4 flex items-center justify-center gap-1.5" style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', color: 'var(--ds-amber)', fontWeight: 700 }}>
              <CreditCard className="w-3.5 h-3.5" />{plans.note}
            </p>
          )}
          {subStatus?.isActive && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full radiance-green" style={{ background: 'var(--ds-bg-raised)', border: '1px solid rgba(105,246,185,0.2)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--ds-green)' }} />
              <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-green)', fontWeight: 600 }}>
                {language === 'es' ? `Plan activo: ${subStatus.plan}` : `Active plan: ${subStatus.plan}`}
              </span>
              <button onClick={handleManageBilling} style={{ marginLeft: '8px', fontFamily: 'var(--ds-font-data)', fontSize: '11px', color: 'var(--ds-cyan)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>
                {language === 'es' ? 'Gestionar' : 'Manage'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Switcher (Fluid Pill) ── */}
      <div className="flex justify-center mb-10 px-4">
        <div className="flex p-1 rounded-full relative" style={{ background: 'var(--ds-bg-input)', border: '1px solid var(--ds-border-subtle)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
          {[
            { id: 'plans', label: language === 'es' ? 'Planes de IA' : 'AI Plans' },
            { id: 'instruments', label: language === 'es' ? 'Instrumentos de Pago' : 'Payment Instruments' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="relative px-6 py-2.5 rounded-full text-sm transition-all duration-300 z-10"
                style={{
                  fontFamily: 'var(--ds-font-body)', fontWeight: 600,
                  color: isActive ? 'var(--ds-bg-base)' : 'var(--ds-text-muted)'
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-full shadow-lg -z-10" style={{ background: 'var(--ds-cyan)' }} />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Plans Tab ── */}
      {activeTab === 'plans' && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {(plans?.plans || [
              { id: 'demo', name: 'Demo', priceUsd: 0, priceArs: 0, features: ['10 búsquedas/mes', '1 análisis de ruta', 'Sin marketplace'], cta: 'Plan actual' },
              { id: 'pro', name: 'Pro PyME', priceUsd: 29, priceArs: 34423, features: ['Todo ilimitado', 'Marketplace B2B', 'Chat corporativo', 'Documentos de ruta', 'Alertas de riesgo', 'Soporte por email'], cta: 'Suscribirse', highlighted: true },
              { id: 'enterprise', name: 'Enterprise', priceUsd: 99, priceArs: 117513, features: ['Todo Pro', 'Multi-usuario', 'API access', 'Onboarding dedicado', 'Informes a medida', 'Soporte prioritario'], cta: 'Contratar' },
            ] as Plan[]).map((plan) => {
              const isCurrent = subStatus?.plan === plan.id;
              const displayPrice = plans?.currency === 'ARS' ? plan.priceArs : plan.priceUsd;
              const currencyLabel = plans?.currency || 'USD';

              return (
                <div key={plan.id} className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${plan.highlighted ? 'glass radiance-cyan scale-105 z-10' : 'bg-[#111d29]'}`} style={{ border: plan.highlighted ? '1px solid rgba(0,212,240,0.3)' : '1px solid var(--ds-border-subtle)', boxShadow: plan.highlighted ? '0 10px 40px rgba(0,212,240,0.1)' : 'var(--ds-shadow-raised)' }}>
                  
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span style={{ background: 'linear-gradient(90deg, var(--ds-cyan) 0%, rgba(0,102,255,1) 100%)', color: 'var(--ds-bg-base)', fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', letterSpacing: '0.1em', boxShadow: '0 0 15px rgba(0,212,240,0.5)' }}>
                        {language === 'es' ? 'NIVEL RECOMENDADO' : 'RECOMMENDED TIER'}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      {plan.id === 'demo' ? <Shield className="w-5 h-5" style={{ color: 'var(--ds-text-muted)' }} /> :
                       plan.id === 'pro' ? <Zap className="w-5 h-5" style={{ color: 'var(--ds-cyan)' }} /> :
                       <Building2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ds-t3)' }} />}
                      <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '20px', fontWeight: 900, color: 'var(--ds-text-primary)' }}>{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontFamily: 'var(--ds-font-display)', fontSize: '42px', fontWeight: 900, color: 'var(--ds-text-primary)', lineHeight: 1 }}>
                        {displayPrice === 0 ? 'Free' : `${currencyLabel} ${displayPrice.toLocaleString()}`}
                      </span>
                      {displayPrice > 0 && <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-text-secondary)', fontWeight: 500 }}>/mes</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ds-cyan)', filter: 'drop-shadow(0 0 5px rgba(0,212,240,0.5))' }} />
                        <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: '14px', color: 'var(--ds-text-secondary)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent || plan.id === 'demo' || loading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: 'Inter', fontWeight: 900, fontSize: '14px', letterSpacing: '0.05em',
                      background: plan.highlighted ? 'linear-gradient(135deg, var(--ds-cyan) 0%, rgba(0,102,255,1) 100%)' : 'var(--ds-bg-input)',
                      color: plan.highlighted ? 'var(--ds-bg-base)' : 'var(--ds-text-primary)',
                      border: plan.highlighted ? 'none' : '1px solid var(--ds-border-subtle)',
                      boxShadow: plan.highlighted ? '0 5px 20px rgba(0,212,240,0.4)' : 'none',
                    }}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                        {language === 'es' ? 'PROCESANDO...' : 'PROCESSING...'}
                      </span>
                    ) : isCurrent ? (language === 'es' ? 'PLAN ACTIVO' : 'ACTIVE PLAN') : plan.cta.toUpperCase()}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── NEW: ROI Widget ── */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 mb-12" style={{ border: '1px solid rgba(105,246,185,0.2)', boxShadow: '0 0 20px rgba(105,246,185,0.05)' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 radiance-green" />
            <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(105,246,185,0.1)', border: '1px solid rgba(105,246,185,0.3)' }}>
              <TrendingUp className="w-7 h-7" style={{ color: 'var(--ds-green)', filter: 'drop-shadow(0 0 8px rgba(105,246,185,0.6))' }} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--ds-text-primary)', marginBottom: '4px' }}>
                {language === 'es' ? 'Optimización de Costos Detectada' : 'Cost Optimization Detected'}
              </h4>
              <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '14px', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                {language === 'es' ? 'Al utilizar la inteligencia de tratados y rutas de Che.Comex, las PyMEs ahorran en promedio ' : 'By using Che.Comex route and treaty intelligence, SMEs save an average of '}
                <span style={{ fontFamily: 'Inter', fontWeight: 900, color: 'var(--ds-green)' }}>USD 1.200</span>
                {language === 'es' ? ' por operación. ' : ' per operation. '}
                <span style={{ color: 'var(--ds-text-primary)', fontWeight: 600 }}>
                  {language === 'es' ? 'El Plan Pro se amortiza con tu primer embarque.' : 'The Pro Plan pays for itself on your first shipment.'}
                </span>
              </p>
            </div>
          </div>

          {/* ── Payment Providers ── */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--ds-text-muted)' }} />
              <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.1em' }}>
                {language === 'es' ? 'PROCESAMIENTO SEGURO EXTERNO' : 'SECURE EXTERNAL PROCESSING'}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-8 mb-4">
              {/* Note: In a real app we'd use SVG logos, here styling text as faded logos */}
              <div className="payment-logo opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1.5" style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '16px', color: 'var(--ds-text-primary)' }}>
                <div className="w-5 h-5 rounded bg-[#00A1E0] flex items-center justify-center"><span className="text-[10px] text-white">MP</span></div>
                Mercado Pago
              </div>
              <div className="payment-logo opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1.5" style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '16px', color: 'var(--ds-text-primary)' }}>
                <div className="w-5 h-5 rounded bg-[#635BFF] flex items-center justify-center text-white"><span className="text-[10px] font-black">S</span></div>
                stripe
              </div>
            </div>

            <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '11px', color: 'var(--ds-text-muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              {language === 'es'
                ? 'Stripe y MercadoPago se usan de forma exclusiva para la suscripción a la plataforma. Che.Comex NO interviene ni procesa transacciones comerciales directas entre importadores y exportadores.'
                : 'Stripe and MercadoPago are used exclusively for platform subscriptions. Che.Comex does NOT intervene in or process direct commercial transactions between users.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Trade Instruments Tab ── */}
      {activeTab === 'instruments' && instruments && (
        <div className="max-w-4xl mx-auto px-4 pb-16 animate-in fade-in duration-300">
          
          <div className="mb-8 p-5 rounded-2xl flex items-start gap-4 radiance-amber" style={{ background: 'var(--ds-bg-raised)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--ds-amber)' }} />
            <div>
              <p style={{ fontFamily: 'var(--ds-font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--ds-text-primary)', marginBottom: '4px' }}>
                {language === 'es' ? 'Directorio de Instrumentos' : 'Instruments Directory'}
              </p>
              <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                {instruments.disclaimer}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {instruments.instruments.map((inst: any) => (
              <div key={inst.id} className="p-6 rounded-2xl transition-all hover:-translate-y-1" style={{ background: 'var(--ds-bg-raised)', border: '1px solid var(--ds-border-subtle)', boxShadow: 'var(--ds-shadow-raised)' }}>
                <div className="flex items-start justify-between mb-4">
                  <h3 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--ds-text-primary)' }}>{inst.name}</h3>
                  <div className="px-2.5 py-1 rounded border" style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: riskColors[inst.risk] || 'var(--ds-text-muted)', borderColor: `rgba(0,0,0,0.1)`, background: 'rgba(255,255,255,0.05)' }}>
                    {inst.risk.toUpperCase()}
                  </div>
                </div>
                
                <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-text-secondary)', marginBottom: '16px', minHeight: '40px' }}>
                  {inst.whenToUse}
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--ds-bg-input)' }}>
                    <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>COSTO TÍPICO</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--ds-text-primary)' }}>{inst.cost}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--ds-bg-input)' }}>
                    <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>PLAZO DÍAS</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--ds-text-primary)' }}>{inst.processingDays}</div>
                  </div>
                </div>

                {inst.learnMore && (
                  <a href={inst.learnMore} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors" style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', fontWeight: 700, color: 'var(--ds-cyan)' }}>
                    {language === 'es' ? 'MÁS INFO (ICC)' : 'LEARN MORE (ICC)'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          {instruments.discrepancyWarning && (
           <div className="p-6 rounded-2xl radiance-red" style={{ background: 'var(--ds-bg-raised)', border: '1px solid rgba(239,68,68,0.2)' }}>
             <h3 className="flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--ds-font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--ds-red)' }}>
               <AlertCircle className="w-5 h-5" />
               {instruments.discrepancyWarning.title}
             </h3>
             <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-text-secondary)', marginBottom: '16px' }}>
               {instruments.discrepancyWarning.description}
             </p>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {instruments.discrepancyWarning.commonErrors.map((err: string, i: number) => (
                 <li key={i} className="flex items-start gap-2" style={{ fontFamily: 'var(--ds-font-body)', fontSize: '12px', color: 'var(--ds-text-muted)' }}>
                   <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--ds-red)', boxShadow: '0 0 5px var(--ds-red)' }} />
                   {err}
                 </li>
               ))}
             </ul>
           </div>
          )}
        </div>
      )}
    </div>
  );
}
