import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Globe, Package, DollarSign, Users, BarChart3, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalOpportunities: number;
  topCountry: string;
  potentialSavings: number;
  companiesAvailable: number;
  activeMarkets: number;
  avgTariffReduction: number;
  growingMarkets: number;
  treaties: number;
}

export default function DashboardWidgets() {
  const { language } = useLanguage();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
    queryFn: async () => {
      return {
        totalOpportunities: 847,
        topCountry: "Brasil",
        potentialSavings: 125000,
        companiesAvailable: 154,
        activeMarkets: 63,
        avgTariffReduction: 12.5,
        growingMarkets: 42,
        treaties: 28
      };
    }
  });

  const sparklineData = [
    { value: 400 }, { value: 300 }, { value: 550 }, { value: 450 }, { value: 600 }, { value: 847 }
  ];

  // ── SKELETON SCREENS (Meridian style) ──
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5 animate-pulse"
            style={{
              background: 'var(--ds-bg-raised)',
              boxShadow: 'var(--ds-shadow-card)',
            }}
          >
            <div className="h-3 rounded w-3/4 mb-4" style={{ background: 'var(--ds-bg-overlay)' }} />
            <div className="h-7 rounded w-1/2 mb-2" style={{ background: 'var(--ds-bg-overlay)' }} />
            <div className="h-2 rounded w-2/3" style={{ background: 'var(--ds-bg-bright)' }} />
          </div>
        ))}
      </div>
    );
  }

  const widgets = [
    {
      title: language === 'es' ? 'Oportunidades Detectadas' : 'Opportunities Detected',
      value: stats?.totalOpportunities || 0,
      change: '+12%',
      trend: 'up' as const,
      icon: TrendingUp,
      accentColor: 'var(--ds-cyan)',
      glowClass: 'glow-cyan',
      description: language === 'es' ? 'vs. mes anterior' : 'vs. last month',
      hasChart: true
    },
    {
      title: language === 'es' ? 'Ahorro Potencial' : 'Potential Savings',
      value: `$${((stats?.potentialSavings || 0) / 1000).toFixed(0)}K`,
      change: '+8%',
      trend: 'up' as const,
      icon: DollarSign,
      accentColor: 'var(--ds-green)',
      glowClass: 'glow-green',
      description: language === 'es' ? 'en aranceles' : 'in tariffs'
    },
    {
      title: language === 'es' ? 'Mercados Activos' : 'Active Markets',
      value: stats?.activeMarkets || 0,
      change: '+5',
      trend: 'up' as const,
      icon: Globe,
      accentColor: 'var(--ds-blue)',
      glowClass: 'glow-cyan',
      description: language === 'es' ? 'países disponibles' : 'countries available'
    },
    {
      title: language === 'es' ? 'Empresas Verificadas' : 'Verified Companies',
      value: stats?.companiesAvailable || 0,
      change: '+23',
      trend: 'up' as const,
      icon: Users,
      accentColor: 'var(--ds-amber)',
      glowClass: 'glow-amber',
      description: language === 'es' ? 'nuevas este mes' : 'new this month'
    },
    {
      title: language === 'es' ? 'Reducción Arancelaria' : 'Avg. Tariff Reduction',
      value: `${stats?.avgTariffReduction || 0}%`,
      change: '+2.3%',
      trend: 'up' as const,
      icon: BarChart3,
      accentColor: 'var(--ds-cyan-soft)',
      glowClass: 'glow-cyan',
      description: language === 'es' ? 'con tratados' : 'with treaties'
    },
    {
      title: language === 'es' ? 'Mercados Crecientes' : 'Growing Markets',
      value: stats?.growingMarkets || 0,
      change: '+7',
      trend: 'up' as const,
      icon: TrendingUp,
      accentColor: 'var(--ds-green)',
      glowClass: 'glow-green',
      description: language === 'es' ? 'tendencia positiva' : 'positive trend'
    },
    {
      title: language === 'es' ? 'Tratados Comerciales' : 'Trade Treaties',
      value: stats?.treaties || 0,
      change: '+3',
      trend: 'up' as const,
      icon: Zap,
      accentColor: 'var(--ds-gold)',
      glowClass: 'glow-amber',
      description: language === 'es' ? 'activos' : 'active'
    },
    {
      title: language === 'es' ? 'Productos Analizados' : 'Products Analyzed',
      value: '99+',
      change: '+15',
      trend: 'up' as const,
      icon: Package,
      accentColor: 'var(--ds-cyan)',
      glowClass: 'glow-cyan',
      description: language === 'es' ? 'códigos HS' : 'HS codes'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {widgets.map((widget, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-xl cursor-pointer ${widget.glowClass}`}
          style={{
            background: 'var(--ds-bg-raised)',
            boxShadow: 'var(--ds-shadow-card)',
            transition: 'var(--ds-ease-base)',
          }}
        >
          {/* Ambient radiance gradient — bottom accent bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100"
            style={{
              background: `linear-gradient(90deg, ${widget.accentColor}, transparent)`,
              transition: 'opacity var(--ds-ease-base)',
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <span
              className="font-semibold uppercase tracking-wider"
              style={{
                fontFamily: 'var(--ds-font-data)',
                fontSize: 'var(--ds-text-xs)',
                color: 'var(--ds-text-tertiary)',
                letterSpacing: 'var(--ds-tracking-data)',
              }}
            >
              {widget.title}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110"
              style={{
                background: `color-mix(in srgb, ${widget.accentColor} 10%, transparent)`,
                transition: 'transform var(--ds-ease-base)',
              }}
            >
              <widget.icon className="w-4 h-4" style={{ color: widget.accentColor }} />
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pb-5">
            <div className="flex items-baseline justify-between">
              <div
                className="font-black leading-none"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  fontSize: 'var(--ds-text-2xl)',
                  color: 'var(--ds-text-primary)',
                }}
              >
                {widget.value}
              </div>
              <div
                className="flex items-center gap-0.5 font-semibold"
                style={{
                  fontFamily: 'var(--ds-font-data)',
                  fontSize: 'var(--ds-text-xs)',
                  color: widget.trend === 'up' ? 'var(--ds-green-text)' : 'var(--ds-red-text)',
                }}
              >
                {widget.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {widget.change}
              </div>
            </div>
            <p
              className="mt-1.5"
              style={{
                fontFamily: 'var(--ds-font-body)',
                fontSize: 'var(--ds-text-sm)',
                color: 'var(--ds-text-muted)',
              }}
            >
              {widget.description}
            </p>
          </div>

          {/* Sparkline background (first widget only) */}
          {widget.hasChart && (
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--ds-cyan)"
                    fill="var(--ds-cyan)"
                    strokeWidth={1.5}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
