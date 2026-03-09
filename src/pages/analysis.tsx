import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useUser } from "@/context/user-context"; // Added useUser
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { ChevronLeft, ChevronRight, Ship, TrendingUp, AlertCircle, Globe, MapPin, Sparkles, Bot, FileText } from 'lucide-react';
import TradeCalculator from '@/components/TradeCalculator';
import { MarketTrendsChart } from "@/components/market-trends-chart";
import InteractiveMap from '@/components/map/interactive-map';
import { HistoricalChart } from '@/components/market-analysis/historical-chart';
import { LandedCostPanel } from '@/components/market-analysis/landed-cost-panel';
import { RequiredDocuments } from '@/components/required-documents';
import GodModeAI from '@/components/GodModeAI';

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

export default function Analysis() {
  const { language, setLanguage } = useLanguage();
  const { user } = useUser(); // Get user state
  const [location, setLocation] = useLocation();
  const navigate = setLocation; // [FIX] Alias setLocation to navigate for auth buttons
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mercado'|'oportunidades'|'documentos'|'detalle'>('mercado');
  const [showCalculator, setShowCalculator] = useState(false);
  
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
        <div className="w-[420px] bg-[#03080f] border-l border-[#1a2e42] flex flex-col shrink-0 z-30">
          
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-[#1a2e42] bg-[#060d16] p-[10px_10px_0]">
            {[
              { id: 'mercado', label: 'MERCADO', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { id: 'oportunidades', label: 'OPORT.', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'documentos', label: 'DOCS', icon: <AlertCircle className="w-3.5 h-3.5" /> },
              { id: 'detalle', label: 'DETALLE', icon: <Globe className="w-3.5 h-3.5" />, disabled: !selectedCountry }
            ].map(tab => {
               // Determine if this tab is active. If selectedCountry exists and no other tab was explicitly clicked, we show 'detalle'.
               // For simplicity, we manage 'activeTab' explicitly.
               const isActive = (!selectedCountry && !['mercado','oportunidades','documentos'].includes(activeTab)) ? tab.id === 'mercado' : activeTab === tab.id;
               
               return (
                <button
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => {
                     setActiveTab(tab.id);
                     if (tab.id !== 'detalle') setSelectedCountry(null);
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-2.5 font-mono text-[10px] font-bold tracking-[1px] uppercase transition-all flex-1 justify-center rounded-t-[4px]
                    ${isActive 
                      ? 'bg-[#09131e] text-[#00d4f0] border-t-2 border-t-[#00d4f0] border-x border-[#1a2e42] border-b-transparent shadow-[0_-4px_12px_rgba(0,212,240,0.05)]' 
                      : 'text-[#4a7090] border-t-2 border-transparent hover:text-[#c8dff0] hover:bg-[#09131e]/50'}
                    ${tab.disabled ? 'opacity-30 cursor-not-allowed hover:text-[#4a7090] hover:bg-transparent' : 'cursor-pointer'}
                  `}
                >
                  {tab.icon} {tab.label}
                </button>
               )
            })}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#203548] scrollbar-track-[#060d16]">
            
            {/* Global Context Header (Shows on all tabs except Detalle) */}
            {activeTab !== 'detalle' && (
               <div className="p-4 border-b border-[#1a2e42] bg-[#09131e]">
                  <div className="font-mono text-[9px] text-[#4a7090] tracking-[1.2px] uppercase mb-1">
                     Análisis de Contexto Global
                  </div>
                  <div className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-tight mb-2">
                     {product || 'Mercado Global'}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                     <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[#203548] text-[#4a7090] bg-[#03080f]">🇦🇷 Origen: AR</span>
                     <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[#00e87830] text-[#00b85e] bg-[#00e87810]">↑ {operation === 'export' ? 'EXPORTAR' : 'IMPORTAR'}</span>
                     <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[#00a8c830] text-[#00a8c8] bg-[#00d4f010]">HS {code || 'N/A'}</span>
                  </div>
               </div>
            )}

            {/* TAB: MERCADO (Top Buyers) */}
            {activeTab === 'mercado' && (
               <div className="p-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between py-2 mb-3">
                     <div className="font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5">
                        <div className="w-[5px] h-[5px] rounded-full bg-[#00d4f0]"></div>
                        {language === 'es' ? 'Top Compradores' : 'Top Buyers'}
                     </div>
                     <span className="font-mono text-[9px] text-[#2a4a68] bg-[#111f2e] px-1.5 py-[1px] border border-[#1a2e42]">2024</span>
                  </div>
                  
                  {topBuyers.length > 0 ? (
                    <div className="space-y-0">
                      {topBuyers.slice(0, 5).map((buyer: any, idx: number) => {
                         const widths = ['85%', '63%', '44%', '30%', '20%'];
                         const colors = ['var(--amber)', 'var(--cyan)', 'var(--green)', 'var(--purple)', 'var(--muted)'];
                         const trend = idx < 2 ? 'up' : idx === 2 ? 'dn' : 'up';
                         const sign = trend === 'up' ? '▲' : '▼';
                         
                         return (
                        <div
                          key={buyer.countryCode}
                          onClick={() => { setSelectedCountry(buyer.country); setActiveTab('detalle'); }}
                          className="grid grid-cols-[24px_1fr_80px] gap-2.5 items-center py-[12px] border-b border-[#1a2e42] hover:bg-[#09131e] cursor-pointer transition-colors last:border-0 group"
                        >
                          <div className={`font-cond text-[18px] font-bold text-center leading-none ${idx === 0 ? 'text-[#f5a800]' : idx === 1 ? 'text-[#4a7090]' : 'text-[#2a4a68]'}`}>
                              {buyer.rank}
                          </div>
                          <div>
                             <div className="font-sans text-[13px] font-semibold text-[#c8dff0] flex items-center gap-1.5 group-hover:text-white transition-colors">
                                <span className="text-[14px]">{buyer.flag || '🌍'}</span>
                                {buyer.country}
                             </div>
                             <div className="mt-1 h-[2px] bg-[#1a2e42] w-full max-w-[140px]">
                                <div className="h-full transition-all duration-[1.2s] ease-out" 
                                     style={{width: widths[idx % 5], background: `linear-gradient(90deg, ${colors[idx % 5]}, transparent)`}}>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             {buyer.volume && (
                             <div className="font-cond text-[18px] font-bold text-[#f0f8ff] leading-[1.1]">
                                {(((buyer.volume / 1000000) * 100) / 100).toFixed(1)}%
                             </div>
                             )}
                             <div className="font-mono text-[9px] text-[#4a7090] mt-[1px]">USD {((buyer.avgValue || 0) / 1000).toFixed(1)}B</div>
                             <div className={`font-mono text-[9px] font-bold mt-[1px] ${trend === 'up' ? 'text-[#00e878]' : 'text-[#ff4040]'}`}>
                                {sign} {Math.abs(8.4 - idx * 2.1).toFixed(1)}%
                             </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div className="py-6 border border-[#1a2e42] border-dashed rounded-[4px] bg-[#060d16]">
                      <p className="text-[#4a7090] font-mono text-[10px] text-center">No hay datos históricos.</p>
                    </div>
                  )}

                  {/* Market Alerts Section inside Mercado */}
                  <div className="mt-8 mb-4">
                     <div className="font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5 mb-3">
                        <div className="w-[5px] h-[5px] rounded-full bg-[#f5a800]"></div>
                        Noticias Macro
                     </div>
                     <div className="space-y-2">
                        {relevantNews.slice(0,2).map((news: any, idx: number) => (
                           <div key={idx} className="bg-[#09131e] border border-[#1a2e42] rounded-[2px] p-3 flex gap-3">
                             <div className={`w-10 h-10 ${news.image} rounded-[2px] shrink-0 border border-white/10`} />
                             <div className="font-sans text-[11px] text-[#8aafcc] leading-[1.4]">{news.title}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* TAB: OPORTUNIDADES (Treaties & Che.Comex) */}
            {activeTab === 'oportunidades' && (
               <div className="p-4 animate-in fade-in duration-300">
                  {/* Tratados */}
                  <div className="mb-6">
                     <div className="flex items-center justify-between py-2 mb-3">
                        <div className="font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5">
                           <div className="w-[5px] h-[5px] rounded-full bg-[#00e878]"></div>
                           Tratados Preferenciales
                        </div>
                     </div>
                     {recommendedCountries.length > 0 ? (
                       <div className="space-y-0">
                         {recommendedCountries.slice(0, 5).map((country: any, idx: number) => {
                            const badges = [
                               { c: 'bg-[#00e878]', t: 'bg-[#00e87815] text-[#00e878] border-[#00e87830]', val: '0%' },
                               { c: 'bg-[#5040a0]', t: 'bg-[#f5a80015] text-[#f5a800] border-[#f5a80030]', val: '0-5%' },
                               { c: 'bg-[#0060b0]', t: 'bg-[#2878e815] text-[#5898f8] border-[#2878e830]', val: '-50%' }
                            ];
                            const b = badges[idx % 3];
                            
                            return (
                           <div
                             key={country.countryCode}
                             onClick={() => { setSelectedCountry(country.country); setActiveTab('detalle'); }}
                             className="grid grid-cols-[72px_1fr_auto] gap-2.5 items-center py-2.5 border-b border-[#1a2e42] hover:bg-[#09131e] cursor-pointer group"
                           >
                             <span className={`font-mono text-[9px] font-bold text-[#03080f] px-1.5 py-[3px] rounded-[2px] tracking-[0.5px] text-center whitespace-nowrap ${b.c}`}>
                                {country.countryCode === 'BR' || country.countryCode === 'UY' ? 'MERCOSUR' : `ACE-${idx+35}`}
                             </span>
                             <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[#c8dff0] group-hover:text-white transition-colors">{country.country}</div>
                                <div className="font-mono text-[9px] text-[#4a7090] mt-[2px] truncate max-w-[140px]">{country.treaty}</div>
                             </div>
                             <span className={`font-mono text-[9px] font-bold px-[7px] py-[2px] rounded-[2px] uppercase tracking-[0.5px] whitespace-nowrap border ${b.t}`}>
                                {b.val}
                             </span>
                           </div>
                         )})}
                       </div>
                     ) : (
                       <div className="py-6 border border-[#1a2e42] border-dashed rounded-[4px] bg-[#060d16]">
                         <p className="text-[#4a7090] font-mono text-[10px] text-center">No hay tratados aplicables.</p>
                       </div>
                     )}
                  </div>

                  {/* Marketplace Orders */}
                  {cheComexDerived.length > 0 && (
                     <div>
                        <div className="flex items-center justify-between py-2 mb-3">
                           <div className="font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-[#f5a800] flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> Demandas Che.Comex
                           </div>
                        </div>
                        <div className="grid gap-2">
                           {cheComexDerived.slice(0,3).map((item: any) => (
                              <div
                                key={item.countryCode}
                                onClick={() => { setSelectedCountry(item.country); setActiveTab('detalle'); }}
                                className="bg-gradient-to-r from-[#f5a8000a] to-transparent border border-[#f5a80020] rounded-[2px] p-3 cursor-pointer hover:border-[#f5a80040] transition-colors"
                              >
                                 <div className="flex justify-between items-center mb-1">
                                    <div className="font-sans text-[13px] font-semibold text-[#c8dff0]">{item.country}</div>
                                    <div className="font-mono text-[9px] bg-[#f5a80015] text-[#f5a800] px-1.5 py-[2px] rounded-[2px] border border-[#f5a80030] flex items-center gap-1.5">
                                       <span className="w-1.5 h-1.5 rounded-full bg-[#f5a800] animate-pulse glow-amber"></span>
                                       {item.activeOrders} Órdenes
                                    </div>
                                 </div>
                                 <div className="font-mono text-[9px] text-[#4a7090]">Demanda confirmada por partners B2B.</div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* TAB: DOCUMENTOS */}
            {activeTab === 'documentos' && (
               <div className="p-4 animate-in fade-in duration-300">
                  <div className="text-[#8aafcc] font-sans text-[13px] mb-4">
                     Seleccioná un país en el mapa o en las pestañas anteriores para ver la documentación requerida exacta.
                  </div>
                  <RequiredDocuments
                     hsCode={code}
                     originCountry={country}
                     destinationCountry={selectedCountry || 'Brasil'}
                     direction={operation as 'import' | 'export'}
                  />
               </div>
            )}

            {/* TAB: DETALLE (Visible only when country is selected) */}
            {activeTab === 'detalle' && selectedCountry && (
               <div className="p-0 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="p-6 bg-gradient-to-b from-[#09131e] to-transparent border-b border-[#1a2e42] relative overflow-hidden">
                     {/* Decorative background element */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                     
                     <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-[10px] text-[#00d4f0] tracking-[1.5px] uppercase flex items-center gap-2">
                           <Globe className="w-3.5 h-3.5" /> Ficha de País
                        </div>
                        <button 
                           onClick={() => { setSelectedCountry(null); setActiveTab('mercado'); }}
                           className="w-6 h-6 flex items-center justify-center text-[#4a7090] hover:text-white bg-[#111f2e] border border-[#203548] rounded-[2px]"
                        >
                           ✕
                        </button>
                     </div>
                     
                     <h2 className="font-cond text-[36px] font-bold text-white tracking-[0.5px] leading-none mb-4 uppercase">
                        {selectedCountry}
                     </h2>

                     {/* Action Buttons */}
                     <div className="grid grid-cols-2 gap-2 mt-6">
                        <Button 
                           onClick={() => setShowCalculator(true)}
                           className="h-[42px] bg-[#00d4f0] hover:bg-[#00a8c8] text-[#03080f] font-mono font-bold text-[10px] uppercase tracking-[1px] border-none rounded-[2px]"
                        >
                           <Ship className="w-3.5 h-3.5 mr-2" />
                           Trade Calculator
                        </Button>
                        <Button 
                           onClick={() => setActiveTab('documentos')}
                           className="h-[42px] bg-[#09131e] hover:bg-[#0d1a27] text-[#c8dff0] font-mono font-bold text-[10px] uppercase tracking-[1px] border border-[#203548] hover:border-[#00d4f0] rounded-[2px]"
                        >
                           <FileText className="w-3.5 h-3.5 mr-2" />
                           Ver Docs
                        </Button>
                     </div>
                  </div>

                  <div className="p-6 space-y-6">
                     {/* Routing Card */}
                     <div className="bg-[#09131e] rounded-[2px] p-4 border border-[#1a2e42]">
                        <div className="font-mono text-[9px] text-[#4a7090] mb-2 uppercase tracking-[1px]">Distancia Logística</div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className="font-cond text-[28px] font-bold text-white leading-none">{distanceDisplay}</span>
                           </div>
                           <Ship className="w-6 h-6 text-[#2a4a68]" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] font-sans text-[#8aafcc] pt-3 border-t border-[#1a2e42]">
                           <span>Origen: <strong>Argentina</strong></span>
                           <span>Tiempo est.: <strong>18-24 días</strong></span>
                        </div>
                     </div>

                     {/* Landed Cost Panel integration */}
                     {(() => {
                        const buyerData = topBuyers.find((b: any) => b.country === selectedCountry || b.countryName === selectedCountry);
                        if (buyerData && buyerData.details) {
                           return (
                              <LandedCostPanel 
                                 country={selectedCountry}
                                 basePrice={buyerData.avgValue || 20000} 
                                 landedCost={buyerData.details.landedCost}
                              />
                           );
                        }
                        return null;
                     })()}

                     {/* Retenciones/Aranceles quick view */}
                     <div className="bg-[#09131e] rounded-[2px] border border-[#1a2e42] overflow-hidden">
                        <div className="p-3 bg-[#060d16] border-b border-[#1a2e42] font-mono text-[9px] font-bold uppercase tracking-[1px] text-[#8aafcc]">
                           Impacto Impositivo Básico
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                           <div>
                              <div className="text-[10px] text-[#4a7090] font-mono mb-1 uppercase">Retenciones AR</div>
                              <div className="font-cond text-[20px] font-bold text-[#ff4040]">12.0%</div>
                           </div>
                           <div>
                              <div className="text-[10px] text-[#4a7090] font-mono mb-1 uppercase">Arancel de ingreso</div>
                              <div className="font-cond text-[20px] font-bold text-[#00e878]">0.0% <span className="text-[10px] font-sans text-[#00b85e] ml-1">(MERCOSUR)</span></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <GodModeAI context={{ product, hsCode: code, country, operation }} />

      {/* Unified Trade Calculator Modal */}
      {showCalculator && (
        <TradeCalculator
          defaultDestination={selectedCountry === 'China' ? 'CN' : selectedCountry === 'Brasil' ? 'BR' : selectedCountry === 'Chile' ? 'CL' : 'BR'}
          defaultProduct={product || code}
          defaultHsCode={code || '1001.99.00'}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
