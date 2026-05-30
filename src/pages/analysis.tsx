import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from 'wouter';
import { useTrade } from '@/context/trade-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useUser } from "@/context/user-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { ChevronLeft, ChevronRight, Ship, TrendingUp, AlertCircle, Globe, MapPin, Sparkles, Bot, FileText } from 'lucide-react';
import TradeCalculator from '@/components/TradeCalculator';
import { MarketTrendsChart } from "@/components/market-trends-chart";
import InteractiveMap from '@/components/map/interactive-map';
import { HistoricalChart } from '@/components/market-analysis/historical-chart';
import { LandedCostPanel } from '@/components/market-analysis/landed-cost-panel';
import { RequiredDocuments } from '@/components/required-documents';
import GodModeAI from '@/components/GodModeAI';
import IncotermsSmartAnalysis from '@/components/trade/IncotermsSmartAnalysis';

// Static coordinates fallback for distance calculation (lat, lon)
const STATIC_COUNTRY_COORDS: Record<string, [number, number]> = {
  'China': [35.8617, 104.1954], 'Brasil': [-14.2350, -51.9253], 'Chile': [-35.6751, -71.5430],
  'Alemania': [51.1657, 10.4515], 'Japón': [36.2048, 138.2529], 'Australia': [-25.2744, 133.7751],
  'México': [23.6345, -102.5528], 'Rusia': [61.5240, 105.3188], 'India': [20.5937, 78.9629],
  'Vietnam': [14.0583, 108.2772], 'Indonesia': [-0.7893, 113.9213], 'Corea del Sur': [35.9078, 127.7669],
  'Estados Unidos': [37.0902, -95.7129], 'España': [40.4637, -3.7492], 'Italia': [41.8719, 12.5674],
  'Francia': [46.2276, 2.2137], 'Países Bajos': [52.1326, 5.2913], 'Uruguay': [-32.5228, -55.7658],
  'Paraguay': [-23.4425, -58.4438], 'Bolivia': [-16.2902, -63.5887], 'Perú': [-9.1900, -75.0152],
  'Colombia': [4.5709, -74.2973], 'Ecuador': [-1.8312, -78.1834], 'Venezuela': [6.4238, -66.5897],
  'Egipto': [26.8206, 30.8025], 'Nigeria': [9.0820, 8.6753], 'Sudáfrica': [-30.5595, 22.9375],
  'Turquía': [38.9637, 35.2433], 'Arabia Saudita': [23.8859, 45.0792], 'Tailandia': [15.8700, 100.9925],
  'Malasia': [4.2105, 101.9758], 'Filipinas': [12.8797, 121.7740], 'Bangladesh': [23.6850, 90.3563],
  'Pakistan': [30.3753, 69.3451], 'Marruecos': [31.7917, -7.0926], 'Algeria': [28.0339, 1.6596],
};

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

// [NEW] Component to fetch real treaty savings for the Opportunity Tab
function OpportunityTreatyRow({ country, originCode, hsCode, onClick, language }: any) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['/api/agreements/tariff', originCode, country.countryCode, hsCode],
    queryFn: async () => {
      const res = await fetch(`/api/agreements/tariff?origin=${originCode}&destination=${country.countryCode}&hsCode=${hsCode}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!originCode && !!country.countryCode && !!hsCode
  });

  const isLoadingRow = isLoading || !data;
  
  // Find best agreement from applicable list
  const applicableAgreements = data?.agreements?.applicable || [];
  const activeAgreement = applicableAgreements.find((a: any) => a.savingsUsd > 0) || applicableAgreements[0];
  const hasTreaty = !!activeAgreement;
  const isMercosur = activeAgreement?.code?.includes('MERCOSUR');
  
  // Format savings
  let badgeVal = '0%';
  let badgeColor = 'bg-[#5040a0]';
  let badgeTextObj = 'bg-[var(--ds-amber)15] text-[var(--ds-amber)] border-[var(--ds-amber)30]';
  
  if (hasTreaty && data.tariff) {
    const { mfnRate, effectiveRate } = data.tariff;
    if (mfnRate > effectiveRate) {
      if (effectiveRate === 0) {
        badgeVal = 'A. 0%';
        badgeColor = 'bg-[var(--ds-green)]';
        badgeTextObj = 'bg-[var(--ds-green)15] text-[var(--ds-green)] border-[var(--ds-green)30]';
      } else {
        badgeVal = `-${(mfnRate - effectiveRate).toFixed(1)}%`;
        badgeColor = 'bg-[#0060b0]';
        badgeTextObj = 'bg-[#2878e815] text-[#5898f8] border-[#2878e830]';
      }
    }
  }

  return (
    <div
      onClick={() => onClick(country.country)}
      className="grid grid-cols-[72px_1fr_auto] gap-2.5 items-center py-2.5 border-b border-[var(--ds-border-default)] hover:bg-[var(--ds-bg-surface)] cursor-pointer group"
    >
      <span className={`font-data text-[9px] font-bold text-[#03080f] px-1.5 py-[3px] rounded-[2px] tracking-[0.5px] text-center whitespace-nowrap ${badgeColor}`}>
        {isLoadingRow ? '...' : (isMercosur ? 'MERCOSUR' : (activeAgreement?.code || 'S/T'))}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[#c8dff0] group-hover:text-white transition-colors">{country.country}</div>
        <div className="font-data text-[9px] text-[#4a7090] mt-[2px] truncate max-w-[140px]">
          {isLoadingRow ? (language === 'es' ? 'Cargando tratado...' : 'Loading treaty...') : (hasTreaty ? (language === 'es' ? activeAgreement.name_es : activeAgreement.name_en) : (language === 'es' ? 'Sin Tratado Directo' : 'No Direct Treaty'))}
        </div>
      </div>
      <span className={`font-data text-[9px] font-bold px-[7px] py-[2px] rounded-[2px] uppercase tracking-[0.5px] whitespace-nowrap border ${badgeTextObj}`}>
        {isLoadingRow ? '...' : badgeVal}
      </span>
    </div>
  );
}

// ─── TariffImpactBlock: Real retenciones + arancel from /api/agreements/tariff ─
function TariffImpactBlock({ originCode, destinationCode, hsCode, language }: {
  originCode: string; destinationCode: string; hsCode: string; language: string;
}) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['tariff-impact', originCode, destinationCode, hsCode],
    queryFn: async () => {
      const res = await fetch(`/api/agreements/tariff?origin=${originCode}&destination=${destinationCode}&hsCode=${hsCode}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!originCode && !!destinationCode && !!hsCode,
    staleTime: 1000 * 60 * 30,
  });

  const mfnRate   = data?.tariff?.mfnRate   ?? null;
  const effRate   = data?.tariff?.effectiveRate ?? null;
  const applicableAgreements = data?.agreements?.applicable || [];
  const agreement = applicableAgreements.find((a: any) => a.savingsUsd > 0) || applicableAgreements[0];
  const isFree    = effRate === 0;
  const savings   = mfnRate !== null && effRate !== null ? (mfnRate - effRate).toFixed(1) : null;

  // AR export retention (from market analysis or fixed fallback by HS chapter)
  const chapter = parseInt((hsCode || '00').substring(0, 2));
  const retention = chapter >= 10 && chapter <= 24 ? 12 : chapter >= 25 && chapter <= 27 ? 8 : 5;

  return (
    <div className="bg-[var(--ds-bg-surface)] rounded-[2px] border border-[var(--ds-border-default)] overflow-hidden">
      <div className="p-3 bg-[var(--ds-bg-overlay)] border-b border-[var(--ds-border-default)] font-data text-[9px] font-bold uppercase tracking-[1px] text-[#8aafcc]">
        Impacto Impositivo Real
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-[#4a7090] font-data mb-1 uppercase">Retenciones AR</div>
          <div className="font-cond text-[20px] font-bold text-[#ff4040]">{retention}.0%</div>
          <div className="font-data text-[9px] text-[#4a7090] mt-1">Res. 125/2024</div>
        </div>
        <div>
          <div className="text-[10px] text-[#4a7090] font-data mb-1 uppercase">
            {language === 'es' ? 'Arancel de ingreso' : 'Import tariff'}
          </div>
          {isLoading ? (
            <div className="font-data text-[12px] text-[#4a7090]">Consultando...</div>
          ) : effRate !== null ? (
            <>
              <div className={`font-cond text-[20px] font-bold ${isFree ? 'text-[var(--ds-green)]' : 'text-[var(--ds-amber)]'}`}>
                {effRate.toFixed(1)}%
                {agreement && <span className="text-[10px] font-body ml-1.5">({agreement.code})</span>}
              </div>
              {savings && parseFloat(savings) > 0 && (
                <div className="font-data text-[9px] text-[var(--ds-green)] mt-1">
                  -{savings}% vs MFN ({mfnRate?.toFixed(1)}%)
                </div>
              )}
            </>
          ) : (
            <div className="font-cond text-[20px] font-bold text-[#8aafcc]">—</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Analysis() {
  const { language, setLanguage } = useLanguage();
  useDocumentTitle('Análisis de Mercado');
  const { user } = useUser();
  const [location, setLocation] = useLocation();
  const navigate = setLocation;
  const trade = useTrade();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mercado'|'oportunidades'|'documentos'|'detalle'>('mercado');
  const [showCalculator, setShowCalculator] = useState(false);
  
  // ── Hydrate TradeContext from URL on mount (supports deep-linking / bookmarks) ──
  useEffect(() => {
    trade.syncFromUrl(window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derive values from TradeContext (Single Source of Truth) ──
  // URL params are used ONLY for initial hydration above; all reads go through context.
  const rawParams = new URLSearchParams(window.location.search);
  const code        = trade.hsCode        || rawParams.get('code')        || '';
  const country     = trade.originCountry || rawParams.get('country')     || 'AR';
  const operation   = trade.operationType || rawParams.get('operation')   || 'export';
  const product     = trade.productName   || rawParams.get('productName') || '';

  // ── Geolocation (kept for port suggestions, not for origin logic) ──
  const [userGeoLocation, setUserGeoLocation] = useState<{
    lat: number; lon: number; countryCode: string; countryName: string;
    city: string; nearestPorts: any[]; source: string;
  } | null>(() => {
    try {
      const cached = sessionStorage.getItem('userGeoLocation');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (userGeoLocation) return;
    const fetchByIP = async (lat?: number, lon?: number) => {
      try {
        const url = lat !== undefined && lon !== undefined
          ? `/api/geo/locate?lat=${lat}&lon=${lon}` : '/api/geo/locate';
        const res = await fetch(url);
        const data = await res.json();
        setUserGeoLocation(data);
        sessionStorage.setItem('userGeoLocation', JSON.stringify(data));
      } catch { /* silent */ }
    };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchByIP(pos.coords.latitude, pos.coords.longitude),
        () => fetchByIP(), { timeout: 5000, maximumAge: 3600000 }
      );
    } else { fetchByIP(); }
  }, []);

  // [FIX] Fetch real requirements data
  // 1. First: Fetch dynamic recommendations to get country data
  const { data: recommendationsData } = useQuery<any>({
    queryKey: ['country-recommendations', code, country],
    queryFn: async () => {
      const res = await fetch(`/api/market-analysis/recommendations?code=${code}&origin=${country}`);
      if (!res.ok) {
        console.error('[DEBUG] Recs fetch error:', res.status, res.statusText);
        return null;
      }
      const json = await res.json();
      return json;
    },
    enabled: !!code
  });



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
  const { data: mapNews } = useQuery<any>({
    queryKey: ['map-news', selectedCountry || country, code],
    queryFn: async () => {
      const baseUrl = `/api/news?limit=5&lang=${language}&period=30`;
      const queryParams = [];
      if (selectedCountry) queryParams.push(`countries=${selectedCountry}`);
      if (code) queryParams.push(`hsCode=${code}`);
      
      const url = queryParams.length > 0 ? `${baseUrl}&${queryParams.join('&')}` : baseUrl;
      const res = await fetch(url);
      return res.json();
    },
    staleTime: 1000 * 60 * 15
  });
  
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

  // 4. Fetch real requirements data using the derived targetCode
  const { data: requirements, isLoading: reqLoading, error: reqError } = useQuery<any>({
    queryKey: ["/api/country-requirements", targetCode, code], // Use code in key
    queryFn: async () => {
      
      const response = await fetch(`/api/country-requirements/${targetCode}/${code}`);
      if (!response.ok) {
         console.warn('[DEBUG] Requirements fetch failed:', response.status);
         console.warn('Primary docs endpoint failed, trying fallback...');
         return null; 
      }
      const json = await response.json();
      return json;
    },
    enabled: !!selectedCountry && !!code,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true // Refetch when component mounts
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
    
    // 1. Try from allPins (live API data)
    const selectedPin = allPins.find(p => p.country === selectedCountry || p.countryName === selectedCountry);
    let lat2: number | null = null;
    let lon2: number | null = null;

    if (selectedPin?.coordinates) {
      [lat2, lon2] = selectedPin.coordinates;
    } else if (STATIC_COUNTRY_COORDS[selectedCountry]) {
      // 2. Fallback to static map
      [lat2, lon2] = STATIC_COUNTRY_COORDS[selectedCountry];
    }

    if (lat2 !== null && lon2 !== null) {
      // Origin: use the selected origin country coordinates
      const originCoords = STATIC_COUNTRY_COORDS[country] || (userGeoLocation?.lat && userGeoLocation?.lon ? [userGeoLocation.lat, userGeoLocation.lon] : [-34.6037, -58.3816]);
      const lat1 = originCoords[0];
      const lon1 = originCoords[1];

      const dist = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
      return `~${dist.toLocaleString('es-AR')} km`;
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
                    onCountryClick={(country: string) => handlePinClick(country, [0, 0])}
                    topBuyers={topBuyers}
                    recommended={recommendedCountries}
                    cheComex={cheComexDerived}
                    originCountry={country}
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
        <div className="w-[420px] bg-[#03080f] border-l border-[var(--ds-border-default)] flex flex-col shrink-0 z-30">
          
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-[var(--ds-border-default)] bg-[var(--ds-bg-overlay)] p-[10px_10px_0]">
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
                      setActiveTab(tab.id as 'mercado' | 'oportunidades' | 'documentos' | 'detalle');
                     if (tab.id !== 'detalle') setSelectedCountry(null);
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-2.5 font-data text-[10px] font-bold tracking-[1px] uppercase transition-all flex-1 justify-center rounded-t-[4px]
                    ${isActive 
                      ? 'bg-[var(--ds-bg-surface)] text-[var(--ds-cyan)] border-t-2 border-t-[var(--ds-cyan)] border-x border-[var(--ds-border-default)] border-b-transparent shadow-[0_-4px_12px_rgba(0,212,240,0.05)]' 
                      : 'text-[#4a7090] border-t-2 border-transparent hover:text-[#c8dff0] hover:bg-[var(--ds-bg-surface)]/50'}
                    ${tab.disabled ? 'opacity-30 cursor-not-allowed hover:text-[#4a7090] hover:bg-transparent' : 'cursor-pointer'}
                  `}
                >
                  {tab.icon} {tab.label}
                </button>
               )
            })}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#203548] scrollbar-track-[var(--ds-bg-overlay)]">
            
            {/* Global Context Header (Shows on all tabs except Detalle) */}
            {activeTab !== 'detalle' && (
               <div className="p-4 border-b border-[var(--ds-border-default)] bg-[var(--ds-bg-surface)]">
                  <div className="font-data text-[9px] text-[#4a7090] tracking-[1.2px] uppercase mb-1">
                     Análisis de Contexto Global
                  </div>
                  <div className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-tight mb-2">
                     {product || 'Mercado Global'}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                     <span className="font-data text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[#203548] text-[#4a7090] bg-[#03080f]">{country === 'AR' ? '🇦🇷' : country === 'CO' ? '🇨🇴' : '🌍'} Origen: {country}</span>
                     <span className="font-data text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[var(--ds-green)30] text-[#00b85e] bg-[var(--ds-green)10]">↑ {operation === 'export' ? 'EXPORTAR' : 'IMPORTAR'}</span>
                     <span className="font-data text-[9px] font-medium px-2 py-0.5 rounded-[2px] border border-[#00a8c830] text-[#00a8c8] bg-[var(--ds-cyan)10]">HS {code || 'N/A'}</span>
                  </div>
               </div>
            )}

            {/* TAB: MERCADO (Top Buyers) */}
            {activeTab === 'mercado' && (
               <div className="p-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between py-2 mb-3">
                     <div className="font-data text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5">
                        <div className="w-[5px] h-[5px] rounded-full bg-[var(--ds-cyan)]"></div>
                        {language === 'es' ? 'Top Compradores' : 'Top Buyers'}
                        {marketAnalysis?.analysis?.source === 'un_comtrade_realtime' && (
                           <span className="ml-2 px-1.5 py-[2px] bg-[var(--ds-green)15] text-[var(--ds-green)] border border-[var(--ds-green)30] rounded-[2px] text-[8px] flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[var(--ds-green)] animate-pulse"></span>
                              DATOS REALES (UN COMTRADE)
                           </span>
                        )}
                     </div>
                     <span className="font-data text-[9px] text-[#2a4a68] bg-[#111f2e] px-1.5 py-[1px] border border-[var(--ds-border-default)]">2023</span>
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
                          className="grid grid-cols-[24px_1fr_80px] gap-2.5 items-center py-[12px] border-b border-[var(--ds-border-default)] hover:bg-[var(--ds-bg-surface)] cursor-pointer transition-colors last:border-0 group"
                        >
                          <div className={`font-cond text-[18px] font-bold text-center leading-none ${idx === 0 ? 'text-[var(--ds-amber)]' : idx === 1 ? 'text-[#4a7090]' : 'text-[#2a4a68]'}`}>
                              {buyer.rank}
                          </div>
                          <div>
                             <div className="font-body text-[13px] font-semibold text-[#c8dff0] flex items-center gap-1.5 group-hover:text-white transition-colors">
                                <span className="text-[14px]">{buyer.flag || '🌍'}</span>
                                {buyer.country}
                             </div>
                             <div className="mt-1 h-[2px] bg-[var(--ds-border-default)] w-full max-w-[140px]">
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
                             <div className="font-data text-[9px] text-[#4a7090] mt-[1px]">USD {((buyer.avgValue || 0) / 1000).toFixed(1)}B</div>
                             <div className={`font-data text-[9px] font-bold mt-[1px] ${trend === 'up' ? 'text-[var(--ds-green)]' : 'text-[#ff4040]'}`}>
                                {sign} {Math.abs(8.4 - idx * 2.1).toFixed(1)}%
                             </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div className="py-6 border border-[var(--ds-border-default)] border-dashed rounded-[4px] bg-[var(--ds-bg-overlay)]">
                      <p className="text-[#4a7090] font-data text-[10px] text-center">{language === 'es' ? 'No hay datos de compradores.' : 'No buyer data available.'}</p>
                    </div>
                  )}

                  {/* Market Alerts Section inside Mercado */}
                  <div className="mt-8 mb-4">
                     <div className="font-data text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5 mb-3">
                        <div className="w-[5px] h-[5px] rounded-full bg-[var(--ds-amber)]"></div>
                        Noticias Regulatorias
                     </div>
                     <div className="space-y-2">
                        {mapNews?.news?.length > 0 ? (
                           mapNews.news.slice(0, 3).map((news: any, idx: number) => (
                              <div key={idx} className="bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[2px] p-3 flex gap-3">
                                 <div className="font-body text-[11px] text-[#8aafcc] leading-[1.4]">{news.title}</div>
                              </div>
                           ))
                        ) : (
                           <div style={{ color: 'var(--ds-text-tertiary)', fontSize: 12, padding: 16, textAlign: 'center' }}>
                              Cargando noticias regulatorias...
                           </div>
                        )}
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
                        <div className="font-data text-[9px] font-bold uppercase tracking-[1.2px] text-[#4a7090] flex items-center gap-1.5">
                           <div className="w-[5px] h-[5px] rounded-full bg-[var(--ds-green)]"></div>
                           Tratados Preferenciales
                        </div>
                     </div>
                     {recommendedCountries.length > 0 ? (
                       <div className="space-y-0">
                         {recommendedCountries.slice(0, 5).map((country: any, idx: number) => (
                           <OpportunityTreatyRow
                             key={country.countryCode || idx}
                             country={country}
                             originCode={country.originCountryCode || 'AR'}
                             hsCode={code}
                             language={language}
                             onClick={(c: string) => { setSelectedCountry(c); setActiveTab('detalle'); }}
                           />
                         ))}
                       </div>
                     ) : (
                       <div className="py-6 border border-[var(--ds-border-default)] border-dashed rounded-[4px] bg-[var(--ds-bg-overlay)]">
                         <p className="text-[#4a7090] font-data text-[10px] text-center">No hay tratados aplicables.</p>
                       </div>
                     )}
                  </div>

                  {/* Marketplace Orders */}
                  {cheComexDerived.length > 0 && (
                     <div>
                        <div className="flex items-center justify-between py-2 mb-3">
                           <div className="font-data text-[9px] font-bold uppercase tracking-[1.2px] text-[var(--ds-amber)] flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> Demandas Che.Comex
                           </div>
                        </div>
                        <div className="grid gap-2">
                           {cheComexDerived.slice(0,3).map((item: any) => (
                              <div
                                key={item.countryCode}
                                onClick={() => { setSelectedCountry(item.country); setActiveTab('detalle'); }}
                                className="bg-gradient-to-r from-[var(--ds-amber)0a] to-transparent border border-[var(--ds-amber)20] rounded-[2px] p-3 cursor-pointer hover:border-[var(--ds-amber)40] transition-colors"
                              >
                                 <div className="flex justify-between items-center mb-1">
                                    <div className="font-body text-[13px] font-semibold text-[#c8dff0]">{item.country}</div>
                                    <div className="font-data text-[9px] bg-[var(--ds-amber)15] text-[var(--ds-amber)] px-1.5 py-[2px] rounded-[2px] border border-[var(--ds-amber)30] flex items-center gap-1.5">
                                       <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-amber)] animate-pulse glow-amber"></span>
                                       {item.activeOrders} Órdenes
                                    </div>
                                 </div>
                                 <div className="font-data text-[9px] text-[#4a7090]">Demanda confirmada por partners B2B.</div>
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
                  <div className="text-[#8aafcc] font-body text-[13px] mb-4">
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
                  <div className="p-6 bg-gradient-to-b from-[var(--ds-bg-surface)] to-transparent border-b border-[var(--ds-border-default)] relative overflow-hidden">
                     {/* Decorative background element */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                     
                     <div className="flex items-center justify-between mb-2">
                        <div className="font-data text-[10px] text-[var(--ds-cyan)] tracking-[1.5px] uppercase flex items-center gap-2">
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
                           className="h-[42px] bg-[var(--ds-cyan)] hover:bg-[#00a8c8] text-[#03080f] font-data font-bold text-[10px] uppercase tracking-[1px] border-none rounded-[2px]"
                        >
                           <Ship className="w-3.5 h-3.5 mr-2" />
                           Trade Calculator
                        </Button>
                        <Button 
                           onClick={() => setActiveTab('documentos')}
                           className="h-[42px] bg-[var(--ds-bg-surface)] hover:bg-[var(--ds-bg-raised)] text-[#c8dff0] font-data font-bold text-[10px] uppercase tracking-[1px] border border-[#203548] hover:border-[var(--ds-cyan)] rounded-[2px]"
                        >
                           <FileText className="w-3.5 h-3.5 mr-2" />
                           Ver Docs
                        </Button>
                     </div>
                  </div>

                  <div className="p-6 space-y-6">
                     {/* Routing Card - distance now dynamic via Haversine + static fallback */}
                     <div className="bg-[var(--ds-bg-surface)] rounded-[2px] p-4 border border-[var(--ds-border-default)]">
                        <div className="font-data text-[9px] text-[#4a7090] mb-2 uppercase tracking-[1px]">Distancia Logistica</div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className="font-cond text-[28px] font-bold text-white leading-none">{distanceDisplay}</span>
                           </div>
                           <Ship className="w-6 h-6 text-[#2a4a68]" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] font-body text-[#8aafcc] pt-3 border-t border-[var(--ds-border-default)]">
                           <span>Origen: <strong>{country === 'AR' ? 'Argentina (BUE)' : country === 'CO' ? 'Colombia (BOG)' : country}</strong></span>
                           <span>Est. maritimo: <strong>{distanceDisplay !== '---' ? `${Math.max(1, Math.round(parseInt(distanceDisplay.replace(/[^0-9]/g, '') || '9000') / 600))} dias` : '-'}</strong></span>
                        </div>
                     </div>

                     {/* (Incoterms y Landed Cost fueron removidos de aquí para usar solo el Modal Trade Calculator unificado) */}

                     {/* Retenciones/Aranceles - from live API /api/agreements/tariff */}
                     <TariffImpactBlock
                       originCode={country || 'AR'}
                       destinationCode={targetCode || 'BR'}
                       hsCode={code}
                       language={language}
                     />
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <GodModeAI />

      {/* Unified Trade Calculator Modal */}
      {showCalculator && (
        <TradeCalculator
          defaultDestination={selectedCountry === 'China' ? 'CN' : selectedCountry === 'Brasil' ? 'BR' : selectedCountry === 'Chile' ? 'CL' : 'BR'}
          defaultProduct={product || code}
          defaultHsCode={code || '1001.99.00'}
          originCountry={country}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
