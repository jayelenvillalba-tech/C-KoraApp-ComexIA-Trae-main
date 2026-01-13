import { useState } from 'react';
import WorldMap4D from '@/components/world-map-4d';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/feature-card';
import { useLanguage } from '@/hooks/use-language';
import { Globe, Search, TrendingUp, Ship, MapPin, ChevronRight, Sparkles, Anchor, BarChart3, Users } from 'lucide-react';
import HsCodeSearch from '@/components/hs-code-search';

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();

  const handleProductSelected = (product: any, country: string, operation: string, productName: string) => {
    navigate(`/analysis?code=${product.code}&country=${country}&operation=${operation}&product=${encodeURIComponent(productName)}`);
  };

  const handlePartidaSelected = (partida: any, country: string, operation: string, productName: string) => {
    navigate(`/analysis?code=${partida.code}&country=${country}&operation=${operation}&product=${encodeURIComponent(productName)}`);
  };

  return (
    <div className="min-h-screen bg-[#0A1929] overflow-x-hidden selection:bg-cyan-500/30">
      {/* Header */}
      <header className="bg-[#0D2137]/80 backdrop-blur-md border-b border-cyan-900/30 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center p-0.5 overflow-hidden shadow-lg border border-cyan-400/50 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="Che.Comex" className="w-full h-full object-contain filter drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter group-hover:text-cyan-100 transition-colors">
                  CHE.<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">COMEX</span>
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {['NOTICIAS', 'MARKETPLACE'].map((item) => (
                <a 
                  key={item}
                  onClick={() => {
                    if (item === 'MARKETPLACE') navigate('/marketplace');
                    if (item === 'NOTICIAS') navigate('/news'); // Add News navigation logic
                  }}
                  className="text-gray-400 hover:text-cyan-400 transition-all text-xs font-bold tracking-widest cursor-pointer hover:scale-105"
                >
                  {item}
                </a>
              ))}
              
              <div className="h-6 w-px bg-cyan-900/50" />

              {/* Language Toggle */}
              <div className="flex bg-[#0A1929] rounded-lg p-1 border border-cyan-900/50">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'es' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-cyan-400'}`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-cyan-400'}`}
                >
                  EN
                </button>
              </div>

              <Button 
                onClick={() => navigate('/auth')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-6 font-bold shadow-[0_0_15px_rgba(8,145,178,0.4)]"
              >
                {language === 'es' ? 'ACCEDER' : 'LOGIN'}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
        {/* Animated 4D World Map Background */}
        <div className="absolute inset-0 pointer-events-none">
           <WorldMap4D className="opacity-50" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0A1929] via-transparent to-[#0A1929]/50" />
        </div>

        <div className="container mx-auto px-6 relative z-10 py-12">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-3 h-3" />
              {language === 'es' ? 'POTENCIADO POR IA' : 'POWERED BY AI'}
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl animate-in fade-in zoom-in-50 duration-1000">
              {language === 'es' 
                ? <>El Futuro del <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Comercio Global</span></>
                : <>The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Global Trade</span></>
              }
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {language === 'es'
                ? 'Plataforma inteligente unificada para descubrir oportunidades, calcular costos logísticos y conectar con partners verificados.'
                : 'Unified intelligent platform to discover opportunities, calculate logistics costs, and connect with verified partners.'}
            </p>

            {/* Glassmorphism Search Box */}
            <div className="max-w-3xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
               <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                 <div className="relative bg-[#0D2137]/80 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-2 shadow-2xl">
                    <HsCodeSearch 
                        onProductSelected={handleProductSelected}
                        onPartidaSelected={handlePartidaSelected}
                    />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-24 bg-[#0A1929] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1929] to-[#0D2137]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {language === 'es' ? 'Herramientas de Última Generación' : 'Next-Gen Tools'}
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8" />}
              title={language === 'es' ? 'Análisis de Mercado' : 'Market Analysis'}
              description={language === 'es' ? 'Identifica oportunidades con Big Data.' : 'Identify opportunities with Big Data.'}
              detailedDescription={language === 'es' 
                ? 'Visualiza flujos comerciales, detecta demanda insatisfecha y analiza competidores con gráficos predictivos.' 
                : 'Visualize trade flows, detect unmet demand, and analyze competitors with predictive charts.'}
              actionLabel={language === 'es' ? 'Explorar Mercados' : 'Explore Markets'}
              onAction={() => navigate('/analysis')}
              imageGradient="from-blue-600 to-cyan-500"
            />
            
            <FeatureCard 
              icon={<Anchor className="w-8 h-8" />}
              title={language === 'es' ? 'Logística Inteligente' : 'Smart Logistics'}
              description={language === 'es' ? 'Calcula y optimiza rutas globales.' : 'Calculate and optimize global routes.'}
              detailedDescription={language === 'es' 
                ? 'Simulador de costos puerta a puerta, comparación de fletes y rutas óptimas para tu carga.' 
                : 'Door-to-door cost simulator, freight comparison, and optimal routes for your cargo.'}
              actionLabel={language === 'es' ? 'Simular Envíos' : 'Simulate Shipping'}
              onAction={() => navigate('/analysis')} 
              imageGradient="from-cyan-500 to-emerald-500"
            />

            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title={language === 'es' ? 'Red Global' : 'Global Network'}
              description={language === 'es' ? 'Conecta con partners verificados.' : 'Connect with verified partners.'}
              detailedDescription={language === 'es' 
                ? 'Marketplace B2B exclusivo para encontrar proveedores, agentes de carga y clientes confiables.' 
                : 'Exclusive B2B marketplace to find reliable suppliers, freight forwarders, and customers.'}
              actionLabel={language === 'es' ? 'Ver Red' : 'View Network'}
              onAction={() => navigate('/marketplace')}
              imageGradient="from-purple-600 to-blue-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-16 text-center transform hover:scale-[1.01] transition-transform duration-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grain-texture.com/grain.png')] opacity-10" />
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500" />
            
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight relative z-10">
              {language === 'es' 
                ? '¿Listo para dominar el comercio global?' 
                : 'Ready to dominate global trade?'}
            </h2>
            <p className="text-xl text-cyan-100 mb-10 max-w-2xl mx-auto font-light relative z-10">
              {language === 'es'
                ? 'Únete a la revolución de la inteligencia artificial aplicada al comercio exterior.'
                : 'Join the revolution of artificial intelligence applied to foreign trade.'}
            </p>
            <Button 
              size="lg" 
              className="bg-white text-cyan-700 hover:bg-cyan-50 text-lg px-10 py-8 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all relative z-10"
              onClick={() => navigate('/marketplace')}
            >
              {language === 'es' ? 'COMENZAR AHORA' : 'GET STARTED NOW'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050B14] border-t border-cyan-900/30 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600" />
                <span className="text-xl font-bold text-white">CHE.COMEX</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                {language === 'es' ? 'Democratizando el acceso a la inteligencia comercial global.' : 'Democratizing access to global trade intelligence.'}
              </p>
            </div>
            
            {[1, 2, 3].map((i) => (
               <div key={i} className="space-y-4">
                 <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                    {language === 'es' ? ['Producto', 'Compañía', 'Recursos'][i-1] : ['Product', 'Company', 'Resources'][i-1]}
                 </h4>
                 <ul className="space-y-2 text-gray-500 text-sm">
                   {['Features', 'Pricing', 'API'].map(link => (
                     <li key={link} className="hover:text-cyan-400 cursor-pointer transition-colors">{link}</li>
                   ))}
                 </ul>
               </div>
            ))}
          </div>
          
          <div className="text-center text-gray-600 text-xs border-t border-gray-800 pt-8">
            <p>© 2026 Che.Comex Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
