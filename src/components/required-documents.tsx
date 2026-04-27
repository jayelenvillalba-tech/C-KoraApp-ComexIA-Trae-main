import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Clock, CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface RequiredDocumentsProps {
  hsCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  incoterm?: string;
  direction?: 'import' | 'export';
}

export function RequiredDocuments({
  hsCode,
  originCountry,
  destinationCountry,
  incoterm,
  direction
}: RequiredDocumentsProps) {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/agreements/documents', hsCode, originCountry, destinationCountry],
    enabled: !!hsCode && !!originCountry && !!destinationCountry,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('hsCode', hsCode!);
      params.set('origin', originCountry!);
      params.set('destination', destinationCountry!);
      
      const response = await fetch(`/api/agreements/documents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const categoryNames: any = {
    commercial: { es: 'Comerciales', en: 'Commercial' },
    transport: { es: 'Transporte', en: 'Transport' },
    customs: { es: 'Aduaneros', en: 'Customs' },
    phyto: { es: 'Fitosanitarios', en: 'Phytosanitary' },
    sanitary: { es: 'Sanitarios', en: 'Sanitary' },
    technical: { es: 'Técnicos', en: 'Technical' },
    origin_cert: { es: 'Certificados de Origen', en: 'Origin Certificates' },
    product: { es: 'Específicos del Producto', en: 'Product-Specific' },
    financial: { es: 'Financieros', en: 'Financial' },
    other: { es: 'Otros', en: 'Other' }
  };

  const categoryIcons: any = {
    commercial: '🧾',
    transport: '🚢',
    customs: '🛃',
    phyto: '🌿',
    sanitary: '⚕️',
    technical: '⚙️',
    origin_cert: '📜',
    product: '📦',
    financial: '💰',
    other: '📄'
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {language === 'es' ? 'Documentos Requeridos' : 'Required Documents'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            {language === 'es' 
              ? 'Selecciona un país de destino para ver los documentos requeridos.'
              : 'Select a destination country to see required documents.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { required = [], conditional = [], warnings = [], dataSource } = data;
  const totalDocs = required.length + conditional.length;

  // Group by type
  const groupedDocs = [...required, ...conditional].reduce((acc: any, doc: any) => {
    const t = doc.type || 'other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(doc);
    return acc;
  }, {});

  return (
    <Card className="bg-[#03080f] border border-[var(--ds-border-default)]">
      <CardHeader className="bg-[var(--ds-bg-surface)] border-b border-[var(--ds-border-default)] py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm font-data uppercase tracking-[1px] font-bold">
            <FileText className="w-4 h-4 text-cyan-400" />
            {language === 'es' ? 'Ruta Documental' : 'Document Route'}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-[#0b1724] text-cyan-400 border-cyan-400/30 text-[10px] font-data font-bold">
              {totalDocs} {language === 'es' ? 'TOTAL' : 'TOTAL'}
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-400/30 text-[10px] font-data font-bold">
              {required.length} {language === 'es' ? 'REQUERIDOS' : 'REQUIRED'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 space-y-2 mb-4">
            <div className="text-amber-400 font-data text-[10px] font-bold uppercase flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Alertas Aduaneras
            </div>
            {warnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-amber-200/90 font-body leading-relaxed">{w}</p>
            ))}
          </div>
        )}

        {Object.entries(groupedDocs).map(([category, docs]: [string, any]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-bold font-data tracking-[1px] uppercase text-[#8aafcc] flex items-center gap-2 border-b border-[var(--ds-border-default)] pb-1">
              <span>{categoryIcons[category] || '📄'}</span>
              {language === 'es' ? (categoryNames[category]?.es || category) : (categoryNames[category]?.en || category)}
            </h4>
            
            <div className="space-y-2">
              {docs.map((doc: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#0b1724] rounded-md p-3 border border-white/5 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h5 className="text-[13px] font-semibold text-white">
                          {language === 'es' ? doc.name : doc.nameEn}
                        </h5>
                        {doc.isMandatory ? (
                          <Badge className="bg-red-500/10 hover:bg-red-500/10 text-red-400 border-red-400/20 text-[9px] h-4 py-0 font-data">Obligatorio</Badge>
                        ) : (
                          <Badge className="bg-[#4a7090]/10 hover:bg-[#4a7090]/10 text-[#4a7090] border-[#4a7090]/20 text-[9px] h-4 py-0 font-data">Condicional</Badge>
                        )}
                        {doc.confidence === 'ai_generated' && (
                          <Badge className="bg-purple-500/10 hover:bg-purple-500/10 text-purple-400 border-purple-400/20 text-[9px] h-4 py-0 font-data" title="Generado por IA">AI</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4a7090] font-body leading-relaxed">
                        {doc.notes || 'Documento requerido para liberación aduanera.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-[10px] font-data text-cyan-400/70">
                        <Clock className="w-3 h-3" />
                        Aprox {doc.processingDays || 1} {language === 'es' ? 'días' : 'days'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-data text-emerald-400/70">
                        <CheckCircle2 className="w-3 h-3" />
                        {doc.issuingBody || 'Autoridad Aduanera'}
                      </div>
                    </div>
                    
                    {doc.issuingUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[9px] font-data bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-100 uppercase tracking-[0.5px]"
                        onClick={() => window.open(doc.issuingUrl || '#', '_blank')}
                      >
                        {language === 'es' ? 'Tramitar' : 'Manage'} <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-md flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-[#8aafcc] font-body leading-relaxed">
            <div className="flex gap-4 mb-1 border-b border-cyan-500/20 pb-1">
              <p className="font-bold text-cyan-400 mb-0">
                {language === 'es' ? 'Costo Total Aprox:' : 'Est. Total Cost:'} <span className="text-white">${data.totalCostUsd || 0}</span>
              </p>
              <p className="font-bold text-cyan-400 mb-0">
                {language === 'es' ? 'Tiempo Crítico:' : 'Critical Time:'} <span className="text-white">Hasta {data.totalProcessingDays || 1} {language === 'es' ? 'días' : 'days'}</span>
              </p>
            </div>
            <p className="mt-1">
              {language === 'es'
                ? 'Los tiempos y costos son referenciales. Consulte siempre con un despachante de aduanas habilitado para verificar aranceles actualizados.'
                : 'Times and costs are reference figures. Always consult with a licensed customs broker to verify updated tariffs.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
