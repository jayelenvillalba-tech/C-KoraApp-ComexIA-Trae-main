import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown, ExternalLink, Shield } from 'lucide-react';

interface ComplianceMissingDoc {
  id: string;
  name: string;
  category: string;
  processingDays?: number;
  hint: string;
  link?: string | null;
  authority?: string | null;
}

interface ComplianceResult {
  status: 'ok' | 'gap' | 'blocked';
  score: number;
  present: { id: string; name: string; category: string }[];
  missing: ComplianceMissingDoc[];
  aiExplanation?: string | null;
  meta: {
    destinationCountry: string;
    ncmCode: string;
    incoterm: string;
    direction: string;
  };
}

interface ComplianceBadgeProps {
  destinationCountry: string;
  ncmCode: string;
  incoterm?: string;
  direction?: 'import' | 'export';
  /** IDs de los documentos que el usuario ya tiene cargados */
  userDocIds?: string[];
  className?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  commercial: 'Comercial',
  transport: 'Transporte',
  customs: 'Aduanero',
  product: 'Producto',
  financial: 'Financiero',
};

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle2,
    color: 'text-[#00e878]',
    bg: 'bg-[#00e878]/10',
    border: 'border-[#00e878]/25',
    label: 'Cumplís los requisitos',
    dot: 'bg-[#00e878]',
  },
  gap: {
    icon: AlertTriangle,
    color: 'text-[#f5a800]',
    bg: 'bg-[#f5a800]/10',
    border: 'border-[#f5a800]/25',
    label: 'Faltan documentos',
    dot: 'bg-[#f5a800]',
  },
  blocked: {
    icon: XCircle,
    color: 'text-[#ff3e5a]',
    bg: 'bg-[#ff3e5a]/10',
    border: 'border-[#ff3e5a]/25',
    label: 'No podés operar esta ruta',
    dot: 'bg-[#ff3e5a]',
  },
};

export default function ComplianceBadge({
  destinationCountry,
  ncmCode,
  incoterm = 'FOB',
  direction = 'export',
  userDocIds = [],
  className = '',
}: ComplianceBadgeProps) {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!destinationCountry || !ncmCode) return;
    
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/ai/compliance-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDocIds, destinationCountry, ncmCode, incoterm, direction }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then((data: ComplianceResult) => setResult(data))
      .catch(e => { if (e.name !== 'AbortError') setError('No se pudo verificar compatibilidad'); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [destinationCountry, ncmCode, incoterm, direction, userDocIds.join(',')]);

  // Click outside closes drawer
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1a2e42]/50 border border-[#1a2e42] ${className}`}>
        <Loader2 className="w-3 h-3 text-[#4a7898] animate-spin" />
        <span className="font-mono text-[9px] text-[#4a7898] uppercase tracking-wider">Verificando</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1a2e42]/30 border border-[#1a2e42]/50 ${className}`}>
        <Shield className="w-3 h-3 text-[#4a7898]" />
        <span className="font-mono text-[9px] text-[#4a7898] uppercase tracking-wider">Sin verificar</span>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[result.status];
  const Icon = cfg.icon;

  return (
    <div className={`relative ${className}`} ref={drawerRef}>
      {/* Badge trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${cfg.bg} border ${cfg.border} hover:opacity-80 transition-all cursor-pointer`}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.color}`} />
        <span className={`font-mono text-[9px] font-semibold uppercase tracking-wider ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className={`font-mono text-[9px] ${cfg.color} opacity-60`}>{result.score}%</span>
        <ChevronDown className={`w-3 h-3 ${cfg.color} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Drawer */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 z-50 bg-[#09131e] border border-[#1a2e42] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1a2e42] flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider">Análisis de Compatibilidad</div>
              <div className="text-[12px] font-semibold text-[#cce0f5] mt-0.5">
                NCM {ncmCode} → {destinationCountry} · {incoterm}
              </div>
            </div>
            <div className={`font-mono text-xl font-black ${cfg.color}`}>{result.score}<span className="text-[10px] text-[#4a7898]">/100</span></div>
          </div>

          {/* Score bar */}
          <div className="px-4 py-2 border-b border-[#1a2e42]/50">
            <div className="h-1.5 bg-[#1a2e42] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${result.score}%`,
                  background: result.status === 'ok' ? '#00e878' : result.status === 'gap' ? '#f5a800' : '#ff3e5a',
                }}
              />
            </div>
          </div>

          {/* AI explanation */}
          {result.aiExplanation && (
            <div className="px-4 py-3 border-b border-[#1a2e42]/50 bg-[#0d1a27]">
              <div className="flex items-start gap-2">
                <span className="text-[9px] font-mono text-[#00d4f0] bg-[#00d4f0]/10 border border-[#00d4f0]/20 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">IA</span>
                <p className="text-[11px] text-[#8ab8d8] leading-relaxed">{result.aiExplanation}</p>
              </div>
            </div>
          )}

          {/* Missing docs */}
          {result.missing.length > 0 && (
            <div>
              <div className="px-4 py-2 flex items-center gap-2 border-b border-[#1a2e42]/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff3e5a]" />
                <span className="font-mono text-[9px] text-[#ff3e5a] uppercase tracking-wider">Documentos faltantes ({result.missing.length})</span>
              </div>
              <div className="divide-y divide-[#1a2e42]/30 max-h-48 overflow-y-auto">
                {result.missing.map(doc => (
                  <div key={doc.id} className="px-4 py-2.5 flex items-start gap-2.5 hover:bg-[#0d1a27] transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f5a800] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#cce0f5]">{doc.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[8px] text-[#4a7898] uppercase">{CATEGORY_LABEL[doc.category] || doc.category}</span>
                        {doc.processingDays && (
                          <span className="font-mono text-[8px] text-[#4a7898]">~{doc.processingDays}d tramitación</span>
                        )}
                      </div>
                      {doc.authority && <div className="text-[9px] text-[#4a7898] mt-0.5">{doc.authority}</div>}
                    </div>
                    {doc.link && (
                      <a
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 rounded hover:bg-[#00d4f0]/10 text-[#4a7898] hover:text-[#00d4f0] transition-colors"
                        title="Ir al organismo"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Present docs */}
          {result.present.length > 0 && (
            <div>
              <div className="px-4 py-2 flex items-center gap-2 border-t border-[#1a2e42]/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e878]" />
                <span className="font-mono text-[9px] text-[#00e878] uppercase tracking-wider">Documentos en regla ({result.present.length})</span>
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {result.present.map(doc => (
                  <span key={doc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00e878]/8 border border-[#00e878]/20 rounded text-[9px] font-mono text-[#00e878]">
                    ✓ {doc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA for blocked */}
          {result.status === 'blocked' && (
            <div className="px-4 py-3 border-t border-[#1a2e42] bg-[#ff3e5a]/5">
              <a
                href="/onboarding"
                className="block w-full text-center py-2 bg-[#ff3e5a]/15 border border-[#ff3e5a]/30 rounded-lg text-[#ff3e5a] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#ff3e5a]/25 transition-all"
              >
                Completar verificación →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
