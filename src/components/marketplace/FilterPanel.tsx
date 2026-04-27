import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronRight, Zap, Globe, FileCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterState {
  type: string;
  sector: string;
  verifiedOnly: boolean;
  minPrice: string;
  maxPrice: string;
  hsCode: string;
  country: string;
  aiQuery: string;
  documentState: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onAiFilter: (query: string) => void;
  isAiLoading?: boolean;
}

// Shared input style using DS tokens (applied via CSS custom properties inline as fallback)
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--ds-bg-input)',
  border: '1px solid var(--ds-border-default)',
  borderRadius: 'var(--ds-radius-sm)',
  color: 'var(--ds-text-primary)',
  padding: '8px',
  fontSize: 'var(--ds-text-sm)',
  fontFamily: 'var(--ds-font-body)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color var(--ds-ease-fast)',
};

export default function FilterPanel({ filters, onChange, onAiFilter, isAiLoading = false }: FilterPanelProps) {
  const { t } = useTranslation();
  const [advOpen, setAdvOpen] = useState(false);
  const [aiText, setAiText] = useState('');

  const [filterOptions, setFilterOptions] = useState<{ countries: any[], tradeBlocs: any[] }>({ countries: [], tradeBlocs: [] });

  useEffect(() => {
    fetch('/api/marketplace/filter-options')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFilterOptions({ countries: data.countries, tradeBlocs: data.tradeBlocs });
        }
      })
      .catch(err => console.error('Failed to load filter options', err));
  }, []);

  const sectors = [
    { key: 'agro', label: '🌾 Agricultura' },
    { key: 'tech', label: '💻 Tecnología' },
    { key: 'transport', label: '🚢 Transporte' },
    { key: 'manuf', label: '🏭 Manufactura' },
    { key: 'services', label: '📋 Servicios' },
    { key: 'eco', label: '🌿 Ecológico' },
  ];

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiText.trim()) { onAiFilter(aiText.trim()); }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div style={{
      padding: 'var(--ds-space-4)',
      position: 'sticky',
      top: '16px',
      background: 'var(--ds-bg-surface)',
      border: '1px solid var(--ds-border-default)',
      borderRadius: 'var(--ds-radius-md)',
      boxShadow: 'var(--ds-shadow-card)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)', marginBottom: 'var(--ds-space-4)' }}>
        <Filter size={14} color="var(--ds-cyan)" />
        <span style={{
          fontFamily: 'var(--ds-font-display)',
          fontWeight: 700,
          fontSize: 'var(--ds-text-base)',
          color: 'var(--ds-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--ds-tracking-label)',
        }}>
          {t('marketplace.filters')}
        </span>
      </div>

      {/* AI NLP Filter */}
      <form onSubmit={handleAiSubmit} style={{
        marginBottom: 'var(--ds-space-5)',
        padding: 'var(--ds-space-3)',
        background: 'var(--ds-cyan-dim)',
        border: '1px solid var(--ds-border-focus)',
        borderRadius: 'var(--ds-radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)', marginBottom: 'var(--ds-space-2)' }}>
          <Zap size={12} color="var(--ds-cyan)" />
          <span style={{
            fontSize: 'var(--ds-text-xs)',
            color: 'var(--ds-cyan)',
            fontFamily: 'var(--ds-font-data)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 'var(--ds-tracking-data)',
          }}>{t('marketplace.aiFilter')}</span>
        </div>
        <input
          value={aiText}
          onChange={e => setAiText(e.target.value)}
          disabled={isAiLoading}
          placeholder={t('marketplace.aiFilterPlaceholder')}
          style={inputStyle}
        />
        {isAiLoading && (
          <div style={{
            fontSize: 'var(--ds-text-xs)',
            color: 'var(--ds-amber)',
            marginTop: 'var(--ds-space-2)',
            fontFamily: 'var(--ds-font-data)',
          }}>Analizando y aplicando filtros...</div>
        )}
      </form>

      {/* Type toggle */}
      <div style={{ marginBottom: 'var(--ds-space-4)' }}>
        <div style={{
          fontSize: 'var(--ds-text-xs)',
          color: 'var(--ds-text-tertiary)',
          fontFamily: 'var(--ds-font-data)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--ds-tracking-data)',
          marginBottom: 'var(--ds-space-2)',
        }}>{t('marketplace.type')}</div>
        <div style={{ display: 'flex', gap: 'var(--ds-space-2)' }}>
          {['', 'buy', 'sell'].map(type => (
            <button
              key={type}
              onClick={() => updateFilter('type', type)}
              style={{
                background: filters.type === type ? 'var(--ds-cyan-dim)' : 'transparent',
                border: `1px solid ${filters.type === type ? 'var(--ds-border-focus)' : 'var(--ds-border-default)'}`,
                borderRadius: 'var(--ds-radius-sm)',
                padding: '6px 14px',
                fontFamily: 'var(--ds-font-data)',
                fontSize: 'var(--ds-text-xs)',
                color: filters.type === type ? 'var(--ds-cyan)' : 'var(--ds-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--ds-ease-fast)',
              }}
            >
              {type === '' ? t('marketplace.showAll') : type === 'buy' ? `🛒 ${t('marketplace.buy')}` : `📤 ${t('marketplace.sell')}`}
            </button>
          ))}
        </div>
      </div>

      {/* Sector */}
      <div style={{ marginBottom: 'var(--ds-space-4)' }}>
        <div style={{
          fontSize: 'var(--ds-text-xs)',
          color: 'var(--ds-text-tertiary)',
          fontFamily: 'var(--ds-font-data)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--ds-tracking-data)',
          marginBottom: 'var(--ds-space-2)',
        }}>{t('marketplace.sector')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-1)' }}>
          {sectors.map(s => (
            <button
              key={s.key}
              onClick={() => updateFilter('sector', filters.sector === s.key ? '' : s.key)}
              style={{
                background: filters.sector === s.key ? 'var(--ds-cyan-dim)' : 'transparent',
                border: `1px solid ${filters.sector === s.key ? 'var(--ds-border-focus)' : 'var(--ds-border-default)'}`,
                borderRadius: 'var(--ds-radius-sm)',
                padding: '6px var(--ds-space-3)',
                color: filters.sector === s.key ? 'var(--ds-cyan)' : 'var(--ds-text-secondary)',
                fontSize: 'var(--ds-text-sm)',
                fontFamily: 'var(--ds-font-body)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--ds-ease-fast)',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Country / Bloc Selector */}
      <div style={{ marginBottom: 'var(--ds-space-4)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--ds-space-1)',
          fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)',
          fontFamily: 'var(--ds-font-data)', textTransform: 'uppercase',
          letterSpacing: 'var(--ds-tracking-data)', marginBottom: 'var(--ds-space-2)',
        }}>
          <Globe size={10} /> {t('marketplace.country')}
        </div>
        <select
          value={filters.country}
          onChange={e => updateFilter('country', e.target.value)}
          style={{ ...inputStyle, background: 'var(--ds-bg-raised)' }}
        >
          <option value="">{t('marketplace.showAll')}</option>
          {filterOptions.tradeBlocs.length > 0 && (
            <optgroup label="Bloques Comerciales">
              {filterOptions.tradeBlocs.map(b => (
                <option key={b.code} value={`bloc:${b.code}`}>{b.code} - {b.name}</option>
              ))}
            </optgroup>
          )}
          {filterOptions.countries.length > 0 && (
            <optgroup label="Países">
              {filterOptions.countries.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Document State Filter */}
      <div style={{ marginBottom: 'var(--ds-space-4)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--ds-space-1)',
          fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)',
          fontFamily: 'var(--ds-font-data)', textTransform: 'uppercase',
          letterSpacing: 'var(--ds-tracking-data)', marginBottom: 'var(--ds-space-2)',
        }}>
          <FileCheck size={10} /> {t('marketplace.docFilter')}
        </div>
        <select
          value={filters.documentState}
          onChange={e => updateFilter('documentState', e.target.value)}
          style={{ ...inputStyle, background: 'var(--ds-bg-raised)' }}
        >
          <option value="">Cualquier estado</option>
          <option value="ready">{t('marketplace.canOperateNow')}</option>
          <option value="partial">{t('marketplace.canOperateSoon')}</option>
        </select>
      </div>

      {/* Verified */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)',
        cursor: 'pointer', marginBottom: 'var(--ds-space-4)',
      }}>
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={e => updateFilter('verifiedOnly', e.target.checked)}
          style={{ accentColor: 'var(--ds-cyan)', width: 14, height: 14 }}
        />
        <span style={{
          fontSize: 'var(--ds-text-sm)',
          color: 'var(--ds-text-secondary)',
          fontFamily: 'var(--ds-font-data)',
        }}>{t('marketplace.onlyVerified')}</span>
      </label>

      {/* Advanced toggle */}
      <button
        onClick={() => setAdvOpen(!advOpen)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--ds-cyan)', cursor: 'pointer',
          fontSize: 'var(--ds-text-sm)', fontFamily: 'var(--ds-font-data)',
          display: 'flex', alignItems: 'center', gap: 'var(--ds-space-1)', padding: 0,
        }}>
        {advOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {t('marketplace.advanced')}
      </button>

      {advOpen && (
        <div style={{ marginTop: 'var(--ds-space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
          <div>
            <div style={{
              fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)',
              fontFamily: 'var(--ds-font-data)', marginBottom: 'var(--ds-space-1)',
            }}>Rango USD</div>
            <div style={{ display: 'flex', gap: 'var(--ds-space-2)' }}>
              <input
                value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)}
                placeholder="Min" style={{ ...inputStyle, flex: 1, background: 'var(--ds-bg-raised)', fontFamily: 'var(--ds-font-data)' }}
              />
              <input
                value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}
                placeholder="Max" style={{ ...inputStyle, flex: 1, background: 'var(--ds-bg-raised)', fontFamily: 'var(--ds-font-data)' }}
              />
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)',
              fontFamily: 'var(--ds-font-data)', marginBottom: 'var(--ds-space-1)',
            }}>HS Code / NCM</div>
            <input
              value={filters.hsCode} onChange={e => updateFilter('hsCode', e.target.value)}
              placeholder="Ej: 1201"
              style={{ ...inputStyle, background: 'var(--ds-bg-raised)', fontFamily: 'var(--ds-font-data)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
