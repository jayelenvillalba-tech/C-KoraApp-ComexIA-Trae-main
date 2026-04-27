import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle, XCircle, DollarSign, Ship, FileText, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

interface Publication {
  id: string;
  company: string;
  contact: string;
  contactRole: string;
  verified: boolean;
  type: 'sell' | 'buy';
  product: string;
  hsCode: string;
  qty: number;
  unit: string;
  incoterm: string;
  price: number;
  currency: string;
  origin: string;
  destination?: string;
  certifications: string[];
  docsCount: number;
}

interface UserProfile {
  userId?: string;
  role?: string;
  subRole?: string;
  country?: string;
  company?: string;
  plan?: string;
  verifyScore?: number;
  docsCompleted?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  userProfile?: UserProfile;
}

const COUNTRY_FLAGS: Record<string, string> = {
  AR: '🇦🇷', BR: '🇧🇷', CN: '🇨🇳', DE: '🇩🇪', US: '🇺🇸', UY: '🇺🇾', EU: '🇪🇺', ES: '🇪🇸', FR: '🇫🇷', MX: '🇲🇽'
};

interface AnalysisResult {
  route: any;
  agreements: any;
  tariff: {
    effectiveRate: number;
    mfnRate: number | null;
    preferentialRate: number | null;
    saving: number;
    treatyUsed: string | null;
  };
  documents: {
    required: any[];
    conditional: any[];
    totalCostUsd: number;
    totalProcessingDays: number;
    dataSource: string;
  };
  warnings: string[];
}

export default function CostAnalysisModal({ isOpen, onClose, publication, userProfile }: Props) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isOpen || !publication) return;
    setLoading(true);
    
    const dest = publication.destination || 'CN';
    const hsCode = publication.hsCode;
    
    // Fetch real data from the Phase 31 agreements API
    fetch(`/api/agreements/route?origin=${publication.origin}&destination=${dest}&hsCode=${hsCode}`)
      .then(res => res.json())
      .then(data => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching route analysis:', err);
        setLoading(false);
      });
  }, [isOpen, publication]);

  if (!isOpen || !publication) return null;

    const requirements = analysis ? analysis.documents.required.map((doc: any) => ({
      name: doc.name,
      status: (userProfile?.docsCompleted || []).some((d: string) => d.toLowerCase().includes(doc.name.toLowerCase().split(' ')[0].toLowerCase())) ? 'available' : 'missing' as 'available' | 'missing',
      costUsd: doc.costUsd || 0,
      processingDays: doc.processingDays || 1
    })) : [];

    const baseValue = publication.qty * publication.price;
    const freight = Math.round(baseValue * 0.05 + 1200);
    const insurance = Math.round(baseValue * 0.01);
    
    // Dynamic customs calculation using the effective rate from the API (e.g. 0 if Mercosur)
    const effectiveRate = analysis?.tariff?.effectiveRate ?? 4;
    const customs = Math.round(baseValue * (effectiveRate / 100));
    
    const handling = Math.round(baseValue * 0.007 + 300);
    const docs = analysis?.documents?.totalCostUsd ?? 300;
    const total = baseValue + freight + insurance + customs + handling + docs;
    const costs = { baseValue, freight, insurance, customs, handling, docs, total, effectiveRate };

    const availCount = requirements.filter(r => r.status === 'available').length;
    const compPct = requirements.length > 0 ? Math.round((availCount / requirements.length) * 100) : 0;
    const dest = publication.destination || 'CN';
    const compColor = compPct >= 80 ? 'var(--ds-green)' : compPct >= 40 ? 'var(--ds-amber)' : 'var(--ds-red)';

    const fmt = (n: number) => '$' + n.toLocaleString('en-US');

    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(2,10,18,.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div style={{ background: 'var(--ds-bg-base)', border: '1px solid var(--ds-cyan)40', borderRadius: '12px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Outfit, sans-serif' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ds-cyan)20', position: 'sticky', top: 0, background: 'var(--ds-bg-base)', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <DollarSign size={18} color="var(--ds-cyan)" />
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', fontWeight: 700, color: 'var(--ds-cyan)' }}>Análisis de Costos y Tratados Comerciales</span>
                </div>
                <p style={{ color: '#8aafc0', fontSize: '13px', margin: 0, fontFamily: 'DM Mono, monospace' }}>
                  {publication.product} · HS {publication.hsCode} · {publication.qty} {publication.unit} · {COUNTRY_FLAGS[publication.origin] || ''}{publication.origin} → {COUNTRY_FLAGS[dest] || ''}{dest}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8aafc0', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>
            
            {!loading && analysis?.agreements?.bestOption && (
              <div style={{ marginTop: '12px', background: 'var(--ds-green)10', border: '1px solid var(--ds-green)40', borderRadius: '4px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--ds-green)" />
                <span style={{ fontSize: '13px', color: '#c8e8c8', fontWeight: 600 }}>TLC Aplicable: {analysis.agreements.bestOption.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--ds-green)' }}>(Ahorro estimado: {fmt(baseValue * ((analysis.tariff.mfnRate || 0) - (analysis.tariff.preferentialRate || 0)) / 100)})</span>
              </div>
            )}
            
            {!loading && analysis?.warnings?.map((w, idx) => (
              <div key={idx} style={{ marginTop: '8px', background: '#1c1000', border: '1px solid var(--ds-amber)40', borderRadius: '4px', padding: '8px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={16} color="var(--ds-amber)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#e8d0a0' }}>{w}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Section 1: Compliance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Cumplimiento Documental</span>
                <div style={{ background: `${compColor}20`, border: `1px solid ${compColor}50`, borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: 700, color: compColor, fontFamily: 'DM Mono, monospace' }}>
                  {compPct}% Completo
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px', color: '#8aafc0' }}>
                  <Loader2 size={32} color="var(--ds-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '13px' }}>Analizando tratados y requisitos globales...</span>
                </div>
              ) : (
                <>
                  <div style={{ height: '6px', background: '#0d2035', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${compPct}%`, background: compColor, borderRadius: '3px', transition: 'width .5s ease' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {requirements.map((req, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#0d2035', borderRadius: '6px', border: `1px solid ${req.status === 'available' ? 'var(--ds-green)20' : 'var(--ds-amber)20'}` }}>
                        {req.status === 'available'
                          ? <CheckCircle size={16} color="var(--ds-green)" />
                          : <AlertTriangle size={16} color="var(--ds-amber)" />
                        }
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: req.status === 'available' ? '#c8e8c8' : '#e8d0a0', fontFamily: 'DM Mono, monospace' }}>{req.name}</div>
                          <div style={{ fontSize: '11px', color: '#8aafc0' }}>Aprox {req.processingDays} días | ${req.costUsd}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: req.status === 'available' ? 'var(--ds-green)' : 'var(--ds-amber)', fontWeight: 600 }}>
                          {req.status === 'available' ? 'Subido' : 'Faltante'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {requirements.some(r => r.status === 'missing') && (
                    <div style={{ marginTop: '16px', background: '#1c1000', border: '1px solid var(--ds-amber)40', borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={16} color="var(--ds-amber)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ds-amber)' }}>Ruta Bloqueada</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b89040' }}>
                          Te faltan {requirements.filter(r => r.status === 'missing').length} documentos reglamentarios para operar hacia {dest}.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          {/* Section 2: Cost Breakdown */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>💰 Desglose de Costos</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Valor del Producto', value: costs.baseValue, icon: null },
                { label: '🚢 Transporte Marítimo', value: costs.freight, icon: null },
                { label: 'Seguro de Carga', value: costs.insurance, icon: null },
                { label: `Aranceles Aduanales (${costs.effectiveRate}%)`, value: costs.customs, icon: null },
                { label: 'Manejo y Almacenaje', value: costs.handling, icon: null },
                { label: '📄 Documentación Reg.', value: costs.docs, icon: null },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '4px', fontSize: '13px' }}>
                  <span style={{ color: '#8aafc0', fontFamily: 'DM Mono, monospace' }}>{row.label}</span>
                  <span style={{ color: '#ffffff', fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{fmt(row.value)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--ds-cyan)30', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                <span style={{ color: 'var(--ds-cyan)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>Costo Total Landed</span>
                <span style={{ color: 'var(--ds-cyan)', fontFamily: 'DM Mono, monospace', fontSize: '20px', fontWeight: 700 }}>{fmt(costs.total)}</span>
              </div>
              <div style={{ background: '#0d2035', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#8aafc0', fontFamily: 'DM Mono, monospace' }}>Costo por {publication.unit.replace('s', '')}</span>
                <span style={{ color: '#a0c8e0', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{fmt(Math.round(costs.total / publication.qty))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ds-cyan)20', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', background: 'none', border: '1px solid #8aafc040', borderRadius: '6px', color: '#8aafc0', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '14px' }}>
            Cerrar
          </button>
          <button
            onClick={() => { onClose(); window.location.href = `/chat/deal-${publication.id}`; }}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, var(--ds-cyan), #0088cc)', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Contactar Vendedor →
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
