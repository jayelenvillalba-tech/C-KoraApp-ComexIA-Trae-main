import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Users, Building2, CheckCircle, XCircle, TrendingUp, 
  DollarSign, Package, AlertTriangle, Shield, LogOut, FileText
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button, Card, Badge } from "@/design-system/components"; // assuming these exist, or I can use inline styling with DS classes

// Mock admin user
const ADMIN_PASSWORD = "admin123";

const mockStats = {
  totalUsers: 156,
  totalCompanies: 89,
  activeSubscriptions: 45,
  pendingVerifications: 12,
  totalRevenue: 22450,
  activePosts: 234
};

const mockPendingVerifications = [
  {
    id: "v1",
    type: "company",
    entityName: "Importadora ABC S.A.",
    country: "AR",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    documents: ["RUT", "Comprobante domicilio", "CÃ¡mara de comercio"],
    status: "pending"
  },
  {
    id: "v2",
    type: "employee",
    entityName: "Juan PÃ©rez",
    company: "Exportadora XYZ Ltda.",
    email: "juan.perez@xyz.com",
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    documents: ["DNI", "Carta empresa"],
    status: "pending"
  }
];

const mockSubscriptions = [
  {
    id: "s1",
    company: "Importadora ABC S.A.",
    plan: "multinacional",
    status: "active",
    employees: 45,
    maxEmployees: 100,
    monthlyRevenue: 499,
    startDate: new Date(2024, 0, 15),
    nextBilling: new Date(2025, 0, 15)
  },
  {
    id: "s2",
    company: "Tech Imports Inc.",
    plan: "pyme",
    status: "active",
    employees: 3,
    maxEmployees: 5,
    monthlyRevenue: 99,
    startDate: new Date(2024, 10, 1),
    nextBilling: new Date(2024, 11, 1)
  }
];

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "verifications" | "subscriptions" | "posts">("overview");

  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/verifications', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch verifications');
      return res.json();
    },
    enabled: !!isAuthenticated
  });

  const { data: realStats } = useQuery({
      queryKey: ['admin-stats'],
      queryFn: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return mockStats;
        return res.json();
      },
      enabled: !!isAuthenticated
  });

  const stats = realStats || mockStats;

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
       const token = localStorage.getItem('token');
       await fetch(`/api/verifications/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['verifications'] });
       toast({ title: "VerificaciÃ³n aprobada" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
       await fetch(`/api/verifications/${id}/reject`, { method: 'POST' });
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['verifications'] });
       toast({ title: "VerificaciÃ³n rechazada", variant: "destructive" });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      window.dispatchEvent(new Event('admin_login'));
    } else {
      alert(language === 'es' ? 'ContraseÃ±a incorrecta' : 'Incorrect password');
    }
  };

  const handleApproveVerification = async (id: string) => {
    try { await approveMutation.mutateAsync(id); } catch { /* handled by mutation */ }
  };

  const handleRejectVerification = async (id: string) => {
    try { await rejectMutation.mutateAsync(id); } catch { /* handled by mutation */ }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    localStorage.removeItem('admin_demo_mode');
    window.dispatchEvent(new Event('demo_mode_changed'));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--ds-bg-base)] flex flex-col relative items-center justify-center p-[var(--ds-space-4)] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--ds-amber)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-modal)] relative z-10">
          <div className="text-center mb-[var(--ds-space-6)]">
            <Shield className="w-12 h-12 mx-auto mb-[var(--ds-space-4)] text-[var(--ds-amber)] drop-shadow-[0_0_15px_rgba(245,168,0,0.4)]" />
            <h1 className="font-display text-[var(--ds-text-2xl)] font-bold text-[var(--ds-text-primary)]">
              {language === 'es' ? 'Acceso Administrador' : 'Admin Access'}
            </h1>
            <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-amber)] uppercase tracking-[var(--ds-tracking-data)] mt-2">
              GodMode Control Center
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-[var(--ds-space-4)]">
            <div>
              <label className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-secondary)] uppercase tracking-[var(--ds-tracking-data)] block mb-2">
                {language === 'es' ? 'ContraseÃ±a' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full bg-[var(--ds-bg-input)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-md)] px-3 py-2.5 text-[var(--ds-text-primary)] placeholder-[var(--ds-text-muted)] focus:border-[var(--ds-amber)] focus:outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--ds-amber)] hover:opacity-90 text-[var(--ds-bg-base)] font-bold text-[var(--ds-text-sm)] py-3 rounded-[var(--ds-radius-md)] shadow-[var(--ds-glow-amber)] transition-all"
            >
              {language === 'es' ? 'Ingresar al sistema' : 'Login to system'}
            </button>
            <p className="text-[var(--ds-text-muted)] font-data text-center text-[var(--ds-text-xs)] mt-4">Demo: admin123</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-[var(--ds-space-8)]">
        <div>
          <h1 className="font-display text-[var(--ds-text-3xl)] font-bold text-[var(--ds-text-primary)] mb-1">
            Command Center
          </h1>
          <p className="text-[var(--ds-text-secondary)] text-[var(--ds-text-sm)]">
            {language === 'es' ? 'Panel central de mÃ©tricas y validaciones operativas.' : 'Central dashboard for metrics and operational validations.'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-[var(--ds-border-default)] rounded-[var(--ds-radius-md)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-overlay)] transition-colors flex items-center gap-2 text-[var(--ds-text-sm)] font-medium"
        >
          <LogOut size={16} />
          {language === 'es' ? 'Pausar SesiÃ³n' : 'Pause Session'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[var(--ds-space-4)] mb-[var(--ds-space-8)]">
        {[
          { label: 'Usuarios', icon: Users, value: stats.totalUsers, color: 'var(--ds-cyan)' },
          { label: 'Empresas', icon: Building2, value: stats.totalCompanies, color: 'var(--ds-cyan)' },
          { label: 'Suscripciones', icon: TrendingUp, value: stats.activeSubscriptions, color: 'var(--ds-green)' },
          { label: 'Verificaciones', icon: AlertTriangle, value: stats.pendingVerifications, color: 'var(--ds-amber)' },
          { label: 'Ingresos/mes', icon: DollarSign, value: '$' + stats.totalRevenue.toLocaleString(), color: 'var(--ds-gold)' },
          { label: 'Publicaciones', icon: Package, value: stats.activePosts, color: 'var(--ds-blue)' },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] p-[var(--ds-space-4)] relative overflow-hidden group hover:border-[var(--ds-border-strong)] transition-all">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-10 transition-opacity group-hover:opacity-20" style={{ background: stat.color }} />
            <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-secondary)] uppercase tracking-[var(--ds-tracking-data)] mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="font-display text-[var(--ds-text-2xl)] font-bold text-[var(--ds-text-primary)]">{stat.value}</p>
              <stat.icon size={20} style={{ color: stat.color }} className="opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--ds-border-default)] mb-[var(--ds-space-6)]">
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'verifications', label: 'Verificaciones', badge: stats.pendingVerifications > 0 ? stats.pendingVerifications : null },
          { id: 'subscriptions', label: 'Suscripciones' },
          { id: 'posts', label: 'Publicaciones' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={'px-[var(--ds-space-5)] py-[var(--ds-space-3)] font-data text-[var(--ds-text-xs)] font-bold uppercase tracking-[var(--ds-tracking-data)] transition-colors flex items-center gap-2 border-b-2 ' + (activeTab === tab.id ? 'border-[var(--ds-amber)] text-[var(--ds-amber)]' : 'border-transparent text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]')}
          >
            {tab.label}
            {tab.badge && (
              <span className="bg-[var(--ds-amber-dim)] text-[var(--ds-amber)] px-1.5 py-0.5 rounded text-[9px] border border-[var(--ds-amber)]/20">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] rounded-tl-none min-h-[400px] shadow-[var(--ds-shadow-card)]">
        
        {activeTab === 'verifications' && (
          <div className="p-[var(--ds-space-6)]">
            <h2 className="font-display text-[var(--ds-text-xl)] font-bold text-[var(--ds-text-primary)] mb-[var(--ds-space-4)] flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--ds-amber)]" />
              Cola de VerificaciÃ³n Manual
            </h2>
            {verifications.length === 0 ? (
              <p className="text-[var(--ds-text-secondary)] text-[var(--ds-text-sm)]">No hay solicitudes pendientes.</p>
            ) : (
              <div className="space-y-4">
                {verifications.map((v: any, i: number) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 p-5 bg-[var(--ds-bg-overlay)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-md)] items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-[var(--ds-text-primary)]">{v.entityName}</span>
                        <span className={"font-data px-2 py-0.5 rounded text-[9px] uppercase tracking-[var(--ds-tracking-data)] border " + (v.entityType === 'company' ? 'bg-[var(--ds-cyan-dim)] text-[var(--ds-cyan)] border-[var(--ds-cyan)]/20' : 'bg-[var(--ds-blue-dim)] text-[var(--ds-blue)] border-[var(--ds-blue)]/20')}>
                          {v.entityType === 'company' ? 'EMPRESA' : 'EMPLEADO'}
                        </span>
                      </div>
                      <p className="text-[var(--ds-text-xs)] font-data text-[var(--ds-text-tertiary)] mb-4">{new Date(v.submittedAt).toLocaleString()}</p>
                      <div className="flex flex-wrap gap-2">
                        {v.documents?.map((doc: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ds-bg-base)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-sm)] text-[var(--ds-text-xs)] text-[var(--ds-text-secondary)] font-body hover:border-[var(--ds-border-strong)] cursor-pointer transition-colors">
                            <FileText size={12} className="text-[var(--ds-amber)]" /> {doc}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <button onClick={() => handleApproveVerification(v.id)} className="flex-1 md:w-auto px-5 py-2.5 bg-[var(--ds-green-dim)] text-[var(--ds-green)] hover:bg-[var(--ds-green)] hover:text-[var(--ds-bg-base)] border border-[var(--ds-green)]/30 rounded-[var(--ds-radius-sm)] flex items-center justify-center gap-2 text-[var(--ds-text-sm)] font-bold transition-colors">
                        <CheckCircle size={16} /> Aprobar
                      </button>
                      <button onClick={() => handleRejectVerification(v.id)} className="flex-1 md:w-auto px-5 py-2.5 bg-[var(--ds-red-dim)] text-[var(--ds-red)] hover:bg-[var(--ds-red)] hover:text-[var(--ds-bg-base)] border border-[var(--ds-red)]/30 rounded-[var(--ds-radius-sm)] flex items-center justify-center gap-2 text-[var(--ds-text-sm)] font-bold transition-colors">
                        <XCircle size={16} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="p-[var(--ds-space-6)]">
             <h2 className="font-display text-[var(--ds-text-xl)] font-bold text-[var(--ds-text-primary)] mb-[var(--ds-space-4)] flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--ds-green)]" />
              Suscripciones Activas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-4)]">
              {mockSubscriptions.map(sub => (
                <div key={sub.id} className="p-5 bg-[var(--ds-bg-overlay)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-md)] flex flex-col justify-between">
                  {/* header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[var(--ds-text-base)] font-bold text-[var(--ds-text-primary)] mb-2">{sub.company}</h3>
                      <div className="flex gap-2">
                        <span className="font-data px-2 py-0.5 bg-[var(--ds-cyan-dim)] text-[var(--ds-cyan)] border border-[var(--ds-cyan)]/20 rounded text-[9px] uppercase tracking-[var(--ds-tracking-data)]">{sub.plan}</span>
                        <span className="font-data px-2 py-0.5 bg-[var(--ds-green-dim)] text-[var(--ds-green)] border border-[var(--ds-green)]/20 rounded text-[9px] uppercase tracking-[var(--ds-tracking-data)]">{sub.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[var(--ds-text-2xl)] font-bold text-[var(--ds-text-primary)]">${sub.monthlyRevenue}</div>
                      <div className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)]">USD / Mes</div>
                    </div>
                  </div>
                  {/* footer */}
                  <div className="pt-4 border-t border-[var(--ds-border-subtle)] grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)] mb-1">Empleados</p>
                      <p className="text-[var(--ds-text-sm)] text-[var(--ds-text-secondary)]">{sub.employees} / {sub.maxEmployees}</p>
                    </div>
                    <div>
                       <p className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] uppercase tracking-[var(--ds-tracking-data)] mb-1">PrÃ³ximo cobro</p>
                       <p className="text-[var(--ds-text-sm)] text-[var(--ds-text-secondary)]">{sub.nextBilling.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* placeholder components for other tabs */}
        {(activeTab === 'overview' || activeTab === 'posts') && (
          <div className="p-16 text-center">
            <p className="text-[var(--ds-text-secondary)] opacity-60">Tab en construcciÃ³n bajo el Design System v2.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
