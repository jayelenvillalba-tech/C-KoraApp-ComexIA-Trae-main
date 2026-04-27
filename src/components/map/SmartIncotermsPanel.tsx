import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Truck } from "lucide-react";

interface IncoTermDef {
  code: string;
  name: string;
  category: 'recommended' | 'alternative' | 'avoid';
  sellerRisk: number; // 0–100
  reasoning: string;
  reasoningEn: string;
}

function getIncotermsForRoute(origin: string, destination: string): IncoTermDef[] {
  // Distance/complexity heuristic
  const same_region = (
    (["AR","BR","CL","UY","PY","BO","PE","CO"].includes(origin) && ["AR","BR","CL","UY","PY","BO","PE","CO"].includes(destination)) ||
    (["DE","FR","IT","ES","NL","BE","AT","CH"].includes(origin) && ["DE","FR","IT","ES","NL","BE","AT","CH"].includes(destination))
  );
  const long_haul = !same_region;

  if (long_haul) {
    return [
      { code: "FOB", name: "Free On Board", category: "recommended", sellerRisk: 20,
        reasoning: "El vendedor entrega en puerto de origen — la responsabilidad pasa al comprador al embarque. Ideal para rutas de larga distancia como esta.",
        reasoningEn: "Seller delivers to origin port — risk transfers to buyer at shipment. Ideal for long-haul routes like this one." },
      { code: "CIF", name: "Cost, Insurance and Freight", category: "alternative", sellerRisk: 55,
        reasoning: "El vendedor cubre flete y seguro hasta destino. Útil cuando el comprador prefiere no gestionar el transporte marítimo.",
        reasoningEn: "Seller covers freight and insurance to destination. Useful when the buyer prefers not to manage maritime transport." },
      { code: "DAP", name: "Delivered at Place", category: "alternative", sellerRisk: 75,
        reasoning: "El vendedor asume todo el transporte hasta destino pero sin despachar en aduana destino. Mayor riesgo para el vendedor.",
        reasoningEn: "Seller assumes all transport to destination without customs clearance. Higher risk for the seller." },
      { code: "DDP", name: "Delivered Duty Paid", category: "avoid", sellerRisk: 95,
        reasoning: "El vendedor asume todos los costos incluyendo impuestos en destino. Muy alto riesgo e imprevisibilidad de costos aduaneros en destino.",
        reasoningEn: "Seller bears all costs including destination taxes. Very high risk and unpredictable customs costs at destination." },
    ];
  } else {
    return [
      { code: "DAP", name: "Delivered at Place", category: "recommended", sellerRisk: 60,
        reasoning: "Ruta regional corta — el vendedor puede entregar fácilmente en punto acordado sin incurrir en costos marítimos elevados.",
        reasoningEn: "Short regional route — seller can easily deliver to agreed point without high maritime costs." },
      { code: "FCA", name: "Free Carrier", category: "alternative", sellerRisk: 30,
        reasoning: "Flexibilidad de transporte multimodal. El riesgo pasa al comprador cuando el transportista recoge la mercancía.",
        reasoningEn: "Multi-modal transport flexibility. Risk transfers to buyer when the carrier collects the goods." },
      { code: "EXW", name: "Ex Works", category: "avoid", sellerRisk: 5,
        reasoning: "Mínimo riesgo para el vendedor, pero el comprador debe gestionar todo desde la fábrica — complejo y puede frenar ventas.",
        reasoningEn: "Minimum seller risk, but buyer must manage everything from the factory — complex and may deter sales." },
    ];
  }
}

const CATEGORY_CONFIG = {
  recommended: { label: "✅ Recomendado", labelEn: "✅ Recommended", color: "#69f6b9", bg: "rgba(105,246,185,.08)", border: "rgba(105,246,185,.25)", icon: CheckCircle },
  alternative:  { label: "⚠️ Alternativa", labelEn: "⚠️ Alternative", color: "#f5a800", bg: "rgba(245,168,0,.08)", border: "rgba(245,168,0,.25)", icon: AlertTriangle },
  avoid:        { label: "🔴 No recomendado", labelEn: "🔴 Not recommended", color: "#ffb4ab", bg: "rgba(255,180,171,.08)", border: "rgba(255,180,171,.25)", icon: XCircle },
};

interface Props {
  origin: string;
  destination: string;
  language: string;
}

export function SmartIncotermsPanel({ origin, destination, language }: Props) {
  const [expanded, setExpanded] = useState(false);
  const terms = getIncotermsForRoute(origin, destination);
  const recommended = terms.filter(t => t.category === 'recommended');
  const others = terms.filter(t => t.category !== 'recommended');

  const isEs = language === 'es';

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-slate-800/20 backdrop-blur-xl border border-white/10 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          {isEs ? "⚓ Análisis de Incoterms" : "⚓ Incoterms Analysis"}
          <Badge className="ml-auto text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {isEs ? `Ruta ${origin}→${destination}` : `Route ${origin}→${destination}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Recommended — always visible */}
        {recommended.map(term => {
          const cfg = CATEGORY_CONFIG[term.category];
          return (
            <div key={term.code}
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 800, color: cfg.color }}>{term.code}</span>
                <span style={{ fontSize: 12, color: '#c8dff0', opacity: 0.8 }}>{term.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: cfg.color, fontWeight: 700 }}>
                  {isEs ? cfg.label : cfg.labelEn}
                </span>
              </div>
              {/* Risk bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#4a7090', minWidth: 90 }}>
                  {isEs ? 'Riesgo vendedor' : 'Seller risk'}
                </span>
                <div style={{ flex: 1, height: 4, background: '#0d2035', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${term.sellerRisk}%`, height: '100%', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)`, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{term.sellerRisk}%</span>
              </div>
              <p style={{ fontSize: 12, color: '#8aafc0', margin: 0, lineHeight: 1.5 }}>
                {isEs ? term.reasoning : term.reasoningEn}
              </p>
            </div>
          );
        })}

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-slate-400 hover:text-white hover:bg-white/5 text-xs border border-white/10"
        >
          {expanded
            ? (isEs ? "Ocultar tabla completa" : "Hide full table")
            : (isEs ? "Ver alternativas y no recomendados" : "View alternatives & not recommended")}
          {expanded ? <ChevronUp className="ml-2 w-3 h-3" /> : <ChevronDown className="ml-2 w-3 h-3" />}
        </Button>

        {/* Other terms — collapsed by default */}
        {expanded && others.map(term => {
          const cfg = CATEGORY_CONFIG[term.category];
          return (
            <div key={term.code}
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 800, color: cfg.color }}>{term.code}</span>
                <span style={{ fontSize: 11, color: '#c8dff0', opacity: 0.7 }}>{term.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: cfg.color, fontWeight: 600 }}>
                  {isEs ? cfg.label : cfg.labelEn}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#8aafc0', margin: 0, lineHeight: 1.4 }}>
                {isEs ? term.reasoning : term.reasoningEn}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
