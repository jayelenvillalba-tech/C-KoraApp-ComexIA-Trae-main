import { useState } from "react";
import { X, Sparkles, Search, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";

interface FiltersProps {
  filters: {
    type: "all" | "buy" | "sell";
    hsCode: string;
    country: string;
    dateRange: "all" | "today" | "week" | "month";
    verifiedOnly: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export default function MarketplaceFilters({ filters, onFiltersChange, onClose }: FiltersProps) {
  const { language } = useLanguage();

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Phase 23: AI Smart Search
  const [smartQuery, setSmartQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleAiSearch = async () => {
    if (!smartQuery || smartQuery.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: smartQuery })
      });
      
      const data = await response.json();
      
      if (data.hsCode) {
        updateFilter("hsCode", data.hsCode);
      }
    } catch (error) {
      console.error('AI search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      type: "all",
      hsCode: "",
      country: "",
      dateRange: "all",
      verifiedOnly: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== "all");

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            {language === 'es' ? '🔍 Filtros de Búsqueda' : '🔍 Search Filters'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Smart Search */}
        <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
          <label className="text-blue-300 text-xs font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            {language === 'es' ? 'Búsqueda Inteligente IA' : 'AI Smart Search'}
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={language === 'es' ? 'Ej: soja orgánica, chips...' : 'Ex: organic soy, chips...'}
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              className="h-8 text-xs bg-black/20 border-blue-500/20 text-white placeholder:text-blue-200/50"
            />
            <Button
              size="sm"
              onClick={handleAiSearch}
              disabled={isSearching || !smartQuery}
              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? <Loader className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-[10px] text-blue-300/70 mt-1">
            {language === 'es' 
              ? 'Busca productos por descripción y la IA encontrará el código HS.' 
              : 'Search by description and AI will find the HS code.'}
          </p>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-slate-300 text-sm mb-2 block">
            {language === 'es' ? 'Tipo de Publicación' : 'Post Type'}
          </label>
          <div className="flex gap-2">
            <Button
              variant={filters.type === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("type", "all")}
              className={filters.type === "all" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {language === 'es' ? 'Todos' : 'All'}
            </Button>
            <Button
              variant={filters.type === "buy" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("type", "buy")}
              className={filters.type === "buy" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              🟢 {language === 'es' ? 'Busco' : 'Buying'}
            </Button>
            <Button
              variant={filters.type === "sell" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("type", "sell")}
              className={filters.type === "sell" 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              🔴 {language === 'es' ? 'Vendo' : 'Selling'}
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="text-slate-300 text-sm mb-2 block">
            {language === 'es' ? 'Fecha de Publicación' : 'Publication Date'}
          </label>
          <div className="flex gap-2">
            <Button
              variant={filters.dateRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("dateRange", "all")}
              className={filters.dateRange === "all" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {language === 'es' ? 'Todas' : 'All'}
            </Button>
            <Button
              variant={filters.dateRange === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("dateRange", "today")}
              className={filters.dateRange === "today" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {language === 'es' ? 'Hoy' : 'Today'}
            </Button>
            <Button
              variant={filters.dateRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("dateRange", "week")}
              className={filters.dateRange === "week" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {language === 'es' ? 'Esta Semana' : 'This Week'}
            </Button>
            <Button
              variant={filters.dateRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("dateRange", "month")}
              className={filters.dateRange === "month" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }
            >
              {language === 'es' ? 'Este Mes' : 'This Month'}
            </Button>
          </div>
        </div>

        {/* Verified Only */}
        <div>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => updateFilter("verifiedOnly", e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">
              {language === 'es' ? 'Solo empresas verificadas' : 'Verified companies only'}
            </span>
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {language === 'es' ? 'Limpiar Filtros' : 'Clear Filters'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
