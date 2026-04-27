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

// DS-token-driven status config
const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle2,
    color: 'text-[var(--ds-green)]',
    bg: 'bg-[var(--ds-green-dim)]',
    border: 'border-[var(--ds-green)]/25',
    barColor: 'var(--ds-green)',
    label: 'Cumplís los requisitos',
    dot: 'bg-[var(--ds-green)]',
    dotTokenSolid: 'var(--ds-green)',
  },
  gap: {
    icon: AlertTriangle,
    color: 'text-[var(--ds-amber)]',
    bg: 'bg-[var(--ds-amber-dim)]',
    border: 'border-[var(--ds-amber)]/25',
    barColor: 'var(--ds-amber)',
    label: 'Faltan documentos',
    dot: 'bg-[var(--ds-amber)]',
    dotTokenSolid: 'var(--ds-amber)',
  },
  blocked: {
    icon: XCircle,
    color: 'text-[var(--ds-red)]',
    bg: 'bg-[var(--ds-red-dim)]',
    border: 'border-[var(--ds-red)]/25',
    barColor: 'var(--ds-red)',
    label: 'No podés operar esta ruta',
    dot: 'bg-[var(--ds-red)]',
    dotTokenSolid: 'var(--ds-red)',
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
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ds-radius-sm)] bg-[var(--ds-bg-overlay)] border border-[var(--ds-border-default)] ${className}`}>
        <Loader2 className="w-3 h-3 text-[var(--ds-text-tertiary)] animate-spin" />
        <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)]">Verificando</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ds-radius-sm)] bg-[var(--ds-bg-overlay)] border border-[var(--ds-border-subtle)] ${className}`}>
        <Shield className="w-3 h-3 text-[var(--ds-text-tertiary)]" />
        <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)]">Sin verificar</span>
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ds-radius-sm)] ${cfg.bg} border ${cfg.border} hover:opacity-80 transition-all cursor-pointer`}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.color}`} />
        <span className={`font-data text-[var(--ds-text-xs)] font-semibold uppercase tracking-[var(--ds-tracking-data)] ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className={`font-data text-[var(--ds-text-xs)] ${cfg.color} opacity-60`}>{result.score}%</span>
        <ChevronDown className={`w-3 h-3 ${cfg.color} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Drawer */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 z-50 bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] shadow-[var(--ds-shadow-modal)] overflow-hidden">
          {/* Header */}
          <div className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] border-b border-[var(--ds-border-default)] flex items-center justify-between">
            <div>
              <div className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)]">Análisis de Compatibilidad</div>
              <div className="text-[var(--ds-text-sm)] font-semibold text-[var(--ds-text-primary)] mt-0.5">
                NCM {ncmCode} → {destinationCountry} · {incoterm}
              </div>
            </div>
            <div className={`font-data text-[var(--ds-text-xl)] font-black ${cfg.color}`}>
              {result.score}<span className="text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)]">/100</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="px-[var(--ds-space-4)] py-[var(--ds-space-2)] border-b border-[var(--ds-border-subtle)]">
            <div className="h-1.5 bg-[var(--ds-bg-overlay)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${result.score}%`, background: cfg.barColor }}
              />
            </div>
          </div>

          {/* AI explanation */}
          {result.aiExplanation && (
            <div className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] border-b border-[var(--ds-border-subtle)] bg-[var(--ds-bg-raised)]">
              <div className="flex items-start gap-2">
                <span className="text-[var(--ds-text-xs)] font-data text-[var(--ds-cyan)] bg-[var(--ds-cyan-dim)] border border-[var(--ds-cyan)]/20 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 uppercase tracking-[var(--ds-tracking-data)]">IA</span>
                <p className="text-[var(--ds-text-sm)] text-[var(--ds-text-secondary)] leading-relaxed">{result.aiExplanation}</p>
              </div>
            </div>
          )}

          {/* Missing docs */}
          {result.missing.length > 0 && (
            <div>
              <div className="px-[var(--ds-space-4)] py-[var(--ds-space-2)] flex items-center gap-2 border-b border-[var(--ds-border-subtle)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ds-red)]" />
                <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-red)] uppercase tracking-[var(--ds-tracking-data)]">Documentos faltantes ({result.missing.length})</span>
              </div>
              <div className="divide-y divide-[var(--ds-border-subtle)] max-h-48 overflow-y-auto">
                {result.missing.map(doc => (
                  <div key={doc.id} className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] flex items-start gap-2.5 hover:bg-[var(--ds-bg-raised)] transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--ds-amber)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--ds-text-sm)] font-medium text-[var(--ds-text-primary)]">{doc.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase">{CATEGORY_LABEL[doc.category] || doc.category}</span>
                        {doc.processingDays && (
                          <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)]">~{doc.processingDays}d tramitación</span>
                        )}
                      </div>
                      {doc.authority && <div className="text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] mt-0.5">{doc.authority}</div>}
                    </div>
                    {doc.link && (
                      <a
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 rounded hover:bg-[var(--ds-cyan-dim)] text-[var(--ds-text-tertiary)] hover:text-[var(--ds-cyan)] transition-colors"
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
              <div className="px-[var(--ds-space-4)] py-[var(--ds-space-2)] flex items-center gap-2 border-t border-[var(--ds-border-subtle)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ds-green)]" />
                <span className="font-data text-[var(--ds-text-xs)] text-[var(--ds-green)] uppercase tracking-[var(--ds-tracking-data)]">Documentos en regla ({result.present.length})</span>
              </div>
              <div className="px-[var(--ds-space-4)] pb-[var(--ds-space-3)] flex flex-wrap gap-1.5">
                {result.present.map(doc => (
                  <span key={doc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--ds-green-dim)] border border-[var(--ds-green)]/20 rounded text-[var(--ds-text-xs)] font-data text-[var(--ds-green)]">
                    ✓ {doc.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA for blocked */}
          {result.status === 'blocked' && (
            <div className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] border-t border-[var(--ds-border-default)] bg-[var(--ds-red-dim)]">
              <a
                href="/onboarding"
                className="block w-full text-center py-2 bg-[var(--ds-red-dim)] border border-[var(--ds-red)]/30 rounded-[var(--ds-radius-md)] text-[var(--ds-red)] font-data text-[var(--ds-text-xs)] font-bold uppercase tracking-[var(--ds-tracking-data)] hover:opacity-80 transition-all"
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
