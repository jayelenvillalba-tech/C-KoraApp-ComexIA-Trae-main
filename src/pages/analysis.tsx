import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { ChevronLeft, ChevronRight, Ship, TrendingUp, AlertCircle, Globe, MapPin } from 'lucide-react';
import LogisticsSimulator from '@/components/logistics-simulator';
import CostCalculatorDialog from '@/components/cost-calculator-dialog';
import { MarketTrendsChart } from "@/components/market-trends-chart";
import InteractiveMap from '@/components/map/interactive-map';
import { HistoricalChart } from '@/components/market-analysis/historical-chart';

export default function Analysis() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showLogisticsSimulator, setShowLogisticsSimulator] = useState(false);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  
  // Get query parameters
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || '';
  const country = params.get('country') || 'AR';
  const operation = params.get('operation') || 'export';
  const product = params.get('product') || '';

  // [FIX] Fetch real requirements data
  const { data: requirements } = useQuery<any>({
    queryKey: ["/api/country-requirements", selectedCountry, code],
    queryFn: async () => {
      // Find country code for selected country name
      let targetCode = 'US'; // Default fallback
      if (selectedCountry?.includes('China')) targetCode = 'CN';
      if (selectedCountry?.includes('Alemania')) targetCode = 'DE';
      if (selectedCountry?.includes('Brasil')) targetCode = 'BR';
      if (selectedCountry?.includes('Chile')) targetCode = 'CL';
      if (selectedCountry?.includes('Europa')) targetCode = 'EU';
      if (selectedCountry?.includes('Japón') || selectedCountry?.includes('Japan')) targetCode = 'JP';
      if (selectedCountry?.includes('Australia')) targetCode = 'AU';
      if (selectedCountry?.includes('México') || selectedCountry?.includes('Mexico')) targetCode = 'MX';
      if (selectedCountry?.includes('Rusia') || selectedCountry?.includes('Russia')) targetCode = 'RU';
      
      console.log('[DEBUG ANALYSIS] Fetching reqs for:', targetCode, code);
      const response = await fetch(`/api/country-requirements/${targetCode}/${code}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedCountry && !!code,
  });

  const globalNews = [
    {
      title: language === 'es' ? 'Aumento de la demanda de carne argentina en Asia' : 'Increase in demand for Argentine beef in Asia',
      image: 'bg-gradient-to-br from-orange-500 to-red-600'
    },
    {
      title: language === 'es' ? 'Nuevas regulaciones de exportación en la UE' : 'New export regulations in the EU',
      image: 'bg-gradient-to-br from-blue-500 to-purple-600'
    }
  ];

  // Fetch market analysis for dynamic data
  const { data: marketAnalysis } = useQuery<any>({
    queryKey: ['market-analysis', code, country, operation],
    queryFn: async () => {
      if (!code) return null;
      const res = await fetch(`/api/market-analysis?hsCode=${code}&country=${country}&operation=${operation}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!code
  });

  const topBuyers = marketAnalysis?.analysis?.topBuyers || [];
  const recommendedCountries = marketAnalysis?.analysis?.recommendedCountries || [
    { rank: 1, country: 'Brasil (Mercosur)', countryCode: 'BR', treaty: 'Mercosur', coordinates: [-14.2350, -51.9253] as [number, number] },
    { rank: 2, country: 'Chile (Acuerdo Bilateral)', countryCode: 'CL', treaty: 'Bilateral', coordinates: [-35.6751, -71.5430] as [number, number] },
    { rank: 3, country: 'Unión Europea', countryCode: 'EU', treaty: 'UE-Mercosur', coordinates: [54.5260, 15.2551] as [number, number] }
  ];
  const relevantNews = marketAnalysis?.analysis?.relevantNews || globalNews;
  
  // New Historical Data
  const historicalData = marketAnalysis?.analysis?.historicalData || [];

  // Additional opportunity pins
  const opportunityPins = [
    { coordinates: [35.6762, 139.6503] as [number, number], country: 'Japón' }, // Tokyo
    { coordinates: [-33.8688, 151.2093] as [number, number], country: 'Australia' }, // Sydney
    { coordinates: [19.4326, -99.1332] as [number, number], country: 'México' }, // Mexico City
    { coordinates: [55.7558, 37.6173] as [number, number], country: 'Rusia' }, // Moscow
  ];

  const allPins = [
    ...topBuyers.map((b: any) => ({ ...b, type: 'buyer' as const })),
    ...recommendedCountries.map((c: any) => ({ ...c, type: 'recommended' as const })),
    ...opportunityPins.map(p => ({ ...p, type: 'opportunity' as const }))
  ];

  const handlePinClick = (country: string, coords: [number, number]) => {
    setSelectedCountry(country);
  };

  return (
    <div className="min-h-screen bg-[#0A1929] overflow-hidden">
      {/* Breadcrumb */}
      <div className="bg-[#0D2137] border-b border-cyan-900/30 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-cyan-400"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Volver al Mapa' : 'Back to Map'}
          </Button>
          <div className="flex items-center gap-2 text-cyan-100 ml-4">
            <Globe className="w-4 h-4" />
            <span className="text-gray-400">
              {language === 'es' ? 'País' : 'Country'}: 
            </span>
            <span className="text-white font-medium">
              {country === 'AR' ? 'Argentina' : country}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-gray-400">
              {language === 'es' ? 'Acción' : 'Action'}:
            </span>
            <span className="text-white font-medium">
              {operation === 'export' ? (language === 'es' ? 'Exportar' : 'Export') : (language === 'es' ? 'Importar' : 'Import')}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-gray-400">
              {language === 'es' ? 'Producto' : 'Product'}:
            </span>
            <span className="text-cyan-400 font-medium">{product || code}</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Map & Chart Section - SPLIT Layout */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Map Area */}
            <div className="flex-1 relative min-h-0">
                <InteractiveMap 
                    hsCode={code}
                    year={2024}
                    onCountryClick={handlePinClick}
                />

                {/* Map Overlay Stats */}
                <div className="absolute top-4 left-4 space-y-2 z-10 pointer-events-none">
                    <div className="bg-[#0D2137]/90 backdrop-blur-md border border-cyan-900/30 rounded-lg p-3 text-white pointer-events-auto">
                    <div className="text-xs text-gray-400 mb-1">
                        {language === 'es' ? 'Oportunidades Totales' : 'Total Opportunities'}
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{allPins.length}</div>
                    </div>
                </div>
            </div>

            {/* Historical Chart Panel (Bottom of Middle Column) */}
            <div className="h-[250px] bg-[#0A1929] border-t border-cyan-900/30 p-2 z-20 shrink-0">
                <HistoricalChart data={historicalData} />
            </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-[#0D2137] border-l border-cyan-900/30 overflow-y-auto shrink-0">
          {selectedCountry ? (
            // Country Details Panel
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {language === 'es' ? 'Detalle de Oportunidad' : 'Opportunity Detail'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCountry(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                <div className="bg-[#0A1929] rounded-lg p-4 border border-cyan-900/30 space-y-3">
                  <h3 className="text-lg font-semibold text-white">{selectedCountry}</h3>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="text-gray-400 mb-1">
                        {language === 'es' ? 'Tratados Comerciales Detallados' : 'Detailed Trade Agreements'}
                      </div>
                      <ul className="text-cyan-100 space-y-1 text-xs">
                        <li>- {language === 'es' ? 'Reducción arancelaria' : 'Tariff reduction'}</li>
                        <li>- {language === 'es' ? 'Protocolos sanitarios' : 'Sanitary protocols'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distance Card */}
              <div className="bg-[#0A1929] rounded-lg p-4 border border-cyan-900/30">
                <div className="text-sm text-gray-400 mb-2">
                  {language === 'es' ? 'Distancia Argentina - ' : 'Distance Argentina - '}{selectedCountry}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-white">~12,000 km</div>
                  <Ship className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-400 mb-1">
                      {language === 'es' ? 'Alerta' : 'Alert'}
                    </div>
                    <div className="text-xs text-yellow-200">
                      {language === 'es' 
                        ? 'Nuevos requisitos de etiquetado para productos cárnicos' 
                        : 'New labeling requirements for meat products'}
                    </div>
                  </div>
                </div>
              </div>

                {/* Simulation Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <Button 
                    variant="outline" 
                    className="h-20 border-cyan-500/30 bg-[#0D2137] hover:bg-cyan-500/10 text-cyan-400 flex flex-col items-center justify-center gap-2"
                    onClick={() => setShowLogisticsSimulator(true)}
                >
                    <Ship className="w-6 h-6" />
                    <span>{language === 'es' ? 'Simulador de Logística' : 'Logistics Simulator'}</span>
                </Button>
                <Button 
                    variant="outline" 
                    className="h-20 border-cyan-500/30 bg-[#0D2137] hover:bg-cyan-500/10 text-cyan-400 flex flex-col items-center justify-center gap-2"
                    onClick={() => setShowCostCalculator(true)}
                >
                    <TrendingUp className="w-6 h-6" />
                    <span>{language === 'es' ? 'Calculadora de Costos' : 'Cost Calculator'}</span>
                </Button>
              </div>

              {/* Regulatory Documentation Section */}
              <div className="bg-[#0A1929] rounded-lg p-4 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                      📋 {language === 'es' ? 'Documentación Reglamentaria Requerida' : 'Required Regulatory Documentation'}
                    </h3>
                  </div>
                  
                  {requirements?.requiredDocuments && requirements.requiredDocuments.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {requirements.requiredDocuments.map((doc: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded border transition-all ${
                            doc.isSanction 
                              ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' 
                              : 'bg-[#0D2137] border-purple-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-xs font-bold flex items-center gap-1 ${doc.isSanction ? 'text-red-400' : 'text-white'}`}>
                              {doc.isSanction && <AlertCircle className="w-3 h-3" />}
                              {doc.name}
                            </h4>
                          </div>
                          <p className={`text-[10px] mb-2 ${doc.isSanction ? 'text-red-200 font-medium' : 'text-gray-400'}`}>
                            {doc.description || ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs italic p-4 text-center">
                       {language === 'es' ? 'Cargando o sin requisitos específicos...' : 'Loading...'}
                    </div>
                  )}
                </div>
            </div>
          ) : (
            // Lists Panel
            <div className="p-6 space-y-6">
              {/* Top 3 Buyers */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? 'Top 3 Compradores' : 'Top 3 Buyers'}
                </h2>
                <div className="space-y-2">
                  {topBuyers.map((buyer: any) => (
                    <div
                      key={buyer.countryCode}
                      onClick={() => setSelectedCountry(buyer.country)}
                      className="bg-[#0A1929] rounded-lg p-3 border border-cyan-900/30 hover:border-cyan-500/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-cyan-400">{buyer.rank}.</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            <span>{buyer.flag}</span>
                            {buyer.country}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Countries */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? 'Países Recomendados (Tratados)' : 'Recommended Countries (Treaties)'}
                </h2>
                <div className="space-y-2">
                  {recommendedCountries.map((country: any) => (
                    <div
                      key={country.countryCode}
                      onClick={() => setSelectedCountry(country.country)}
                      className="bg-[#0A1929] rounded-lg p-3 border border-cyan-900/30 hover:border-cyan-500/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-cyan-400">{country.rank}.</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{country.country}</div>
                          <div className="text-xs text-gray-400">{country.treaty}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global News */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? 'Noticias Globales Relevantes' : 'Relevant Global News'}
                </h2>
                <div className="space-y-2">
                  {relevantNews.map((news: any, idx: number) => (
                    <div key={idx} className="bg-[#0A1929] rounded-lg p-3 border border-cyan-900/30">
                      <div className="flex gap-2">
                        <div className={`w-12 h-12 ${news.image} rounded flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="text-xs text-white font-medium">
                            {news.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Dialogs */}
      <LogisticsSimulator
        open={showLogisticsSimulator}
        onOpenChange={setShowLogisticsSimulator}
        origin={country === 'AR' ? 'Argentina' : country}
        destination={selectedCountry || 'China'}
        product={product || code}
      />
      
      <CostCalculatorDialog
        open={showCostCalculator}
        onOpenChange={setShowCostCalculator}
        origin={country === 'AR' ? 'Argentina' : country}
        destination={selectedCountry || 'China'}
        product={product || code}
      />
    </div>
  );
}
