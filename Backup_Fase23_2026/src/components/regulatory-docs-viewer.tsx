
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exportRegulatoryDocsPDF } from "@/lib/pdf-export";
import { useLanguage } from "@/hooks/use-language";

interface RegulatoryDocsViewerProps {
  hsCode: string;
  countryCode: string; // Destination
  countryName?: string;
  productName?: string;
}

interface RegulatoryRule {
  id: string;
  countryCode: string;
  hsChapter: string;
  documentName: string;
  issuer: string;
  description: string;
  requirements: string;
  priority: number;
}

export function RegulatoryDocsViewer({ hsCode, countryCode, countryName = "Destino", productName = "Producto" }: RegulatoryDocsViewerProps) {
  const { language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch docs
  const { data: docs, isLoading, isError } = useQuery<RegulatoryRule[]>({
    queryKey: ['/api/market-analysis/docs', hsCode, countryCode],
    queryFn: async () => {
        if (!hsCode || !countryCode) return [];
        const response = await fetch(`/api/market-analysis/docs?code=${hsCode}&country=${countryCode}`);
        if (!response.ok) throw new Error('Failed to fetch docs');
        return response.json();
    },
    enabled: !!hsCode && !!countryCode
  });

  const handleExport = () => {
    if (!docs || docs.length === 0) return;
    setIsExporting(true);
    
    try {
        exportRegulatoryDocsPDF(docs, {
            hsCode,
            productName,
            countryCode,
            countryName
        });
    } catch (e) {
        console.error("Export failed", e);
    } finally {
        setIsExporting(false);
    }
  };

  if (!hsCode || !countryCode) {
    return (
        <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6 text-center text-slate-500">
                Seleccione un producto y país para ver los requisitos documentales.
            </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
        <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
  }

  if (isError) {
    return (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Error al cargar documentos regulatorios.
            </CardContent>
        </Card>
    );
  }

  const hasDocs = docs && docs.length > 0;

  return (
    <Card className="w-full shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Requisitos Documentales
                </CardTitle>
                <CardDescription className="text-blue-700 mt-1">
                    Regulaciones para exportar HS {hsCode} a {countryName}
                </CardDescription>
            </div>
            {hasDocs && (
                <Button 
                    variant="outline" 
                    className="border-blue-200 text-blue-700 hover:bg-white hover:text-blue-800"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Generando...' : 'Exportar PDF'}
                </Button>
            )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {!hasDocs ? (
             <div className="text-center py-8">
                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <p className="text-slate-600 font-medium">No se encontraron requisitos específicos.</p>
                 <p className="text-slate-400 text-sm mt-1">Es posible que apliquen solo las normas generales de la OMC.</p>
             </div>
        ) : (
            <div className="space-y-4">
                {docs.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow">
                        <div className="p-3 rounded-lg bg-orange-50 text-orange-600 h-fit">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                <h4 className="font-semibold text-slate-900">{doc.documentName}</h4>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {doc.issuer}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{doc.description}</p>
                            <div className="bg-slate-50 p-2 rounded text-xs text-slate-500 flex gap-2 items-center border border-slate-100">
                                <span className="font-medium text-slate-700">Requisito:</span>
                                {doc.requirements}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
