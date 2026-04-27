import fs from 'fs';

let code = fs.readFileSync('src/pages/onboarding.tsx', 'utf8');

const target1 = "function TraderStep1({ country, setCountry, setIndustry, onNext }: any) {";
const replace1 = `function TraderStep1({ country, setCountry, setIndustry, onNext }: any) {
  const [companyName, setCompanyName] = useState('');
  const [sanctionStatus, setSanctionStatus] = useState<'idle' | 'checking' | 'clear' | 'flagged' | 'blocked'>('idle');

  // Debounced mockup of Sanctions API
  useEffect(() => {
    if (!companyName || companyName.length < 3) {
      setSanctionStatus('idle');
      return;
    }
    setSanctionStatus('checking');
    const timer = setTimeout(() => {
      const lower = companyName.toLowerCase();
      if (lower.includes('gazprom') || lower.includes('pdvsa') || lower.includes('sanctioned')) {
        setSanctionStatus('blocked');
      } else if (lower.includes('crypto') || lower.includes('shell')) {
        setSanctionStatus('flagged');
      } else {
        setSanctionStatus('clear');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [companyName]);
`;

code = code.replace(target1, replace1);

const target2 = `        {/* Razón Social */}
        <div>
          <label className="font-data text-[10px] font-medium text-[var(--ds-text-tertiary)] uppercase tracking-wider block mb-1.5">Razón Social</label>
          <div className="flex items-center gap-2 bg-[var(--ds-bg-raised)] border border-[var(--ds-border-default)] rounded-lg px-3 py-2.5 focus-within:border-[var(--ds-cyan)]">
             <Building className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
             <input type="text" placeholder="Ej: Exportadora del Sur S.A." className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>`;

const replace2 = `        {/* Razón Social con Sanctions Check */}
        <div>
          <label className="font-data text-[10px] font-medium text-[var(--ds-text-tertiary)] uppercase tracking-wider block mb-1.5 flex justify-between">
            <span>Razón Social</span>
            {sanctionStatus === 'checking' && <span className="text-yellow-500 animate-pulse text-[9px]">Verificando OFAC/UN...</span>}
            {sanctionStatus === 'clear' && <span className="text-[var(--ds-green)] text-[9px] flex items-center gap-1"><Check className="w-3 h-3"/> Empresa Libre de Sanciones</span>}
            {sanctionStatus === 'flagged' && <span className="text-yellow-500 text-[9px]">Requiere Revisión Manual</span>}
            {sanctionStatus === 'blocked' && <span className="text-red-500 text-[9px]">ALERTA GLOBAL - ENTIDAD BLOQUEADA</span>}
          </label>
          <div className={\`flex items-center gap-2 bg-[var(--ds-bg-raised)] border rounded-lg px-3 py-2.5 transition-colors \${sanctionStatus === 'blocked' ? 'border-red-500/50 bg-red-500/10' : sanctionStatus === 'clear' ? 'border-[var(--ds-green)]/30' : 'border-[var(--ds-border-default)] focus-within:border-[var(--ds-cyan)]'}\`}>
             <Building className={\`w-4 h-4 \${sanctionStatus === 'blocked' ? 'text-red-400' : 'text-[var(--ds-text-tertiary)]'}\`} />
             <input 
               type="text" 
               placeholder="Ej: Exportadora del Sur S.A." 
               value={companyName}
               onChange={(e) => setCompanyName(e.target.value)}
               className="bg-transparent text-[13px] text-white outline-none w-full" 
             />
             {sanctionStatus === 'checking' && <div className="w-3 h-3 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />}
          </div>`;

code = code.replace(target2, replace2);

// Make sure useEffect is imported if not already
if (!code.includes("import { useState, useEffect }")) {
   code = code.replace('import { useState }', 'import { useState, useEffect }');
}

fs.writeFileSync('src/pages/onboarding.tsx', code);
console.log('Sanctions UI injected');
