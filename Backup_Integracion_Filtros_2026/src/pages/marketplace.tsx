import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, Users, Briefcase, MessageSquare, Bell, Plus } from 'lucide-react';
import PostCard from '@/components/marketplace/post-card';
import MarketplaceSidebar from '@/components/marketplace/sidebar';
import PostForm from '@/components/marketplace/post-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Mock data for posts - will be replaced with real API
const mockPosts = [
  {
    id: '1',
    type: 'buy' as const,
    company: {
      id: 'c1',
      name: 'AgroExport S.A.',
      verified: true,
      country: 'AR'
    },
    user: {
      id: 'u1',
      name: 'María González',
      role: 'Gerente de Exportaciones',
      verified: true
    },
    hsCode: '1201',
    productName: 'Soya No GMO',
    quantity: '500 toneladas mensuales',
    originCountry: 'BR',
    destinationCountry: 'CN',
    deadline: 30,
    requirements: ['Certificado de Origen', 'Análisis Fitosanitario', 'Factura Comercial'],
    certifications: ['Blockchain Verified', 'ISO 9001'],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active' as const
  },
  {
    id: '2',
    type: 'sell' as const,
    company: {
      id: 'c2',
      name: 'BeefCorp International',
      verified: true,
      country: 'UY'
    },
    user: {
      id: 'u2',
      name: 'Carlos Rodríguez',
      role: 'Director Comercial',
      verified: true
    },
    hsCode: '0202',
    productName: 'Carne Bovina Premium',
    quantity: '200 toneladas',
    originCountry: 'UY',
    destinationCountry: 'EU',
    deadline: 15,
    requirements: ['Certificado Sanitario', 'Trazabilidad Completa'],
    certifications: ['SENASA', 'Halal', 'Blockchain Verified'],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'active' as const
  }
];

export default function Marketplace() {
  const { language } = useLanguage();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch posts from API
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/marketplace/posts'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      return data;
    }
  });

  // Filter posts based on search term
  const filteredPosts = posts.filter((post: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      post.productName?.toLowerCase().includes(term) ||
      post.hsCode?.includes(term) ||
      post.requirements?.some((r: string) => r.toLowerCase().includes(term)) ||
      post.certifications?.some((c: string) => c.toLowerCase().includes(term)) ||
      post.company?.name?.toLowerCase().includes(term)
    );
  });

  const handlePostSubmit = async (postData: any) => {
    if (!user) {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "Debes iniciar sesión para publicar" : "You must be logged in to post",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        ...postData,
        userId: user.id,
        companyId: user.companyId
      };

      const response = await fetch('/api/marketplace/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create post');

      toast({
        title: language === 'es' ? "Publicación creada" : "Post created",
        description: language === 'es' ? "Tu oportunidad comercial ha sido publicada" : "Your trade opportunity has been posted",
      });

      setShowPostForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/posts'] });
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' ? "No se pudo crear la publicación" : "Could not create post",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1929]">
      {/* LinkedIn-style Top Navigation Bar */}
      <nav className="bg-[#0D1117] border-b border-cyan-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <a href="/" className="text-cyan-400 font-bold text-xl">
                CHE.COMEX
              </a>
              
              {/* Global Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={language === 'es' ? 'Buscar empresas, productos, códigos HS...' : 'Search companies, products, HS codes...'}
                    className="pl-10 w-80 bg-[#0A1929] border-gray-700 text-white placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex items-center gap-6">
              <NavItem icon={<Home className="w-5 h-5" />} label={language === 'es' ? 'Inicio' : 'Home'} active onClick={() => navigate('/')} />
              <NavItem icon={<Users className="w-5 h-5" />} label={language === 'es' ? 'Mi Red' : 'My Network'} onClick={() => navigate('/marketplace')} />
              <NavItem icon={<Briefcase className="w-5 h-5" />} label={language === 'es' ? 'Oportunidades' : 'Opportunities'} onClick={() => navigate('/marketplace')} />
              <NavItem icon={<MessageSquare className="w-5 h-5" />} label={language === 'es' ? 'Mensajes' : 'Messages'} badge={3} onClick={() => navigate('/chat')} />
              <NavItem icon={<Bell className="w-5 h-5" />} label={language === 'es' ? 'Notificaciones' : 'Notifications'} badge={5} onClick={() => navigate('/alerts-center')} />
              
              {/* User Profile */}
              {/* User Profile or Login Button */}
              {user ? (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm text-gray-300 font-medium">{user.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/auth')}
                  >
                    {language === 'es' ? 'Iniciar Sesión' : 'Login'}
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                    onClick={() => navigate('/auth?tab=register')}
                  >
                    {language === 'es' ? 'Registrarse' : 'Sign Up'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile & Connections */}
          <aside className="lg:col-span-3 space-y-4">
            <MarketplaceSidebar />
          </aside>

          {/* Center Feed */}
          <main className="lg:col-span-6 space-y-4">
            {/* Post Creation Box */}
            <div className="bg-[#0D2137] border border-cyan-900/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <button
                  onClick={() => setShowPostForm(true)}
                  className="flex-1 text-left px-4 py-3 bg-[#0A1929] border border-gray-700 rounded-full text-gray-400 hover:bg-[#0D2137] transition-colors"
                >
                  {language === 'es' ? '¿Qué oportunidad comercial querés compartir?' : 'What trade opportunity do you want to share?'}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => setShowPostForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Agregar HS Code' : 'Add HS Code'}
                </Button>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => setShowPostForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Documentos' : 'Documents'}
                </Button>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => setShowPostForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Contacto' : 'Contact'}
                </Button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                  {language === 'es' ? 'Cargando oportunidades...' : 'Loading opportunities...'}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  {language === 'es' ? 'No hay publicaciones aún' : 'No posts yet'}
                </div>
              ) : (
                filteredPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="lg:col-span-3 space-y-4">
            {/* World Trade Pulse Widget */}
            <WorldTradePulseWidget />
            
            {/* Events Widget */}
            <EventsWidget />
            
            {/* Suggested Groups */}
            <SuggestedGroupsWidget />
          </aside>
        </div>
      </div>

      {/* Post Form Dialog */}
      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="bg-[#0D2137] border-cyan-900/30 text-white sm:max-w-[600px]">
          <PostForm onClose={() => setShowPostForm(false)} onSubmit={handlePostSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button 
      onClick={() => {
        console.log(`Navigating to ${label}`);
        onClick?.();
      }}
      className={`hidden md:flex flex-col items-center gap-1 px-3 py-2 rounded transition-colors relative ${
        active ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
      }`}>
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}

// World Trade Pulse Widget
function WorldTradePulseWidget() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  const { data: news = [] } = useQuery({
    queryKey: ['/api/news', 'all'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/news?category=all');
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        return data.slice(0, 3); // Only show 3 latest
      } catch (error) {
        console.error('News fetch error:', error);
        // Fallback to mock data
        return [
          { id: '1', title: 'Nueva regulación aduanera en UE', category: 'regulacion', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { id: '2', title: 'Tratado comercial China-LATAM', category: 'tratado', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
          { id: '3', title: 'Alerta: Sanciones Rusia', category: 'alerta', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ];
      }
    }
  });

  const getTimeAgo = (date: Date) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return language === 'es' ? 'Hace menos de 1h' : 'Less than 1h ago';
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      regulacion: { es: 'Regulación', en: 'Regulation' },
      tratado: { es: 'Tratado', en: 'Treaty' },
      alerta: { es: 'Alerta', en: 'Alert' },
      mercado: { es: 'Mercado', en: 'Market' },
      logistica: { es: 'Logística', en: 'Logistics' }
    };
    return labels[category]?.[language] || category;
  };
  
  return (
    <div className="bg-[#0D2137] border border-cyan-900/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="text-cyan-400">📰</span>
          World Trade Pulse
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-cyan-400 hover:text-cyan-300 text-xs h-auto p-0"
          onClick={() => navigate('/news')}
        >
          {language === 'es' ? 'Ver todo' : 'See all'}
        </Button>
      </div>
      <div className="space-y-3">
        {news.map((item: any) => (
          <div 
            key={item.id} 
            className="pb-3 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
            onClick={() => navigate('/news')}
          >
            <p className="text-white text-sm font-medium line-clamp-2">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-cyan-400">{getCategoryLabel(item.category)}</span>
              <span className="text-xs text-gray-500">• {getTimeAgo(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Events Widget
function EventsWidget() {
  const { language } = useLanguage();
  
  return (
    <div className="bg-[#0D2137] border border-cyan-900/30 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4">
        {language === 'es' ? 'Eventos de Comercio' : 'Trade Events'}
      </h3>
      <div className="space-y-3">
        {[
          { name: 'Expo Agro 2025', date: 'Mar 15', location: 'Buenos Aires' },
          { name: 'Webinar: Exportar a China', date: 'Mar 20', location: 'Online' }
        ].map((event, i) => (
          <div key={i} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <p className="text-white text-sm font-medium">{event.name}</p>
            <p className="text-xs text-gray-400 mt-1">{event.date} • {event.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Suggested Groups Widget
function SuggestedGroupsWidget() {
  const { language } = useLanguage();
  
  return (
    <div className="bg-[#0D2137] border border-cyan-900/30 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4">
        {language === 'es' ? 'Grupos Sugeridos' : 'Suggested Groups'}
      </h3>
      <div className="space-y-3">
        {[
          { name: 'Exportadores de Soya LATAM', members: '12k' },
          { name: 'Importadores UE', members: '8.5k' },
          { name: 'Logística Internacional', members: '5k' }
        ].map((group, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {group.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{group.name}</p>
                <p className="text-xs text-gray-400">{group.members} {language === 'es' ? 'miembros' : 'members'}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
