import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// Icons 
import { Building, MapPin, Briefcase, ChevronRight, Globe, Lock, User, Mail, Shield, ShieldCheck, CheckCircle2, Factory, Ship, Plane, FileText, LayoutList } from "lucide-react";

// --- Types ---
type OnboardingRole = 'trader' | 'logistics' | 'institutional' | null;
type OperationType = 'export' | 'import' | 'both' | 'domestic' | 'none';

interface OnboardingState {
  step: string; // 'auth', 'role', 'trader-1', 'trader-2', 'trader-3', 'logistics-1', etc.
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

  // 1. Fetch AI Requirements dynamically
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


  // --- Helper Components matching the design ---
  
  // Custom styled inputs
  const InputWrap = ({ icon, children, readOnly, className = "" }: any) => (
    <div className={`flex items-center gap-2 bg-[#0d1a27]/60 border border-[#1a2e42] focus-within:border-[#00d4f0] focus-within:shadow-[0_0_12px_rgba(0,212,240,0.15)] rounded-lg px-3 py-2.5 transition-all ${readOnly ? 'opacity-70 bg-[#060d16]' : ''} ${className}`}>
      {icon && <span className="text-[#4a7898] flex-shrink-0">{icon}</span>}
      <div className="flex-1 w-full text-[13px] text-[#f0f8ff] outline-none bg-transparent">
        {children}
      </div>
    </div>
  );

  const StepIndicator = ({ stepId }: { stepId: string }) => {
    let total = 3; let current = 0;
    if (stepId === 'auth') { total = 1; current = 0; }
    else if (stepId === 'role') { total = 2; current = 1; }
    else if (stepId.includes('trader')) { total = 5; current = parseInt(stepId.split('-')[1]) + 1; }
    else if (stepId.includes('logistics')) { total = 5; current = parseInt(stepId.split('-')[1]) + 1; }
    else if (stepId.includes('inst')) { total = 6; current = parseInt(stepId.split('-')[1]) + 1; }

    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#4a7898] uppercase tracking-wider">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < current ? 'bg-[#00e878] shadow-[0_0_8px_rgba(0,232,120,0.5)]' : i === current ? 'bg-[#00d4f0] shadow-[0_0_8px_rgba(0,212,240,0.5)]' : 'bg-[#203548]'}`} />
        ))}
        <span className="ml-1">{current}/{total}</span>
      </div>
    );
  };


  const renderStep = () => {
    switch (state.step) {
      case 'auth':
        return <AuthStep onNext={() => goTo('role')} />;
      case 'role':
        return (
          <RoleStep 
            selectedRole={state.role} 
            onChange={(r) => setState(prev => ({ ...prev, role: r }))} 
            onNext={() => {
              if (state.role === 'trader') goTo('trader-1');
              if (state.role === 'logistics') goTo('logistics-1');
              if (state.role === 'institutional') goTo('inst-1');
              if (!state.role) goTo('trader-1'); // Default fallback
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
            onNext={() => goTo('trader-2')}
          />
        );
      case 'trader-2':
        return (
          <TraderStep2 
            op={state.operationType}
            setOp={(o) => setState(prev => ({...prev, operationType: o}))}
            fetchDocs={() => {
                if(state.operationType !== 'none') {
                    fetchRequirements(state.country, 'trader', state.operationType, state.industry);
                }
            }}
            requirements={state.requirements}
            loading={state.loadingDocs}
            onNext={() => goTo('trader-3')}
          />
        );
      case 'trader-3':
        return <PlanStep role="trader" onNext={() => setLocation('/')} />;

      // ----------- LOGISTICS FLOW -----------
      case 'logistics-1':
        return (
          <LogisticsStep1
            country={state.country}
            setCountry={(c) => setState(prev => ({...prev, country: c}))}
            onNext={() => goTo('logistics-2')}
          />
        );
      case 'logistics-2':
        return (
          <LogisticsStep2
            requirements={state.requirements}
            loading={state.loadingDocs}
            fetchDocs={() => fetchRequirements(state.country, 'logistics', 'domestic', state.industry)}
            onNext={() => goTo('logistics-3')}
          />
        );
      case 'logistics-3':
        return <LogisticsPlanStep onNext={() => setLocation('/')} />;

      // ----------- INSTITUTIONAL FLOW -----------
      case 'inst-1':
        return <InstStep1 onNext={() => goTo('inst-2')} />;
      case 'inst-2':
        return (
          <InstStep2
            country={state.country}
            setCountry={(c) => setState(prev => ({...prev, country: c}))}
            onNext={() => goTo('inst-3')}
          />
        );
      case 'inst-3':
        return <InstStep3 onNext={() => goTo('inst-4')} />;
      case 'inst-4':
        return <InstStep4 onNext={() => setLocation('/')} />;

      // ----------- DASHBOARD FINAL -----------
      case 'dashboard':
        return <OnboardingDashboard verifyScore={state.verifyScore} role={state.role || 'trader'} />;

      default:
        return <div className="text-white text-center mt-20">Pantalla en construcción... ({state.step})</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#020a12] text-[#8ab8d8] font-sans selection:bg-[#00d4f0]/30 overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,240,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,240,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 20% 20%, rgba(0,212,240,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 80% 80%, rgba(26,138,255,0.03) 0%, transparent 60%)'
      }} />

      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#020a12]/90 backdrop-blur-md border-b border-[#1a2e42] flex items-center justify-between px-6">
        <div className="font-cond text-xl font-black tracking-wide text-white">
          CHE.<span className="text-[#00d4f0]">COMEX</span>
        </div>
        <StepIndicator stepId={state.step} />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 pt-[52px] flex flex-col items-center min-h-screen pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl px-6 pt-12 md:pt-20 flex flex-col items-center"
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

function AuthStep({ onNext }: { onNext: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="font-cond text-3xl font-black text-white">ComexIA ID</h1>
        <p className="text-[#8ab8d8] text-sm mt-3">Accedé a la plataforma líder en comercio B2B</p>
      </div>

      <div className="bg-[#09131e]/80 backdrop-blur-sm border border-[#1a2e42] rounded-xl p-6 shadow-2xl">
        <div className="flex border-b border-[#1a2e42] mb-6">
          <button onClick={() => setTab('login')} className={`flex-1 pb-3 text-[13px] font-medium transition-all ${tab === 'login' ? 'text-[#00d4f0] border-b-2 border-[#00d4f0]' : 'text-[#4a7898] hover:text-[#8ab8d8]'}`}>Iniciar Sesión</button>
          <button onClick={() => setTab('register')} className={`flex-1 pb-3 text-[13px] font-medium transition-all ${tab === 'register' ? 'text-[#00d4f0] border-b-2 border-[#00d4f0]' : 'text-[#4a7898] hover:text-[#8ab8d8]'}`}>Registrarse</button>
        </div>

        {tab === 'login' ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Email</label>
              <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
                <Mail className="w-4 h-4 text-[#4a7898]" />
                <input type="email" placeholder="tu@empresa.com" defaultValue="j.ayelen.villalba@gmail.com" className="bg-transparent text-[13px] text-white outline-none w-full" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Contraseña</label>
              <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
                <Lock className="w-4 h-4 text-[#4a7898]" />
                <input type="password" placeholder="••••••••" defaultValue="password123" className="bg-transparent text-[13px] text-white outline-none w-full" />
              </div>
            </div>
            
            <button onClick={onNext} className="mt-2 w-full bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all shadow-[0_4px_14px_rgba(0,212,240,0.25)]">
              Ingresar <ChevronRight className="inline w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Nombre y Apellido</label>
              <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
                <User className="w-4 h-4 text-[#4a7898]" />
                <input type="text" placeholder="Ej. Ana Pérez" className="bg-transparent text-[13px] text-white outline-none w-full" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Email corporativo</label>
              <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
                <Mail className="w-4 h-4 text-[#4a7898]" />
                <input type="email" placeholder="tu@empresa.com" className="bg-transparent text-[13px] text-white outline-none w-full" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Contraseña nueva</label>
              <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
                <Lock className="w-4 h-4 text-[#4a7898]" />
                <input type="password" placeholder="Mínimo 8 caracteres" className="bg-transparent text-[13px] text-white outline-none w-full" />
              </div>
            </div>

            <button onClick={onNext} className="mt-2 w-full bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all">
              Crear cuenta <ChevronRight className="inline w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-[#4a7898]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00e878]" />
          Conexión segura encriptada · SSL/TLS
        </div>
      </div>
    </div>
  );
}


function RoleStep({ selectedRole, onChange, onNext }: { selectedRole: OnboardingRole, onChange: (r: OnboardingRole) => void, onNext: () => void }) {
  const roles = [
    { id: 'trader', icon: '📦', title: 'Comerciante', sub: '(Trader)', desc: 'Compro o vendo productos para importación / exportación', ex: 'Importador · Exportador · Fabricante · PyME' },
    { id: 'logistics', icon: '🚢', title: 'Logística y Servicios', sub: '(Partner)', desc: 'Transporto carga, gestiono aduanas o aseguro mercadería', ex: 'Forwarder · Despachante · Transportista · Aseguradora' },
    { id: 'institutional', icon: '🏛️', title: 'Institucional', sub: '(Official)', desc: 'Represento un organismo público, cámara de comercio u ONG', ex: 'Aduana · Cámaras · Ministerios · Agencias' },
  ];

  return (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-10 w-full">
        <h1 className="font-cond text-3xl md:text-4xl font-black text-white px-4">¿Cuál es el rol principal de tu empresa?</h1>
        <p className="text-[#8ab8d8] text-[13px] md:text-sm mt-4">Esto personaliza tu dashboard, documentación requerida y oportunidades visibles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {roles.map(r => (
          <div 
            key={r.id} 
            onClick={() => onChange(r.id as OnboardingRole)}
            className={`cursor-pointer relative overflow-hidden bg-[#09131e] border-2 rounded-xl p-6 text-center transition-all duration-300 transform ${selectedRole === r.id ? 'border-[#00d4f0] bg-[#00d4f0]/5 shadow-[0_0_24px_rgba(0,212,240,0.1)] -translate-y-1' : 'border-[#1a2e42] hover:border-[#2a4560] hover:-translate-y-0.5'}`}
          >
            {selectedRole === r.id && (
              <div className="absolute top-3 right-3 bg-[#00d4f0] text-black w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
            )}
            <div className="text-4xl mb-4">{r.icon}</div>
            <div className="font-cond text-lg font-black text-white uppercase tracking-wide mb-1">{r.title}</div>
            <div className="font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">{r.sub}</div>
            <p className="text-xs text-[#8ab8d8] leading-relaxed mb-4">{r.desc}</p>
            <div className="pt-4 border-t border-[#1a2e42] text-[10px] text-[#4a7898] leading-relaxed">
              {r.ex}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center flex-col items-center">
        <button 
          onClick={onNext} 
          disabled={!selectedRole}
          className={`px-12 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${selectedRole ? 'bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] hover:opacity-90 shadow-[0_4px_14px_rgba(0,212,240,0.25)]' : 'bg-[#1a2e42] text-[#4a7898] cursor-not-allowed'}`}
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


function TraderStep1({ country, setCountry, setIndustry, onNext }: any) {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 1 de 3 — Comerciante</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Definamos tu empresa</h2>
        <p className="text-[13px] text-[#8ab8d8]">Solo datos básicos para verificación institucional.</p>
      </div>

      <div className="space-y-5 bg-[#09131e] p-6 lg:p-8 rounded-xl border border-[#1a2e42]">
        
        {/* Razón Social */}
        <div>
          <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Razón Social</label>
          <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
             <Building className="w-4 h-4 text-[#4a7898]" />
             <input type="text" placeholder="Ej: Exportadora del Sur S.A." className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>
        </div>

        {/* País Base */}
        <div>
          <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-2">País Base de Operación</label>
          <div className="flex flex-wrap gap-2">
            {[ {id:'AR', label:'🇦🇷 Argentina'}, {id:'BR', label:'🇧🇷 Brasil'}, {id:'AT', label:'🇦🇹 Austria'} ].map(c => (
              <button 
                key={c.id} 
                onClick={() => setCountry(c.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs border rounded-lg transition-all ${country === c.id ? 'bg-[#00d4f0]/10 text-white border-[#00d4f0]' : 'bg-[#0d1a27] text-[#8ab8d8] border-[#1a2e42] hover:border-[#2a4560]'}`}
              >
                {c.label}
              </button>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 text-xs border border-[#1a2e42] bg-[#0d1a27] rounded-lg">
               <Globe className="w-3.5 h-3.5 text-[#4a7898]" />
               <input type="text" placeholder="Otro país..." className="bg-transparent outline-none w-20 text-white placeholder:text-[#4a7898]" onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ID Fiscal - Conditional AR layout */}
        <div className="pt-2">
          <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">ID Fiscal / Identificación Tributaria</label>
          <div className="flex gap-2">
            <div className="shrink-0 flex items-center justify-center bg-[#1a2e42] rounded-lg px-3 text-xs font-mono text-[#8ab8d8]">{country}</div>
            <div className="flex-1 flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
              <input type="text" placeholder={country === 'AR' ? "30-12345678-9" : "ID Fiscal..."} className="bg-transparent text-[13px] text-white outline-none w-full font-mono" />
            </div>
          </div>
        </div>

        {/* Industria */}
        <div>
           <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Industria Principal (CIIU)</label>
           <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
             <Briefcase className="w-4 h-4 text-[#4a7898]" />
             <select onChange={(e) => setIndustry(e.target.value)} className="bg-transparent text-[13px] text-white outline-none w-full appearance-none">
               <option value="general" className="bg-[#0d1a27]">Seleccionar industria...</option>
               <option value="agro" className="bg-[#0d1a27]">Agricultura y Ganadería</option>
               <option value="manufacture" className="bg-[#0d1a27]">Manufacturas e Industria</option>
               <option value="tech" className="bg-[#0d1a27]">Tecnología</option>
             </select>
           </div>
        </div>

        <button onClick={onNext} className="mt-4 w-full bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all shadow-lg">
          Continuar y Explorar <ChevronRight className="inline w-4 h-4" />
        </button>

        <p className="text-center text-[10px] text-[#4a7898] mt-2">
          Tus datos se verificarán automáticamente con APIs oficiales si están disponibles.
        </p>
      </div>
    </div>
  );
}

function TraderStep2({ op, setOp, fetchDocs, requirements, loading, onNext }: any) {
  
  // Trigger AI fetch when operation type changes
  useEffect(() => {
    if (op !== 'none') {
      fetchDocs();
    }
  }, [op]);

  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 2 de 3 — Comerciante</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">¿Cómo operás internacionalmente?</h2>
        <p className="text-[13px] text-[#8ab8d8]">Esto nos permite adaptar los requisitos y matchear oportunidades.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { id: 'export', icon: '📤', label: 'Exportador' },
          { id: 'import', icon: '📥', label: 'Importador' },
          { id: 'both',   icon: '↔️', label: 'Ambos' }
        ].map(type => (
          <button 
            key={type.id}
            onClick={() => setOp(type.id)}
            className={`flex flex-col items-center justify-center py-4 px-2 border-2 rounded-xl transition-all ${op === type.id ? 'border-[#00d4f0] bg-[#00d4f0]/10' : 'border-[#1a2e42] bg-[#09131e] hover:border-[#2a4560]'}`}
          >
            <span className="text-2xl mb-2">{type.icon}</span>
            <span className="text-sm font-bold text-white font-cond uppercase">{type.label}</span>
          </button>
        ))}
      </div>

      {op !== 'none' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
          <div className="flex items-center justify-between mb-3">
             <label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block">Documentación Exigible</label>
             <span className="bg-[#f5a800]/10 border border-[#f5a800]/20 text-[#f5a800] text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">IA Generative</span>
          </div>

          <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-[#0d1a27] px-4 py-3 border-b border-[#1a2e42] flex justify-between items-center">
              <span className="font-mono text-[10px] text-[#8ab8d8] uppercase tracking-wider">Checklist Legal Detección Dinámica</span>
              <span className="text-[10px] text-[#4a7898] flex items-center gap-1"><Shield className="w-3 h-3" /> Basado en tu País y Rol</span>
            </div>

            <div className="bg-[#09131e]">
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-6 h-6 border-2 border-[#00d4f0] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[13px] text-[#00d4f0] font-medium">Buscando normativa aduanera transfronteriza en tiempo real...</p>
                  <p className="text-[10px] text-[#4a7898] mt-2 font-mono">Powered by Groq IA</p>
                </div>
              ) : requirements.length > 0 ? (
                <div className="flex flex-col divide-y divide-[#1a2e42]/50">
                  {requirements.map((req: any, i: number) => (
                    <div key={i} className="p-4 flex gap-3 items-center hover:bg-[#0d1a27] transition-colors group">
                      <div className={`w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold leading-none shrink-0 ${req.status === 'req' ? 'text-[#1a8aff] bg-[#1a8aff]/10' : req.status === 'warn' ? 'text-[#f5a800] bg-[#f5a800]/10' : 'text-[#8ab8d8] bg-[#8ab8d8]/10'}`}>
                        {req.status === 'req' ? '!' : req.status === 'warn' ? '▲' : 'i'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#cce0f5] truncate">{req.name}</div>
                        <div className="text-[11px] text-[#4a7898] leading-tight mt-0.5">{req.hint}</div>
                      </div>
                      <button className="shrink-0 px-2.5 py-1 rounded bg-[#00d4f0]/10 text-[#00d4f0] hover:bg-[#00d4f0] hover:text-[#020a12] font-mono text-[9px] uppercase font-bold transition-all opacity-0 group-hover:opacity-100">
                         Subir doc
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[#4a7898] text-[13px]">
                  No se encontraron requisitos para esta combinación.
                </div>
              )}
            </div>
            
            {!loading && requirements.length > 0 && (
              <div className="bg-[#0d1a27]/50 p-4 border-t border-[#1a2e42]">
                 <div className="flex justify-between items-center text-[10px] text-[#4a7898] font-mono mb-2">
                   <span>Perfil de Verificación Inicial</span>
                   <span>0 / {requirements.length} Listos</span>
                 </div>
                 <div className="h-1 bg-[#1a2e42] rounded-full overflow-hidden">
                   <div className="h-full w-0 bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] transition-all" />
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <button onClick={onNext} disabled={op === 'none'} className="flex-1 bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
          Explorar el Ecosistema <ChevronRight className="inline w-4 h-4" />
        </button>
        <button onClick={onNext} className="md:w-auto w-full px-6 py-3 border border-[#2a4560] text-[#8ab8d8] hover:text-white hover:bg-[#2a4560]/30 rounded-lg text-sm transition-all">
          Omitir por ahora
        </button>
      </div>

    </div>
  );
}

function PlanStep({ role, onNext }: { role: string, onNext: () => void }) {
  return (
    <div className="w-full max-w-4xl">
      <div className="text-center mb-10 w-full">
         <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 3 de 3 — Comercial</div>
         <h1 className="font-cond text-3xl md:text-4xl font-black text-white px-4">Elegí tu plan</h1>
         <p className="text-[#8ab8d8] text-[13px] md:text-sm mt-3">Activá el plan gratuito para explorar. Podés escalar cuando estés listo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE */}
        <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] text-[#4a7898] uppercase tracking-widest mb-2">Demo</div>
            <div className="font-cond text-4xl font-black text-white mb-2">Gratis</div>
            <p className="text-xs text-[#4a7898] mb-6 pb-6 border-b border-[#1a2e42]">Para explorar el ecosistema</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00e878] shrink-0" /> Búsqueda inteligente HS Code</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00e878] shrink-0" /> Mapa interactivo de mercados</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00e878] shrink-0" /> Simulador de Incoterms</li>
              <li className="flex items-start gap-2 text-[12px] text-[#4a7898] opacity-50"><span className="w-4 h-4 flex justify-center text-xs">✗</span> Marketplace B2B Limitado</li>
            </ul>
          </div>
          <button onClick={onNext} className="w-full py-2.5 bg-transparent border border-[#2a4560] text-[#8ab8d8] rounded-lg text-[13px] font-medium hover:text-white hover:border-[#4a7898] transition-all">
            Empezar gratis
          </button>
        </div>

        {/* PRO */}
        <div className="bg-[#09131e] border-2 border-[#00d4f0] rounded-xl p-6 relative flex flex-col justify-between transform -translate-y-2 shadow-[0_12px_32px_rgba(0,212,240,0.1)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d4f0] text-black font-mono text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full whitespace-nowrap">
            MÁS POPULAR
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#00d4f0] uppercase tracking-widest mb-2">Pro PyME</div>
            <div className="font-cond text-4xl font-black text-white mb-2">$29<span className="text-lg text-[#4a7898]">/mes USD</span></div>
            <p className="text-xs text-[#4a7898] mb-6 pb-6 border-b border-[#1a2e42]">Para PyMEs listas para operar</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> <b>Todo del plan Demo</b></li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Generación automática de Docs IA</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Chat Seguro B2B con cifrado</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Trazabilidad Blockchain básica</li>
            </ul>
          </div>
          <button onClick={onNext} className="w-full py-2.5 bg-[#00d4f0] text-[#020a12] font-bold rounded-lg text-[13px] hover:bg-[#00e878] shadow-[0_4px_14px_rgba(0,212,240,0.3)] transition-all">
            Activar Pro
          </button>
        </div>

        {/* ENTERPRISE */}
        <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] text-[#f5a800] uppercase tracking-widest mb-2">Enterprise</div>
            <div className="font-cond text-4xl font-black text-white mb-2">$99<span className="text-lg text-[#4a7898]">/mes USD</span></div>
            <p className="text-xs text-[#4a7898] mb-6 pb-6 border-b border-[#1a2e42]">Capacidad operativa completa</p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#f5a800] shrink-0" /> <b>Múltiples sucursales y usuarios</b></li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#f5a800] shrink-0" /> Soporte legal dedicado</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#f5a800] shrink-0" /> Conexión API a ERPs</li>
              <li className="flex items-start gap-2 text-[12px] text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#f5a800] shrink-0" /> Acuerdos inteligentes personaliz.</li>
            </ul>
          </div>
          <button onClick={onNext} className="w-full py-2.5 bg-transparent border border-[#2a4560] text-[#8ab8d8] rounded-lg text-[13px] font-medium hover:text-white hover:border-[#4a7898] transition-all">
            Contactar ventas
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LOGISTICS FLOW
// ==========================================
function LogisticsStep1({ country, setCountry, onNext }: any) {
  const opTypes = [
    { id: 'maritime', icon: '🚢', label: 'Flete Marítimo / Terrestre', sub: 'Multimodal' },
    { id: 'air', icon: '✈️', label: 'Flete Aéreo', sub: 'Cargas aéreas' },
    { id: 'customs', icon: '📋', label: 'Despachante / Agente de Carga', sub: 'Aduanas y documentación' },
    { id: 'warehouse', icon: '🏭', label: 'Warehouse / Depósito Fiscal', sub: 'Almacenamiento y ZF' },
  ];
  const [selected, setSelected] = React.useState<string[]>(['maritime']);
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 1 de 3 - Logistica</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Definamos tu empresa</h2>
        <p className="text-[13px] text-[#8ab8d8]">Datos para verificacion y matching con carga real.</p>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 space-y-5">
        <div><label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-1.5">Razon Social</label>
          <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#00d4f0]">
            <Building className="w-4 h-4 text-[#4a7898]" />
            <input type="text" placeholder="Ej: Grupo Logistico del Sur S.A." className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>
        </div>
        <div><label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-2">Pais Base</label>
          <div className="flex flex-wrap gap-2">
            {[{id:'AR', label:'Argentina'}, {id:'BR', label:'Brasil'}, {id:'UY', label:'Uruguay'}].map(c => (
              <button key={c.id} onClick={() => setCountry(c.id)}
                className={`px-4 py-2 text-xs border rounded-lg transition-all ${country === c.id ? 'bg-[#00d4f0]/10 text-white border-[#00d4f0]' : 'bg-[#0d1a27] text-[#8ab8d8] border-[#1a2e42] hover:border-[#2a4560]'}`}>{c.label}</button>
            ))}
          </div>
        </div>
        <div><label className="font-mono text-[10px] font-medium text-[#4a7898] uppercase tracking-wider block mb-2">Servicios que ofreces</label>
          <div className="grid grid-cols-2 gap-2">
            {opTypes.map(op => (
              <div key={op.id} onClick={() => toggle(op.id)}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selected.includes(op.id) ? 'border-[#00d4f0] bg-[#00d4f0]/5' : 'border-[#1a2e42] bg-[#0d1a27] hover:border-[#2a4560]'}`}>
                <span className="text-xl">{op.icon}</span>
                <div><div className="text-[12px] font-medium text-[#cce0f5]">{op.label}</div><div className="text-[10px] text-[#4a7898]">{op.sub}</div></div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onNext} className="mt-4 w-full bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all shadow-lg">
          Continuar <ChevronRight className="inline w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LogisticsStep2({ requirements, loading, fetchDocs, onNext }: any) {
  React.useEffect(() => { fetchDocs(); }, []);
  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 2 de 3 - Logistica</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Habilitaciones requeridas</h2>
        <p className="text-[13px] text-[#8ab8d8]">Documentacion legal para operar como operador logistico.</p>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl overflow-hidden mb-5">
        <div className="bg-[#0d1a27] px-4 py-3 border-b border-[#1a2e42] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#8ab8d8] uppercase tracking-wider">Checklist Legal Detectado por IA</span>
          <span className="bg-[#f5a800]/10 border border-[#f5a800]/20 text-[#f5a800] text-[9px] px-2 py-0.5 rounded-full font-mono uppercase">IA Generative</span>
        </div>
        {loading ? (
          <div className="p-8 flex flex-col items-center"><div className="w-5 h-5 border-2 border-[#00d4f0] border-t-transparent rounded-full animate-spin mb-3" /><p className="text-sm text-[#00d4f0]">Analizando habilitaciones...</p></div>
        ) : requirements.length > 0 ? (
          <div className="divide-y divide-[#1a2e42]/50">
            {requirements.map((req: any, i: number) => (
              <div key={i} className="p-4 flex gap-3 items-center hover:bg-[#0d1a27] transition-colors group">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${req.status === 'req' ? 'text-[#1a8aff] bg-[#1a8aff]/10 border-[#1a8aff]/30' : 'text-[#f5a800] bg-[#f5a800]/10 border-[#f5a800]/30'}`}>{req.status === 'req' ? '!' : 'A'}</div>
                <div className="flex-1 min-w-0"><div className="text-[13px] font-medium text-[#cce0f5]">{req.name}</div><div className="text-[11px] text-[#4a7898] mt-0.5">{req.hint}</div></div>
                <button className="shrink-0 px-2.5 py-1 rounded bg-[#00d4f0]/10 text-[#00d4f0] hover:bg-[#00d4f0] hover:text-[#020a12] font-mono text-[9px] font-bold transition-all opacity-0 group-hover:opacity-100">Subir</button>
              </div>
            ))}
          </div>
        ) : (<div className="p-6 text-center text-[#4a7898] text-[13px]">No se encontraron habilitaciones.</div>)}
      </div>
      <div className="flex gap-3">
        <button onClick={onNext} className="flex-1 bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all shadow-lg">Explorar ahora <ChevronRight className="inline w-4 h-4" /></button>
        <button onClick={onNext} className="px-5 py-3 border border-[#2a4560] text-[#8ab8d8] hover:text-white rounded-lg text-sm transition-all">Omitir</button>
      </div>
    </div>
  );
}

function LogisticsPlanStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 bg-[#00d4f0]/10 border border-[#00d4f0]/20 rounded-full font-mono text-[9px] text-[#00d4f0] uppercase tracking-widest mb-3">Paso 3 de 3 - Logistica</div>
        <h1 className="font-cond text-3xl md:text-4xl font-black text-white">Tu plan Partner</h1>
        <p className="text-[#8ab8d8] text-sm mt-3">Conectate con cargas reales y empresas verificadas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 flex flex-col justify-between">
          <div><div className="font-mono text-[10px] text-[#4a7898] uppercase tracking-widest mb-2">Basico</div><div className="font-cond text-4xl font-black text-white mb-2">Gratis</div><p className="text-xs text-[#4a7898] mb-6 pb-6 border-b border-[#1a2e42]">Para empezar</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-xs text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00e878] shrink-0" /> Perfil publico y 5 leads/mes</li>
              <li className="flex items-start gap-2 text-xs text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00e878] shrink-0" /> Calculadora de rutas y costos</li>
              <li className="flex items-start gap-2 text-xs text-[#4a7898] opacity-50"><span className="w-4 text-center text-xs">x</span> Badge Verificado</li>
            </ul>
          </div>
          <button onClick={onNext} className="w-full py-2.5 border border-[#2a4560] text-[#8ab8d8] rounded-lg text-sm hover:text-white hover:border-[#4a7898] transition-all">Empezar gratis</button>
        </div>
        <div className="bg-[#09131e] border-2 border-[#00d4f0] rounded-xl p-6 relative flex flex-col justify-between transform -translate-y-2 shadow-[0_12px_32px_rgba(0,212,240,0.1)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d4f0] text-black font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">PARTNER PRO</div>
          <div><div className="font-mono text-[10px] text-[#00d4f0] uppercase tracking-widest mb-2">Partner Pro</div><div className="font-cond text-4xl font-black text-white mb-2">$49<span className="text-lg text-[#4a7898]">/mes USD</span></div><p className="text-xs text-[#4a7898] mb-6 pb-6 border-b border-[#1a2e42]">Para operadores activos</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-xs text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Leads ilimitados y prioridad</li>
              <li className="flex items-start gap-2 text-xs text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Badge Verificado visible</li>
              <li className="flex items-start gap-2 text-xs text-[#cce0f5]"><CheckCircle2 className="w-4 h-4 text-[#00d4f0] shrink-0" /> Chat seguro y alertas de rutas</li>
            </ul>
          </div>
          <button onClick={onNext} className="w-full py-2.5 bg-[#00d4f0] text-[#020a12] font-bold rounded-lg text-sm hover:bg-[#00e878] shadow-[0_4px_14px_rgba(0,212,240,0.3)] transition-all">Activar Partner Pro</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INSTITUTIONAL FLOW
// ==========================================
function InstStep1({ onNext }: { onNext: () => void }) {
  const [sel, setSel] = React.useState(0);
  const types = [
    { icon: 'institution', label: 'Camara de Comercio / Asociacion Gremial', ex: 'Camara de Exportadores, Union Industrial, CAME' },
    { icon: 'government', label: 'Organismo Gubernamental / Regulador', ex: 'SENASA, Aduana Argentina, Ministerio de Produccion, INTA' },
    { icon: 'agency', label: 'Agencia de Promocion y Desarrollo', ex: 'Agencias de exportaciones, ONGs de comercio, ProArgentina' },
  ];
  const emojis: Record<string, string> = { institution: 'institution', government: 'government', agency: 'agency' };
  const icons = ['institution', 'government', 'agency'];
  const emojiMap: Record<string, string> = { institution: String.fromCodePoint(0x1F3DB, 0xFE0F), government: String.fromCodePoint(0x2696, 0xFE0F), agency: String.fromCodePoint(0x1F4C8) };
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full font-mono text-[9px] text-[#f0c040] uppercase tracking-widest mb-3">Paso 1 de 4 - Institucional</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Que tipo de entidad representas?</h2>
        <p className="text-[13px] text-[#8ab8d8]">Define los documentos de verificacion de autoridad requeridos.</p>
      </div>
      <div className="space-y-3">
        {types.map((t, i) => (
          <div key={i} onClick={() => setSel(i)} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${sel === i ? 'border-[#f0c040] bg-[#f0c040]/5' : 'border-[#1a2e42] bg-[#09131e] hover:border-[#2a4560]'}`}>
            <span className="text-2xl">{emojiMap[icons[i]]}</span>
            <div><div className="text-[13px] font-semibold text-[#f0f8ff]">{t.label}</div><div className="text-[11px] text-[#4a7898] mt-0.5">{t.ex}</div></div>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="mt-6 w-full bg-gradient-to-r from-[#f0c040] to-[#f5a800] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all">Continuar <ChevronRight className="inline w-4 h-4" /></button>
    </div>
  );
}

function InstStep2({ country, onNext }: any) {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full font-mono text-[9px] text-[#f0c040] uppercase tracking-widest mb-3">Paso 2 de 4 - Institucional</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Datos de tu entidad</h2>
        <p className="text-[13px] text-[#8ab8d8]">Datos oficiales para verificacion de autoridad.</p>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 space-y-4">
        <div><label className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider block mb-1.5">Razon Social / Nombre Oficial</label>
          <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#f0c040]">
            <Building className="w-4 h-4 text-[#4a7898]" /><input type="text" defaultValue="Camara de Exportadores de Argentina" className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>
        </div>
        <div><label className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider block mb-1.5">ID Fiscal</label>
          <div className="flex gap-2">
            <div className="shrink-0 flex items-center justify-center bg-[#1a2e42] rounded-lg px-3 text-xs font-mono text-[#8ab8d8]">{country} CUIT</div>
            <div className="flex-1 flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#f0c040]"><input type="text" placeholder="30-12345678-9" className="bg-transparent text-[13px] text-white outline-none w-full font-mono" /></div>
          </div>
        </div>
        <div><label className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider block mb-1.5">Sitio Web Oficial</label>
          <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#f0c040]">
            <Globe className="w-4 h-4 text-[#4a7898]" /><input type="text" defaultValue="www.camarax.org.ar" className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>
        </div>
        <button onClick={onNext} className="w-full bg-gradient-to-r from-[#f0c040] to-[#f5a800] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all mt-2">Continuar <ChevronRight className="inline w-4 h-4" /></button>
      </div>
    </div>
  );
}

function InstStep3({ onNext }: { onNext: () => void }) {
  const [done, setDone] = React.useState<number[]>([]);
  const docs = [
    { name: 'Carta de Acreditacion Oficial (PDF firmado)', hint: 'Firmada por autoridad competente, con sello oficial', req: true },
    { name: 'Estatuto o Acta Constitutiva', hint: 'Inscripcion en IGJ o equivalente provincial', req: false },
    { name: 'Resolucion de Autorizacion Ministerial', hint: 'Para organismos gubernamentales', req: false },
  ];
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full font-mono text-[9px] text-[#f0c040] uppercase tracking-widest mb-3">Paso 3 de 4 - Institucional</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Verificacion de autoridad</h2>
        <p className="text-[13px] text-[#8ab8d8]">Para garantizar maxima confianza, verificamos tu identidad oficial.</p>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 space-y-4">
        <div className="text-center p-5 bg-[#1a8aff]/5 border border-[#1a8aff]/15 rounded-xl"><div className="text-4xl mb-2">shield</div><div className="text-[13px] text-[#cce0f5]">Verificacion de Institucion Oficial</div></div>
        <div><label className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider block mb-1.5">Email con dominio oficial (.gob, .org, .edu)</label>
          <div className="flex items-center gap-2 bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 focus-within:border-[#f0c040]">
            <Mail className="w-4 h-4 text-[#4a7898]" /><input type="email" placeholder="@organismo.gob.ar" className="bg-transparent text-[13px] text-white outline-none w-full" />
          </div>
        </div>
        <div className="bg-[#0d1a27] border border-[#1a2e42] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1a2e42]"><span className="font-mono text-[10px] text-[#8ab8d8] uppercase tracking-wider">Documentacion institucional requerida</span></div>
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a2e42]/50 last:border-0 hover:bg-[#09131e] transition-colors group">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${done.includes(i) ? 'bg-[#00e878]/15 border-[#00e878]/30 text-[#00e878]' : doc.req ? 'bg-[#1a8aff]/10 border-[#1a8aff]/30 text-[#1a8aff]' : 'bg-[#f5a800]/10 border-[#f5a800]/30 text-[#f5a800]'}`}>
                {done.includes(i) ? 'v' : doc.req ? '!' : 'A'}
              </div>
              <div className="flex-1 min-w-0"><div className="text-[12px] font-medium text-[#cce0f5]">{doc.name}</div><div className="text-[10px] text-[#4a7898] mt-0.5">{doc.hint}</div></div>
              {!done.includes(i) && (<button onClick={() => setDone(prev => [...prev, i])} className="shrink-0 px-2.5 py-1 rounded bg-[#f0c040]/10 text-[#f0c040] hover:bg-[#f0c040] hover:text-[#020a12] font-mono text-[9px] font-bold transition-all opacity-0 group-hover:opacity-100">Subir</button>)}
            </div>
          ))}
        </div>
        <button onClick={onNext} className="w-full bg-gradient-to-r from-[#f0c040] to-[#f5a800] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all">Solicitar aprobacion <ChevronRight className="inline w-4 h-4" /></button>
        <button onClick={onNext} className="w-full py-2.5 border border-[#2a4560] text-[#8ab8d8] rounded-lg text-sm hover:text-white transition-all">Mas tarde</button>
      </div>
    </div>
  );
}

function InstStep4({ onNext }: { onNext: () => void }) {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full font-mono text-[9px] text-[#f0c040] uppercase tracking-widest mb-3">Paso 4 de 4 - Institucional</div>
        <h2 className="font-cond text-3xl font-bold text-white mb-2">Alcance y servicios digitales</h2>
        <p className="text-[13px] text-[#8ab8d8]">Que servicios queres ofrecer dentro de la plataforma?</p>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 space-y-5">
        <div><label className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider block mb-2">Alcance jurisdiccional</label>
          <div className="grid grid-cols-3 gap-3">{['Nacional', 'Provincial', 'Internacional'].map(opt => (<button key={opt} className="bg-[#0d1a27] border border-[#1a2e42] rounded-lg px-3 py-2.5 text-[13px] text-[#8ab8d8] hover:border-[#f0c040] hover:text-white transition-all">{opt}</button>))}</div>
        </div>
        <div className="bg-[#0d1a27] border border-[#1a2e42] rounded-xl p-4 space-y-3">
          <div className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider mb-2">Servicios digitales a habilitar</div>
          {['Emitir Certificados de Origen', 'Ofrecer capacitaciones y cursos', 'Publicar estadisticas y reportes sectoriales', 'Padrinazgo / Badges para empresas miembro'].map((svc, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked={i < 2} className="accent-[#f0c040] w-4 h-4" /><span className="text-[12px] text-[#cce0f5]">{svc}</span></label>
          ))}
        </div>
        <div className="p-4 bg-[#0d1a27] border border-[#1a2e42] rounded-xl text-center">
          <div className="font-mono text-[10px] text-[#4a7898] uppercase tracking-wider mb-4 text-left">Vista previa de tu sello institucional</div>
          <div className="inline-flex flex-col items-center gap-2 px-8 py-5 bg-[#111f2e] border-2 border-[#f0c040] rounded-xl shadow-[0_0_32px_rgba(240,192,64,0.12)]">
            <span className="text-3xl">inst</span><div className="font-mono text-[9px] text-[#f0c040] uppercase tracking-widest">Institucion Verificada</div><div className="text-[10px] text-[#8ab8d8]">Che.Comex Official Partner</div>
          </div>
        </div>
        <button onClick={onNext} className="w-full bg-gradient-to-r from-[#f0c040] to-[#f5a800] text-[#020a12] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-all">Finalizar y solicitar aprobacion <ChevronRight className="inline w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ==========================================
// PROGRESSIVE VERIFICATION DASHBOARD
// ==========================================
function OnboardingDashboard({ verifyScore: initialScore, role }: { verifyScore: number; role: string }) {
  const [score, setScore] = React.useState(initialScore || 0);
  const [done, setDone] = React.useState<number[]>([]);
  const [, setLocation] = useLocation();
  const items = [
    { name: 'Registro Fiscal / RIE', hint: 'Subi tu constancia de inscripcion tributaria', points: 15, unlock: 'Analisis de mercado avanzado' },
    { name: 'Firma Digital / ID Verificado', hint: 'Necesaria para documentacion electronica', points: 15, unlock: 'Generacion automatica de docs IA' },
    { name: 'Habilitacion Sectorial', hint: 'SENASA / CNRT para tu sector', points: 20, unlock: 'Matches sectoriales exclusivos' },
    { name: 'Certificado de Origen', hint: 'Para acceder a tarifas preferenciales', points: 25, unlock: 'Marketplace B2B desbloqueado' },
    { name: role === 'logistics' ? 'Poliza de Seguro Carga' : 'Cuenta Bancaria Habilitada', hint: 'Para cobro de divisas o seguros', points: 25, unlock: 'Chat Seguro + Deals' },
  ];
  const features = [
    { icon: 'search', title: 'HS Code + Mapa', desc: 'Inteligencia arancelaria', threshold: 0 },
    { icon: 'doc', title: 'Docs IA', desc: 'Generacion automatica de documentacion', threshold: 15 },
    { icon: 'market', title: 'Marketplace B2B', desc: 'Matching IA con compradores verificados', threshold: 50 },
    { icon: 'chat', title: 'Chat Seguro', desc: 'Con trazabilidad blockchain', threshold: 75 },
    { icon: 'alert', title: 'Alertas', desc: 'Cambios regulatorios por perfil', threshold: 0 },
    { icon: 'chain', title: 'Blockchain', desc: 'Hashing inmutable en Polygon L2', threshold: 100 },
  ];
  const emojiMap: Record<string, string> = { search: 'search', doc: 'doc', market: 'market', chat: 'chat', alert: 'alert', chain: 'chain' };
  const iconEmoji: Record<string, string> = { search: String.fromCodePoint(0x1F50D), doc: String.fromCodePoint(0x1F4C4), market: String.fromCodePoint(0x1F91D), chat: String.fromCodePoint(0x1F4AC), alert: String.fromCodePoint(0x1F4F0), chain: String.fromCodePoint(0x26D3, 0xFE0F) };
  const toggle = (i: number, pts: number) => { if (done.includes(i)) return; setDone(prev => [...prev, i]); setScore(prev => Math.min(100, prev + pts)); };
  const pct = Math.min(100, score);
  const color = pct >= 100 ? '#00e878' : '#00d4f0';
  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-xl p-5 mb-6 bg-gradient-to-r from-[#09131e] to-[#0d1a27] border border-[#1a2e42] flex flex-wrap items-center justify-between gap-4">
        <div><div className="font-cond text-2xl font-black text-white">Bienvenida al ecosistema</div><div className="text-[13px] text-[#8ab8d8] mt-1">{role === 'trader' ? 'Comerciante' : role === 'logistics' ? 'Logistica' : 'Institucional'} - Plan Demo activo</div></div>
        <div className="flex gap-2"><span className="bg-[#f5a800]/10 border border-[#f5a800]/20 text-[#f5a800] text-[9px] px-2.5 py-1 rounded-full font-mono uppercase">Pendiente verificacion</span><span className="bg-[#00d4f0]/10 border border-[#00d4f0]/20 text-[#00d4f0] text-[9px] px-2.5 py-1 rounded-full font-mono uppercase">Demo</span></div>
      </div>
      <div className="bg-[#09131e] border border-[#1a2e42] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div><h2 className="font-cond text-xl font-bold text-white">Verificacion de Perfil</h2><p className="text-[13px] text-[#8ab8d8] mt-1">Completa documentos para desbloquear el ecosistema</p></div>
          <div className="flex items-baseline gap-1"><span className="font-cond text-5xl font-black transition-all" style={{ color }}>{pct}</span><span className="font-mono text-lg text-[#4a7898]">/100</span></div>
        </div>
        <div className="h-2 bg-[#1a2e42] rounded-full overflow-hidden mb-4"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #00d4f0, ${color})` }} /></div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} onClick={() => toggle(i, item.points)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${done.includes(i) ? 'bg-[#00e878]/5 border-[#00e878]/20' : 'bg-[#0d1a27] border-[#1a2e42] hover:border-[#2a4560]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${done.includes(i) ? 'bg-[#00e878]/15 text-[#00e878]' : 'bg-[#f5a800]/10 text-[#f5a800]'}`}>{done.includes(i) ? 'ok' : 'T'}</div>
              <div className="flex-1 min-w-0"><div className="text-[12px] font-medium text-[#cce0f5]">{item.name}</div><div className="text-[10px] text-[#4a7898] mt-0.5">{item.hint}</div></div>
              {done.includes(i) ? (<span className="font-mono text-[9px] text-[#00e878] shrink-0">Completado</span>) : (<span className="font-mono text-[9px] text-[#f5a800] bg-[#f5a800]/8 border border-[#f5a800]/20 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">{item.unlock}</span>)}
            </div>
          ))}
        </div>
      </div>
      <h3 className="font-cond text-xl font-bold text-white mb-3">Funcionalidades del Ecosistema</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {features.map((f, i) => { const locked = pct < f.threshold; return (
          <div key={i} className={`relative bg-[#09131e] border border-[#1a2e42] rounded-xl p-5 transition-all ${locked ? 'opacity-40' : 'hover:border-[#00d4f0]/50'}`}>
            <div className="text-2xl mb-3">{iconEmoji[f.icon]}</div><div className="text-[12px] font-semibold text-[#f0f8ff] mb-1">{f.title}</div><div className="text-[10px] text-[#4a7898] leading-relaxed">{f.desc}</div>
            {locked && <div className="absolute inset-0 bg-[#020a12]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center text-lg">lock</div>}
          </div>
        ); })}
      </div>
      <button onClick={() => setLocation('/')} className="w-full bg-gradient-to-r from-[#00d4f0] to-[#1a8aff] text-[#020a12] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg text-sm">Ir al Dashboard Principal</button>
    </div>
  );
}
