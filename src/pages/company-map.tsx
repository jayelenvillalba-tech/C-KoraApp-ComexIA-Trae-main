
import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Company } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { Search, Globe, MapPin, Filter, AlertTriangle, Shield, Ship } from "lucide-react";
import CompanyMapLeaflet from "@/components/company-map-leaflet";
import Header from "@/components/header";

/* ═══════════════════════════════════════════════════════
   CYBER-TRADE MERIDIAN — Global Risk Monitoring Center
   Glassmorphism overlay sidebar + Radiance stat cards
═══════════════════════════════════════════════════════ */

export default function CompanyMapPage() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // ── PRESERVED DATA LOGIC ──
  const { data: companiesData, isLoading } = useQuery<{ success: boolean; total: number; companies: Company[] }>({
    queryKey: ["/api/companies"],
  });
  const companies: Company[] = companiesData?.companies ?? [];

  const filteredCompanies = companies.filter(company => {
    const searchableText = [
      company.name,
      company.products ?? '',
      company.address ?? '',
    ].join(' ').toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesCountry = selectedCountry ? company.country === selectedCountry : true;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--ds-bg-base)', fontFamily: 'var(--ds-font-body)' }}>
      <Header />

      {/* Map Container — Full width behind sidebar */}
      <div className="relative pt-[var(--ds-offset-top)]">

        {/* ── MAP ── */}
        <div className="relative px-4 pb-4">
          {isLoading ? (
            <div
              className="h-[700px] w-full rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: 'var(--ds-bg-raised)' }}
            >
              <Globe className="w-12 h-12 animate-spin" style={{ color: 'var(--ds-text-muted)' }} />
            </div>
          ) : (
            <CompanyMapLeaflet companies={filteredCompanies} />
          )}

          {/* ── GLASSMORPHISM FLOATING SIDEBAR ── */}
          <div
            className="absolute top-4 right-8 z-[1000] w-[320px] glass rounded-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100% - 32px)' }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" style={{ color: 'var(--ds-cyan)' }} />
                <h1
                  className="font-black tracking-tight"
                  style={{ fontFamily: 'var(--ds-font-display)', fontSize: '18px', color: 'var(--ds-text-primary)' }}
                >
                  {language === 'es' ? 'Centro de Monitoreo' : 'Monitoring Center'}
                </h1>
              </div>
              <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '11px', color: 'var(--ds-text-muted)' }}>
                {language === 'es'
                  ? 'Red global de empresas + alertas de riesgo marítimo'
                  : 'Global company network + maritime risk alerts'}
              </p>
            </div>

            {/* Search bar — Crystal effect */}
            <div className="px-5 pb-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ds-text-muted)' }} />
                <input
                  placeholder={language === 'es' ? "Buscar empresa, producto..." : "Search company, product..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all"
                  style={{
                    background: 'var(--ds-bg-base)',
                    border: '1px solid var(--ds-border-subtle)',
                    color: 'var(--ds-text-primary)',
                    fontFamily: 'var(--ds-font-body)',
                    fontSize: '13px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--ds-cyan)';
                    e.target.style.boxShadow = '0 0 20px rgba(0,212,240,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--ds-border-subtle)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Country filter pills */}
            <div className="px-5 pb-4">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    fontFamily: 'var(--ds-font-data)',
                    background: selectedCountry === null ? 'var(--ds-cyan-dim)' : 'var(--ds-bg-base)',
                    color: selectedCountry === null ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                    border: `1px solid ${selectedCountry === null ? 'rgba(0,212,240,0.25)' : 'var(--ds-border-subtle)'}`,
                  }}
                >ALL</button>
                {['AR', 'BR', 'CL', 'UY', 'PY'].map(country => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      fontFamily: 'var(--ds-font-data)',
                      background: selectedCountry === country ? 'var(--ds-cyan-dim)' : 'var(--ds-bg-base)',
                      color: selectedCountry === country ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                      border: `1px solid ${selectedCountry === country ? 'rgba(0,212,240,0.25)' : 'var(--ds-border-subtle)'}`,
                    }}
                  >{country}</button>
                ))}
              </div>
            </div>

            {/* Stats Cards — Radiance emitters */}
            <div className="px-5 pb-5 space-y-2.5">
              {/* Card: Active Countries */}
              <div className="radiance-cyan rounded-xl p-4" style={{ background: 'var(--ds-bg-raised)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="uppercase font-bold tracking-wider mb-1"
                      style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', letterSpacing: 'var(--ds-tracking-data)' }}
                    >
                      {language === 'es' ? 'PAÍSES ACTIVOS' : 'ACTIVE COUNTRIES'}
                    </div>
                    <div className="font-black" style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', color: 'var(--ds-text-primary)' }}>5</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-muted)' }}>Mercosur + Chile</div>
                  </div>
                  <Globe className="w-8 h-8" style={{ color: 'var(--ds-cyan)', opacity: 0.4 }} />
                </div>
              </div>

              {/* Card: Verified Companies */}
              <div className="radiance-green rounded-xl p-4" style={{ background: 'var(--ds-bg-raised)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="uppercase font-bold tracking-wider mb-1"
                      style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', letterSpacing: 'var(--ds-tracking-data)' }}
                    >
                      {language === 'es' ? 'EMPRESAS VERIFICADAS' : 'VERIFIED COMPANIES'}
                    </div>
                    <div className="font-black" style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', color: 'var(--ds-text-primary)' }}>{filteredCompanies.length}</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-muted)' }}>
                      {language === 'es' ? 'Nodos de energía en el mapa' : 'Energy nodes on map'}
                    </div>
                  </div>
                  <MapPin className="w-8 h-8" style={{ color: 'var(--ds-green)', opacity: 0.4 }} />
                </div>
              </div>

              {/* Card: Risk Zones */}
              <div className="radiance-amber rounded-xl p-4" style={{ background: 'var(--ds-bg-raised)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="uppercase font-bold tracking-wider mb-1"
                      style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', letterSpacing: 'var(--ds-tracking-data)' }}
                    >
                      {language === 'es' ? 'ZONAS DE RIESGO' : 'RISK ZONES'}
                    </div>
                    <div className="font-black" style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', color: 'var(--ds-text-primary)' }}>5</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-muted)' }}>
                      {language === 'es' ? 'Click en zona para ver alertas GDELT' : 'Click zone for GDELT alerts'}
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8" style={{ color: 'var(--ds-amber)', opacity: 0.4 }} />
                </div>
              </div>

              {/* Card: Trade Routes */}
              <div className="radiance-cyan rounded-xl p-4" style={{ background: 'var(--ds-bg-raised)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="uppercase font-bold tracking-wider mb-1"
                      style={{ fontFamily: 'var(--ds-font-data)', fontSize: '9px', color: 'var(--ds-text-muted)', letterSpacing: 'var(--ds-tracking-data)' }}
                    >
                      {language === 'es' ? 'RUTAS COMERCIALES' : 'TRADE ROUTES'}
                    </div>
                    <div className="font-black" style={{ fontFamily: 'var(--ds-font-display)', fontSize: '28px', color: 'var(--ds-text-primary)' }}>3</div>
                    <div style={{ fontFamily: 'var(--ds-font-body)', fontSize: '10px', color: 'var(--ds-text-muted)' }}>
                      <span style={{ color: 'var(--ds-cyan)' }}>Cian</span> segura · <span style={{ color: 'var(--ds-amber)' }}>Naranja</span> riesgo
                    </div>
                  </div>
                  <Ship className="w-8 h-8" style={{ color: 'var(--ds-cyan)', opacity: 0.4 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
