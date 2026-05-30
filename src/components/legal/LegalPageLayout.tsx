import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Shield, FileText, AlertTriangle, ExternalLink, ChevronRight, ArrowLeft, Menu, X } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface LegalDoc {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const DOCS: LegalDoc[] = [
  {
    id: 'terms',
    title: 'Términos y Condiciones',
    icon: <FileText className="w-4 h-4" />,
    href: '/legal/terms',
    badge: 'v1.2',
  },
  {
    id: 'privacy',
    title: 'Política de Privacidad',
    icon: <Shield className="w-4 h-4" />,
    href: '/legal/privacy',
    badge: 'GDPR',
  },
  {
    id: 'acceptable-use',
    title: 'Uso Aceptable',
    icon: <AlertTriangle className="w-4 h-4" />,
    href: '/legal/acceptable-use',
    badge: 'OFAC',
  },
];

const DOC_TITLES: Record<string, string> = {
  'terms': 'Términos y Condiciones',
  'privacy': 'Política de Privacidad',
  'acceptable-use': 'Uso Aceptable',
};

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface LegalPageLayoutProps {
  activeDoc: 'terms' | 'privacy' | 'acceptable-use';
  rawMarkdown: string;
  lastUpdated: string;
}

/** Parse markdown to HTML with Che.Comex design system styles */
function parseMarkdown(md: string): string {
  return md
    .replace(/^(#+)\s+(.+)$/gm, (_match, hashes, content) => {
      const level = hashes.length;
      const id = content.toLowerCase().replace(/[^a-záéíóúñ0-9\s]/gi, '').replace(/\s+/g, '-');
      if (level === 1)
        return `<h1 id="${id}" class="lg-h1">${content}</h1>`;
      if (level === 2)
        return `<h2 id="${id}" class="lg-h2">${content}</h2>`;
      if (level === 3)
        return `<h3 id="${id}" class="lg-h3">${content}</h3>`;
      return `<h${level} id="${id}">${content}</h${level}>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong class="lg-strong">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="lg-em">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="lg-code">$1</code>')
    .replace(/---/g, '<hr class="lg-hr" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="lg-link">$1</a>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      const isHeader = cells.some(c => c === '' || c.match(/^-+$/));
      if (isHeader) return '';
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag} class="lg-td">${c}</${tag}>`).join('')}</tr>`;
    })
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, '<div class="lg-blockquote">$1</div>')
    // Lists
    .replace(/^- \*\*(.+?)\*\*:(.+)$/gm, '<li class="lg-li"><strong class="lg-strong">$1</strong>:$2</li>')
    .replace(/^- (.+)$/gm, '<li class="lg-li">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="lg-li-num">$1</li>')
    // Blank line → paragraph break
    .replace(/\n\n/g, '</p><p class="lg-p">');
}

/** Extract headings from markdown for TOC */
function extractHeadings(md: string): Heading[] {
  const headings: Heading[] = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-záéíóúñ0-9\s]/gi, '').replace(/\s+/g, '-');
      headings.push({ id, text, level });
    }
  }
  return headings;
}

/** Sidebar / Drawer TOC content */
function TocContent({
  headings,
  activeDoc,
  activeHeading,
  scrollToHeading,
  navigate,
  onClose,
}: {
  headings: Heading[];
  activeDoc: string;
  activeHeading: string;
  scrollToHeading: (id: string) => void;
  navigate: (path: any) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: 'var(--ds-bg-raised)', border: '1px solid var(--ds-border-subtle)' }}
      >
        <p
          className="mb-3"
          style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          En este documento
        </p>
        <nav className="space-y-0.5">
          {headings.filter(h => h.level <= 2).map(h => (
            <button
              key={h.id}
              onClick={() => { scrollToHeading(h.id); onClose?.(); }}
              className="w-full text-left flex items-start gap-1.5 py-1.5 px-2 rounded-lg transition-all"
              style={{
                fontFamily: 'var(--ds-font-body)',
                fontSize: h.level === 1 ? '12px' : '11px',
                fontWeight: h.level === 1 ? 700 : 500,
                color: activeHeading === h.id ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                background: activeHeading === h.id ? 'rgba(0,212,240,0.08)' : 'transparent',
                paddingLeft: h.level === 1 ? '8px' : '16px',
              }}
            >
              {h.level === 2 && (
                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
              )}
              <span className="line-clamp-2">{h.text}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Links to other docs */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--ds-bg-raised)', border: '1px solid var(--ds-border-subtle)' }}
      >
        <p
          className="mb-3"
          style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Otros documentos
        </p>
        {DOCS.filter(d => d.id !== activeDoc).map(doc => (
          <button
            key={doc.id}
            onClick={() => { navigate(doc.href); onClose?.(); }}
            className="w-full flex items-center gap-2 py-2 transition-colors"
            style={{ fontFamily: 'var(--ds-font-body)', fontSize: '12px', color: 'var(--ds-text-secondary)' }}
          >
            <span style={{ color: 'var(--ds-text-muted)' }}>{doc.icon}</span>
            {doc.title}
            <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
          </button>
        ))}
      </div>
    </>
  );
}

export default function LegalPageLayout({ activeDoc, rawMarkdown, lastUpdated }: LegalPageLayoutProps) {
  const [, navigate] = useLocation();
  const [activeHeading, setActiveHeading] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const headings = extractHeadings(rawMarkdown);
  const htmlContent = parseMarkdown(rawMarkdown);
  const activeDocMeta = DOCS.find(d => d.id === activeDoc)!;

  // Dynamic page title
  useDocumentTitle(`Legal · ${DOC_TITLES[activeDoc] ?? activeDoc}`);

  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Intersection observer for TOC active state
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    const els = contentRef.current?.querySelectorAll('h1,h2,h3') || [];
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [htmlContent]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a141d', color: 'var(--ds-text-secondary)' }}>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 xl:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <div
        className="fixed top-0 left-0 h-full z-50 xl:hidden transition-transform duration-300 ease-out"
        style={{
          width: '280px',
          background: '#0d1e2e',
          border: '1px solid var(--ds-border-subtle)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.6)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          overflowY: 'auto',
          padding: '24px 16px',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <span
            style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', fontWeight: 700, color: 'var(--ds-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Índice
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--ds-text-muted)', background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <TocContent
          headings={headings}
          activeDoc={activeDoc}
          activeHeading={activeHeading}
          scrollToHeading={scrollToHeading}
          navigate={navigate}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── Radial glow header ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,240,0.07) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-6">
          {/* Top bar: back + mobile TOC trigger */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1 as any)}
              className="inline-flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', fontWeight: 700, color: 'var(--ds-text-muted)', letterSpacing: '0.08em' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              VOLVER
            </button>

            {/* Mobile TOC toggle — only visible below xl */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="xl:hidden flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                fontFamily: 'var(--ds-font-data)', fontSize: '11px', fontWeight: 700,
                color: 'var(--ds-cyan)', background: 'rgba(0,212,240,0.08)',
                border: '1px solid rgba(0,212,240,0.2)',
              }}
            >
              <Menu className="w-4 h-4" />
              Índice
            </button>
          </div>

          {/* Page title */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: 'rgba(0,212,240,0.1)', border: '1px solid rgba(0,212,240,0.2)' }}
            >
              {activeDocMeta.icon}
            </div>
            <div>
              <div
                className="mb-0.5"
                style={{ fontFamily: 'var(--ds-font-data)', fontSize: '10px', fontWeight: 700, color: 'var(--ds-cyan)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                Documentos Legales · Che.Comex
              </div>
              <h1 style={{ fontFamily: 'var(--ds-font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, color: 'var(--ds-text-primary)', margin: 0 }}>
                {activeDocMeta.title}
              </h1>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: '12px', color: 'var(--ds-text-muted)', marginLeft: '52px' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Doc navigation tabs */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-0">
          <div
            className="flex gap-1 overflow-x-auto border-b scrollbar-none"
            style={{ borderColor: 'var(--ds-border-subtle)' }}
          >
            {DOCS.map(doc => {
              const isActive = doc.id === activeDoc;
              return (
                <button
                  key={doc.id}
                  onClick={() => navigate(doc.href)}
                  className="flex items-center gap-2 px-3 md:px-4 py-3 text-sm transition-all relative flex-shrink-0"
                  style={{
                    fontFamily: 'var(--ds-font-body)',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                    borderBottom: isActive ? '2px solid var(--ds-cyan)' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {doc.icon}
                  <span className="hidden sm:inline">{doc.title}</span>
                  <span className="sm:hidden">{doc.title.split(' ')[0]}</span>
                  {doc.badge && (
                    <span
                      style={{
                        fontFamily: 'var(--ds-font-data)',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: isActive ? 'rgba(0,212,240,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                        border: `1px solid ${isActive ? 'rgba(0,212,240,0.3)' : 'transparent'}`,
                      }}
                    >
                      {doc.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-8">
          {/* Sidebar TOC (sticky, desktop only) */}
          <aside
            className="hidden xl:block w-60 flex-shrink-0"
            style={{ position: 'sticky', top: '24px', alignSelf: 'flex-start', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
          >
            <TocContent
              headings={headings}
              activeDoc={activeDoc}
              activeHeading={activeHeading}
              scrollToHeading={scrollToHeading}
              navigate={navigate}
            />
          </aside>

          {/* Content card */}
          <main className="flex-1 min-w-0">
            <div
              className="rounded-2xl p-6 md:p-8 lg:p-12"
              style={{
                background: 'var(--ds-bg-raised)',
                border: '1px solid var(--ds-border-subtle)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <style>{`
                .lg-h1 { font-family: var(--ds-font-display); font-size: clamp(20px, 3vw, 26px); font-weight: 900; color: var(--ds-text-primary); margin: 0 0 8px 0; scroll-margin-top: 80px; }
                .lg-h2 { font-family: var(--ds-font-display); font-size: clamp(15px, 2.5vw, 18px); font-weight: 800; color: var(--ds-text-primary); margin: 36px 0 12px 0; padding-bottom: 10px; border-bottom: 1px solid var(--ds-border-subtle); scroll-margin-top: 80px; }
                .lg-h3 { font-family: var(--ds-font-body); font-size: 15px; font-weight: 700; color: var(--ds-text-primary); margin: 24px 0 8px 0; scroll-margin-top: 80px; }
                .lg-p { font-family: var(--ds-font-body); font-size: clamp(13px, 1.5vw, 14px); color: var(--ds-text-secondary); line-height: 1.75; margin-bottom: 14px; }
                .lg-strong { color: var(--ds-text-primary); font-weight: 700; }
                .lg-em { color: var(--ds-text-secondary); font-style: italic; }
                .lg-code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: rgba(0,212,240,0.08); color: var(--ds-cyan); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,212,240,0.2); }
                .lg-hr { border: none; border-top: 1px solid var(--ds-border-subtle); margin: 32px 0; }
                .lg-link { color: var(--ds-cyan); text-decoration: underline; text-underline-offset: 3px; transition: opacity 0.2s; }
                .lg-link:hover { opacity: 0.7; }
                .lg-li { font-family: var(--ds-font-body); font-size: 14px; color: var(--ds-text-secondary); line-height: 1.7; display: list-item; list-style: disc; margin-left: 20px; margin-bottom: 4px; }
                .lg-li-num { font-family: var(--ds-font-body); font-size: 14px; color: var(--ds-text-secondary); line-height: 1.7; display: list-item; list-style: decimal; margin-left: 20px; margin-bottom: 4px; }
                .lg-blockquote { background: rgba(245,158,11,0.07); border-left: 3px solid var(--ds-amber); border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 20px 0; font-family: var(--ds-font-body); font-size: 13px; color: var(--ds-amber); font-weight: 600; line-height: 1.6; }
                .lg-td { font-family: var(--ds-font-body); font-size: 12.5px; color: var(--ds-text-secondary); padding: 8px 12px; border: 1px solid var(--ds-border-subtle); }
                tr:nth-child(even) .lg-td { background: rgba(255,255,255,0.02); }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>

              <div
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: `<p class="lg-p">${htmlContent}</p>` }}
              />
            </div>

            {/* Footer nav between docs */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-8 pt-6" style={{ borderTop: '1px solid var(--ds-border-subtle)' }}>
              <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: '11px', color: 'var(--ds-text-muted)', fontWeight: 700 }}>
                © 2026 Che.Comex — ComexIA · San Lorenzo, Santa Fe, Argentina
              </div>
              <div className="flex gap-4 flex-wrap">
                {DOCS.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(doc.href)}
                    style={{
                      fontFamily: 'var(--ds-font-data)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: doc.id === activeDoc ? 'var(--ds-cyan)' : 'var(--ds-text-muted)',
                      textDecoration: doc.id === activeDoc ? 'underline' : 'none',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {doc.title.split(' ')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
