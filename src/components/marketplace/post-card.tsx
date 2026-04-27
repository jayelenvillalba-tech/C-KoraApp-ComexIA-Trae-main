import { MessageCircle, TrendingUp, MapPin, Calendar, Package, CheckCircle, DollarSign, Ship, FileText, Handshake } from "lucide-react";
import { Card, Badge, Button, DataLabel } from "@/design-system/components";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import CostAnalysisModal from "./cost-analysis-modal";
import AuthGuardModal from "@/components/auth/auth-guard-modal";
import { useUser } from "@/context/user-context";
import { useMarketplace } from "@/context/marketplace-context";
import ComplianceBadge from "@/components/marketplace/compliance-badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Post {
  id: string;
  type: "buy" | "sell";
  company: {
    id: string;
    name: string;
    verified: boolean;
    country: string;
    verificationLevel?: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
    verified: boolean;
  };
  hsCode: string;
  productName: string;
  quantity: string;
  originCountry?: string;
  destinationCountry?: string;
  deadline?: number;
  requirements?: string[];
  certifications?: string[];
  createdAt: Date;
  status: "active" | "closed";
  // Phase 21 fields
  descriptionLong?: string;
  photos?: string[];
  moq?: string;
  price?: number;
  currency?: string;
  incoterm?: string;
  tradePreferences?: any[];
  regionalContentPercentage?: number;
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { language } = useLanguage();
  const { user } = useUser();
  const { setSelectedPost } = useMarketplace();
  const [, navigate] = useLocation();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tradePrefs, setTradePrefs] = useState<any[]>([]);

  // Fetch live trade agreements from the agreements API
  useEffect(() => {
    if (post.originCountry && post.destinationCountry) {
      fetch(`/api/agreements/between?origin=${post.originCountry}&destination=${post.destinationCountry}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.agreements) {
            // Map to the structure expected by the badge renderer
            setTradePrefs(data.agreements.map((a: any) => ({
              agreement: a.code,
              agreementName: language === 'es' ? a.name_es : a.name_en,
              status: a.status,
              tariffRate: a.status === 'active' ? 0 : null
            })));
          }
        })
        .catch(() => {});
    }
  }, [post.originCountry, post.destinationCountry, language]);

  // Static docs count (simplified — no longer depends on deleted shared module)
  const requiredDocsCount = useMemo(() => {
    if (!post.hsCode || !post.originCountry || !post.destinationCountry) return 0;
    return 5;
  }, [post.hsCode, post.originCountry, post.destinationCountry]);

  // Phase 33: Price vs market analysis
  const [priceAnalysis, setPriceAnalysis] = useState<any>(null);
  useEffect(() => {
    if (post.price && post.hsCode) {
      fetch(`/api/market/price-analysis?hsCode=${post.hsCode}&price=${post.price}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.success) setPriceAnalysis(data); })
        .catch(() => {});
    }
  }, [post.price, post.hsCode]);

  const handleContact = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedPost(post);
    const demoConvId = `marketplace-${post.id}`;
    navigate(`/chat/${demoConvId}`);
  };

  const getTimeAgo = (date: Date) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return language === 'es' ? 'Hace menos de 1 hora' : 'Less than 1 hour ago';
    } else if (hours < 24) {
      return language === 'es' ? `Hace ${hours} hora${hours > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return language === 'es' ? `Hace ${days} día${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'AR': '🇦🇷', 'BR': '🇧🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'UY': '🇺🇾',
      'US': '🇺🇸', 'MX': '🇲🇽', 'CN': '🇨🇳', 'DE': '🇩🇪', 'ES': '🇪🇸',
      'PY': '🇵🇾', 'EU': '🇪🇺', 'IN': '🇮🇳'
    };
    return flags[countryCode] || '🌍';
  };

  // Check if company is verified
  const isVerified = post.company.verificationLevel === 'verified' || post.company.verificationLevel === 'premium';

  return (
    <Card 
      variant="default" 
      className={`mb-4 relative overflow-hidden transition-all duration-300 ${
        post.type === 'buy' ? 'hover:shadow-[0_0_30px_rgba(0,212,240,0.15)]' : 'hover:shadow-[0_0_30px_rgba(255,140,0,0.15)]'
      } hover:scale-[1.02] glass border border-white/5`}
      style={{
        boxShadow: priceAnalysis && (priceAnalysis.assessment === 'excellent' || priceAnalysis.assessment === 'good') 
          ? '0 0 20px rgba(105,246,185,0.15), inset 0 0 10px rgba(105,246,185,0.05)' // radiance-green
          : post.type === 'sell' && post.hsCode?.startsWith('02') 
          ? '0 0 20px rgba(255,140,0,0.1), inset 0 0 10px rgba(255,140,0,0.05)' // Simulated maritime/amber risk
          : 'var(--ds-shadow-raised)',
      }}
    >
      {/* Background ambient glow based on type */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none ${post.type === 'buy' ? 'bg-[var(--ds-cyan)]' : 'bg-[var(--ds-amber)]'}`} />
      {/* Header */}
      <div className="flex items-start justify-between mb-[var(--ds-space-4)]">
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-[var(--ds-radius-full)] bg-black/40 border border-white/10 flex items-center justify-center font-display text-[var(--ds-text-xl)] text-[var(--ds-text-primary)] font-bold shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
            {post.company.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-body text-[var(--ds-text-primary)] text-[var(--ds-text-md)] font-bold truncate max-w-[200px] md:max-w-[300px]">
                {post.company.name}
              </h3>
              {isVerified && (
                <Badge variant="verified" text="Verified" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[var(--ds-text-sm)] text-[var(--ds-text-secondary)]">
              <span>{post.user.name}</span>
              {post.user.verified && (
                <CheckCircle className="w-3 h-3 text-[var(--ds-cyan)]" />
              )}
              <span>·</span>
              <span className="truncate max-w-[120px]">{post.user.role}</span>
            </div>
            <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] mt-1">
              {getTimeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={post.type === "buy" ? "buy" : "sell"}
            text={post.type === "buy" ? (language === 'es' ? 'BUSCO' : 'BUYING') : (language === 'es' ? 'VENDO' : 'SELLING')}
          />
          
          {/* Phase 22: Document Count Badge */}
          {requiredDocsCount > 0 && (
            <Badge variant="neutral">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {requiredDocsCount} {language === 'es' ? 'docs' : 'docs'}
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Compliance Badge — AI document gap analysis */}
      {post.destinationCountry && post.hsCode && (
        <div className="mb-4">
          <ComplianceBadge
            destinationCountry={post.destinationCountry}
            ncmCode={post.hsCode}
            incoterm={post.incoterm || 'FOB'}
            direction={post.type === 'buy' ? 'import' : 'export'}
            userDocIds={[]} 
          />
        </div>
      )}

      {/* Main Title */}
      <h2 className="font-display text-[var(--ds-text-xl)] md:text-[var(--ds-text-2xl)] font-bold text-[var(--ds-text-primary)] mb-[var(--ds-space-3)]">
        {post.productName} <span className="text-[var(--ds-text-tertiary)] font-data text-[var(--ds-text-lg)]">HS {post.hsCode}</span>
      </h2>

      {/* Phase 21: Photo Carousel */}
      {post.photos && post.photos.length > 0 && (
        <div className="mb-[var(--ds-space-4)]">
          <Carousel className="w-full">
            <CarouselContent>
              {post.photos.map((photo, index) => (
                <CarouselItem key={index}>
                  <img 
                    src={photo} 
                    alt={`${post.productName} ${index + 1}`}
                    className="w-full h-48 md:h-64 object-cover rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)]"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {post.photos.length > 1 && (
              <>
                <CarouselPrevious className="left-2 bg-[var(--ds-bg-surface)] border-[var(--ds-border-default)]" />
                <CarouselNext className="right-2 bg-[var(--ds-bg-surface)] border-[var(--ds-border-default)]" />
              </>
            )}
          </Carousel>
        </div>
      )}

      {/* Long Description */}
      {post.descriptionLong && (
        <p className="font-body text-[var(--ds-text-base)] text-[var(--ds-text-secondary)] leading-relaxed mb-[var(--ds-space-4)] line-clamp-3">
          {post.descriptionLong}
        </p>
      )}

      {/* Specs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-[var(--ds-space-4)]">
        <div className="bg-black/30 p-3 rounded-[var(--ds-radius-md)] border border-white/5 backdrop-blur-[2px]">
          <p className="font-data text-[8px] text-[var(--ds-text-tertiary)] tracking-[0.1em] uppercase flex items-center gap-1 mb-1">
            <Package className="w-3 h-3 text-[var(--ds-cyan)]" />
            {language === 'es' ? 'CANTIDAD' : 'QUANTITY'}
          </p>
          <p className="font-body font-semibold text-[var(--ds-text-primary)]">{post.quantity}</p>
          {post.moq && (
            <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-muted)] mt-1">MOQ: {post.moq}</p>
          )}
        </div>
        
        {post.incoterm && (
          <div className="bg-black/30 p-3 rounded-[var(--ds-radius-md)] border border-white/5 backdrop-blur-[2px]">
            <p className="font-data text-[8px] text-[var(--ds-text-tertiary)] tracking-[0.1em] uppercase flex items-center gap-1 mb-1">
              <Ship className="w-3 h-3 text-[var(--ds-cyan)]" />
              INCOTERM
            </p>
            <p className="font-data font-bold text-[10px] text-[var(--ds-text-primary)] tracking-widest">{post.incoterm}</p>
          </div>
        )}
        
        {post.price && (
          <div className="bg-black/30 p-3 rounded-[var(--ds-radius-md)] border border-white/5 backdrop-blur-[2px] col-span-2 md:col-span-1 relative overflow-hidden">
            {priceAnalysis && (priceAnalysis.assessment === 'excellent' || priceAnalysis.assessment === 'good') && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
            )}
            <p className="font-data text-[8px] text-[var(--ds-text-tertiary)] tracking-[0.1em] uppercase flex items-center gap-1 mb-1 relative border-z-10">
              <DollarSign className="w-3 h-3 text-[var(--ds-green)]" />
              {language === 'es' ? 'PRECIO' : 'PRICE'}
            </p>
            <p className="font-body font-semibold text-[var(--ds-green)] relative z-10" style={{ textShadow: '0 0 10px rgba(105,246,185,0.3)' }}>
              ${post.price} <span className="text-[var(--ds-text-secondary)] text-xs">{post.currency || 'USD'}/ton</span>
            </p>
            {priceAnalysis && (
              <p className={`font-data text-[9px] mt-1 font-bold relative z-10 ${
                priceAnalysis.assessment === 'excellent' || priceAnalysis.assessment === 'good'
                  ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'
                  : priceAnalysis.assessment === 'fair'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}>
                {priceAnalysis.label}
                {' '}
                <span className="font-normal text-[var(--ds-text-tertiary)] opacity-60">— {priceAnalysis.source}</span>
              </p>
            )}
          </div>
        )}
        
        {post.originCountry && (
          <div className="bg-black/30 p-3 rounded-[var(--ds-radius-md)] border border-white/5 backdrop-blur-[2px]">
            <p className="font-data text-[8px] text-[var(--ds-text-tertiary)] tracking-[0.1em] uppercase flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[var(--ds-amber)]" />
              {language === 'es' ? 'ORIGEN' : 'ORIGIN'}
            </p>
            <p className="font-body font-semibold text-[var(--ds-text-primary)]">
              {getCountryFlag(post.originCountry)} {post.originCountry}
            </p>
          </div>
        )}
      </div>

      {/* Trade Agreement Badges — live from /api/agreements/between */}
      {tradePrefs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-[var(--ds-space-4)]">
          {tradePrefs.map((pref: any, index: number) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1.5 font-data text-[9px] font-bold px-2 py-0.5 rounded-[2px] uppercase tracking-[0.5px] border ${
                pref.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={pref.agreementName}
            >
              <Handshake className="w-2.5 h-2.5" />
              {pref.agreement}
              {pref.status === 'active' ? ` · 0%` : ` · Pendiente`}
            </span>
          ))}
        </div>
      )}

      {/* Certifications */}
      {post.certifications && post.certifications.length > 0 && (
        <div className="mb-[var(--ds-space-4)]">
          <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] tracking-[var(--ds-tracking-data)] uppercase mb-2">
            {language === 'es' ? 'CERTIFICACIONES' : 'CERTIFICATIONS'}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.certifications.map((cert, index) => (
              <Badge key={index} variant="institutional" text={cert} />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-[var(--ds-space-4)] border-t border-[var(--ds-border-subtle)]">
        <Button 
          variant="primary"
          onClick={handleContact}
          disabled={isCreatingChat}
          className="flex-1"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {isCreatingChat 
            ? (language === 'es' ? 'Abriendo...' : 'Opening...')
            : (language === 'es' ? 'Contactar' : 'Contact')
          }
        </Button>
        <Button 
          variant="ghost"
          onClick={() => setShowCostModal(true)}
          className="flex-1 border border-[var(--ds-border-default)] hover:border-[var(--ds-border-strong)]"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {language === 'es' ? 'Ver Costos' : 'View Costs'}
        </Button>
      </div>

      {/* Cost Analysis Modal */}
      <CostAnalysisModal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        post={post}
      />
      <AuthGuardModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        title={language === 'es' ? 'Contactar Empresa' : 'Contact Company'}
        description={language === 'es' 
          ? 'Inicia sesión para chatear directamente con este proveedor.' 
          : 'Login to chat directly with this supplier.'}
      />
    </Card>
  );
}
