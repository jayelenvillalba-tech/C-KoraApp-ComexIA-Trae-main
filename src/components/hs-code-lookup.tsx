import { useState, useEffect } from "react";
import { Search, Info, MapPin, Zap, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import type { HsChapter, HsPartida } from "@shared/schema";
import CommercialOpportunitiesPanel from "./commercial-opportunities-panel";

export default function HsCodeLookup() {
  const { language, t } = useLanguage();
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedPartida, setSelectedPartida] = useState<HsPartida | null>(null);
  const [operationType, setOperationType] = useState<"importer" | "exporter">("importer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [finalSelection, setFinalSelection] = useState<{
    hsCode: string;
    productName: string;
    originCountry: string;
    operationType: "importer" | "exporter";
  } | null>(null);

  const { data: chapters = [] } = useQuery<HsChapter[]>({
    queryKey: ["/api/hs-chapters"],
  });

  const { data: partidas = [] } = useQuery<HsPartida[]>({
    queryKey: ["/api/hs-partidas", selectedChapter],
    enabled: !!selectedChapter,
  });

  // Enhanced search with continental intelligence
  const { data: enhancedSearchResults } = useQuery({
    queryKey: ["/api/hs-search", searchQuery, selectedCountry, operationType],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return null;
      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedCountry && { country: selectedCountry }),
        ...(operationType && { operation: operationType })
      });
      const response = await fetch(`/api/hs-search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: searchQuery.length >= 3,
  });

  // Countries list for enhanced search (sorted alphabetically)
  const countries = [
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'South America' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'South America' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'North America' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', region: 'South America' },
    { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', region: 'South America' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
    { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
    { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'North America' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', region: 'Oceania' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', region: 'South America' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', region: 'Asia' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', region: 'Asia' },
    { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', region: 'South America' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', region: 'South America' },
  ];

  const handleChapterSelect = (chapterCode: string) => {
    setSelectedChapter(chapterCode);
    setSelectedPartida(null);
  };

  const handlePartidaSelect = (partida: HsPartida) => {
    setSelectedPartida(partida);
  };

  const handleProceedToOpportunities = () => {
    if (selectedPartida && selectedCountry) {
      setFinalSelection({
        hsCode: selectedPartida.code,
        productName: language === "es" ? selectedPartida.description : selectedPartida.descriptionEn,
        originCountry: selectedCountry,
        operationType: operationType
      });
      setShowOpportunities(true);
    }
  };

  const handleBackToSearch = () => {
    setShowOpportunities(false);
    setFinalSelection(null);
  };

  // Update search results when enhanced search completes
  useEffect(() => {
    if (enhancedSearchResults) {
      setSearchResults(enhancedSearchResults);
    }
  }, [enhancedSearchResults]);

  // Show Commercial Opportunities Panel if user has made selections
  if (showOpportunities && finalSelection) {
    return (
      <div className="space-y-4">
        <Button 
          onClick={handleBackToSearch}
          variant="outline"
          className="mb-4"
        >
          ← Back to Product Search
        </Button>
        <CommercialOpportunitiesPanel
          hsCode={finalSelection.hsCode}
          productName={finalSelection.productName}
          originCountry={finalSelection.originCountry}
          operationType={finalSelection.operationType}
        />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 mb-8 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 className="text-[18px] font-bold text-white flex items-center tracking-wide" style={{ fontFamily: 'Inter', fontWeight: 900 }}>
          <Zap className="mr-3 text-[var(--ds-cyan)] w-5 h-5 drop-shadow-[0_0_8px_rgba(0,212,240,0.8)]" />
          {t("hsLookup.title")} <span className="text-slate-500 font-data text-[10px] uppercase ml-3 border border-white/10 px-2 py-0.5 rounded bg-black/50 tracking-widest">Global Scan Active</span>
        </h3>
        <div className="flex space-x-2 bg-black/40 p-1 rounded-full border border-white/5">
          <Button
            variant={operationType === "importer" ? "default" : "ghost"}
            onClick={() => setOperationType("importer")}
            className={operationType === "importer" ? "bg-[var(--ds-cyan)] text-[#010609] hover:bg-cyan-400 font-bold rounded-full text-[11px] uppercase tracking-wider" : "text-slate-400 hover:text-white font-bold rounded-full text-[11px] uppercase tracking-wider"}
            style={{ fontFamily: 'var(--ds-font-data)' }}
          >
            {t("hsLookup.importer")}
          </Button>
          <Button
            variant={operationType === "exporter" ? "default" : "ghost"}
            onClick={() => setOperationType("exporter")}
            className={operationType === "exporter" ? "bg-[var(--ds-cyan)] text-[#010609] hover:bg-cyan-400 font-bold rounded-full text-[11px] uppercase tracking-wider" : "text-slate-400 hover:text-white font-bold rounded-full text-[11px] uppercase tracking-wider"}
            style={{ fontFamily: 'var(--ds-font-data)' }}
          >
            {t("hsLookup.exporter")}
          </Button>
        </div>
      </div>

      {/* Enhanced Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Country Selection */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 font-data">
            <MapPin className="inline w-3.5 h-3.5 mr-1" />
            Contexto País (Opcional)
          </label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="bg-[#0a1d2e] border-white/5 text-white h-12 focus:ring-1 focus:ring-[var(--ds-cyan)] focus:border-[var(--ds-cyan)] transition-shadow shadow-inner">
              <SelectValue placeholder="Selecciona un país para optimizar" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1d2e] border-white/10 text-white backdrop-blur-[20px]">
              <SelectItem value="all">Sin filtro de país</SelectItem>
              {countries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name} <span className="text-slate-500 font-data text-[10px] ml-2">({country.region})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search Type Indicator */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 font-data">
            Inteligencia Activa
          </label>
          <div className="h-12 px-4 bg-[var(--ds-cyan)]/10 border border-[var(--ds-cyan)]/30 rounded-lg flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-[var(--ds-cyan)]/20 to-transparent animate-pulse" />
            <div className="text-[11px] font-bold text-[var(--ds-cyan)] font-data tracking-wide flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> IA Escaneando 875 perfiles
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Search Bar */}
      <div className="relative mb-6 glass border border-white/5 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all group overflow-hidden">
        <div className={`absolute -inset-0.5 rounded-xl blur ${searchQuery.length > 0 ? 'bg-[var(--ds-cyan)] opacity-20 animate-[pulse_2s_infinite]' : 'opacity-0'} transition-opacity duration-300 pointer-events-none`} />
        
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar Inteligencia: 'smartphone', 'tecnología', 'petroleo', o Código HS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 bg-transparent border-transparent text-white font-data text-[14px] placeholder:text-slate-600 focus:ring-0 focus:border-transparent h-14 w-full shadow-none outline-none"
            style={{ fontFamily: 'var(--ds-font-data)' }}
          />
          <Search className={`absolute left-5 top-4 w-6 h-6 transition-colors duration-300 ${searchQuery.length > 0 ? 'text-[var(--ds-cyan)] drop-shadow-[0_0_8px_rgba(0,212,240,0.8)]' : 'text-slate-600'}`} />
          
          {/* Search Status */}
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <div className="absolute right-4 top-4 text-[10px] text-slate-500 font-data uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
              Buscando...
            </div>
          )}
          {searchQuery.length >= 3 && (
            <div className="absolute right-4 top-4 text-[10px] text-[var(--ds-cyan)] font-data font-bold uppercase tracking-widest bg-[var(--ds-cyan)]/10 px-2 py-1 rounded flex items-center gap-1.5 border border-[var(--ds-cyan)]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-cyan)] animate-pulse glow-cyan" /> DB Activa
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search Results */}
      {searchResults && searchQuery.length >= 3 && (
        <div className="mb-8 p-6 glass rounded-2xl border border-[var(--ds-cyan)]/30 shadow-[0_0_30px_rgba(0,212,240,0.1)] backdrop-blur-[20px] relative z-10 animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold text-white mb-4 flex items-center tracking-wide" style={{ fontFamily: 'Inter' }}>
            <Zap className="w-4 h-4 mr-2 text-[var(--ds-cyan)]" />
            Resultados Tácticos
          </h4>
          
          {/* Smart Partidas Results */}
          {searchResults.partidas && searchResults.partidas.length > 0 && (
            <div className="mb-6">
              <h5 className="font-data text-[10px] text-slate-400 tracking-widest uppercase mb-3">🎯 HS Codes Sugeridos:</h5>
              <div className="grid gap-3">
                {searchResults.partidas.slice(0, 5).map((partida: any) => (
                  <div 
                    key={partida.id}
                    className={`p-4 bg-[#0a1d2e] border rounded-xl cursor-pointer transition-all relative overflow-hidden group hover:bg-black/40 ${
                       partida.tariffRate === 0 
                         ? 'border-[var(--ds-green)]/40 hover:border-[var(--ds-green)] hover:shadow-[0_0_15px_rgba(0,255,0,0.2)]'
                         : partida.tariffRate > 15 
                           ? 'border-[var(--ds-amber)]/40 hover:border-[var(--ds-amber)] hover:shadow-[0_0_15px_rgba(255,140,0,0.2)]'
                           : 'border-white/10 hover:border-[var(--ds-cyan)]/50 hover:shadow-[0_0_15px_rgba(0,212,240,0.15)]'
                    }`}
                    onClick={() => handlePartidaSelect(partida)}
                  >
                    <div className="flex items-start justify-between">
                       <div className="font-bold text-white text-[14px]" style={{ fontFamily: 'Inter' }}>
                         <span className="font-data text-[var(--ds-cyan)] mr-2">{partida.code}</span>
                         {language === "es" ? partida.description : partida.descriptionEn}
                       </div>
                       <div className={`font-data px-2 py-1 rounded bg-black/50 border text-[13px] font-bold ${
                          partida.tariffRate === 0 ? 'text-[var(--ds-green)] border-[var(--ds-green)]/30' : 
                          partida.tariffRate > 15 ? 'text-[var(--ds-amber)] border-[var(--ds-amber)]/30' : 
                          'text-white border-white/20'
                       }`}>
                         {partida.tariffRate}%
                       </div>
                    </div>
                    {selectedCountry && (
                      <Button 
                        size="sm" 
                        className="mt-4 bg-gradient-to-r from-[var(--ds-cyan)] to-blue-600 hover:shadow-[0_0_15px_rgba(0,212,240,0.4)] text-[#010609] border-none font-bold uppercase tracking-wider font-data text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartida(partida);
                          handleProceedToOpportunities();
                        }}
                      >
                        Scanner Oportunidades 
                        <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapters Results */}
          {searchResults.chapters && searchResults.chapters.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-800 mb-2">📂 Related Categories:</h5>
              <div className="flex flex-wrap gap-2">
                {searchResults.chapters.slice(0, 4).map((chapter: any) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(chapter.code)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {chapter.code} - {language === "es" ? chapter.description.slice(0, 30) : chapter.descriptionEn.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.partidas && searchResults.partidas.length === 0 && 
           searchResults.chapters && searchResults.chapters.length === 0 && (
            <div className="text-gray-600 text-center py-4">
              No results found. Try different keywords or check spelling.
              <br />
              <span className="text-sm">Common searches: smartphone, computer, coffee, oil, wine, meat</span>
            </div>
          )}
        </div>
      )}
      
      {/* HS Classification Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chapters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("hsLookup.chapters")}
          </label>
          <div className="bg-white border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedChapter === chapter.code ? "bg-blue-50" : ""
                }`}
                onClick={() => handleChapterSelect(chapter.code)}
              >
                <div className="font-medium text-gray-900">
                  {chapter.code} - {language === "es" ? chapter.description : chapter.descriptionEn}
                </div>
                <div className="text-sm text-gray-500">
                  {partidas.filter(p => p.chapterCode === chapter.code).length} {t("hsLookup.partidas")}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Partidas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("hsLookup.partidas")}
          </label>
          <div className="bg-white border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {selectedChapter ? (
              partidas.map((partida) => (
                <div
                  key={partida.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedPartida?.id === partida.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handlePartidaSelect(partida)}
                >
                  <div className="font-medium text-gray-900">
                    {partida.code} - {language === "es" ? partida.description : partida.descriptionEn}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("hsLookup.tariff")}: {partida.tariffRate}%
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-500 text-center">
                {t("hsLookup.selectChapter")}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Selected Item Info */}
      {selectedPartida && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="text-kora-primary mt-1 w-5 h-5" />
            <div>
              <h4 className="font-medium text-gray-900">{selectedPartida.code}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {language === "es" ? selectedPartida.description : selectedPartida.descriptionEn}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600">
                  {t("hsLookup.tariff")}: <span className="font-medium">{selectedPartida.tariffRate}%</span>
                </span>
                <span className="text-gray-600">
                  IVA: <span className="font-medium">21%</span>
                </span>
                <span className="text-gray-600">
                  {t("hsLookup.statistics")}: <span className="font-medium">0.5%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
