import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TrendingUp, Globe, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import HistoricalChart from '@/components/market-analysis/historical-chart';
import ConfidenceBadge from '@/components/market-analysis/confidence-badge';

export default function MarketAnalysisDetail() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  // Get query parameters
  const params = new URLSearchParams(window.location.search);
  const hsCode = params.get('code') || '';
  const country = params.get('country') || 'CN';
  const operation = params.get('operation') || 'export';
  const productName = params.get('product') || '';

  // Fetch market analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['market-analysis', hsCode, country, operation],
    queryFn: async () => {
      const res = await fetch(`/api/market-analysis?hsCode=${hsCode}&country=${country}&operation=${operation}`);
      if (!res.ok) throw new Error('Failed to fetch analysis');
      return res.json();
    },
    enabled: !!hsCode && !!country
  });

  // Fetch historical data
  const { data: historical, isLoading: historicalLoading } = useQuery({
    queryKey: ['market-historical', hsCode, country],
    queryFn: async () => {
      const res = await fetch(`/api/market-analysis/historical/${hsCode}/${country}`);
      if (!res.ok) throw new Error('Failed to fetch historical data');
      return res.json();
    },
    enabled: !!hsCode && !!country
  });

  const marketData = analysis?.analysis;
  const chartData = historical?.data || [];

  return (
    <div className="min-h-screen bg-[#0A1929]">
      {/* Header */}
      <div className="bg-[#0D2137] border-b border-cyan-900/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-cyan-400"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === 'es' ? 'Volver' : 'Back'}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {language === 'es' ? 'Análisis de Mercado' : 'Market Analysis'}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                <Globe className="w-4 h-4" />
                <span>{productName || hsCode}</span>
                <span>→</span>
                <span>{country}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {analysisLoading ? (
          <div className="text-center py-20 text-gray-400">
            {language === 'es' ? 'Cargando análisis...' : 'Loading analysis...'}
          </div>
        ) : marketData ? (
          <>
            {/* Market Size Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
                <div className="text-sm text-gray-400 mb-2">
                  {language === 'es' ? 'Tamaño de Mercado' : 'Market Size'}
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${marketData.marketSize.estimated}M USD
                </div>
                <ConfidenceBadge 
                  level={marketData.marketSize.confidence} 
                  dataPoints={chartData.filter((d: any) => !d.projected).length}
                />
              </div>

              <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
                <div className="text-sm text-gray-400 mb-2">
                  {language === 'es' ? 'Crecimiento Anual' : 'Annual Growth'}
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-6 h-6 ${marketData.marketSize.growthRate > 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <div className="text-3xl font-bold text-white">
                    {marketData.marketSize.growthRate > 0 ? '+' : ''}{marketData.marketSize.growthRate}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">CAGR 2018-2024</div>
              </div>

              <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
                <div className="text-sm text-gray-400 mb-2">
                  {language === 'es' ? 'Viabilidad' : 'Viability'}
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-2 capitalize">
                  {marketData.viability}
                </div>
                <div className="text-sm text-gray-400">
                  Score: {marketData.overallScore}/100
                </div>
              </div>
            </div>

            {/* Historical Chart */}
            {!historicalLoading && chartData.length > 0 && (
              <HistoricalChart
                data={chartData}
                trend={marketData.marketSize.trend}
                growthRate={marketData.marketSize.growthRate}
                productName={productName || hsCode}
              />
            )}

            {/* Competition & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competition */}
              <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {language === 'es' ? 'Competencia' : 'Competition'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{language === 'es' ? 'Nivel' : 'Level'}:</span>
                    <span className="text-white capitalize">{marketData.competition.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{language === 'es' ? 'Empresas Activas' : 'Active Companies'}:</span>
                    <span className="text-white">{marketData.competition.activeCompanies}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{language === 'es' ? 'Barrera de Entrada' : 'Entry Barrier'}:</span>
                    <span className="text-white capitalize">{marketData.competition.entryBarrier}</span>
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {language === 'es' ? 'Oportunidades' : 'Opportunities'}
                </h3>
                <div className="space-y-2">
                  {marketData.opportunities.slice(0, 3).map((opp: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <div className="text-cyan-400 font-medium">{opp.title}</div>
                      <div className="text-gray-400 text-xs">{opp.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#0D2137] rounded-lg p-6 border border-cyan-900/30">
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'es' ? 'Recomendaciones' : 'Recommendations'}
              </h3>
              <div className="space-y-3">
                {marketData.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#0A1929] rounded border border-cyan-900/30">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm">{rec.action}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {rec.timeframe}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            {language === 'es' ? 'No se encontraron datos' : 'No data found'}
          </div>
        )}
      </div>
    </div>
  );
}
