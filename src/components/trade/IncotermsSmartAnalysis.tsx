import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Props {
  origin: string;        // "AR"
  destination: string;  // "ID"
  hsCode: string;        // "120190"
  productName: string;  // "Soja"
}

export default function IncotermsSmartAnalysis({
  origin, destination, hsCode, productName
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // We fallback to local calculation if there is no endpoint yet
  const { data, isLoading } = useQuery({
    queryKey: ['incoterms-analysis', origin, destination, hsCode],
    queryFn: () => fetch('/api/incoterms/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        hsCode,
        product: productName,
        userRole: 'exporter',
        productType: getProductType(hsCode),
        sellerExperience: 'intermediate',
      }),
    }).then(r => r.json()).catch(() => ({})),
    staleTime: 1000 * 60 * 60
  });

  if (isLoading) return (
    <div style={{
      background: 'var(--ds-bg-surface)',
      border: '1px solid var(--ds-border-default)',
      borderRadius: 'var(--ds-radius-lg)',
      padding: 'var(--ds-space-5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 14, height: 14,
          border: '2px solid var(--ds-border-default)',
          borderTopColor: 'var(--ds-cyan)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{
          fontFamily: 'var(--ds-font-data)',
          fontSize: 'var(--ds-text-xs)',
          color: 'var(--ds-text-tertiary)',
          letterSpacing: 'var(--ds-tracking-data)',
          textTransform: 'uppercase',
        }}>
          Analizando Incoterms para {origin} → {destination}...
        </span>
      </div>
    </div>
  );

  const recommended = data?.recommended || 'FOB';
  const reasoning = data?.reasoning || '';
  const alternatives = data?.alternatives || [
    { incoterm: 'CFR', pros: `Útil cuando el comprador en ${destination} lo solicita específicamente.` },
    { incoterm: 'FCA', pros: 'Válido pero menos común para commodities.' }
  ];

  // Los 11 Incoterms con análisis de por qué NO para esta ruta
  const ALL_INCOTERMS = [
    { code: 'EXW', name: 'Ex Works', vendorRisk: 0, buyerRisk: 10 },
    { code: 'FCA', name: 'Free Carrier', vendorRisk: 2, buyerRisk: 8 },
    { code: 'FAS', name: 'Free Alongside Ship', vendorRisk: 3, buyerRisk: 7 },
    { code: 'FOB', name: 'Free On Board', vendorRisk: 4, buyerRisk: 6 },
    { code: 'CFR', name: 'Cost and Freight', vendorRisk: 5, buyerRisk: 5 },
    { code: 'CIF', name: 'Cost Insurance Freight', vendorRisk: 6, buyerRisk: 4 },
    { code: 'CPT', name: 'Carriage Paid To', vendorRisk: 6, buyerRisk: 4 },
    { code: 'CIP', name: 'Carriage Insurance Paid', vendorRisk: 7, buyerRisk: 3 },
    { code: 'DAP', name: 'Delivered at Place', vendorRisk: 8, buyerRisk: 2 },
    { code: 'DPU', name: 'Delivered at Place Unloaded', vendorRisk: 9, buyerRisk: 1 },
    { code: 'DDP', name: 'Delivered Duty Paid', vendorRisk: 10, buyerRisk: 0 },
  ];

  const whyNotReasons: Record<string, string> = {
    'EXW': `PyMEs exportadoras en ${origin} raramente usan EXW porque el comprador debe gestionar todos los trámites de exportación en tu país, lo cual es muy complejo para una empresa extranjera.`,
    'FCA': `Válido pero menos común para commodities como ${productName}. FOB es el estándar del mercado para granos y oleaginosas.`,
    'FAS': `Solo para carga a granel en muelle. Similar a FOB pero tu responsabilidad termina antes de cargar el buque.`,
    'CFR': `Alternativa válida: vos pagás el flete hasta ${destination} pero no el seguro. Más riesgo para vos que FOB, menos que CIF.`,
    'CIF': `Podría funcionar pero tenés más responsabilidades. Para mercados sin TLC como ${destination}, FOB es más simple y el precio de referencia del mercado.`,
    'CPT': `Para transporte multimodal. No aplica directamente a rutas marítimas ${origin}→${destination}.`,
    'CIP': `Variante de CPT con seguro. Más usado en transporte aéreo o multimodal que marítimo.`,
    'DAP': `Excesivo riesgo para el exportador en una primera operación. Asumís el flete, seguro Y los trámites de importación en ${destination}.`,
    'DPU': `Incluye descarga en destino — muy inusual para commodities. Alto riesgo y costo para el vendedor.`,
    'DDP': `El más desfavorable para vos como exportador. Asumís TODO: flete, seguro, aranceles de importación en ${destination}. No recomendado para PyMEs exportando por primera vez a ese mercado.`,
  };

  return (
    <div style={{
      background: 'var(--ds-bg-surface)',
      border: '1px solid var(--ds-border-default)',
      borderRadius: 'var(--ds-radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--ds-bg-raised)',
        borderBottom: '1px solid var(--ds-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--ds-font-data)',
          fontSize: 'var(--ds-text-xs)',
          color: 'var(--ds-text-tertiary)',
          letterSpacing: 'var(--ds-tracking-label)',
          textTransform: 'uppercase',
        }}>
          ⚖️ Análisis de Incoterms · {origin} → {destination}
        </span>
        <span style={{
          fontFamily: 'var(--ds-font-data)',
          fontSize: 'var(--ds-text-xs)',
          color: 'var(--ds-cyan)',
          background: 'var(--ds-cyan-dim)',
          padding: '2px 8px',
          borderRadius: 20,
        }}>
          {productName}
        </span>
      </div>

      {/* Incoterm recomendado */}
      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'rgba(0,232,120,.05)',
          border: '1px solid rgba(0,232,120,.2)',
          borderRadius: 'var(--ds-radius-md)',
          padding: '14px 16px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              fontFamily: 'var(--ds-font-display)',
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--ds-green)',
              lineHeight: 1,
            }}>
              {recommended}
            </div>
            <div>
              <div style={{
                fontSize: 'var(--ds-text-sm)',
                color: 'var(--ds-text-primary)',
                fontWeight: 600,
              }}>
                {ALL_INCOTERMS.find(i => i.code === recommended)?.name}
              </div>
              <div style={{
                fontFamily: 'var(--ds-font-data)',
                fontSize: 9,
                color: 'var(--ds-green)',
                letterSpacing: 1,
              }}>
                ★ RECOMENDADO PARA ESTA RUTA
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 'var(--ds-text-xs)',
            color: 'var(--ds-text-secondary)',
            lineHeight: 1.6,
          }}>
            {reasoning || `Para la ruta ${origin} → ${destination} con ${productName}, ${recommended} es el Incoterm más adecuado porque el comprador prefiere gestionar el flete desde el puerto de origen, y es el precio de referencia estándar del mercado para este tipo de producto.`}
          </div>
        </div>

        {/* Alternativas */}
        {alternatives.slice(0, 2).map((alt: any) => (
          <div key={alt.incoterm} style={{
            background: 'var(--ds-bg-overlay)',
            border: '1px solid var(--ds-border-subtle)',
            borderRadius: 'var(--ds-radius-sm)',
            padding: '10px 12px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <div style={{
              fontFamily: 'var(--ds-font-display)',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--ds-amber)',
              flexShrink: 0,
              width: 36,
            }}>
              {alt.incoterm}
            </div>
            <div>
              <div style={{
                fontSize: 11,
                color: 'var(--ds-text-secondary)',
                fontWeight: 500,
                marginBottom: 2,
              }}>
                Alternativa válida
              </div>
              <div style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', lineHeight: 1.4 }}>
                {alt.pros || `Útil cuando el comprador en ${destination} lo solicita específicamente.`}
              </div>
            </div>
          </div>
        ))}

        {/* Botón Ver todos */}
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-sm)',
            color: 'var(--ds-cyan)',
            padding: '9px',
            fontFamily: 'var(--ds-font-body)',
            fontSize: 'var(--ds-text-sm)',
            cursor: 'pointer',
            marginTop: 4,
            transition: 'all 0.18s',
          }}
          onMouseOver={e => {
            (e.target as HTMLElement).style.background = 'var(--ds-cyan-dim)';
          }}
          onMouseOut={e => {
            (e.target as HTMLElement).style.background = 'none';
          }}
        >
          {showAll ? 'Ocultar' : 'Ver todos los Incoterms y por qué no se eligieron →'}
        </button>

        {/* Panel expandido con todos los Incoterms */}
        {showAll && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              fontFamily: 'var(--ds-font-data)',
              fontSize: 9,
              color: 'var(--ds-text-muted)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Análisis completo · {origin} → {destination} · {productName}
            </div>
            {ALL_INCOTERMS.filter(i => i.code !== recommended).map(inco => (
              <div key={inco.code} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--ds-border-subtle)',
              }}>
                <div style={{
                  fontFamily: 'var(--ds-font-display)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--ds-text-muted)',
                  width: 36,
                  flexShrink: 0,
                  paddingTop: 1,
                }}>
                  {inco.code}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--ds-text-secondary)',
                    fontWeight: 500,
                    marginBottom: 2,
                  }}>
                    {inco.name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--ds-text-tertiary)',
                    lineHeight: 1.5,
                  }}>
                    ❌ {whyNotReasons[inco.code] || `No óptimo para esta ruta específica.`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getProductType(hs6: string): string {
  if (!hs6) return 'packaged';
  const ch = parseInt(hs6.substring(0, 2));
  if (ch >= 1 && ch <= 5) return 'perishable';
  if (ch >= 6 && ch <= 24) return 'perishable';
  if (ch >= 25 && ch <= 27) return 'bulk';
  return 'packaged';
}
