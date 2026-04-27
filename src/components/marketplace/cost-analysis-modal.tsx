import { useState, useEffect } from "react";
import { X, FileCheck, AlertTriangle, CheckCircle, DollarSign, Package, Ship, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

interface CostAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    productName: string;
    hsCode: string;
    quantity: string;
    price?: number;
    originCountry?: string;
    destinationCountry?: string;
    requirements?: string[];
    certifications?: string[];
  };
}

// Phase 33B: Maritime risk subcomponent (must be outside main component for hooks)
function MaritimeRiskSection({ originCountry, destinationCountry, cargoValue, language }: {
  originCountry: string; destinationCountry: string; cargoValue: number; language: string;
}) {
  const [routeRisk, setRouteRisk] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/maritime/route-risk?origin=${originCountry}&destination=${destinationCountry}&cargoValue=${cargoValue}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRouteRisk(data); })
      .catch(() => {});
  }, [originCountry, destinationCountry, cargoValue]);

  if (!routeRisk?.hasRisk) return null;
  const isHighRisk = routeRisk.highestRisk === 'high';

  return (
    <div className="space-y-3">
      {routeRisk.zonesAffected.map((zone: any) => (
        <div key={zone.id} className={`p-4 rounded-lg border ${isHighRisk ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/15 border-amber-500/25'}`}>
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isHighRisk ? 'text-red-400' : 'text-amber-400'}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${isHighRisk ? 'text-red-300' : 'text-amber-300'}`}>
                {language === 'es' ? 'ALERTA DE RUTA' : 'ROUTE ALERT'} — {zone.name.toUpperCase()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{zone.warningMessage}</p>
            </div>
          </div>
          {routeRisk.totalImpact?.extraDays > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-black/20 rounded p-2">
                <span className="text-gray-400">+{language === 'es' ? 'Días tránsito' : 'Transit days'}: </span>
                <span className="text-white font-bold">+{routeRisk.totalImpact.extraDays}</span>
              </div>
              <div className="bg-black/20 rounded p-2">
                <span className="text-gray-400">+{language === 'es' ? 'Flete' : 'Freight'}: </span>
                <span className="text-white font-bold">USD {routeRisk.totalImpact.extraFreightUsd?.toLocaleString()}</span>
              </div>
              {routeRisk.totalImpact.warRiskInsuranceUsd > 0 && (
                <div className="bg-black/20 rounded p-2 col-span-2">
                  <span className="text-gray-400">+{language === 'es' ? 'Seguro guerra (est.)' : 'War insurance (est.)'}: </span>
                  <span className="text-white font-bold">USD {routeRisk.totalImpact.warRiskInsuranceUsd?.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {zone.sources?.slice(0, 2).map((s: any) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline">{s.name}</a>
            ))}
          </div>
          <p className="text-[9px] text-gray-500 mt-2 italic">{zone.disclaimer}</p>
        </div>
      ))}
      {routeRisk.totalImpact?.hasOpportunity && (
        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
          <p className="text-sm text-emerald-300">{routeRisk.totalImpact.opportunityNote}</p>
        </div>
      )}
    </div>
  );
}

export default function CostAnalysisModal({ isOpen, onClose, post }: CostAnalysisModalProps) {
  const { language } = useLanguage();
  const [logisticsData, setLogisticsData] = useState<any>(null);
  const [loadingCosts, setLoadingCosts] = useState(false);

  // Fetch real freight costs 
  useEffect(() => {
    if (isOpen && post.originCountry && post.destinationCountry) {
      setLoadingCosts(true);
      fetch(`/api/logistics/calculate?origin=${post.originCountry}&destination=${post.destinationCountry}&hsCode=${post.hsCode}&containerType=20GP`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            setLogisticsData(data.data[0]); // usually sea-standard
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCosts(false));
    }
  }, [isOpen, post.originCountry, post.destinationCountry, post.hsCode]);

  // Simulated document compliance check
  const requiredDocs = [
    { name: "Factura Comercial", nameEn: "Commercial Invoice", required: true, hasIt: true },
    { name: "Certificado de Origen", nameEn: "Certificate of Origin", required: true, hasIt: true },
    { name: "Certificado Sanitario SENASA", nameEn: "SENASA Sanitary Certificate", required: true, hasIt: true },
    { name: "Inspección USDA", nameEn: "USDA Inspection", required: true, hasIt: false },
    { name: "Etiquetado FDA", nameEn: "FDA Labeling", required: true, hasIt: false },
    { name: "Bill of Lading", nameEn: "Bill of Lading", required: true, hasIt: false },
    { name: "Packing List", nameEn: "Packing List", required: true, hasIt: true },
  ];

  const compliantDocs = requiredDocs.filter(d => d.hasIt).length;
  const totalDocs = requiredDocs.length;
  const compliancePercentage = Math.round((compliantDocs / totalDocs) * 100);

  // Default simulated cost breakdown
  let productValue = post.price ? (post.price * parseInt(post.quantity.replace(/\D/g, '') || '1')) : 62500;
  if (!productValue || isNaN(productValue) || productValue === 0) productValue = 62500;

  let transportCost = 3200;
  let transportLabel = 'Transporte Marítimo Estándar';

  if (logisticsData && logisticsData.cost) {
    // Attempt to extract numeric base cost from "USD 1,200 - 1,500"
    const match = logisticsData.cost.match(/\d+(,\d+)?/);
    if (match) {
      transportCost = parseInt(match[0].replace(/,/g, ''), 10);
      transportLabel = logisticsData.name || transportLabel;
    }
  }

  const costs = {
    productValue, 
    transport: transportCost,
    insurance: Math.round(productValue * 0.0045), // 0.45% of value
    customsDuties: Math.round(productValue * 0.04), // 4% tariff guess
    handling: 450,
    documentation: 300,
  };

  const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0D2137] border-cyan-900/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-cyan-400" />
            {language === 'es' ? 'Análisis de Costos y Documentación' : 'Cost & Documentation Analysis'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Product Info */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-2">{post.productName}</h3>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>HS Code: {post.hsCode}</span>
                <span>•</span>
                <span>{post.quantity}</span>
                <span>•</span>
                <span>{post.originCountry} → {post.destinationCountry}</span>
              </div>
              {logisticsData?.details?.distanceNm && (
                <div className="mt-2 text-sm text-cyan-300">
                  <Ship className="w-4 h-4 inline mr-1" />
                  Ruta Estimada: {logisticsData.details.distanceNm.toLocaleString()} mn ({logisticsData.totalDuration})
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Compliance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                {language === 'es' ? 'Cumplimiento Documental' : 'Document Compliance'}
              </h3>
              <Badge 
                variant={compliancePercentage >= 80 ? "default" : "destructive"}
                className={compliancePercentage >= 80 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}
              >
                {compliancePercentage}% {language === 'es' ? 'Completo' : 'Complete'}
              </Badge>
            </div>

            <div className="space-y-2">
              {requiredDocs.map((doc, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    doc.hasIt ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {doc.hasIt ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className="text-sm text-white">
                      {language === 'es' ? doc.name : doc.nameEn}
                    </span>
                  </div>
                  <Badge variant="outline" className={doc.hasIt ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"}>
                    {doc.hasIt 
                      ? (language === 'es' ? 'Disponible' : 'Available')
                      : (language === 'es' ? 'Faltante' : 'Missing')
                    }
                  </Badge>
                </div>
              ))}
            </div>

            {compliancePercentage < 100 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      {language === 'es' ? 'Documentos Faltantes' : 'Missing Documents'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {language === 'es' 
                        ? `Te faltan ${totalDocs - compliantDocs} documentos para completar el proceso de exportación. Contacta al vendedor para coordinar.`
                        : `You are missing ${totalDocs - compliantDocs} documents to complete the export process. Contact the seller to coordinate.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-cyan-400" />
              {language === 'es' ? 'Desglose de Costos Estimados' : 'Estimated Cost Breakdown'}
            </h3>

            {loadingCosts ? (
               <div className="flex justify-center items-center p-8 space-x-2">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                 <span className="text-cyan-400 text-sm animate-pulse">Calculando flete marítimo real...</span>
               </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{language === 'es' ? 'Valor del Producto (FOB)' : 'Product Value (FOB)'}</span>
                  <span className="text-white font-semibold">${costs.productValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-cyan-900/20 border border-cyan-800/30 rounded-lg">
                  <span className="text-cyan-100 flex items-center gap-2">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    {transportLabel}
                  </span>
                  <span className="text-cyan-400 font-bold">${costs.transport.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{language === 'es' ? 'Seguro de Carga' : 'Cargo Insurance'}</span>
                  <span className="text-white font-semibold">${costs.insurance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{language === 'es' ? 'Aranceles Aduanales' : 'Customs Duties'}</span>
                  <span className="text-white font-semibold">${costs.customsDuties.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{language === 'es' ? 'Manejo y Almacenaje' : 'Handling & Storage'}</span>
                  <span className="text-white font-semibold">${costs.handling.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {language === 'es' ? 'Documentación' : 'Documentation'}
                  </span>
                  <span className="text-white font-semibold">${costs.documentation.toLocaleString()}</span>
                </div>

                <div className="flex justify-between p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-lg mt-4">
                  <span className="text-cyan-300 font-bold text-lg">
                    {language === 'es' ? 'Costo Total Landed (CIF/DAP)' : 'Total Landed Cost (CIF/DAP)'}
                  </span>
                  <span className="text-cyan-300 font-bold text-xl">${totalCost.toLocaleString()}</span>
                </div>

                <p className="text-xs text-gray-500 text-center mt-2">
                  * Basado en tarifas de mercado actualizadas a 2024 para contenedores 20GP.
                </p>
              </div>
            )}
          </div>

          {/* Maritime Risk — Phase 33B */}
          {post.originCountry && post.destinationCountry && (
            <MaritimeRiskSection
              originCountry={post.originCountry}
              destinationCountry={post.destinationCountry}
              cargoValue={costs.productValue}
              language={language}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/5"
            >
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
            <Button
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => {
                onClose();
              }}
            >
              {language === 'es' ? 'Contactar Vendedor' : 'Contact Seller'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
