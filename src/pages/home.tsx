
import { useState, useEffect } from 'react';
import PremiumGlobe3D from '@/components/premium-globe-3d'; // Premium 3D globe with Three.js
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/feature-card';
import { useLanguage } from '@/hooks/use-language';
import { 
  Globe, Search, TrendingUp, Ship, MapPin, ChevronRight, Sparkles, 
  Anchor, BarChart3, Users, ShieldAlert, FileText, Zap, Box
} from 'lucide-react';
import HsCodeSearch from '@/components/hs-code-search';
import { AlertsTicker } from '@/components/alerts-ticker';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '@/components/header';

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
      delay: 0,
    });
  }, []);

  const handleProductSelected = (product: any, country: string, operation: string, productName: string) => {
    navigate(`/analysis?code=${product.code}&country=${country}&operation=${operation}&product=${encodeURIComponent(productName)}`);
  };

  const handlePartidaSelected = (partida: any, country: string, operation: string, productName: string) => {
    navigate(`/analysis?code=${partida.code}&country=${country}&operation=${operation}&product=${encodeURIComponent(productName)}`);
  };

  const quickAccesItems = [
    { icon: <ShieldAlert className="w-5 h-5 text-red-400" />, label: 'Sanciones', path: '/alerts', color: 'bg-red-500/10 border-red-500/20' },
    { icon: <FileText className="w-5 h-5 text-orange-400" />, label: 'Documentos', path: '/analysis?tab=documentation', color: 'bg-orange-500/10 border-orange-500/20' },
    { icon: <Ship className="w-5 h-5 text-blue-400" />, label: 'Logística', path: '/analysis?tab=calculator', color: 'bg-blue-500/10 border-blue-500/20' },
    { icon: <Zap className="w-5 h-5 text-yellow-400" />, label: 'IA Insights', path: '/analysis', color: 'bg-yellow-500/10 border-yellow-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] overflow-x-hidden selection:bg-cyan-500/30 relative">
      {/* GLOBAL 3D BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PremiumGlobe3D className="w-full h-full opacity-60 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B14]/30 via-transparent to-[#050B14]/90" />
      </div>

      {/* Header */}
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 relative z-10 w-full max-w-7xl mx-auto">
        
          {/* Welcome Section */}
          <section className="relative min-h-[500px] flex flex-col items-center justify-center text-center p-8" data-aos="fade-up">
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[2px] bg-[#00d4f010] border border-[#00d4f025] text-[#00d4f0] font-mono text-[10px] font-semibold uppercase tracking-[2px]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4f0] animate-pulse"></div>
                Sistema Operativo de Comercio Exterior
              </div>
              
              <h1 className="font-cond text-[clamp(44px,6vw,72px)] font-extrabold text-[#f0f8ff] uppercase leading-[1.05] tracking-[-0.5px]">
                Ecosistema Integral <br/>
                <span className="text-[#00d4f0]">Che.</span><span className="text-[#f5a800]">Comex</span> <span className="text-[#00d4f0]">AI</span>
              </h1>
              
              <p className="font-sans text-[15px] text-[#4a7090] max-w-[540px] mx-auto leading-[1.7]">
                Desde la clasificación arancelaria hasta el cálculo logístico puerta a puerta. 
                Todo lo que necesitas para operar en el comercio internacional, en una sola plataforma.
              </p>

              {/* Search Box - Flotando limpio */}
              <div className="max-w-[680px] mx-auto w-full mt-10 text-left bg-[#060d16] border border-[#203548] rounded-[4px] p-[20px_24px]" data-aos="fade-up" data-aos-delay="200">
                <div className="flex items-center gap-2 font-sans text-[13px] font-semibold text-[#c8dff0] mb-[14px]">
                  🔍 Buscador de Códigos HS
                  <span className="font-mono text-[9px] bg-[#00d4f015] text-[#00d4f0] border border-[#00d4f030] px-[7px] py-[2px] rounded-[2px] uppercase tracking-[0.8px]">
                    AI Powered
                  </span>
                </div>
                
                <div className="mb-3">
                   <HsCodeSearch 
                     onProductSelected={handleProductSelected}
                     onPartidaSelected={handlePartidaSelected}
                   />
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                  {quickAccesItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className="font-mono text-[10px] font-semibold px-[14px] py-[7px] border border-[#203548] text-[#4a7090] bg-[#09131e] rounded-[2px] cursor-pointer uppercase tracking-[0.8px] flex items-center gap-1.5 transition-all hover:border-[#2a4560] hover:text-[#c8dff0]"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* New Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-[1100px] mx-auto">
            
            {/* Left Column: Stats & Alerts */}
            <div className="md:col-span-4 space-y-6" data-aos="fade-up" data-aos-delay="400">
              <div className="bg-[#03080f] rounded-none px-0 pb-[60px] h-full">
                <div className="font-mono text-[9px] font-semibold text-[#2a4a68] tracking-[1.5px] uppercase mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-[1px] after:bg-[#1a2e42]">
                  Alertas Recientes
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-3 p-[10px_14px] border border-[#1a2e42] bg-[#09131e] hover:bg-[#0d1a27] transition-colors cursor-pointer" onClick={() => navigate('/alerts')}>
                    <span className="font-mono text-[9px] font-bold px-2 py-[2px] rounded-[2px] uppercase shrink-0 mt-[1px] bg-[#ff404015] text-[#ff4040] border border-[#ff404030]">Critical</span>
                    <span className="font-sans text-[12px] text-[#8aafcc] flex-1 leading-[1.5]">Nuevas sanciones a exportación de tecnología dual-use a Rusia.</span>
                    <span className="font-mono text-[9px] text-[#2a4a68] shrink-0">Hace 2h</span>
                  </div>
                  <div className="flex items-start gap-3 p-[10px_14px] border border-[#1a2e42] bg-[#09131e] hover:bg-[#0d1a27] transition-colors cursor-pointer" onClick={() => navigate('/alerts')}>
                    <span className="font-mono text-[9px] font-bold px-2 py-[2px] rounded-[2px] uppercase shrink-0 mt-[1px] bg-[#f5a80015] text-[#f5a800] border border-[#f5a80030]">Warning</span>
                    <span className="font-sans text-[12px] text-[#8aafcc] flex-1 leading-[1.5]">Congestión portuaria en Shanghai aumenta tiempos de tránsito (+7 días).</span>
                    <span className="font-mono text-[9px] text-[#2a4a68] shrink-0">Hace 5h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Main Modules */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="600">
              {/* Card 1 */}
              <div className="bg-[#03080f] border-t-2 border-t-[#00d4f0] border-x border-b border-x-[#1a2e42] border-b-[#1a2e42] p-[24px_20px] rounded-[2px] cursor-pointer group hover:bg-[#060d16] transition-colors" onClick={() => navigate('/analysis')}>
                 <div className="w-[42px] h-[42px] bg-[#00d4f010] border border-[#00d4f030] rounded-[2px] flex items-center justify-center text-[#00d4f0] mb-[20px] group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-[22px] h-[22px]" />
                 </div>
                 <h3 className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-[1.1] mb-[10px]">INTELIGENCIA DE MERCADO</h3>
                 <p className="font-sans text-[13px] text-[#8aafcc] leading-[1.6] mb-[20px]">Análisis predictivo de demandas, flujos comerciales y visualización interactiva de compradores globales.</p>
                 <div className="font-mono text-[10px] text-[#4a7090] font-bold uppercase tracking-[1px] flex items-center gap-2 group-hover:text-[#00d4f0] transition-colors">
                    Explorar Datos <ChevronRight className="w-3.5 h-3.5" />
                 </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#03080f] border-t-2 border-t-[#00e878] border-x border-b border-x-[#1a2e42] border-b-[#1a2e42] p-[24px_20px] rounded-[2px] cursor-pointer group hover:bg-[#060d16] transition-colors" onClick={() => navigate('/analysis?tab=calculator')}>
                 <div className="w-[42px] h-[42px] bg-[#00e87810] border border-[#00e87830] rounded-[2px] flex items-center justify-center text-[#00e878] mb-[20px] group-hover:scale-110 transition-transform">
                    <Ship className="w-[22px] h-[22px]" />
                 </div>
                 <h3 className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-[1.1] mb-[10px]">CALCULADORA LOGÍSTICA</h3>
                 <p className="font-sans text-[13px] text-[#8aafcc] leading-[1.6] mb-[20px]">Costos completos desde FOB hasta Landed Cost. Comparativa de los 11 Incoterms 2020 integrados.</p>
                 <div className="font-mono text-[10px] text-[#4a7090] font-bold uppercase tracking-[1px] flex items-center gap-2 group-hover:text-[#00e878] transition-colors">
                    Simular Costos <ChevronRight className="w-3.5 h-3.5" />
                 </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#03080f] border-t-2 border-t-[#f5a800] border-x border-b border-x-[#1a2e42] border-b-[#1a2e42] p-[24px_20px] rounded-[2px] cursor-pointer group hover:bg-[#060d16] transition-colors" onClick={() => navigate('/analysis?tab=documentation')}>
                 <div className="w-[42px] h-[42px] bg-[#f5a80010] border border-[#f5a80030] rounded-[2px] flex items-center justify-center text-[#f5a800] mb-[20px] group-hover:scale-110 transition-transform">
                    <FileText className="w-[22px] h-[22px]" />
                 </div>
                 <h3 className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-[1.1] mb-[10px]">GESTOR DOCUMENTAL</h3>
                 <p className="font-sans text-[13px] text-[#8aafcc] leading-[1.6] mb-[20px]">Requisitos fitosanitarios por partida HS, certificados de origen MERCOSUR y aduaneros listos para usar.</p>
                 <div className="font-mono text-[10px] text-[#4a7090] font-bold uppercase tracking-[1px] flex items-center gap-2 group-hover:text-[#f5a800] transition-colors">
                    Ver Requisitos <ChevronRight className="w-3.5 h-3.5" />
                 </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#03080f] border-t-2 border-t-[#8f40ff] border-x border-b border-x-[#1a2e42] border-b-[#1a2e42] p-[24px_20px] rounded-[2px] cursor-pointer group hover:bg-[#060d16] transition-colors" onClick={() => navigate('/marketplace')}>
                 <div className="w-[42px] h-[42px] bg-[#8f40ff10] border border-[#8f40ff30] rounded-[2px] flex items-center justify-center text-[#8f40ff] mb-[20px] group-hover:scale-110 transition-transform">
                    <Users className="w-[22px] h-[22px]" />
                 </div>
                 <h3 className="font-cond text-[24px] font-bold text-[#f0f8ff] tracking-[0.3px] leading-[1.1] mb-[10px]">RED DE PARTNERS</h3>
                 <p className="font-sans text-[13px] text-[#8aafcc] leading-[1.6] mb-[20px]">Directorio B2B verificado. Conecta directamente con agentes de carga, despachantes y empresas.</p>
                 <div className="font-mono text-[10px] text-[#4a7090] font-bold uppercase tracking-[1px] flex items-center gap-2 group-hover:text-[#8f40ff] transition-colors">
                    Buscar Partners <ChevronRight className="w-3.5 h-3.5" />
                 </div>
              </div>
            </div>
          
        </div>
      </main>
      
      <footer className="border-t border-white/5 py-12 bg-[#02060C]">
        <div className="container mx-auto px-6 text-center">
             <p className="text-gray-600 text-sm">© 2026 Che.Comex Inc. - Sistema Operativo de Comercio Exterior</p>
        </div>
      </footer>
    </div>
  );
}
