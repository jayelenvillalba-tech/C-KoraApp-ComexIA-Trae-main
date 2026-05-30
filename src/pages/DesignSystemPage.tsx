import React, { Suspense } from 'react';
import { Card, Button, Input, Badge, DataLabel, SectionHeader } from '@/design-system/components';

// Lazy-load pages so they don't interfere with App.tsx's dynamic chunk splits
const MarketplacePage = React.lazy(() => import('./MarketplacePage'));
const OnboardingPage = React.lazy(() => import('./onboarding'));
const NewsPage = React.lazy(() => import('./news'));
const ChatPage = React.lazy(() => import('./ChatPage'));
const IncotermsPage = React.lazy(() => import('./IncotermsPage'));
const VendorDashboardPage = React.lazy(() => import('./VendorDashboardPage'));
const CommandCenterPage = React.lazy(() => import('./admin/CommandCenterPage'));
const AnalyticsPage = React.lazy(() => import('./admin/AnalyticsPage'));

const PreviewBox = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ padding: 20, color: 'var(--ds-text-muted)' }}>Loading preview...</div>}>
    <div style={{ pointerEvents: 'none', height: '800px', overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </Suspense>
);

const CSS = `
  .ds-section {
    padding: var(--ds-space-8);
    border-bottom: 1px solid var(--ds-border-subtle);
    background: var(--ds-bg-base);
    min-height: 100vh;
  }
  .ds-label {
    font-family: var(--ds-font-data);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-muted);
    letter-spacing: var(--ds-tracking-label);
    text-transform: uppercase;
    margin-bottom: var(--ds-space-6);
  }
  .ds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--ds-space-6);
  }
`;

export default function DesignSystemPage() {
  if (!import.meta.env.DEV) return null;

  return (
    <div style={{ background: 'var(--ds-bg-base)', minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* 00 - Design Tokens */}
      <section id="ds-tokens" className="ds-section">
        <div className="ds-label">00 - Design Tokens</div>
        <div className="ds-grid">
          <div>
            <SectionHeader title="Colors (Semantic)" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['cyan', 'blue', 'green', 'amber', 'red', 'gold'].map(color => (
                <div key={color} style={{ width: 60, height: 60, borderRadius: 'var(--ds-radius-full)', background: `var(--ds-${color})`, border: '1px solid var(--ds-border-default)' }} />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader title="Surfaces" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['base', 'surface', 'overlay', 'raised', 'input'].map(bg => (
                <div key={bg} style={{ padding: 10, background: `var(--ds-bg-${bg})`, border: '1px solid var(--ds-border-default)', borderRadius: 'var(--ds-radius-md)' }}>
                  <span style={{ color: 'var(--ds-text-primary)' }}>--ds-bg-{bg}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader title="Typography" />
            <h1 style={{ fontFamily: 'var(--ds-font-display)', fontSize: 'var(--ds-text-3xl)' }}>Display Font (Barlow)</h1>
            <p style={{ fontFamily: 'var(--ds-font-body)', fontSize: 'var(--ds-text-base)' }}>Body Font (Outfit) for general text.</p>
            <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: 'var(--ds-text-xs)', textTransform: 'uppercase' }}>Data Font (DM Mono)</span>
          </div>
        </div>
      </section>

      {/* 01 - Components */}
      <section id="ds-components" className="ds-section">
        <div className="ds-label">01 - Components</div>
        <div className="ds-grid">
          <Card>
            <SectionHeader title="Buttons" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Inputs & Badges" />
            <Input label="Email Address" placeholder="Ej: info@empresa.com" />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <Badge variant="verified" text="Verified" />
              <Badge variant="blocked" text="Alert" />
              <Badge variant="buy" text="Buy" />
              <Badge variant="sell" text="Sell" />
            </div>
          </Card>
          <Card semantic="amber">
            <SectionHeader title="Semantic Card (Amber)" />
            <p style={{ color: 'var(--ds-text-secondary)' }}>Esta tarjeta usa el borde semántico ámbar.</p>
          </Card>
        </div>
      </section>

      {/* 02 - Marketplace */}
      <section id="ds-marketplace" className="ds-section">
        <div className="ds-label">02 - Marketplace</div>
        <PreviewBox><MarketplacePage /></PreviewBox>
      </section>

      {/* 03 - Onboarding */}
      <section id="ds-onboarding" className="ds-section">
        <div className="ds-label">03 - Onboarding</div>
        <PreviewBox><OnboardingPage /></PreviewBox>
      </section>

      {/* 04 - World Trade Pulse */}
      <section id="ds-news" className="ds-section">
        <div className="ds-label">04 - World Trade Pulse</div>
        <PreviewBox><NewsPage /></PreviewBox>
      </section>

      {/* 05 - Chat Colaborativo */}
      <section id="ds-chat" className="ds-section">
        <div className="ds-label">05 - Chat Colaborativo</div>
        <PreviewBox><ChatPage /></PreviewBox>
      </section>

      {/* 06 - Incoterms Simulator */}
      <section id="ds-incoterms" className="ds-section">
         <div className="ds-label">06 - Incoterms Simulator</div>
         <PreviewBox><IncotermsPage /></PreviewBox>
      </section>

      {/* 07 - Vendor Dashboard */}
      <section id="ds-vendor" className="ds-section">
        <div className="ds-label">07 - Vendor Dashboard</div>
        <PreviewBox><VendorDashboardPage /></PreviewBox>
      </section>

      {/* 08 - Admin Command Center */}
      <section id="ds-admin-command" className="ds-section">
        <div className="ds-label">08 - Admin Command Center</div>
        <PreviewBox><CommandCenterPage /></PreviewBox>
      </section>

      {/* 09 - Admin Analytics */}
      <section id="ds-admin-analytics" className="ds-section">
        <div className="ds-label">09 - Admin Analytics</div>
        <PreviewBox><AnalyticsPage /></PreviewBox>
      </section>

    </div>
  );
}
