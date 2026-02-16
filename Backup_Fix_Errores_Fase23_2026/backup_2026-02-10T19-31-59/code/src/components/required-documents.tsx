import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { getManagementLink } from "@shared/documents-data";

interface RequiredDocument {
  id: string;
  name: string;
  nameEs: string;
  category: 'commercial' | 'transport' | 'customs' | 'product' | 'financial';
  description: string;
  descriptionEs: string;
  processingDays?: number;
  mandatory: boolean;
  status: 'mandatory' | 'optional' | 'conditional';
  managementLinks: {
    [countryCode: string]: {
      url: string;
      authority: string;
      authorityEs: string;
    };
  };
}

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
    queryKey: ['/api/documents/required', hsCode, originCountry, destinationCountry, incoterm, direction],
    enabled: !!hsCode || !!originCountry || !!destinationCountry,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (hsCode) params.set('hsCode', hsCode);
      if (originCountry) params.set('originCountry', originCountry);
      if (destinationCountry) params.set('destinationCountry', destinationCountry);
      if (incoterm) params.set('incoterm', incoterm);
      if (direction) params.set('direction', direction);

      const response = await fetch(`/api/documents/required?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const documents: RequiredDocument[] = data?.documents || [];
  const grouped: Record<string, RequiredDocument[]> = data?.grouped || {};
  const totalDocs = data?.total || 0;
  const mandatoryDocs = documents.filter(d => d.status === 'mandatory').length;

  const categoryNames = {
    commercial: { es: 'Comerciales', en: 'Commercial' },
    transport: { es: 'Transporte', en: 'Transport' },
    customs: { es: 'Aduaneros', en: 'Customs' },
    product: { es: 'Específicos del Producto', en: 'Product-Specific' },
    financial: { es: 'Financieros', en: 'Financial' }
  };

  const categoryIcons = {
    commercial: '🧾',
    transport: '🚢',
    customs: '🛃',
    product: '📦',
    financial: '💰'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'mandatory':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'es' ? 'Obligatorio' : 'Mandatory'}
          </Badge>
        );
      case 'conditional':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {language === 'es' ? 'Condicional' : 'Conditional'}
          </Badge>
        );
      case 'optional':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs flex items-center gap-1">
            <Info className="w-3 h-3" />
            {language === 'es' ? 'Opcional' : 'Optional'}
          </Badge>
        );
      default:
        return null;
    }
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

  if (documents.length === 0) {
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

  return (
    <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {language === 'es' ? 'Documentos Requeridos' : 'Required Documents'}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              {totalDocs} {language === 'es' ? 'total' : 'total'}
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-400/30">
              {mandatoryDocs} {language === 'es' ? 'obligatorios' : 'mandatory'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([category, docs]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
              {language === 'es' 
                ? categoryNames[category as keyof typeof categoryNames].es 
                : categoryNames[category as keyof typeof categoryNames].en}
            </h4>
            <div className="space-y-2">
              {docs.map((doc) => {
                const managementLink = getManagementLink(doc, originCountry || destinationCountry);
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className="text-sm font-medium text-white">
                            {language === 'es' ? doc.nameEs : doc.name}
                          </h5>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {language === 'es' ? doc.descriptionEs : doc.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-3 flex-wrap">
                        {doc.processingDays && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {doc.processingDays} {language === 'es' ? 'días' : 'days'}
                          </div>
                        )}
                        {managementLink && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'es' ? managementLink.authorityEs : managementLink.authority}
                          </div>
                        )}
                      </div>
                      
                      {managementLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 flex items-center gap-1"
                          onClick={() => window.open(managementLink.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {language === 'es' ? 'Gestionar aquí' : 'Manage here'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300 space-y-1">
              <p className="font-semibold">
                {language === 'es' ? 'Información importante:' : 'Important information:'}
              </p>
              <p>
                {language === 'es'
                  ? 'Los tiempos de procesamiento son estimados. Haz clic en "Gestionar aquí" para acceder al sitio oficial de cada autoridad y obtener información actualizada sobre requisitos y procedimientos.'
                  : 'Processing times are estimated. Click "Manage here" to access the official site of each authority and get updated information on requirements and procedures.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
