import { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { Bot, RefreshCw, FileText } from 'lucide-react';

interface AiAnalysisWidgetProps {
  hsCode: string;
  originCountry: string;
  targetCountry: string;
  productName?: string;
  className?: string;
  compact?: boolean;
}

export function AiAnalysisWidget({ 
  hsCode, 
  originCountry, 
  targetCountry, 
  productName,
  className = "",
  compact = false
}: AiAnalysisWidgetProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  // AI Analysis Mutation
  const aiMutation = useMutation({
    mutationFn: async () => {
      console.log('[AI Widget] Requesting analysis for:', { hsCode, originCountry, targetCountry });
      const res = await fetch('/api/ai/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hsCode, 
          originCountry, 
          targetCountry: targetCountry || 'Global', 
          productName 
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to generate analysis: ${errorText}`);
      }
      return res.json();
    },
    onError: (err) => {
      console.error('[AI Widget] Error:', err);
    }
  });

  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-lg border border-cyan-500/30 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
            <h2 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white flex items-center gap-2`}>
                <Bot className={compact ? "w-4 h-4 text-cyan-400" : "w-6 h-6 text-cyan-400"} /> 
                {language === 'es' ? 'Análisis de Mercado IA' : 'AI Market Analysis'}
            </h2>
            {aiMutation.isPending && (
                <span className="text-cyan-400 animate-pulse text-xs flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {language === 'es' ? 'Analizando...' : 'Analyzing...'}
                </span>
            )}
        </div>
        
        {!aiMutation.data ? (
            <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-3">
                    {language === 'es' 
                        ? 'Obtenga un reporte estratégico instantáneo basado en datos históricos y tendencias actuales.' 
                        : 'Get an instant strategic report based on historical data and current trends.'}
                </p>
                <Button 
                    onClick={() => aiMutation.mutate()} 
                    disabled={aiMutation.isPending}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
                    size={compact ? "sm" : "default"}
                >
                    {language === 'es' ? 'Generar Informe Estratégico' : 'Generate Strategic Report'}
                </Button>
            </div>
        ) : (
            <div className="mt-3 animate-in fade-in duration-500">
                <div className={`p-3 bg-[#0D2137]/80 rounded border border-cyan-500/20 text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap leading-relaxed ${compact ? 'max-h-[200px]' : 'max-h-[300px]'}`}>
                    {typeof aiMutation.data.analysis === 'string' 
                        ? aiMutation.data.analysis.replace(/## /g, '').replace(/\*\*/g, '') 
                        : 'Analysis generated.'}
                </div>
                <div className="flex gap-2 mt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => aiMutation.reset()}
                        className="flex-1 text-xs text-gray-400 hover:text-white"
                    >
                        {language === 'es' ? 'Generar Nuevo' : 'Reset'}
                    </Button>
                     {/* Placeholder for PDF export in future */}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-xs text-cyan-400 hover:text-cyan-300"
                        onClick={() => alert('PDF export coming soon')}
                    >
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
