
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
        
          {/* Welcome Section - Removida la caja "glass-premium" gigante */}
          <section className="relative min-h-[500px] flex flex-col items-center justify-center text-center p-8" data-aos="fade-up">
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-sm font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-cyan-900/20">
                <Sparkles className="w-4 h-4" />
                Sistema Operativo de Comercio Exterior
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                Ecosistema Integral <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400">
                  Che.Comex AI
                </span>
              </h1>
              
              <p className="text-gray-200 text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
                Desde la clasificación arancelaria hasta el cálculo logístico puerta a puerta. 
                Todo lo que necesitas para operar, en una sola plataforma.
              </p>

              {/* Search Box - Flotando limpio */}
              <div className="max-w-3xl mx-auto w-full mt-10" data-aos="fade-up" data-aos-delay="200">
                {/* Contenedor del buscador con glass más suave */}
                <div className="bg-[#0f172a]/60 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-2xl shadow-blue-900/30">
                  <HsCodeSearch 
                    onProductSelected={handleProductSelected}
                    onPartidaSelected={handlePartidaSelected}
                  />
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {quickAccesItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-left ${item.color} backdrop-blur-sm`}
                    >
                      {item.icon}
                      <span className="text-sm font-semibold text-gray-200">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* New Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Stats & Alerts */}
            <div className="md:col-span-4 space-y-6" data-aos="fade-up" data-aos-delay="400">
              <div className="glass-premium rounded-2xl p-6 border border-white/5 h-full">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-yellow-500" />
                  Alertas Globales
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-400">CRITICAL</span>
                        <span className="text-xs text-gray-500">Hace 2h</span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">Nuevas sanciones a exportación de tecnología dual-use a Rusia.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-orange-400">WARNING</span>
                        <span className="text-xs text-gray-500">Hace 5h</span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">Congestión portuaria en Shanghai aumenta tiempos de tránsito (+7 días).</p>
                  </div>
                  <Button variant="ghost" className="w-full text-cyan-400 text-xs hover:text-cyan-300 hover:bg-white/5" onClick={() => navigate('/alerts')}>
                    Ver todas las alertas <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Main Modules */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6" data-aos="fade-up" data-aos-delay="600">
              <FeatureCard 
                icon={<Ship className="w-8 h-8" />}
                title="Calculadora Logística"
                description="Costos puerta a puerta con impuestos y servicios incluidos."
                detailedDescription="Simula operaciones de expo/impo marítimas, aéreas y terrestres con precisión milimétrica."
                actionLabel="Simular"
                onAction={() => navigate('/analysis?tab=calculator')}
                imageGradient="from-blue-600 to-indigo-600"
              />
              <FeatureCard 
                icon={<FileText className="w-8 h-8" />}
                title="Gestor Documental"
                description="Generación automática de documentos regulatorios."
                detailedDescription="Accede a templates oficiales y requisitos fitosanitarios por partida arancelaria y destino."
                actionLabel="Ver Requisitos"
                onAction={() => navigate('/analysis?tab=documentation')}
                imageGradient="from-orange-500 to-red-500"
              />
              <FeatureCard 
                icon={<BarChart3 className="w-8 h-8" />}
                title="Inteligencia de Mercado"
                description="Datos de flujos comerciales 2024-2025."
                detailedDescription="Descubre nuevos mercados con análisis predictivo de demanda y competencia."
                actionLabel="Analizar"
                onAction={() => navigate('/analysis')}
                imageGradient="from-purple-600 to-pink-600"
              />
              <FeatureCard 
                icon={<Users className="w-8 h-8" />}
                title="Red de Partners"
                description="Conecta con agentes de carga y despachantes."
                detailedDescription="Directorio verificado de proveedores de servicios logísticos y legales."
                actionLabel="Buscar Partners"
                onAction={() => navigate('/marketplace')}
                imageGradient="from-emerald-500 to-teal-500"
              />
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
