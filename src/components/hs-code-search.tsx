import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Hash,
  Package,
  ArrowRight,
  Zap,
  Globe,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
// Command imports removed to fix double search issue
} from "@/components/ui/command";
// Popover imports removed to cleanup UI
import type { HsSubpartida, HsPartida } from "@shared/schema";
import { countries, getCountryTreaties, getTariffReduction, type CountryData } from "@shared/countries-data";

interface HsCodeSearchProps {
  onProductSelected?: (product: HsSubpartida, country: string, operation: string, productName: string) => void;
  onPartidaSelected?: (partida: HsPartida, country: string, operation: string, productName: string) => void;
}

export default function HsCodeSearch({ onProductSelected, onPartidaSelected }: HsCodeSearchProps = {}) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [originCountry, setOriginCountry] = useState<string>("");
  const [operationType, setOperationType] = useState<string>("");
  const [open, setOpen] = useState(false);

  const aiSuggestions = [
    { code: '1201', label: language === 'es' ? 'Soja / Soya' : 'Soybeans', icon: '🌱' },
    { code: '0201', label: language === 'es' ? 'Carne Bovina' : 'Beef Meat', icon: '🥩' },
    { code: '1006', label: language === 'es' ? 'Arroz' : 'Rice', icon: '🌾' },
    { code: '8517', label: language === 'es' ? 'Smartphones / Celulares' : 'Smartphones', icon: '📱' },
    { code: '0901', label: language === 'es' ? 'Café' : 'Coffee', icon: '☕' }
  ];

  // Agrupar países por región para mejor organización
  const regionOrder = ['South America', 'North America', 'Europe', 'Asia', 'Oceania', 'Africa', 'Middle East'];
  const countriesByRegion = regionOrder.map(region => ({
    region,
    regionName: {
      'South America': language === 'es' ? 'Sudamérica' : 'South America',
      'North America': language === 'es' ? 'Norteamérica' : 'North America', 
      'Europe': language === 'es' ? 'Europa' : 'Europe',
      'Asia': language === 'es' ? 'Asia' : 'Asia',
      'Oceania': language === 'es' ? 'Oceanía' : 'Oceania',
      'Africa': language === 'es' ? 'África' : 'Africa',
      'Middle East': language === 'es' ? 'Medio Oriente' : 'Middle East'
    }[region],
    countries: countries.filter(c => c.region === region)
  })).filter(group => group.countries.length > 0);

  // Search HS items with country and operation filters
  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/hs-search", searchQuery, originCountry, operationType],
    queryFn: async () => {
      console.log('🔍 Frontend: Executing search for:', searchQuery);
      if (!searchQuery.trim() || searchQuery.length < 2) return { subpartidas: [], warnings: [] };
      
      const params = new URLSearchParams({
        q: searchQuery,
        ...(originCountry && originCountry !== 'all' && { country: originCountry }),
        ...(operationType && operationType !== 'all' && { operation: operationType })
      });
      
      console.log('🔍 Frontend: Fetching URL:', `/api/hs/search?${params}`);
      const response = await fetch(`/api/hs/search?${params}`);
        if (!response.ok) throw new Error('Failed to search HS items');
        const data = await response.json();
        console.log('✅ Frontend: Received data:', data);
        
        return { 
          subpartidas: data.results || [],
          warnings: []
        };
    },
    enabled: searchQuery.length >= 2
  });

  console.log('🎨 Render: isLoading:', isLoading, 'Results:', searchResults?.subpartidas?.length);

  const handleProductSelect = (item: any) => {
    if (!originCountry || originCountry === 'all' || originCountry.trim().length === 0) {
      toast({
        title: language === 'es' ? 'País específico requerido' : 'Specific country required',
        description: language === 'es' ? 'Selecciona un país específico antes de elegir un producto' : 'Select a specific country before choosing a product',
        variant: "destructive",
      });
      return;
    }
    
    if (!operationType || operationType === 'all' || operationType.trim().length === 0) {
      toast({
        title: language === 'es' ? 'Operación específica requerida' : 'Specific operation required',
        description: language === 'es' ? 'Selecciona importar o exportar específicamente' : 'Select import or export specifically',
        variant: "destructive",
      });
      return;
    }

    const productName = language === 'es' ? (item.desc_es || item.desc_en) : (item.desc_en || item.desc_es);
    const finalCode = item.primaryCode || item.hs6 || item.code;
    
    const navParams = {
      code: finalCode,
      country: originCountry.trim(), 
      operation: operationType.trim(),
      productName: productName
    };
    
    onProductSelected?.(item as any, navParams.country, navParams.operation, navParams.productName);
    toast({
      title: language === 'es' ? 'Producto seleccionado' : 'Product selected',
      description: `${navParams.code} - ${navParams.productName}`,
    });
  };

  // queryFn always returns { subpartidas, warnings }
  const allResults = searchResults?.subpartidas || [];

  return (
    <TooltipProvider>
      <Card className="bg-[var(--ds-bg-overlay)] border border-[var(--ds-border-default)] rounded-[4px] shadow-2xl overflow-hidden relative z-50">
      <CardHeader className="bg-[#03080f] border-b border-[var(--ds-border-default)] p-[16px_24px]">
        <CardTitle className="flex items-center text-[13px] font-body font-semibold text-[#c8dff0]">
          <Search className="mr-2 text-[var(--ds-cyan)] w-4 h-4" />
          {language === 'es' ? 'Buscador de Códigos HS' : 'HS Code Search'}
          <Badge variant="secondary" className="ml-2 bg-[var(--ds-cyan)15] text-[var(--ds-cyan)] border border-[var(--ds-cyan)30] font-data text-[9px] uppercase tracking-[0.8px] rounded-[2px] hover:bg-[var(--ds-cyan)15]">
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selector de país */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-blue-100">
              <Globe className="w-4 h-4 inline mr-2 text-blue-400" />
              {language === 'es' ? 'País de Origen/Destino' : 'Origin/Destination Country'}
            </Label>
            <Select value={originCountry} onValueChange={setOriginCountry} name="originCountry">
              <SelectTrigger id="originCountry" className="bg-white/5 border-white/10 text-white focus:ring-blue-500/50 focus:border-blue-500/50">
                <SelectValue placeholder={language === 'es' ? "Selecciona un país" : "Select a country"} />
              </SelectTrigger>
              <SelectContent className="max-h-96 bg-slate-900 border-white/10 text-white z-[60]">
                <SelectItem value="all" className="focus:bg-white/10 focus:text-white">{language === 'es' ? 'Todos los países' : 'All countries'}</SelectItem>
                {countriesByRegion.map(group => [
                  <div key={`${group.region}-header`} className="px-2 py-1.5 text-sm font-semibold text-blue-400 bg-white/5">
                    {group.regionName}
                  </div>,
                  ...group.countries.map(country => (
                    <SelectItem key={country.code} value={country.code} className="pl-4 focus:bg-white/10 focus:text-white">
                      {language === 'es' ? country.name : country.nameEn}
                      {country.treaties.length > 0 && (
                        <span className="ml-2 text-xs text-blue-400">●</span>
                      )}
                    </SelectItem>
                  ))
                ])}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de operación */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-blue-100">
              {language === 'es' ? 'Tipo de Operación' : 'Operation Type'}
            </Label>
            <Select value={operationType} onValueChange={setOperationType} name="operationType">
              <SelectTrigger id="operationType" className="bg-white/5 border-white/10 text-white focus:ring-blue-500/50 focus:border-blue-500/50">
                <SelectValue placeholder={language === 'es' ? "Selecciona operación" : "Select operation"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white z-[60]">
                <SelectItem value="all" className="focus:bg-white/10 focus:text-white">{language === 'es' ? 'Importar y Exportar' : 'Import and Export'}</SelectItem>
                <SelectItem value="import" className="focus:bg-white/10 focus:text-white">
                  <div className="flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2 text-green-400" />
                    {language === 'es' ? 'Importar' : 'Import'}
                  </div>
                </SelectItem>
                <SelectItem value="export" className="focus:bg-white/10 focus:text-white">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                    {language === 'es' ? 'Exportar' : 'Export'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buscador de productos con Autocomplete Inteligente */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-blue-100 flex items-center justify-between">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 inline mr-2 text-yellow-400" />
              {language === 'es' ? 'Búsqueda Inteligente (HS Code o Producto)' : 'Smart Search (HS Code or Product)'}
            </span>
            <div className="flex gap-2">
              {aiSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion.code}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-500/20 border-blue-500/30 text-[10px] py-0"
                  onClick={() => {
                    setSearchQuery(suggestion.label);
                    setOpen(true);
                  }}
                >
                  {suggestion.icon} {suggestion.label}
                </Badge>
              ))}
            </div>
          </Label>
          
          <div className="relative group glass border border-white/5 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all">
             <div className={`absolute -inset-0.5 rounded-xl blur ${searchQuery.length > 0 ? 'bg-[var(--ds-cyan)] opacity-20 animate-[pulse_2s_infinite]' : 'opacity-0'} transition-opacity duration-300 pointer-events-none`} />
             
                <div className="relative flex items-center h-14 px-2">
                  <Search className={`absolute left-4 w-5 h-5 z-10 transition-colors ${searchQuery.length > 0 ? 'text-[var(--ds-cyan)] drop-shadow-[0_0_5px_rgba(0,212,240,0.8)]' : 'text-slate-500'}`} />
                  <Input
                    placeholder={language === 'es' ? "Busca por nombre o código HS..." : "Search by name or HS code..."}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) setOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.length >= 2) setOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        refetch();
                      }
                    }}
                    className="pl-12 pr-32 bg-transparent border-transparent text-white font-data text-[14px] placeholder:text-slate-600 focus:ring-0 focus:border-transparent h-full w-full shadow-none outline-none"
                    style={{ fontFamily: 'var(--ds-font-data)' }}
                  />
                  <div className="absolute right-2 z-10 h-10 top-2">
                    <Button 
                      size="sm"
                      className={`h-full px-6 font-bold uppercase tracking-wider text-[11px] rounded-lg transition-all ${
                        (searchQuery.length < 3) 
                          ? 'bg-black/50 text-slate-500 cursor-not-allowed border border-white/5' 
                          : 'bg-gradient-to-r from-[var(--ds-cyan)] to-blue-600 text-[#010609] hover:shadow-[0_0_20px_rgba(0,212,240,0.4)] border-none'
                      }`}
                      style={{ fontFamily: 'var(--ds-font-data)' }}
                      onClick={() => {
                        if (searchQuery.length < 3) return;
                        
                        // Force refetch to ensure we have data
                        refetch().then(({ data }) => {
                          const results = data?.subpartidas || [];
                          if (results.length === 0) {
                            toast({
                              title: language === 'es' ? 'Sin resultados' : 'No results',
                              description: language === 'es' ? 'No encontramos productos con ese nombre.' : 'We could not find products with that name.',
                              variant: "default",
                            });
                          } else {
                            if (!originCountry || !operationType) {
                                toast({
                                  title: language === 'es' ? 'Selecciona País y Operación' : 'Select Country and Operation',
                                  description: language === 'es' ? 'Hemos encontrado productos. Por favor selecciona país y operación para analizar.' : 'Products found. Please select country and operation to analyze.',
                                  variant: "default",
                                });
                            }
                          }
                        });
                      }}
                    >
                      {language === 'es' ? 'ANALIZAR' : 'ANALYZE'}
                    </Button>
                  </div>
                </div>
          </div>
        </div>

        {/* Información de filtros activos */}
        <AnimatePresence>
          {(originCountry || operationType) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {originCountry && originCountry !== 'all' && (
                <div className="flex flex-col space-y-1">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                    <Globe className="w-3 h-3 mr-1" />
                    {countries.find(c => c.code === originCountry)?.[language === 'es' ? 'name' : 'nameEn'] || originCountry}
                  </Badge>
                </div>
              )}
              {operationType && operationType !== 'all' && (
                <Badge variant="secondary" className={operationType === 'import' ? "bg-green-500/20 text-green-200 border-green-400/30" : "bg-blue-500/20 text-blue-200 border-blue-400/30"}>
                  {operationType === 'import' ? (
                    <><TrendingDown className="w-3 h-3 mr-1" />{language === 'es' ? 'Importar' : 'Import'}</>
                  ) : (
                    <><TrendingUp className="w-3 h-3 mr-1" />{language === 'es' ? 'Exportar' : 'Export'}</>
                  )}
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <motion.div 
              key="too-short"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-400 text-center py-4"
            >
              {language === 'es' ? 'Escribe al menos 3 caracteres para buscar' : 'Type at least 3 characters to search'}
            </motion.div>
          )}

          {isLoading && searchQuery.length >= 3 && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 relative overflow-hidden glass rounded-xl border border-[var(--ds-cyan)]/30 shadow-[0_0_30px_rgba(0,212,240,0.15)]"
            >
              <div className="absolute inset-0 z-0 opacity-20 text-[var(--ds-cyan)] flex flex-col justify-center font-data text-[10px] break-all animate-[scan_4s_linear_infinite]" style={{ lineHeight: '10px' }}>
                 {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i}>{Math.random().toString(36).substring(2, 10).toUpperCase()} {Math.random().toString(36).substring(2, 10).toUpperCase()} {Math.random().toString(36).substring(2, 10).toUpperCase()} {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                 ))}
              </div>
              <div className="absolute left-0 right-0 h-[2px] bg-[var(--ds-cyan)] shadow-[0_0_15px_rgba(0,212,240,1)] animate-[scan_2s_ease-in-out_infinite] z-10" />
              
              <div className="relative z-20 flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-t-2 border-[var(--ds-cyan)] rounded-full animate-spin glow-cyan opacity-80" />
                  <div className="absolute inset-2 border-b-2 border-slate-500 rounded-full animate-spin-slow opacity-60" />
                  <Zap className="w-5 h-5 text-[var(--ds-cyan)] drop-shadow-[0_0_8px_rgba(0,212,240,0.8)] animate-pulse" />
                </div>
                <div className="text-[14px] font-bold text-[var(--ds-cyan)] font-data uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,212,240,0.5)]">
                  {language === 'es' ? 'Analizando Base de Datos Global...' : 'Analyzing Global Database...'}
                </div>
                <div className="text-[10px] font-data text-slate-500 mt-2 uppercase tracking-widest">
                  Escaneando Aranceles y Barreras
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && searchQuery.length >= 3 && allResults.length === 0 && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-base text-gray-300 font-medium mb-1">
                {language === 'es' ? 'No se encontraron productos' : 'No products found'}
              </div>
              <div className="text-sm text-gray-500">
                {language === 'es' ? 'Intenta con otros términos de búsqueda' : 'Try different search terms'}
              </div>
            </motion.div>
          )}

          {!isLoading && allResults.length > 0 && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
            >
              <div className="flex items-center justify-between text-sm text-blue-300 mb-3 px-1">
                <span>{language === 'es' ? 'Resultados encontrados:' : 'Results found:'} {allResults.length}</span>
                <Sparkles className="w-4 h-4" />
              </div>
              
              {/* Display warning messages */}
              {searchResults?.warnings && searchResults.warnings.length > 0 && (
                <div className="space-y-2 mb-4">
                  {searchResults.warnings.map((warning: {message: string, messageEn: string, severity: 'info' | 'warning' | 'blocked'}, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start p-3 rounded-lg border ${
                        warning.severity === 'blocked' ? 'bg-red-900/20 border-red-500/30 text-red-200' :
                        warning.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200' :
                        'bg-blue-900/20 border-blue-500/30 text-blue-200'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm">{language === 'es' ? warning.message : warning.messageEn}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {allResults.map((item, index) => {
                const getArancelClass = (val: string) => {
                  if (val === '0.0%') return 'text-[var(--ds-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]';
                  if (val && parseFloat(val) > 15) return 'text-[var(--ds-amber)] drop-shadow-[0_0_8px_rgba(255,140,0,0.5)]';
                  return 'text-white';
                };
                return (
                <motion.div
                  key={`${item.hs6}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 glass rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-4 ${
                    item.tariffInfo?.mercosur === '0.0%' 
                     ? 'border-[var(--ds-green)]/30 hover:shadow-[0_0_20px_rgba(0,255,0,0.15)] hover:border-[var(--ds-green)] bg-gradient-to-br from-black/40 to-[var(--ds-green)]/5'
                     : 'border-white/5 hover:border-[var(--ds-cyan)]/30 hover:shadow-[0_0_15px_rgba(0,212,240,0.1)] hover:bg-black/40'
                  }`}
                  onClick={() => handleProductSelect(item)}
                >
                  <div className="flex items-start justify-between relative z-10 w-full">
                    <div className="flex-1">
                      <h6 className="font-bold text-white mb-2 leading-tight group-hover:text-[var(--ds-cyan)] transition-colors text-lg flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                        <div className={`w-2 h-2 rounded-full ${item.tariffInfo?.mercosur === '0.0%' ? 'bg-[var(--ds-green)] glow-green' : 'bg-slate-500'}`} />
                        {language === 'es' ? item.desc_es : item.desc_en}
                        <span className="text-sm text-slate-400 font-normal ml-2">
                          ({language === 'es' ? item.desc_en : item.desc_es})
                        </span>
                      </h6>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
                        {/* MERCOSUR NCM */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col bg-[var(--ds-bg-input)] p-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] shadow-[var(--ds-shadow-raised)] hover:border-[var(--ds-cyan)] transition-colors cursor-help">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--ds-text-secondary)] font-bold mb-1 font-data">NCM (SUR) {item.ncm8 ? '' : '⏳'}</span>
                              <span className="text-[13px] text-[var(--ds-text-primary)] font-data">{item.ncm8 || '---'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[var(--ds-bg-overlay)] border-[var(--ds-border-default)] text-[var(--ds-text-primary)] text-xs">
                            <p className="font-bold mb-1">Nomenclatura Común del Mercosur</p>
                            <p className="text-[var(--ds-text-secondary)]">Usado en: Argentina, Brasil, Paraguay, Uruguay.</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* EU TARIC */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col bg-[var(--ds-bg-input)] p-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] shadow-[var(--ds-shadow-raised)] hover:border-[var(--ds-cyan)] transition-colors cursor-help">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--ds-text-secondary)] font-bold mb-1 font-data">TARIC (UE) {item.taric10 ? '' : '⏳'}</span>
                              <span className="text-[13px] text-[var(--ds-text-primary)] font-data">{item.taric10 || '---'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[var(--ds-bg-overlay)] border-[var(--ds-border-default)] text-[var(--ds-text-primary)] text-xs">
                            <p className="font-bold mb-1">TARIC</p>
                            <p className="text-[var(--ds-text-secondary)]">Arancel Integrado de las Comunidades Europeas.</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* USA HTS */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col bg-[var(--ds-bg-input)] p-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)] shadow-[var(--ds-shadow-raised)] hover:border-[var(--ds-cyan)] transition-colors cursor-help">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--ds-text-secondary)] font-bold mb-1 font-data">HTS (USA) {item.hts10 ? '' : '⏳'}</span>
                              <span className="text-[13px] text-[var(--ds-text-primary)] font-data">{item.hts10 || '---'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[var(--ds-bg-overlay)] border-[var(--ds-border-default)] text-[var(--ds-text-primary)] text-xs">
                            <p className="font-bold mb-1">HTS</p>
                            <p className="text-[var(--ds-text-secondary)]">Harmonized Tariff Schedule of the United States.</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* HS Base */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col bg-[var(--ds-bg-surface)] p-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-default)] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] cursor-help">
                              <span className="text-[10px] uppercase tracking-widest text-[var(--ds-text-muted)] font-bold mb-1 font-data">HS Base</span>
                              <span className="text-[14px] text-[var(--ds-cyan)] font-data font-bold">{item.hs6}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[var(--ds-bg-overlay)] border-[var(--ds-border-default)] text-[var(--ds-text-primary)] text-xs">
                            <p className="font-bold mb-1">Sistema Armonizado Base</p>
                            <p className="text-[var(--ds-text-secondary)]">Los primeros 6 dígitos son idénticos a nivel mundial.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-data text-[9px] uppercase tracking-widest font-bold text-slate-500 bg-black/50 px-2 py-1 rounded">Aranceles:</span>
                        <div className="flex items-center gap-1.5">
                           <span className="font-data text-[10px] text-[#4a7090] uppercase tracking-wider">MERCOSUR</span>
                           <span className={`text-[16px] font-bold ${getArancelClass(item.tariffInfo?.mercosur)}`} style={{ fontFamily: 'Inter', fontWeight: 900 }}>{item.tariffInfo?.mercosur || '-'}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <div className="flex items-center gap-1.5">
                           <span className="font-data text-[10px] text-[#4a7090] uppercase tracking-wider">UE (TARIC)</span>
                           <span className={`text-[16px] font-bold ${getArancelClass(item.tariffInfo?.eu)}`} style={{ fontFamily: 'Inter', fontWeight: 900 }}>{item.tariffInfo?.eu || '-'}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <div className="flex items-center gap-1.5">
                           <span className="font-data text-[10px] text-[#4a7090] uppercase tracking-wider">USA (HTS)</span>
                           <span className={`text-[16px] font-bold ${getArancelClass(item.tariffInfo?.usa)}`} style={{ fontFamily: 'Inter', fontWeight: 900 }}>{item.tariffInfo?.usa || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {searchQuery.length >= 3 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20"
          >
            <div className="text-xs text-blue-300 font-medium mb-1 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              {language === 'es' ? 'Consejos de búsqueda:' : 'Search tips:'}
            </div>
            <ul className="text-xs text-blue-400/80 space-y-1 ml-4 list-disc">
              <li>{language === 'es' ? 'Selecciona un país para ver regulaciones específicas' : 'Select a country to see specific regulations'}</li>
              <li>{language === 'es' ? 'Elige importar/exportar para filtrar productos permitidos' : 'Choose import/export to filter allowed products'}</li>
              <li>{language === 'es' ? 'Usa palabras clave específicas como "smartphone", "algodón"' : 'Use specific keywords like "smartphone", "cotton"'}</li>
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
