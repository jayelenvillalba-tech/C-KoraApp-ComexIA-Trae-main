import { Globe, Mail, Shield, FileText, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';

export default function Footer() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();

  const legalLinks = [
    { label: language === 'es' ? 'Términos' : 'Terms', href: '/legal/terms', icon: <FileText className="w-3 h-3" /> },
    { label: language === 'es' ? 'Privacidad' : 'Privacy', href: '/legal/privacy', icon: <Shield className="w-3 h-3" /> },
    { label: language === 'es' ? 'Uso Aceptable' : 'Acceptable Use', href: '/legal/acceptable-use', icon: <AlertTriangle className="w-3 h-3" /> },
    { label: 'Contacto', href: 'mailto:soporte@checomex.com', icon: <Mail className="w-3 h-3" /> },
  ];

  const serviceLinks = [
    { label: language === 'es' ? 'Analizador de Rutas' : 'Route Analyzer', href: '/trade-flow' },
    { label: language === 'es' ? 'Mercado B2B' : 'B2B Marketplace', href: '/marketplace' },
    { label: language === 'es' ? 'Alertas Comerciales' : 'Trade Alerts', href: '/alerts' },
    { label: language === 'es' ? 'Suscripción' : 'Subscription', href: '/subscription' },
  ];

  return (
    <footer
      className="relative z-10 mt-16"
      style={{
        background: 'var(--ds-bg-raised)',
        borderTop: '1px solid var(--ds-border-subtle)',
      }}
    >
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(0,212,240,0.1)', border: '1px solid rgba(0,212,240,0.2)' }}
              >
                <Globe className="w-4 h-4" style={{ color: 'var(--ds-cyan)' }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  fontSize: '17px',
                  fontWeight: 900,
                  color: 'var(--ds-text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Che.Comex
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--ds-font-body)',
                fontSize: '13px',
                color: 'var(--ds-text-muted)',
                lineHeight: 1.7,
                maxWidth: '240px',
              }}
            >
              {language === 'es'
                ? 'Plataforma de inteligencia comercial internacional. Análisis de rutas, compliance y marketplace B2B para PyMEs exportadoras.'
                : 'International trade intelligence platform. Route analysis, compliance, and B2B marketplace for exporting SMEs.'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--ds-green)', boxShadow: '0 0 6px var(--ds-green)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--ds-font-data)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--ds-green)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {language === 'es' ? 'Sistema operativo' : 'System operational'}
              </span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: 'var(--ds-font-data)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--ds-text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {language === 'es' ? 'Plataforma' : 'Platform'}
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <button
                    onClick={() => navigate(link.href)}
                    style={{
                      fontFamily: 'var(--ds-font-body)',
                      fontSize: '13px',
                      color: 'var(--ds-text-secondary)',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--ds-text-primary)')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--ds-text-secondary)')}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="mb-4"
              style={{
                fontFamily: 'var(--ds-font-data)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--ds-text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {language === 'es' ? 'Contacto' : 'Contact'}
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'soporte@checomex.com', href: 'mailto:soporte@checomex.com' },
                { label: 'legal@checomex.com', href: 'mailto:legal@checomex.com' },
                { label: 'San Lorenzo, Santa Fe, AR', href: null },
              ].map((item, i) => (
                <li key={i}>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-cyan)' }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'var(--ds-font-body)', fontSize: '13px', color: 'var(--ds-text-muted)' }}>
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div
        className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--ds-border-subtle)' }}
      >
        <span
          style={{
            fontFamily: 'var(--ds-font-data)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--ds-text-muted)',
          }}
        >
          © 2026 Che.Comex — ComexIA · {language === 'es' ? 'Todos los derechos reservados' : 'All rights reserved'}.
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {legalLinks.map(link => (
            link.href.startsWith('mailto:') ? (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.05em' }}
              >
                {link.icon}
                {link.label.toUpperCase()}
              </a>
            ) : (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.05em' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--ds-cyan)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--ds-text-muted)')}
              >
                {link.icon}
                {link.label.toUpperCase()}
              </button>
            )
          ))}
        </div>
      </div>
    </footer>
  );
}
