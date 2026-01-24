import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
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

// Helper: Calculate distance between two coordinates (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return Math.round(d);
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

import { AiAnalysisWidget } from '@/components/ai-analysis-widget';

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
  // 1. First: Fetch dynamic recommendations to get country data
  const { data: recommendationsData } = useQuery<any>({
    queryKey: ['country-recommendations', code, country],
    queryFn: async () => {
      console.log(`[DEBUG] Fetching recommendations for code: ${code}, origin: ${country}`);
      const res = await fetch(`/api/country-recommendations?hsCode=${code}&originCountry=${country}`);
      if (!res.ok) {
        console.error('[DEBUG] Recs fetch error:', res.status, res.statusText);
        return null;
      }
      const json = await res.json();
      console.log('[DEBUG] Recs data received:', json?.recommended?.length || 0, 'items');
      return json;
    },
    enabled: !!code
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

  const { data: marketAnalysis } = useQuery<any>({
    queryKey: ['market-analysis', code, country, operation], // Key includes vars
    queryFn: async () => {
      if (!code) return null;
      const res = await fetch(`/api/market-analysis?hsCode=${code}&country=${country}&operation=${operation}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!code
  });

  // 2. Define derived lists (topBuyers, recommendedCountries)
  const topBuyers = recommendationsData?.recommended 
    ? recommendationsData.recommended
        .sort((a: any, b: any) => (b.companyCount || 0) - (a.companyCount || 0))
        .slice(0, 3)
        .map((item: any, index: number) => ({
          rank: index + 1,
          country: item.countryName || item.country,
          countryCode: item.countryCode,
          flag: '🌍',
          coordinates: item.coordinates
        }))
    : (marketAnalysis?.analysis?.topBuyers || []);

  const recommendedCountries = recommendationsData?.recommended
    ? recommendationsData.recommended
        .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map((item: any, index: number) => ({
          rank: index + 1,
          country: item.countryName || item.country,
          countryCode: item.countryCode,
          treaty: item.treatyBenefits?.length > 0 ? 'Tratado Vigente' : 'Sin Tratado Preferencial',
          coordinates: item.coordinates
        }))
    : (marketAnalysis?.analysis?.recommendedCountries || [
    { rank: 1, country: 'Brasil (Mercosur)', countryCode: 'BR', treaty: 'Mercosur', coordinates: [-14.2350, -51.9253] as [number, number] },
    { rank: 2, country: 'Chile (Acuerdo Bilateral)', countryCode: 'CL', treaty: 'Bilateral', coordinates: [-35.6751, -71.5430] as [number, number] },
    { rank: 3, country: 'Unión Europea', countryCode: 'EU', treaty: 'UE-Mercosur', coordinates: [54.5260, 15.2551] as [number, number] }
  ]);
  const relevantNews = marketAnalysis?.analysis?.relevantNews || globalNews;
  
  // New Historical Data - Ensure we have data for the chart
  const historicalData = marketAnalysis?.analysis?.historicalData || [
    { year: 2020, value: 120, volume: 450 },
    { year: 2021, value: 135, volume: 480 },
    { year: 2022, value: 150, volume: 520 },
    { year: 2023, value: 142, volume: 510 },
    { year: 2024, value: 165, volume: 600 },
  ];

  // 3. Helper to find code by name from our data sources
  const findCountryCode = (name: string | null) => {
    if (!name) return 'US'; // Default
    // Try to find in lists
    const inTop = topBuyers.find((b: any) => b.country === name);
    if (inTop) return inTop.countryCode;
    const inRec = recommendedCountries.find((r: any) => r.country === name);
    if (inRec) return inRec.countryCode;
    
    // Fallback mapping
    const map: Record<string, string> = {
      'China': 'CN', 'Alemania': 'DE', 'Brasil': 'BR', 'Chile': 'CL',
      'Japón': 'JP', 'Australia': 'AU', 'México': 'MX', 'Rusia': 'RU',
      'Estados Unidos': 'US', 'España': 'ES', 'Uruguay': 'UY', 'Paraguay': 'PY',
      'Bolivia': 'BO', 'Vietnam': 'VN'
    };
    // Fuzzy match
    const key = Object.keys(map).find(k => k.includes(name) || name.includes(k));
    return key ? map[key] : 'US';
  };

  const targetCode = findCountryCode(selectedCountry);
  console.log('[DEBUG] Selected:', selectedCountry, 'Derived Code:', targetCode);

  // 4. Fetch real requirements data using the derived targetCode
  const { data: requirements, isLoading: reqLoading, error: reqError } = useQuery<any>({
    queryKey: ["/api/country-requirements", targetCode, code], // Use code in key
    queryFn: async () => {
      console.log('[DEBUG ANALYSIS] Fetching reqs for:', targetCode, code, selectedCountry);
      
      const response = await fetch(`/api/country-requirements/${targetCode}/${code}`);
      if (!response.ok) {
         console.warn('[DEBUG] Requirements fetch failed:', response.status);
         console.warn('Primary docs endpoint failed, trying fallback...');
         return null; 
      }
      const json = await response.json();
      console.log('[DEBUG] Requirements loaded:', json?.length || 0, 'docs');
      return json;
    },
    enabled: !!selectedCountry && !!code,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true // Refetch when component mounts
  });

  console.log('[DEBUG] Requirements state:', { 
    loading: reqLoading, 
    hasData: !!requirements, 
    error: reqError,
    enabled: !!selectedCountry && !!code 
  });

  // Additional opportunity pins
  // COMMENTED OUT: These were hardcoded and didn't match the actual recommendations
  // Now the map will ONLY show countries from topBuyers and recommendedCountries (real data)
  /*
  const opportunityPins = [
    { coordinates: [35.6762, 139.6503] as [number, number], country: 'Japón' }, // Tokyo
    { coordinates: [-33.8688, 151.2093] as [number, number], country: 'Australia' }, // Sydney
    { coordinates: [19.4326, -99.1332] as [number, number], country: 'México' }, // Mexico City
    { coordinates: [55.7558, 37.6173] as [number, number], country: 'Rusia' }, // Moscow
  ];
  */
  const opportunityPins: any[] = []; // Empty - only show real data

  const allPins = [
    ...topBuyers.map((b: any) => ({ ...b, type: 'buyer' as const })),
    ...recommendedCountries.map((c: any) => ({ ...c, type: 'recommended' as const })),
    ...opportunityPins.map(p => ({ ...p, type: 'opportunity' as const }))
  ];

  const handlePinClick = (country: string, coords: [number, number]) => {
    setSelectedCountry(country);
  };

  const getDistanceText = () => {
    if (!selectedCountry) return '---';
    
    // Find selected country coordinates in allPins
    const selectedPin = allPins.find(p => p.country === selectedCountry || p.countryName === selectedCountry);
    
    if (selectedPin && selectedPin.coordinates) {
        const [lat2, lon2] = selectedPin.coordinates;
        // Argentina coordinates
        const lat1 = -38.4161;
        const lon1 = -63.6167;
        
        const dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
        return `~${dist.toLocaleString()} km`;
    }
    
    return language === 'es' ? 'Calculando...' : 'Calculating...';
  };

  const distanceDisplay = getDistanceText();

  return (
    <div className="min-h-screen bg-[#0A1929] overflow-hidden">
      {/* Breadcrumb */}
      <div className="bg-[#0D2137] border-b border-cyan-900/30 px-6 py-3 flex items-center justify-between">
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

        {/* Auth & Language Controls */}
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              {['es', 'en'].map((lang) => (
                <button
                  key={lang}
                  // @ts-ignore
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    language === lang 
                      ? 'bg-cyan-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            
            <Button 
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 h-9 text-xs font-bold"
              onClick={() => navigate('/auth')}
            >
              LOGIN
            </Button>
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
                  <div className="text-2xl font-bold text-white">{distanceDisplay}</div>
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
                  
                  {/* Logic for handling both API formats (direct array or object with property) */}
                  {(() => {
                    // Normalize data structure
                    const docsList = Array.isArray(requirements) 
                      ? requirements 
                      : (requirements?.requiredDocuments || []);
                      
                    if (docsList && docsList.length > 0) {
                      return (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {docsList.map((doc: any, idx: number) => (
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
                                  {/* Handle both property names */}
                                  {doc.documentName || doc.name}
                                </h4>
                              </div>
                              <p className={`text-[10px] mb-2 ${doc.isSanction ? 'text-red-200 font-medium' : 'text-gray-400'}`}>
                                {doc.description || ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-gray-400 text-xs italic p-4 text-center">
                           {language === 'es' ? 'Cargando o sin requisitos específicos...' : 'Loading...'}
                        </div>
                      );
                    }
                  })()}
                </div>
            </div>
          ) : (
            // Lists Panel
            <div className="p-6 space-y-6">
              {/* AI Analysis Section */}
              <AiAnalysisWidget 
                hsCode={code} 
                originCountry={country} 
                targetCountry="Global" 
                productName={product} 
                className="mb-2"
              />
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
