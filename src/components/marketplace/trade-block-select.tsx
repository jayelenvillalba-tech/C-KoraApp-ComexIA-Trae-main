import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface TradeBlockSelectProps {
  value?: string;
  onChange: (value: string, isBlock: boolean) => void;
  language: 'es' | 'en';
}

interface TradeBlock {
  id: string;
  name: string;
  nameEs: string;
  countries: string[];
  icon: string;
  tariffBenefit: string;
}

export default function TradeBlockSelect({ value, onChange, language }: TradeBlockSelectProps) {
  const [tradeBlocks, setTradeBlocks] = useState<TradeBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketplace/trade-blocks')
      .then(res => res.json())
      .then(data => {
        setTradeBlocks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading trade blocks:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-xs text-gray-400">Loading...</div>;
  }

  const topCountries = [
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brasil' },
    { code: 'US', name: 'USA' },
    { code: 'CN', name: 'China' },
    { code: 'DE', name: 'Alemania' },
    { code: 'CL', name: 'Chile' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'PY', name: 'Paraguay' }
  ];

  return (
    <Select value={value} onValueChange={(val) => {
      const isBlock = tradeBlocks.some(b => b.id === val);
      onChange(val, isBlock);
    }}>
      <SelectTrigger className="bg-white/5 border-gray-700 text-white text-sm">
        <SelectValue placeholder={language === 'es' ? 'Todos los países' : 'All countries'} />
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-gray-700">
        <SelectGroup>
          <SelectLabel className="text-cyan-400 text-xs">
            {language === 'es' ? 'Bloques Comerciales' : 'Trade Blocks'}
          </SelectLabel>
          {tradeBlocks.map(block => (
            <SelectItem 
              key={block.id} 
              value={block.id}
              className="text-white hover:bg-white/10"
            >
              {language === 'es' ? block.nameEs : block.name}
              <span className="text-xs text-green-400 ml-2">
                {block.tariffBenefit.includes('0%') ? '0%' : ''}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-700">
            {language === 'es' ? 'Países Principales' : 'Top Countries'}
          </SelectLabel>
          {topCountries.map(country => (
            <SelectItem 
              key={country.code} 
              value={country.code}
              className="text-white hover:bg-white/10"
            >
              {country.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
