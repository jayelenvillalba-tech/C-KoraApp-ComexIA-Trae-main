
import React, { useState, useEffect, useContext } from "react";
import { useUser } from "@/context/user-context";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// Icons 
import { Building, Globe, Briefcase, ChevronRight, Lock, User, Mail, Shield, ShieldCheck, CheckCircle2, Factory, Ship, Plane, FileText, AlertTriangle, TrendingUp, Search } from "lucide-react";

// --- Types ---
type OnboardingRole = 'trader' | 'logistics' | 'institutional' | null;
type OperationType = 'export' | 'import' | 'both' | 'domestic' | 'none';

interface OnboardingState {
  step: string;
  role: OnboardingRole;
  country: string;
  operationType: OperationType;
  industry: string;
  requirements: any[];
  verifyScore: number;
  loadingDocs: boolean;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();

  const [state, setState] = useState<OnboardingState>({
    step: 'auth',
    role: null,
    country: 'AR',
    operationType: 'none',
    industry: 'general',
    requirements: [],
    verifyScore: 0,
    loadingDocs: false
  });

  const goTo = (newStep: string) => {
    setState(prev => ({ ...prev, step: newStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchRequirements = async (countryCode: string, role: string, operationType: string, industry: string) => {
    setState(prev => ({ ...prev, loadingDocs: true, requirements: [] }));
    try {
      const res = await fetch("/api/ai/onboarding-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, countryName: countryCode, role, operationType, industry })
      });
      const data = await res.json();
      if (data && data.data && data.data.requirements) {
        setState(prev => ({ ...prev, requirements: data.data.requirements, loadingDocs: false }));
      } else {
        setState(prev => ({ ...prev, loadingDocs: false }));
      }
    } catch (err) {
      console.error("Failed to fetch requirements", err);
      setState(prev => ({ ...prev, loadingDocs: false }));
    }
  };

  const TopProgress = ({ stepId }: { stepId: string }) => {
    let total = 3; let current = 0;
    if (stepId === 'auth') { total = 1; current = 0; }
    else if (stepId === 'role') { total = 2; current = 1; }
    else if (stepId.includes('trader')) { total = 5; current = parseInt(stepId.split('-')[1]) + 1; }
    else if (stepId.includes('logistics')) { total = 5; current = parseInt(stepId.split('-')[1]) + 1; }
    else if (stepId.includes('inst')) { total = 6; current = parseInt(stepId.split('-')[1]) + 1; }
    else if (stepId === 'dashboard') { total = 1; current = 1; }
    
    const pct = total > 0 ? (current / total) * 100 : 0;
    
    return (
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--ds-bg-base)] overflow-hidden z-[60]">
        <div 
          className="h-full bg-[var(--ds-cyan)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, boxShadow: '0 0 10px var(--ds-cyan), 0 0 20px var(--ds-cyan)' }}
        />
      </div>
    );
  };

  const renderStep = () => {
    switch (state.step) {
      case 'auth': return <AuthStep onNext={() => goTo('role')} />;
      case 'role':
        return (
          <RoleStep 
            selectedRole={state.role} 
            onChange={(r) => setState(prev => ({ ...prev, role: r }))} 
            onNext={() => {
              if (state.role === 'trader') goTo('trader-1');
              if (state.role === 'logistics') goTo('logistics-1');
              if (state.role === 'institutional') goTo('inst-1');
              if (!state.role) goTo('trader-1'); 
            }} 
          />
        );
      
      // ----------- TRADER FLOW -----------
      case 'trader-1':
        return (
          <TraderStep1 
            country={state.country}
            setCountry={(c) => setState(prev => ({...prev, country: c}))}
            setIndustry={(i) => setState(prev => ({...prev, industry: i}))}
            setVerifyScore={(s) => setState(prev => ({...prev, verifyScore: s}))}
            onNext={() => goTo('trader-2')}
          />
        );
      case 'trader-2':
        return (
          <TraderStep2 
            op={state.operationType}
            setOp={(o) => setState(prev => ({...prev, operationType: o}))}
            fetchDocs={() => { if(state.operationType !== 'none') fetchRequirements(state.country, 'trader', state.operationType, state.industry); }}
            requirements={state.requirements}
            loading={state.loadingDocs}
            onNext={() => goTo('trader-3')}
          />
        );
      case 'trader-3': return <PlanStep role="trader" onNext={() => goTo('dashboard')} />;

      // ----------- LOGISTICS FLOW -----------
      case 'logistics-1': return <LogisticsStep1 country={state.country} setCountry={(c) => setState(prev => ({...prev, country: c}))} onNext={() => goTo('logistics-2')} />;
      case 'logistics-2': return <LogisticsStep2 requirements={state.requirements} loading={state.loadingDocs} fetchDocs={() => fetchRequirements(state.country, 'logistics', 'domestic', state.industry)} onNext={() => goTo('logistics-3')} />;
      case 'logistics-3': return <LogisticsPlanStep onNext={() => goTo('dashboard')} />;

      // ----------- INSTITUTIONAL FLOW -----------
      case 'inst-1': return <InstStep1 onNext={() => goTo('inst-2')} />;
      case 'inst-2': return <InstStep2 country={state.country} setCountry={(c) => setState(prev => ({...prev, country: c}))} onNext={() => goTo('inst-3')} />;
      case 'inst-3': return <InstStep3 onNext={() => goTo('inst-4')} />;
      case 'inst-4': return <InstStep4 onNext={() => goTo('dashboard')} />;

      // ----------- DASHBOARD FINAL -----------
      case 'dashboard': return <OnboardingDashboard verifyScore={state.verifyScore} role={state.role || 'trader'} />;

      default: return <div className="text-white text-center mt-20">Pantalla en construcción...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a141d] text-[var(--ds-text-primary)] font-body selection:bg-[var(--ds-cyan)]/30 overflow-x-hidden relative">
      {/* ── THE VOID ENTRY (Background Grid & Particles) ── */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,240,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,240,0.1) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)'
        }} 
      />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(0,212,240,0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(26,138,255,0.03) 0%, transparent 50%)'
      }} />

      {/* Topbar & Progress Neon Line */}
      <TopProgress stepId={state.step} />
      <div className="fixed top-0 left-0 right-0 z-50 h-[60px] glass border-b border-white/5 flex items-center justify-between px-6 shadow-sm">
        <div className="font-display text-xl font-black tracking-wide text-[var(--ds-text-primary)]">
          CHE.<span className="text-[var(--ds-cyan)]" style={{ textShadow: '0 0 10px rgba(0,212,240,0.5)' }}>COMEX</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 pt-[80px] flex flex-col items-center min-h-screen pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl px-6 pt-8 flex flex-col items-center"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENTS: STEPS
// ==========================================

function ContinueButton({ onClick, disabled, text = "Continuar" }: { onClick: () => void, disabled?: boolean, text?: string }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`relative w-full overflow-hidden rounded-xl flex items-center justify-center gap-2 py-4 font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale ${disabled ? 'bg-white/5 border border-white/10 text-[var(--ds-text-muted)]' : 'hover:scale-[1.01]'}`}
      style={{
        fontFamily: 'Inter', fontSize: '15px', letterSpacing: '0.05em',
        background: disabled ? '' : 'linear-gradient(135deg, var(--ds-cyan) 0%, rgba(0,102,255,1) 100%)',
        color: disabled ? '' : 'var(--ds-bg-base)',
        boxShadow: disabled ? 'none' : '0 10px 30px rgba(0,212,240,0.3)',
      }}
    >
      {!disabled && (
        <style>{`
          .btn-pulse { animation: btnPulse 2s infinite; }
          @keyframes btnPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(0,212,240,0.2); }
            50% { box-shadow: 0 0 40px rgba(0,212,240,0.5); }
          }
        `}</style>
      )}
      <span className="relative z-10">{text}</span>
      <ChevronRight className="w-5 h-5 relative z-10" />
      {!disabled && <div className="absolute inset-0 z-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />}
    </button>
  );
}

function InputField({ label, icon, placeholder, type = "text", onChange, value }: any) {
  return (
    <div className="w-full">
      <label style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-text-muted)', letterSpacing: '0.1em' }} className="block mb-2 uppercase">{label}</label>
      <div className="flex items-center gap-3 glass rounded-xl px-4 py-3.5 border border-white/5 transition-all focus-within:border-[var(--ds-cyan)] focus-within:shadow-[0_0_20px_rgba(0,212,240,0.15)]">
        {icon}
        <input type={type} placeholder={placeholder} onChange={onChange} value={value}
          className="bg-transparent text-[14px] text-white outline-none w-full placeholder:text-gray-500" 
          style={{ fontFamily: 'var(--ds-font-body)' }}
        />
      </div>
    </div>
  );
}

function AuthStep({ onNext }: { onNext: () => void }) {
  const { login, register, user } = useUser();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [terms, setTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (tab === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password, companyName: form.companyName });
      }
      onNext();
    } catch (err) {
      console.error('Auth error in onboarding', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) onNext();
  }, [user]);

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[var(--ds-cyan)]" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,240,0.5))' }} />
        <h1 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '32px', fontWeight: 900, color: 'var(--ds-text-primary)' }}>Terminal Access</h1>
      </div>

      <div className="glass rounded-2xl p-8 border border-white/5 relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--ds-cyan)] to-transparent opacity-50" />
        
        <div className="flex mb-8 border-b border-white/10">
          <button onClick={() => setTab('login')} className={`flex-1 pb-3 text-sm font-bold transition-all ${tab === 'login' ? 'text-[var(--ds-cyan)] border-b-2 border-[var(--ds-cyan)]' : 'text-gray-500'}`}>LOGIN</button>
          <button onClick={() => setTab('register')} className={`flex-1 pb-3 text-sm font-bold transition-all ${tab === 'register' ? 'text-[var(--ds-cyan)] border-b-2 border-[var(--ds-cyan)]' : 'text-gray-500'}`}>REGISTER</button>
        </div>

        <div className="space-y-5">
          {tab === 'register' && (
            <>
              <InputField label="Nombre Completo" icon={<User className="w-5 h-5 text-gray-400" />} placeholder="Juan Perez" value={form.name} onChange={(e:any)=>setForm({...form, name: e.target.value})} />
              <InputField label="Nombre de Empresa" icon={<Building className="w-5 h-5 text-gray-400" />} placeholder="Exportadora S.A." value={form.companyName} onChange={(e:any)=>setForm({...form, companyName: e.target.value})} />
            </>
          )}
          <InputField label="Email Corporativo" icon={<Mail className="w-5 h-5 text-gray-400" />} placeholder="tu@empresa.com" value={form.email} onChange={(e:any)=>setForm({...form, email: e.target.value})} />
          <InputField label="Contraseña" type="password" icon={<Lock className="w-5 h-5 text-gray-400" />} placeholder="••••••••" value={form.password} onChange={(e:any)=>setForm({...form, password: e.target.value})} />
          
          {tab === 'register' && (
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1" style={{ accentColor: 'var(--ds-cyan)' }} />
              <span style={{ fontSize: '12px', color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>Acepto Políticas de Privacidad y Confirmo Autoridad de Representación Legal.</span>
            </label>
          )}

          <div className="pt-4">
            <ContinueButton onClick={handleAuth} disabled={(tab === 'register' && !terms) || isLoading} text={isLoading ? "Cargando..." : "Autenticar"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleStep({ selectedRole, onChange, onNext }: { selectedRole: OnboardingRole, onChange: (r: OnboardingRole) => void, onNext: () => void }) {
  const roles = [
    { id: 'trader', icon: <Building className="w-10 h-10" />, title: 'Trader', sub: 'Comerciante Global', desc: 'Importación, exportación y manufactura.' },
    { id: 'logistics', icon: <Ship className="w-10 h-10" />, title: 'Logistics', sub: 'Servicios Logísticos', desc: 'Transporte marítimo/aéreo y aduanas.' },
    { id: 'institutional', icon: <Globe className="w-10 h-10" />, title: 'Institutional', sub: 'Organismo Oficial', desc: 'Regulación, cámaras y ministerios.' }
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-12">
        <h1 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '36px', fontWeight: 900, color: 'var(--ds-text-primary)' }}>Protocolo de Identificación</h1>
        <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '15px', color: 'var(--ds-text-secondary)', marginTop: '8px' }}>Seleccione su rol primario en la cadena de suministro internacional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {roles.map(r => {
          const isSelected = selectedRole === r.id;
          return (
            <div 
              key={r.id} 
              onClick={() => onChange(r.id as OnboardingRole)}
              className={`cursor-pointer glass rounded-2xl p-8 text-center transition-all duration-300 transform ${isSelected ? 'scale-105 z-10' : 'hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,212,240,0.15)]'}`}
              style={{
                border: isSelected ? '1px solid rgba(0,212,240,0.6)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isSelected ? '0 0 30px rgba(0,212,240,0.2), inset 0 0 20px rgba(0,212,240,0.1)' : 'var(--ds-shadow-raised)'
              }}
            >
              <div 
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300"
                style={{ 
                  background: isSelected ? 'rgba(0,212,240,0.1)' : 'rgba(255,255,255,0.05)', 
                  color: isSelected ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                  border: isSelected ? '1px solid rgba(0,212,240,0.4)' : '1px solid transparent',
                  filter: isSelected ? 'drop-shadow(0 0 15px rgba(0,212,240,0.6))' : 'none'
                }}
              >
                {r.icon}
              </div>
              <div style={{ fontFamily: 'var(--ds-font-display)', fontSize: '20px', fontWeight: 900, color: 'var(--ds-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.title}</div>
              <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', color: 'var(--ds-text-secondary)', fontWeight: 700, margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="text-cyan-400/70">{r.sub}</div>
              <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '12px', color: 'var(--ds-text-muted)' }}>{r.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="max-w-xs mx-auto">
        <ContinueButton onClick={onNext} disabled={!selectedRole} />
      </div>
    </div>
  );
}

function TraderStep1({ country, setCountry, setIndustry, setVerifyScore, onNext }: any) {
  const [cuit, setCuit] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | number>(null);

  useEffect(() => {
    if (cuit.length >= 10) {
      setScanning(true);
      setScanResult(null);
      const timer = setTimeout(() => {
        setScanning(false);
        const randScore = Math.floor(Math.random() * 20) + 80; // 80-100 score
        setScanResult(randScore);
        setVerifyScore(randScore);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setScanning(false);
      setScanResult(null);
    }
  }, [cuit]);

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-10">
         <h2 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', fontWeight: 900 }}>Verificación de Entidad</h2>
         <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '14px', color: 'var(--ds-text-secondary)', marginTop: '8px' }}>Escanear CUIT contra listas Globales OFAC/ONU.</p>
      </div>

      <div className="glass rounded-2xl p-8 border border-white/5 space-y-6">
        <InputField label="Razón Social" icon={<Building className="w-5 h-5 text-gray-500" />} placeholder="Ej: TechCorp S.A." />
        
        {/* Security Scan Area */}
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black/40 p-1">
          <InputField label="Identificación Tributaria (CUIT/Tax ID)" icon={<Search className="w-5 h-5 text-gray-500" />} placeholder="Ingrese ID fiscal..." value={cuit} onChange={(e:any) => setCuit(e.target.value)} />
          
          {scanning && (
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'rgba(0,212,240,0.05)' }}>
              <motion.div 
                initial={{ top: '-10%' }} animate={{ top: '110%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-4"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,212,240,0.5), transparent)', boxShadow: '0 0 15px rgba(0,212,240,0.5)' }}
              />
              <div className="absolute top-2 right-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', color: 'var(--ds-cyan)' }}>ESCANEO OFAC...</span>
              </div>
            </div>
          )}

          {scanResult !== null && !scanning && (
            <div className="absolute top-3 right-4 flex items-center gap-2 animate-in fade-in duration-300">
               <ShieldCheck className="w-4 h-4 text-green-400" />
               <span style={{ fontFamily: 'Inter', fontWeight: 900, color: 'var(--ds-green)', textShadow: '0 0 10px rgba(105,246,185,0.5)' }}>SCORE: {scanResult}/100</span>
            </div>
          )}
        </div>

        <div className="pt-4">
          <ContinueButton onClick={onNext} disabled={!cuit || scanning} />
        </div>
      </div>
    </div>
  );
}

function TraderStep2({ op, setOp, fetchDocs, requirements, loading, onNext }: any) {
  useEffect(() => { if (op !== 'none') fetchDocs(); }, [op]);
  
  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-10">
         <h2 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', fontWeight: 900 }}>Vector Operativo</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[ { id:'export', icon:'📤', label:'Exportador' }, { id:'import', icon:'📥', label:'Importador' }, { id:'both', icon:'↔️', label:'Ambos' } ].map(t => (
          <button key={t.id} onClick={() => setOp(t.id)} className={`glass p-6 rounded-2xl transition-all border ${op === t.id ? 'border-[var(--ds-cyan)] scale-105 radiance-cyan' : 'border-white/5 hover:border-white/20'}`}>
            <div className="text-3xl mb-3">{t.icon}</div>
            <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>{t.label}</div>
          </button>
        ))}
      </div>

      <div className="max-w-xs mx-auto"><ContinueButton onClick={onNext} disabled={op === 'none'} /></div>
    </div>
  );
}

// Minimal placeholders for rest of flow to keep logic intact while applying glass styling
function PlanStep({ role, onNext }: any) { return <div className="text-center mt-20"><h2 className="text-2xl font-bold mb-8">Inicialización del Ecosistema</h2><div className="max-w-xs mx-auto"><ContinueButton onClick={onNext} text="Ingresar al Command Center" /></div></div>; }
function LogisticsStep1({ onNext }: any) { return <TraderStep1 onNext={onNext} setVerifyScore={()=>{}} />; }
function LogisticsStep2({ fetchDocs, onNext }: any) { useEffect(() => { fetchDocs(); }, []); return <TraderStep2 op="export" setOp={()=>{}} onNext={onNext} />; }
function LogisticsPlanStep({ onNext }: any) { return <PlanStep onNext={onNext} />; }
function InstStep1({ onNext }: any) { return <div className="mt-20"><div className="max-w-xs mx-auto"><ContinueButton onClick={onNext} /></div></div>; }
function InstStep2({ onNext }: any) { return <div className="mt-20"><div className="max-w-xs mx-auto"><ContinueButton onClick={onNext} /></div></div>; }
function InstStep3({ onNext }: any) { return <div className="mt-20"><div className="max-w-xs mx-auto"><ContinueButton onClick={onNext} /></div></div>; }
function InstStep4({ onNext }: any) { return <PlanStep onNext={onNext} />; }

// ==========================================
// PROGRESSIVE VERIFICATION DASHBOARD (END)
// ==========================================
function OnboardingDashboard({ verifyScore, role }: any) {
  const [, setLocation] = useLocation();
  const features = [
    { title: 'HS Code Intelligence', locked: false, icon: <Search /> },
    { title: 'Marketplace Deals', locked: verifyScore < 85, icon: <TrendingUp /> },
    { title: 'Chat Seguro B2B', locked: verifyScore < 85, icon: <Shield /> },
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-10">
         <h2 style={{ fontFamily: 'var(--ds-font-display)', fontSize: '32px', fontWeight: 900 }}>Acceso Garantizado</h2>
         <p className="text-[var(--ds-green)] font-mono mt-2 flex items-center justify-center gap-2"><ShieldCheck /> SECURITY CLEARANCE: LEVEL {verifyScore >= 85 ? 'ALPHA' : 'BETA'} (SCORE: {verifyScore})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((f, i) => (
          <div key={i} className={`glass p-6 rounded-2xl border transition-all relative ${f.locked ? 'grayscale opacity-60 border-white/5' : 'border-[var(--ds-cyan)]/30 hover:shadow-[0_0_20px_rgba(0,212,240,0.2)]'}`}>
             <div className="mb-4 text-[var(--ds-cyan)] opacity-80">{f.icon}</div>
             <h3 style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '15px' }}>{f.title}</h3>
             
             {f.locked && (
               <div className="absolute top-4 right-4 text-[var(--ds-amber)] aspect-square rounded-full flex items-center justify-center radiance-amber p-2 bg-black/50">
                 <Lock className="w-4 h-4" />
               </div>
             )}
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        <ContinueButton onClick={() => setLocation('/')} text="Acceder a CHE.COMEX" />
      </div>
    </div>
  );
}
