import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  History, 
  Star, 
  Settings, 
  LogOut, 
  Check, 
  ShieldCheck, 
  Download,
  Search,
  MessageSquare,
  Store,
  Calculator,
  UserPlus
} from "lucide-react";
import FilteredNavbar from "@/components/filtered-navbar";
import Footer from "@/components/footer";

export default function ProfilePage() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<'personal' | 'corporate'>('personal');
  const isCorporate = viewMode === 'corporate';
  const { toast } = useToast();

  // Mock User Data
  const { user: contextUser } = useUser();

  // Combine context user with mock details for display if missing
  const user = {
    name: contextUser?.name || "Usuario",
    email: contextUser?.email || "usuario@ejemplo.com",
    role: contextUser?.role || "Usuario",
    phone: (contextUser as any)?.phone || "+54 9 11 1234-5678",
    location: (contextUser as any)?.location || "Buenos Aires, Argentina",
    company: contextUser?.company || "Sin Empresa",
    plan: "free",
    members: 1,
    joinDate: "Dic 2025"
  };

  const [formData, setFormData] = useState({
    email: user.email,
    phone: user.phone,
    location: user.location
  });
  const [isSaving, setIsSaving] = useState(false);
  const [realActivity, setRealActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch live profile data from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setFormData({
            email: data.user.email || user.email,
            phone: data.user.phone || user.phone,
            location: data.user.location || user.location,
          });
        }
      })
      .catch(() => { /* use context defaults */ });

    // Fetch real deal history
    const userId = (contextUser as any)?.id || (contextUser as any)?.userId;
    if (userId) {
      const token = localStorage.getItem('token');
      fetch(`/api/deals/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : { success: false, data: [] })
        .then(d => {
          if (d.success && Array.isArray(d.data)) {
            setRealActivity(d.data.slice(0, 5));
          }
        })
        .catch(() => {})
        .finally(() => setActivityLoading(false));
    } else {
      setActivityLoading(false);
    }
  }, []);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: formData.email, phone: formData.phone, location: formData.location })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo actualizar el perfil", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Build activity list: real deals + fallback static if empty
  const activityItems = realActivity.length > 0
    ? realActivity.map(deal => ({
        type: deal.status === 'closed' ? 'deal cerrado' : deal.status === 'negotiation' ? 'negociación' : 'contacto',
        title: `${deal.product?.toUpperCase() || 'Producto'} · ${deal.origin || '?'} → ${deal.destination || '?'}`,
        date: deal.updated_at
          ? new Date(deal.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
          : 'Reciente',
        icon: <MessageSquare className="w-4 h-4 text-cyan-500" />,
        link: `/chat/${deal.id}`
      }))
    : [
        { type: 'search', title: language === 'es' ? 'Comenzá tu primera operación' : 'Start your first operation', date: '', icon: <Search className="w-4 h-4 text-blue-500" />, link: '/marketplace' }
      ];

  const plans = [
    {
      id: "pyme",
      name: language === 'es' ? 'Plan Pyme' : 'SME Plan',
      price: '$49',
      period: language === 'es' ? '/mes' : '/mo',
      description: language === 'es' ? 'Para pequeñas empresas en crecimiento' : 'For growing small businesses',
      features: [
        language === 'es' ? 'Hasta 5 usuarios' : 'Up to 5 users',
        language === 'es' ? 'Verificación de empresa básica' : 'Basic company verification',
        language === 'es' ? 'Acceso a contactos limitado' : 'Limited contact access',
        language === 'es' ? 'Búsquedas por HS Code ilimitadas' : 'Unlimited HS Code searches',
      ],
      icon: <Building2 className="w-6 h-6 text-blue-400" />,
      color: 'blue',
      highlight: false
    },
    {
      id: "corporate",
      name: language === 'es' ? 'Plan Corporativo' : 'Corporate Plan',
      price: '$199',
      period: language === 'es' ? '/mes' : '/mo',
      description: language === 'es' ? 'Solución completa para multinacionales' : 'Complete solution for multinationals',
      features: [
        language === 'es' ? 'Usuarios ilimitados (+100)' : 'Unlimited users (+100)',
        language === 'es' ? 'Verificación de empleados completa' : 'Full employee verification',
        language === 'es' ? 'Acceso total a contactos directos' : 'Full access to direct contacts',
        language === 'es' ? 'Marketplace B2B Premium' : 'Premium B2B Marketplace',
        language === 'es' ? 'Soporte prioritario 24/7' : '24/7 Priority support',
      ],
      icon: <ShieldCheck className="w-6 h-6 text-yellow-400" />,
      color: 'yellow',
      highlight: true
    }
  ];

  // Corporate Profile Data
  const corporateProfile = {
    name: "Che.Comex",
    tagline: "Ecosistema Integral de Comercio Internacional con IA & Blockchain",
    bio: "Transformamos el comercio exterior para PyMEs en Latinoamérica. Somos una plataforma 'all-in-one' que integra inteligencia artificial generativa y trazabilidad blockchain para simplificar desde la búsqueda de códigos HS hasta el cierre de acuerdos comerciales.",
    location: "Buenos Aires, Argentina (HQ)",
    verified: true,
    experts: [
      { name: "J. Ayelén Villalba", role: "CEO", link: "#" },
      { name: "Agente IA Che.Comex", role: "Soporte Técnico & IA", link: "#" },
      { name: "Dpto. Operaciones", role: "Compliance & Aduana", link: "#" }
    ]
  };

  // Personal Profile Data (Ayelén)
  const personalProfile = {
    name: "J. Ayelén Villalba",
    role: "CEO & Founder de Che.Comex",
    bio: "Apasionada por democratizar el comercio internacional a través de la tecnología. Lidero soluciones disruptivas para exportar de forma segura y eficiente.",
    tags: ["#Comex", "#IAGenerativa", "#Fintech", "#Blockchain", "#Liderazgo"],
    location: "Buenos Aires, Argentina"
  };

  // Determine current display data
  const displayProfile = isCorporate ? corporateProfile : personalProfile;

  return (
    <div className="min-h-screen bg-[#010609] flex flex-col font-body relative">
      {/* Deep grid background effect */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,240,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black 100%)'
        }} 
      />
      <FilteredNavbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* View Toggle - Pill Style */}
          <div className="flex justify-center mb-8">
             <div className="glass p-1 rounded-full border border-white/5 inline-flex shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-8 py-2.5 rounded-full text-[13px] font-bold transition-all uppercase tracking-widest ${
                    !isCorporate 
                      ? 'bg-[#0a1d2e] text-white shadow-[inset_0_0_15px_rgba(0,212,240,0.2)] border border-[var(--ds-cyan)]/30' 
                      : 'text-slate-500 hover:text-white border border-transparent'
                  }`}
                  style={{ fontFamily: 'Inter' }}
                >
                  {language === 'es' ? 'Personal' : 'Personal'}
                </button>
                <button
                  onClick={() => setViewMode('corporate')}
                  className={`px-8 py-2.5 rounded-full text-[13px] font-bold transition-all uppercase tracking-widest ${
                    isCorporate 
                      ? 'bg-[#0a1d2e] text-white shadow-[inset_0_0_15px_rgba(0,212,240,0.2)] border border-[var(--ds-cyan)]/30' 
                      : 'text-slate-500 hover:text-white border border-transparent'
                  }`}
                  style={{ fontFamily: 'Inter' }}
                >
                   {language === 'es' ? 'Corporate' : 'Corporate'}
                </button>
             </div>
          </div>
          
          {/* Header Profile - Asymmetric Vault */}
          <div className={`glass rounded-2xl md:rounded-tl-[3rem] md:rounded-br-[3rem] p-8 md:p-10 mb-8 relative overflow-hidden border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${isCorporate && (displayProfile as any).verified ? 'radiance-cyan' : ''}`}>
             
             {/* Gradient Aura for Verified */}
             {isCorporate && (displayProfile as any).verified && (
               <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none bg-[var(--ds-cyan)]/10" />
             )}

             <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10 text-center md:text-left">
               {/* Avatar / Logo */}
               <div className="flex-shrink-0 relative">
                  {(isCorporate && (displayProfile as any).verified) && (
                    <div className="absolute -inset-2 bg-[var(--ds-cyan)]/20 rounded-full blur-md animate-pulse" />
                  )}
                  <Avatar className={`w-36 h-36 border-2 relative z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isCorporate ? 'border-[var(--ds-cyan)]/50 bg-[#0a1d2e]' : 'border-white/10'}`}>
                    <AvatarImage src={isCorporate ? "/logo.png" : (user.email.includes('demo') ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" : "/placeholder-user.jpg")} className={isCorporate ? "object-contain p-2 bg-white" : ""} />
                    <AvatarFallback className="bg-cyan-900 text-cyan-200 text-3xl font-bold">
                      {isCorporate ? "CH" : user.name.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
               </div>

               {/* Info */}
               <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">{displayProfile.name}</h1>
                    {isCorporate && (
                       <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 gap-1 pl-1 pr-2">
                          <Check className="w-3 h-3 bg-blue-500 rounded-full text-[#0D2137] p-0.5" />
                          {language === 'es' ? 'Verificado Blockchain' : 'Blockchain Verified'}
                       </Badge>
                    )}
                  </div>

                  <p className={`text-lg font-medium mb-4 ${isCorporate ? 'text-blue-200' : 'text-cyan-200'}`}>
                    {isCorporate ? (displayProfile as any).tagline : (displayProfile as any).role}
                  </p>

                  <p className="text-slate-300 leading-relaxed max-w-2xl mb-6">
                    "{displayProfile.bio}"
                  </p>

                  {!isCorporate && (
                    <div className="flex flex-wrap gap-2 mb-6">
                       {(displayProfile as any).tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-900/10">
                            {tag}
                          </Badge>
                       ))}
                    </div>
                  )}

                  {isCorporate && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        {language === 'es' ? '🤝 Nuestro Equipo de Expertos' : '🤝 Our Expert Team'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(displayProfile as any).experts.map((exp: any, i: number) => (
                           <div key={i} className="bg-white/5 rounded-lg p-2 flex items-center gap-3 border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer text-left">
                              <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-200">
                                {exp.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{exp.role}</p>
                                <p className="text-[10px] text-slate-400 truncate">{exp.name}</p>
                              </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {isCorporate ? (
                      <>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
                           <Store className="w-4 h-4 mr-2" />
                           {language === 'es' ? 'Ver Marketplace' : 'View Marketplace'}
                        </Button>
                        <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-900/20">
                           <Calculator className="w-4 h-4 mr-2" />
                           {language === 'es' ? 'Simular Costos' : 'Simulate Costs'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/20">
                           <MessageSquare className="w-4 h-4 mr-2" />
                           {language === 'es' ? 'Mensaje Directo' : 'Direct Message'}
                        </Button>
                        <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20">
                           <UserPlus className="w-4 h-4 mr-2" />
                           {language === 'es' ? 'Conectar' : 'Connect'}
                        </Button>
                      </>
                    )}
                  </div>
               </div>
             </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="glass p-1 rounded-full border border-white/5 w-full md:w-auto inline-flex h-auto shadow-[0_4px_15px_rgba(0,0,0,0.3)] mx-auto md:mx-0 flex-wrap justify-center">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'billing', label: language === 'es' ? 'Planes' : 'Billing' },
                { id: 'history', label: language === 'es' ? 'Historial' : 'History' },
                { id: 'settings', label: language === 'es' ? 'Terminal Settings' : 'Terminal Settings' }
              ].map(t => (
                <TabsTrigger 
                  key={t.id} 
                  value={t.id} 
                  className="data-[state=active]:bg-[#0a1d2e] data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_10px_rgba(0,212,240,0.1)] data-[state=active]:border-[var(--ds-cyan)]/20 border border-transparent text-slate-400 rounded-full px-6 py-2.5 transition-all text-[12px] uppercase tracking-wider font-bold"
                  style={{ fontFamily: 'var(--ds-font-data)' }}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Content */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-1 space-y-6">
                  {/* Trust Score Widget */}
                  <div className="glass p-6 rounded-2xl border border-white/5 shadow-[var(--ds-shadow-card)]">
                    <h3 style={{ fontFamily: 'Inter', fontWeight: 900 }} className="text-white text-lg mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-[var(--ds-cyan)] drop-shadow-[0_0_8px_rgba(0,212,240,0.8)]" />
                       {language === 'es' ? 'Nivel de Confianza Aduanera' : 'Customs Trust Level'}
                    </h3>
                    <div className="relative h-2 bg-black/50 rounded-full mb-3 overflow-hidden border border-white/5">
                       <div className="absolute top-0 left-0 h-full bg-[var(--ds-cyan)] w-[85%] rounded-full shadow-[0_0_10px_var(--ds-cyan)]" />
                    </div>
                    <div className="flex justify-between items-center font-data text-[10px] uppercase tracking-widest">
                       <span className="text-white">Score: <span className="text-[var(--ds-cyan)] font-bold">850/1000</span></span>
                       <span className="text-emerald-400">Excelente</span>
                    </div>
                    <p className="mt-4 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                      {language === 'es' ? 'Tu perfil es visible para ' : 'Your profile is visible to '}
                      <strong className="text-white">42</strong> 
                      {language === 'es' ? ' exportadores premium.' : ' premium exporters.'}
                    </p>
                  </div>

                  {/* Vault / Documents Summary (Read-Only here) */}
                  <div className="glass p-6 rounded-2xl border border-white/5 shadow-[var(--ds-shadow-card)]">
                    <h3 style={{ fontFamily: 'Inter', fontWeight: 900 }} className="text-white text-lg mb-5 flex items-center gap-2">
                       <Building2 className="w-5 h-5 text-slate-400" />
                       {language === 'es' ? 'Datos Técnicos' : 'Technical Data'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">{language === 'es' ? 'ID Cuenta' : 'Account ID'}</p>
                        <p className="font-data text-xs text-[var(--ds-cyan)] tracking-wider">CH-8492001A</p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">{language === 'es' ? 'Email Corporativo' : 'Corporate Email'}</p>
                        <p className="font-data text-xs text-slate-300">{user.email}</p>
                      </div>
                      <div>
                        <p className="font-data text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">{language === 'es' ? 'Tax ID' : 'Tax ID'}</p>
                        <p className="font-data text-xs text-slate-300 tracking-wider">30-71589342-9</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Recent Activity */}
                <Card className="md:col-span-2 glass border-none shadow-none rounded-2xl p-0">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-lg flex items-center gap-2 text-white" style={{ fontFamily: 'Inter', fontWeight: 900 }}>
                       <History className="w-5 h-5 text-slate-500" />
                       Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-4">
                       {activityLoading ? (
                         <div className="py-6 text-center">
                           <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                         </div>
                       ) : activityItems.map((activity, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl transition-all border border-white/5 hover:border-[var(--ds-cyan)]/30 hover:bg-black/30 group">
                             <div className="flex items-center gap-4">
                                <div className="bg-[#0a1d2e] p-2 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border border-white/5 group-hover:shadow-[0_0_15px_rgba(0,212,240,0.2)] transition-all">
                                   {activity.icon}
                                </div>
                                <div>
                                   <p className="font-bold text-white text-[14px]" style={{ fontFamily: 'Inter' }}>{activity.title}</p>
                                   <p className="text-[11px] text-slate-400 capitalize" style={{ fontFamily: 'var(--ds-font-data)' }}>{activity.type}{activity.date ? ` • ${activity.date}` : ''}</p>
                                </div>
                             </div>
                             <Button variant="ghost" size="sm"
                               className="text-[var(--ds-cyan)] hover:text-white hover:bg-[var(--ds-cyan)]/20 rounded-lg"
                               onClick={() => activity.link && (window.location.href = activity.link)}>
                                Ver
                             </Button>
                          </div>
                       ))}
                    </div>
                    <Button variant="outline" className="w-full mt-6 text-slate-400 border-white/10 hover:bg-white/5 hover:text-white rounded-xl">
                       Ver todo el historial
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Plans Content */}
            <TabsContent value="billing" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    {language === 'es' ? 'Mejora tu plan' : 'Upgrade your plan'}
                  </h2>
                  <p className="text-slate-400 mt-2">
                    {language === 'es' 
                      ? 'Elige el plan que mejor se adapte a tu escala comercial.'
                      : 'Choose the plan that fits your business scale.'}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {plans.map((plan) => (
                    <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 bg-[#0D2137] ${plan.highlight ? 'border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10' : 'border-cyan-900/30 hover:border-blue-500/50'}`}>
                       {plan.highlight && (
                         <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            RECOMENDADO
                         </div>
                       )}
                       <CardHeader>
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${plan.highlight ? 'bg-yellow-900/20' : 'bg-blue-900/20'}`}>
                             {plan.icon}
                          </div>
                          <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                          <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-6">
                          <div>
                             <span className="text-4xl font-bold text-white">{plan.price}</span>
                             <span className="text-slate-500">{plan.period}</span>
                          </div>
                          <ul className="space-y-3">
                             {plan.features.map((feature, idx) => (
                               <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                  <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-green-400' : 'text-blue-400'}`} />
                                  <span>{feature}</span>
                               </li>
                             ))}
                          </ul>
                          <Button className={`w-full ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' : 'bg-slate-800 hover:bg-slate-700'} text-white border-0`}>
                             {language === 'es' ? 'Seleccionar Plan' : 'Select Plan'}
                          </Button>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </TabsContent>

             {/* History Content */}
             <TabsContent value="history">
                 <div className="glass border border-white/5 rounded-2xl">
                    <div className="py-12 text-center">
                       <div className="mb-4 bg-black/50 border border-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                          <History className="w-8 h-8 text-slate-500" />
                       </div>
                       <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Inter' }}>Tu historial está vacío</h3>
                       <p className="text-slate-400 max-w-sm mx-auto mt-2 text-sm">
                          Cuando realices búsquedas de HS Codes o calcules costos de importación, aparecerán aquí.
                       </p>
                       <Button className="mt-6 bg-[#0a1d2e] hover:bg-[var(--ds-cyan)]/20 text-[var(--ds-cyan)] border border-[var(--ds-cyan)]/30 rounded-full shadow-[0_0_15px_rgba(0,212,240,0.1)] transition-all">
                          Comenzar a explorar
                       </Button>
                    </div>
                 </div>
             </TabsContent>

             {/* Settings & Compliance */}
             <TabsContent value="settings" className="space-y-6">
                 {/* Editable Forms */}
                 <div className="glass border border-white/5 rounded-2xl p-6 md:p-8">
                     <h3 className="text-xl text-white mb-6" style={{ fontFamily: 'Inter', fontWeight: 900 }}>{language === 'es' ? 'Información de Contacto' : 'Contact Information'}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-2">
                           <Label className="text-slate-400 font-data text-[10px] uppercase tracking-widest">{language === 'es' ? 'Email Corporativo' : 'Corporate Email'}</Label>
                           <Input 
                             value={formData.email} 
                             onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                             className="bg-[#0d2236] border-transparent text-white focus:border-[var(--ds-cyan)] focus:ring-1 focus:ring-[var(--ds-cyan)] focus:shadow-[0_0_20px_rgba(0,212,240,0.2)] transition-all rounded-xl shadow-inner placeholder:text-slate-600 h-12 px-4"
                             style={{ fontFamily: 'var(--ds-font-data)' }}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-400 font-data text-[10px] uppercase tracking-widest">{language === 'es' ? 'Teléfono Móvil' : 'Mobile Phone'}</Label>
                           <Input 
                             value={formData.phone} 
                             onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                             className="bg-[#0d2236] border-transparent text-white focus:border-[var(--ds-cyan)] focus:ring-1 focus:ring-[var(--ds-cyan)] focus:shadow-[0_0_20px_rgba(0,212,240,0.2)] transition-all rounded-xl shadow-inner placeholder:text-slate-600 h-12 px-4"
                             style={{ fontFamily: 'var(--ds-font-data)' }}
                           />
                        </div>
                     </div>
                     <div className="space-y-2 mb-8">
                        <Label className="text-slate-400 font-data text-[10px] uppercase tracking-widest">{language === 'es' ? 'Dirección Comercial' : 'Business Address'}</Label>
                        <Input 
                          value={formData.location} 
                          onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                          className="bg-[#0d2236] border-transparent text-white focus:border-[var(--ds-cyan)] focus:ring-1 focus:ring-[var(--ds-cyan)] focus:shadow-[0_0_20px_rgba(0,212,240,0.2)] transition-all rounded-xl shadow-inner placeholder:text-slate-600 h-12 px-4"
                          style={{ fontFamily: 'var(--ds-font-data)' }}
                        />
                     </div>
                     <div className="flex justify-end">
                        <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-[var(--ds-cyan)] hover:bg-cyan-400 text-[#010609] font-bold rounded-full px-8 shadow-[0_0_20px_rgba(0,212,240,0.3)] transition-all" style={{ fontFamily: 'Inter' }}>
                           {isSaving ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')}
                        </Button>
                     </div>
                 </div>

                 <Card className="border-red-900/50 bg-[#1A0B0F]">
                    <CardHeader>
                       <CardTitle className="text-xl text-red-500 font-bold">Zona de Peligro</CardTitle>
                       <CardDescription className="text-red-200/70">Acciones destructivas y opciones de privacidad</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="border border-red-900/50 bg-red-950/20 p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                             <h4 className="text-white font-semibold mb-1">Eliminar cuenta permanentemente</h4>
                             <p className="text-sm text-red-200/70 max-w-xl">
                                Según el RGPD (Derecho al olvido), tienes derecho a solicitar la eliminación de tu cuenta. 
                                Esta acción anonimizará tus datos personales, cerrará tus alertas y eliminará tu acceso de inmediato. Los registros fiscales obligatorios se mantendrán según exige la ley.
                             </p>
                          </div>
                          <Button 
                            variant="destructive" 
                            className="bg-red-600 hover:bg-red-700 text-white shrink-0 shadow-lg shadow-red-900/20"
                            onClick={() => {
                               if (window.confirm("¿ESTÁS SEGURO? Esta acción es irreversible y perderás acceso a Che.Comex inmediatamente.")) {
                                  // Call DELETE /api/user/:userId/delete-account
                                  fetch(`/api/user/${user?.name === 'Usuario' ? 'demo' : 'actual_id'}/delete-account`, {
                                     method: 'DELETE',
                                     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                  }).then(res => {
                                     alert("Cuenta eliminada. Serás redirigido.");
                                     window.location.href = '/auth';
                                  }).catch(e => console.error(e));
                               }
                            }}
                          >
                             Eliminar cuenta
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
             </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
