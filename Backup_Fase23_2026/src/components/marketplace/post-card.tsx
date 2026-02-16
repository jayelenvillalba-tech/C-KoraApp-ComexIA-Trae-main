import { MessageCircle, TrendingUp, MapPin, Calendar, Package, CheckCircle, DollarSign, Ship, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import CostAnalysisModal from "./cost-analysis-modal";
import AuthGuardModal from "@/components/auth/auth-guard-modal";
import { useUser } from "@/context/user-context";
import { useMarketplace } from "@/context/marketplace-context";
import ReputationBadge from "@/components/ui/reputation-badge";
import { getRequiredDocuments } from "@shared/documents-data";
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

  // Fetch trade preferences if origin and destination are available
  useEffect(() => {
    if (post.originCountry && post.destinationCountry && post.hsCode) {
      fetch(`/api/marketplace/tariff-preferences?hsCode=${post.hsCode}&originCountry=${post.originCountry}&destinationCountry=${post.destinationCountry}`)
        .then(res => res.json())
        .then(data => setTradePrefs(data.preferences || []))
        .catch(err => console.error('Error fetching trade preferences:', err));
    }
  }, [post.hsCode, post.originCountry, post.destinationCountry]);

  // Calculate required documents count
  const requiredDocsCount = useMemo(() => {
    if (!post.hsCode) return 0;
    const docs = getRequiredDocuments({
      hsCode: post.hsCode,
      originCountry: post.originCountry,
      destinationCountry: post.destinationCountry,
      incoterm: post.incoterm,
      direction: post.type === 'buy' ? 'import' : 'export'
    });
    return docs.filter(d => d.mandatory).length;
  }, [post.hsCode, post.originCountry, post.destinationCountry, post.incoterm, post.type]);

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
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {post.company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold">
                  {post.company.name}
                </h3>
                {isVerified && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span>{post.user.name}</span>
                {post.user.verified && (
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                )}
                <span>·</span>
                <span>{post.user.role}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {getTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={post.type === "buy" 
                ? "bg-green-500/20 text-green-300 border-green-500/30" 
                : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              {post.type === "buy" 
                ? (language === 'es' ? '🟢 BUSCO' : '🟢 BUYING')
                : (language === 'es' ? '🔴 VENDO' : '🔴 SELLING')
              }
            </Badge>
            
            {/* Phase 22: Document Count Badge */}
            {requiredDocsCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {requiredDocsCount} {language === 'es' ? 'docs' : 'docs'}
              </Badge>
            )}
          </div>
        </div>

        {/* Phase 21: Large Title */}
        <h2 className="text-white text-2xl font-bold mb-3">
          {post.productName} HS {post.hsCode}
        </h2>

        {/* Phase 21: Photo Carousel */}
        {post.photos && post.photos.length > 0 && (
          <div className="mb-4">
            <Carousel className="w-full">
              <CarouselContent>
                {post.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <img 
                      src={photo} 
                      alt={`${post.productName} ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {post.photos.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          </div>
        )}

        {/* Phase 21: Long Description (Alibaba-style) */}
        {post.descriptionLong && (
          <p className="text-gray-300 text-base leading-relaxed mb-4">
            {post.descriptionLong}
          </p>
        )}

        {/* Phase 21: Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Package className="w-3 h-3" />
              {language === 'es' ? 'Cantidad' : 'Quantity'}
            </p>
            <p className="text-white font-bold text-sm">{post.quantity}</p>
            {post.moq && (
              <p className="text-xs text-gray-400 mt-1">MOQ: {post.moq}</p>
            )}
          </div>
          
          {post.incoterm && (
            <div className="bg-purple-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Ship className="w-3 h-3" />
                Incoterm
              </p>
              <p className="text-white font-bold text-sm">{post.incoterm}</p>
            </div>
          )}
          
          {post.price && (
            <div className="bg-green-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {language === 'es' ? 'Precio' : 'Price'}
              </p>
              <p className="text-white font-bold text-sm">
                ${post.price} {post.currency || 'USD'}
              </p>
            </div>
          )}
          
          {post.originCountry && (
            <div className="bg-cyan-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {language === 'es' ? 'Origen' : 'Origin'}
              </p>
              <p className="text-white font-bold text-sm">
                {getCountryFlag(post.originCountry)} {post.originCountry}
              </p>
            </div>
          )}
        </div>

        {/* Phase 21: Trade Preference Badges */}
        {tradePrefs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tradePrefs.map((pref, index) => (
              pref.tariffRate === 0 && (
                <Badge 
                  key={index}
                  className="bg-green-500/20 text-green-300 border-green-500/30"
                >
                  ✓ {pref.agreement} 0% {language === 'es' ? 'Arancel' : 'Tariff'}
                  {pref.regionalContentRequired && ` (${pref.regionalContentRequired}% regional)`}
                </Badge>
              )
            ))}
          </div>
        )}

        {/* Certifications */}
        {post.certifications && post.certifications.length > 0 && (
          <div className="mb-4">
            <p className="text-slate-400 text-xs mb-2">
              {language === 'es' ? 'Certificaciones:' : 'Certifications:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {post.certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  ✓ {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button 
            onClick={handleContact}
            disabled={isCreatingChat}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isCreatingChat 
              ? (language === 'es' ? 'Abriendo...' : 'Opening...')
              : (language === 'es' ? 'Contactar' : 'Contact')
            }
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCostModal(true)}
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Ver Costos' : 'View Costs'}
          </Button>
        </div>
      </CardContent>

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
