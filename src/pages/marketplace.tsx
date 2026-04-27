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
import SmartSidebar, { MarketplaceFilters } from '@/components/marketplace/smart-sidebar';
import PostForm from '@/components/marketplace/post-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMarketplace } from '@/context/marketplace-context';
import Header from '@/components/header';

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
  const { filters, setFilters } = useMarketplace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.type) params.append('type', filters.type);
    if (filters.hsCode) params.append('hsCode', filters.hsCode);
    if (filters.country) params.append('country', filters.country);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.incoterm) params.append('incoterm', filters.incoterm);
    if (filters.ecological) params.append('ecological', 'true');
    return params.toString();
  };

  // Fetch posts from API
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ['/api/marketplace/posts', filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const url = `/api/marketplace/posts${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      
      // Some API versions wrap arrays in { data: [] } or { posts: [] }
      if (data && Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && Array.isArray(data.posts)) return data.posts;
      
      // If none match, return empty array to prevent filter crashes
      return [];
    }
  });

  const posts = Array.isArray(rawData) ? rawData : [];

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
    <div className="min-h-screen bg-[#0a141d] relative pt-[var(--ds-offset-top)]">
      <Header />

      {/* Subtle void background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--ds-cyan)]/5 blur-[120px] pointer-events-none rounded-[100%]" />

      {/* 3-Column Layout */}
      <div className="max-w-[var(--ds-content-max)] mx-auto px-4 py-[var(--ds-space-6)] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--ds-space-6)]">
          {/* Left Sidebar - Smart Filters */}
          <aside className="lg:col-span-3 space-y-[var(--ds-space-4)]">
            <SmartSidebar onFilterChange={setFilters} currentFilters={filters} />
          </aside>

          {/* Center Feed */}
          <main className="lg:col-span-6 space-y-[var(--ds-space-4)]">
            {/* Central Search & Post Creation Box */}
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--ds-cyan)]/30 to-blue-600/30 rounded-[var(--ds-radius-lg)] blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative glass bg-[#0a1d2e]/90 border border-white/10 rounded-[var(--ds-radius-lg)] p-5 shadow-[0_0_30px_rgba(0,212,240,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--ds-cyan)] to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(0,212,240,0.4)] border border-white/20">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="flex-1 text-left px-5 py-4 bg-black/50 border border-transparent rounded-2xl text-gray-400 hover:text-white hover:border-[var(--ds-cyan)]/50 transition-all focus:outline-none"
                    style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '16px', letterSpacing: '0.02em' }}
                  >
                    {language === 'es' ? 'Buscador Central de Oportunidades...' : 'Central Opportunity Search...'}
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-[var(--ds-space-4)] pt-[var(--ds-space-4)] border-t border-white/5">
                  <Button variant="ghost" size="sm" className="text-[var(--ds-cyan)] hover:text-[var(--ds-cyan)] hover:bg-[var(--ds-cyan)]/10" onClick={() => setShowPostForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Publicar Demanda' : 'Post Demand'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/5" onClick={() => setShowPostForm(true)}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Ofrecer Capacidad' : 'Offer Capacity'}
                  </Button>
                </div>
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
        const response = await fetch('/api/news?limit=3');
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        return data.news || data.data || [];
      } catch (error) {
        console.error('News fetch error:', error);
        return [];
      }
    }
  });

  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return language === 'es' ? 'Hace menos de 1h' : 'Less than 1h ago';
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      regulation: { es: 'Regulación', en: 'Regulation' },
      treaty: { es: 'Tratado', en: 'Treaty' },
      warning: { es: 'Alerta', en: 'Alert' },
      market: { es: 'Mercado', en: 'Market' },
      info: { es: 'Info', en: 'Info' }
    };
    return labels[category]?.[language] || category.toUpperCase();
  };
  
  return (
    <div className="glass bg-[#0a1d2e]/80 border border-white/5 rounded-2xl p-5 shadow-[var(--ds-shadow-raised)]">
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
            <p className="text-white text-sm font-medium line-clamp-2">{item.title_en || item.title_original}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-cyan-400">{getCategoryLabel(item.alert_type || 'info')}</span>
              <span className="text-xs text-gray-500">• {getTimeAgo(item.published_at)}</span>
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
    <div className="glass bg-[#0a1d2e]/80 border border-white/5 rounded-2xl p-5 shadow-[var(--ds-shadow-raised)]">
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
    <div className="glass bg-[#0a1d2e]/80 border border-white/5 rounded-2xl p-5 shadow-[var(--ds-shadow-raised)]">
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
                <p className="text-xs text-cyan-400" style={{ fontFamily: 'Inter', fontWeight: 900 }}>{group.members} {language === 'es' ? 'miembros' : 'members'}</p>
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
