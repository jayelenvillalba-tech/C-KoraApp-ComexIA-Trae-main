import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useUser } from "@/context/user-context"; // Added useUser
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { ChevronLeft, ChevronRight, Ship, TrendingUp, AlertCircle, Globe, MapPin, Sparkles, Bot } from 'lucide-react';
import LogisticsSimulator from '@/components/logistics-simulator';
import CostCalculatorDialog from '@/components/cost-calculator-dialog';
import { MarketTrendsChart } from "@/components/market-trends-chart";
import InteractiveMap from '@/components/map/interactive-map';
import { HistoricalChart } from '@/components/market-analysis/historical-chart';
import { LandedCostPanel } from '@/components/market-analysis/landed-cost-panel';
import { RequiredDocuments } from '@/components/required-documents';

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
  const { user } = useUser(); // Get user state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [location, setLocation] = useLocation();
  const navigate = setLocation; // [FIX] Alias setLocation to navigate for auth buttons
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
      const res = await fetch(`/api/market-analysis/recommendations?code=${code}&origin=${country}`);
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

  // 2. Define derived lists (topBuyers, recommendedCountries, cheComex)
  // NOW STRICTLY SEPARATED
  const topBuyers = recommendationsData?.topBuyers 
    ? recommendationsData.topBuyers.map((item: any, index: number) => ({
          rank: index + 1,
          country: item.countryName || item.country,
          countryCode: item.countryCode,
          flag: '🌍',
          coordinates: item.coordinates,
          details: item.details, // [NEW] Pass cost breakdown details
          avgValue: item.avgValue
        }))
    : [];

  const recommendedCountries = recommendationsData?.treatyRecommendations
    ? recommendationsData.treatyRecommendations.map((item: any, index: number) => ({
          rank: index + 1,
          country: item.countryName || item.country,
          countryCode: item.countryCode,
          treaty: item.treaty || 'Acuerdo Comercial',
          coordinates: item.coordinates
        }))
    : [];

  // DEBUG: Log the raw data to understand structure
  useEffect(() => {
    if (recommendationsData) {
      console.log('[DEBUG] recommendationsData:', recommendationsData);
      console.log('[DEBUG] treatyRecommendations:', recommendationsData.treatyRecommendations);
      console.log('[DEBUG] recommendedCountries length:', recommendedCountries.length);
    }
  }, [recommendationsData]);

  const cheComexDerived = recommendationsData?.cheComexRecommended 
    ? recommendationsData.cheComexRecommended.map((item: any, index: number) => ({
          rank: index + 1,
          country: item.countryName || item.country,
          countryCode: item.countryCode,
          activeOrders: item.activeOrders,
          coordinates: item.coordinates
    }))
    : [
      // Fallback data to prevent UI disappearing on network error
      { rank: 1, country: 'India', countryCode: 'IN', activeOrders: 15, coordinates: [20.5937, 78.9629] },
      { rank: 2, country: 'Vietnam', countryCode: 'VN', activeOrders: 8, coordinates: [14.0583, 108.2772] },
      { rank: 3, country: 'Indonesia', countryCode: 'ID', activeOrders: 5, coordinates: [-0.7893, 113.9213] }
    ];
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
    const inChe = cheComexDerived.find((c: any) => c.country === name); // [FIX] Check Marketplace items
    if (inChe) return inChe.countryCode;
    
    // Fallback mapping
    const map: Record<string, string> = {
      'China': 'CN', 'Alemania': 'DE', 'Brasil': 'BR', 'Chile': 'CL',
      'Japón': 'JP', 'Australia': 'AU', 'México': 'MX', 'Rusia': 'RU',
      'Estados Unidos': 'US', 'España': 'ES', 'Uruguay': 'UY', 'Paraguay': 'PY',
      'Bolivia': 'BO', 'Vietnam': 'VN', 'India': 'IN', 'Indonesia': 'ID'
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

  const opportunityPins: any[] = []; // Empty - only show real data

  const allPins = [
    ...topBuyers.map((b: any) => ({ ...b, type: 'buyer' as const })),
    ...recommendedCountries.map((c: any) => ({ ...c, type: 'recommended' as const })),
    ...cheComexDerived.map((c: any) => ({ ...c, type: 'marketplace' as const })), // [FIX] Include Marketplace in Pins for Distance
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
    
    return '---';
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
            
            
            {user ? (
               <Button 
                onClick={() => navigate('/profile')}
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-slate-800 text-white px-2 border border-slate-700/50"
              >
                 <Avatar className="w-8 h-8 border border-cyan-500/50">
                    <AvatarImage src={user.avatar || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-cyan-900 text-cyan-200">{user.name?.substring(0,2)?.toUpperCase() || "U"}</AvatarFallback>
                 </Avatar>
                 <span className="hidden lg:inline text-sm max-w-[100px] truncate">{user.name || "Usuario"}</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  className="text-gray-300 hover:text-white h-9 text-xs"
                  onClick={() => navigate('/auth')}
                >
                  {language === 'es' ? 'Ingresar' : 'Login'}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border-0 h-9 text-xs"
                  onClick={() => navigate('/auth?view=register')}
                >
                  {language === 'es' ? 'Crear Cuenta' : 'Register'}
                </Button>
              </div>
            )}
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
                    topBuyers={topBuyers}
                    recommended={recommendedCountries}
                    cheComex={cheComexDerived}
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





// ... inside component ...

              {/* [NEW] Landed Cost Panel */}
              {(() => {
                  // Find the selected country data in topBuyers to get the details
                  const buyerData = topBuyers.find((b: any) => b.country === selectedCountry || b.countryName === selectedCountry);
                  
                  if (buyerData && buyerData.details) {
                      return (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                             <LandedCostPanel 
                                country={selectedCountry}
                                basePrice={buyerData.avgValue || 20000} // Fallback if missing
                                landedCost={buyerData.details.landedCost}
                             />
                          </div>
                      );
                  }
                  return null;
              })()}

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

              {/* Required Documents Section - Phase 22 */}
              <RequiredDocuments
                hsCode={code}
                originCountry={country}
                destinationCountry={selectedCountry}
                direction={operation as 'import' | 'export'}
              />
            </div>
          ) : (
            // Lists Panel
            <div className="p-6 space-y-6">
              {/* AI Analysis Section */}
              {/* Header with AI Toggle */}
              <div className="flex justify-end mb-4">
                 <Button 
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 shadow-lg shadow-cyan-900/50"
                 >
                    <Bot className="w-4 h-4" />
                    {showAiAssistant 
                      ? (language === 'es' ? 'Ocultar Asistente' : 'Hide Assistant')
                      : (language === 'es' ? 'Consultar Asistente IA' : 'Ask AI Assistant')
                    }
                 </Button>
              </div>
              
              {/* AI Analysis Widget - Hidden by default */}
              {showAiAssistant && (
                <AiAnalysisWidget 
                  hsCode={code} 
                  originCountry={country} 
                  targetCountry="Global" 
                  productName={product} 
                  className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300"
                />
              )}
              {/* Top 3 Buyers */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? 'Top 3 Compradores' : 'Top 3 Buyers'}
                </h2>
                {topBuyers.length > 0 ? (
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
                              <span>{buyer.flag || '🌍'}</span>
                              {buyer.country}
                            </div>
                            {buyer.volume && (
                              <div className="text-xs text-gray-400">
                                {(buyer.volume / 1000000).toFixed(1)}M tons
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0A1929] rounded-lg p-4 border border-gray-700/30">
                    <p className="text-gray-400 text-sm italic text-center">
                      {language === 'es' 
                        ? 'No hay datos históricos de importación disponibles para este producto' 
                        : 'No historical import data available for this product'}
                    </p>
                  </div>
                )}
              </div>

              {/* Recommended Countries */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  {language === 'es' ? 'Países Recomendados (Tratados)' : 'Recommended Countries (Treaties)'}
                </h2>
                {recommendedCountries.length > 0 ? (
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
                ) : (
                  <div className="bg-[#0A1929] rounded-lg p-4 border border-gray-700/30">
                    <p className="text-gray-400 text-sm italic text-center">
                      {language === 'es' 
                        ? 'No hay tratados comerciales preferenciales disponibles para este producto' 
                        : 'No preferential trade agreements available for this product'}
                    </p>
                  </div>
                )}
              </div>

              {/* Che.Comex Opportunities (Marketplace) */}
              {cheComexDerived.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-4 flex items-center gap-2">
                    <span>🔥</span>
                    {language === 'es' ? 'Oportunidades Che.Comex' : 'Che.Comex Opportunities'}
                  </h2>
                  <div className="space-y-2">
                    {cheComexDerived.map((item: any) => (
                      <div
                        key={item.countryCode}
                        onClick={() => setSelectedCountry(item.country)}
                        className="bg-gradient-to-r from-amber-900/20 to-[#0A1929] rounded-lg p-3 border border-amber-500/50 hover:border-amber-400 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-amber-400">{item.rank}.</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white group-hover:text-amber-200 transition-colors">
                                {item.country}
                            </div>
                            <div className="text-xs text-amber-300/80 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {item.activeOrders} {language === 'es' ? 'órdenes activas' : 'active orders'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
