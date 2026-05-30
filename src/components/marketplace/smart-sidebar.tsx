import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wheat, 
  Cpu, 
  Truck, 
  Factory, 
  Briefcase,
  ChevronDown,
  ChevronUp,
  Leaf,
  Ship,
  FileText,
  Globe,
  Building2,
  Sparkles
} from 'lucide-react';
import TradeBlockSelect from './trade-block-select';

interface SmartSidebarProps {
  onFilterChange: (filters: MarketplaceFilters) => void;
  currentFilters: MarketplaceFilters;
}

export interface MarketplaceFilters {
  sector?: string;
  type?: string;
  hsCode?: string;
  country?: string;
  subcategory?: string;
  incoterm?: string;
  ecological?: boolean;
  tradeBlock?: string;
  verifiedOnly?: boolean;
  companyName?: string;
}

const SECTORS = [
  { id: 'Agriculture', icon: Wheat, label: { es: 'Agricultura', en: 'Agriculture', pt: 'Agricultura', zh: 'Agriculture' }, color: 'text-green-400' },
  { id: 'Technology', icon: Cpu, label: { es: 'Tecnología', en: 'Technology', pt: 'Tecnologia', zh: 'Technology' }, color: 'text-blue-400' },
  { id: 'Transport', icon: Truck, label: { es: 'Transporte', en: 'Transport', pt: 'Transporte', zh: 'Transport' }, color: 'text-yellow-400' },
  { id: 'Manufacturing', icon: Factory, label: { es: 'Manufactura', en: 'Manufacturing', pt: 'Manufatura', zh: 'Manufacturing' }, color: 'text-purple-400' },
  { id: 'Services', icon: Briefcase, label: { es: 'Servicios', en: 'Services', pt: 'Serviços', zh: 'Services' }, color: 'text-cyan-400' }
];

const AGRICULTURE_SUBCATEGORIES = [
  { id: 'Soybeans', label: { es: 'Soja', en: 'Soybeans', pt: 'Soja', zh: 'Soybeans' } },
  { id: 'Corn', label: { es: 'Maíz', en: 'Corn', pt: 'Milho', zh: 'Corn' } },
  { id: 'Wheat', label: { es: 'Trigo', en: 'Wheat', pt: 'Trigo', zh: 'Wheat' } },
  { id: 'Beef', label: { es: 'Carne Bovina', en: 'Beef', pt: 'Carne Bovina', zh: 'Beef' } }
];

const TRANSPORT_SUBCATEGORIES = [
  { id: 'Maritime', label: { es: 'Marítimo', en: 'Maritime', pt: 'Marítimo', zh: 'Maritime' } },
  { id: 'Air', label: { es: 'Aéreo', en: 'Air', pt: 'Aéreo', zh: 'Air' } },
  { id: 'Land', label: { es: 'Terrestre', en: 'Land', pt: 'Terrestre', zh: 'Land' } }
];

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP', 'FCA'];

export default function SmartSidebar({ onFilterChange, currentFilters }: SmartSidebarProps) {
  const { language } = useLanguage();
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSectorClick = (sectorId: string) => {
    if (currentFilters.sector === sectorId) {
      // Deselect
      onFilterChange({ ...currentFilters, sector: undefined, subcategory: undefined });
      setExpandedSector(null);
    } else {
      // Select
      onFilterChange({ ...currentFilters, sector: sectorId, subcategory: undefined });
      setExpandedSector(sectorId);
    }
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    onFilterChange({ ...currentFilters, subcategory: subcategoryId });
  };

  const handleTypeClick = (type: string) => {
    onFilterChange({ 
      ...currentFilters, 
      type: currentFilters.type === type ? undefined : type 
    });
  };

  const handleIncotermClick = (incoterm: string) => {
    onFilterChange({ 
      ...currentFilters, 
      incoterm: currentFilters.incoterm === incoterm ? undefined : incoterm 
    });
  };

  const handleEcologicalToggle = () => {
    onFilterChange({ 
      ...currentFilters, 
      ecological: !currentFilters.ecological 
    });
  };

  const clearFilters = () => {
    onFilterChange({});
    setExpandedSector(null);
  };

  const getSubcategories = (sectorId: string) => {
    switch (sectorId) {
      case 'Agriculture':
        return AGRICULTURE_SUBCATEGORIES;
      case 'Transport':
        return TRANSPORT_SUBCATEGORIES;
      default:
        return [];
    }
  };

  return (
    <div className="glass p-5 rounded-2xl sticky top-20 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
      {/* Subtle background glow for the sidebar */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-[var(--ds-cyan)]/5 rounded-full blur-[40px] pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="text-cyan-400">🔍</span>
          {language === 'es' ? 'Filtros Inteligentes' : 'Smart Filters'}
        </h3>
        {Object.keys(currentFilters).length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-400 hover:text-white h-auto p-1"
            onClick={clearFilters}
          >
            {language === 'es' ? 'Limpiar' : 'Clear'}
          </Button>
        )}
      </div>

      {/* Post Type Filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          {language === 'es' ? 'Tipo' : 'Type'}
        </p>
        <div className="flex gap-2">
          <Button
            variant={currentFilters.type === 'buy' ? 'default' : 'outline'}
            size="sm"
            className={`flex-1 text-xs ${
              currentFilters.type === 'buy' 
                ? 'bg-cyan-600 hover:bg-cyan-700' 
                : 'border-gray-700 text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => handleTypeClick('buy')}
          >
            {language === 'es' ? 'Compra' : 'Buy'}
          </Button>
          <Button
            variant={currentFilters.type === 'sell' ? 'default' : 'outline'}
            size="sm"
            className={`flex-1 text-xs ${
              currentFilters.type === 'sell' 
                ? 'bg-cyan-600 hover:bg-cyan-700' 
                : 'border-gray-700 text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => handleTypeClick('sell')}
          >
            {language === 'es' ? 'Venta' : 'Sell'}
          </Button>
        </div>
      </div>

      {/* Sector Filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          {language === 'es' ? 'Sector' : 'Sector'}
        </p>
        <div className="space-y-1">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isSelected = currentFilters.sector === sector.id;
            const isExpanded = expandedSector === sector.id;
            const subcategories = getSubcategories(sector.id);

            return (
              <div key={sector.id}>
                <button
                  onClick={() => handleSectorClick(sector.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded transition-colors ${
                    isSelected 
                      ? 'bg-cyan-900/30 text-cyan-400' 
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? sector.color : 'text-gray-400'}`} />
                  <span className="text-sm flex-1 text-left">
                  {sector.label[language as keyof typeof sector.label] ?? sector.label.en}
                  </span>
                  {subcategories.length > 0 && isSelected && (
                    isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {/* Subcategories */}
                {isSelected && isExpanded && subcategories.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategoryClick(sub.id)}
                        className={`w-full text-left text-xs p-2 rounded transition-colors ${
                          currentFilters.subcategory === sub.id
                            ? 'bg-cyan-900/20 text-cyan-300'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {sub.label[language as keyof typeof sub.label] ?? sub.label.en}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecological Filter */}
      <div className="mb-4">
        <button
          onClick={handleEcologicalToggle}
          className={`w-full flex items-center gap-2 p-2 rounded transition-colors ${
            currentFilters.ecological 
              ? 'bg-green-900/30 text-green-400' 
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <Leaf className={`w-4 h-4 ${currentFilters.ecological ? 'text-green-400' : 'text-gray-400'}`} />
          <span className="text-sm">
            {language === 'es' ? 'Ecológico' : 'Ecological'}
          </span>
        </button>
      </div>

      {/* Phase 21: Country/Trade Block Filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {language === 'es' ? 'País / Bloque' : 'Country / Block'}
        </p>
        <TradeBlockSelect 
          value={currentFilters.tradeBlock || currentFilters.country}
          onChange={(value, isBlock) => {
            if (isBlock) {
              onFilterChange({ ...currentFilters, tradeBlock: value, country: undefined });
            } else {
              onFilterChange({ ...currentFilters, country: value, tradeBlock: undefined });
            }
          }}
          language={(language === 'es' || language === 'en') ? language : 'en'}
        />
      </div>

      {/* Phase 21: Company Verification Filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {language === 'es' ? 'Empresa' : 'Company'}
        </p>
        <Input
          placeholder={language === 'es' ? 'Buscar empresa...' : 'Search company...'}
          value={currentFilters.companyName || ''}
          onChange={(e) => onFilterChange({ ...currentFilters, companyName: e.target.value })}
          className="bg-black/50 border-transparent text-white text-sm mb-2 focus:border-[var(--ds-cyan)] focus:ring-1 focus:ring-[var(--ds-cyan)] transition-all shadow-inner placeholder:text-gray-600"
          style={{ fontFamily: 'var(--ds-font-body)' }}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            checked={currentFilters.verifiedOnly || false}
            onCheckedChange={(checked) => 
              onFilterChange({ ...currentFilters, verifiedOnly: checked as boolean })
            }
            className="border-gray-600"
          />
          <label className="text-xs text-gray-300">
            {language === 'es' ? 'Solo verificadas ✓' : 'Verified only ✓'}
          </label>
        </div>
      </div>

      {/* Advanced Filters */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white mb-2"
        >
          <span className="uppercase tracking-wide">
            {language === 'es' ? 'Avanzado' : 'Advanced'}
          </span>
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showAdvanced && (
          <div className="space-y-3">
            {/* Incoterms */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Incoterms</p>
              <div className="flex flex-wrap gap-1">
                {INCOTERMS.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleIncotermClick(term)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      currentFilters.incoterm === term
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Smart Search Button */}
      <div className="mt-8 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--ds-cyan)] to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500 animate-pulse" />
        <button className="relative w-full flex items-center justify-center gap-2 py-3 px-4 bg-black rounded-xl leading-none text-white border border-white/10 font-bold transition-all hover:border-[var(--ds-cyan)]/50">
          <Sparkles className="w-4 h-4 text-[var(--ds-cyan)]" />
          <span style={{ fontFamily: 'Inter', letterSpacing: '0.05em' }} className="text-[13px] uppercase">
            {language === 'es' ? 'AI Smart Search' : 'AI Smart Search'}
          </span>
        </button>
      </div>
    </div>
  );
}
