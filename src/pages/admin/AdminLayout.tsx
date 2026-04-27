import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/context/user-context';
import { LayoutDashboard, BarChart3, Settings, ArrowLeft } from 'lucide-react';

const CSS = `
  .admin-wrap { display: flex; height: 100vh; background: var(--ds-bg-base); color: var(--ds-text-primary); font-family: var(--ds-font-body); overflow: hidden; }
  .admin-sidebar { width: 220px; background: var(--ds-bg-surface); border-right: 1px solid var(--ds-border-default); display: flex; flex-direction: column; flex-shrink: 0; position: relative; }
  .admin-sidebar::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ds-amber); }
  
  .admin-logo { padding: var(--ds-space-6) var(--ds-space-5) var(--ds-space-8); }
  .admin-logo-title { font-family: var(--ds-font-display); font-size: var(--ds-text-xl); font-weight: 800; color: var(--ds-text-primary); line-height: 1; letter-spacing: 0.5px; }
  .admin-badge { display: inline-block; background: var(--ds-amber-dim); color: var(--ds-amber); font-family: var(--ds-font-data); font-size: var(--ds-text-xs); font-weight: 700; padding: 2px 6px; border-radius: var(--ds-radius-sm); margin-top: 4px; letter-spacing: var(--ds-tracking-data); text-transform: uppercase; }

  .admin-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 0 var(--ds-space-3); }
  .admin-section-title { font-family: var(--ds-font-data); font-size: var(--ds-text-xs); color: var(--ds-text-tertiary); text-transform: uppercase; letter-spacing: var(--ds-tracking-label); margin: var(--ds-space-4) var(--ds-space-2) var(--ds-space-2); }
  
  .admin-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--ds-radius-md); color: var(--ds-text-secondary); text-decoration: none; font-size: var(--ds-text-sm); font-weight: 500; transition: all var(--ds-ease-fast); cursor: pointer; }
  .admin-link:hover { background: var(--ds-bg-overlay); color: var(--ds-text-primary); }
  .admin-link.active { background: var(--ds-amber-dim); color: var(--ds-amber); font-weight: 600; }
  
  .admin-user { padding: var(--ds-space-5); border-top: 1px solid var(--ds-border-default); }
  
  .admin-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .admin-main::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 300px; background: radial-gradient(ellipse at top right, var(--ds-amber-dim), transparent 70%); pointer-events: none; opacity: 0.3; }

  .admin-topbar { height: 56px; border-bottom: 1px solid var(--ds-border-default); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--ds-space-6); background: var(--ds-bg-base); flex-shrink: 0; z-index: 10; relative; }
  .admin-content { flex: 1; overflow-y: auto; padding: var(--ds-space-6); z-index: 1; position: relative; }
  
  .demo-toggle { display: flex; align-items: center; gap: 8px; background: var(--ds-bg-surface); border: 1px solid var(--ds-border-default); padding: 4px 12px; border-radius: var(--ds-radius-full); font-family: var(--ds-font-data); font-size: var(--ds-text-xs); color: var(--ds-text-secondary); cursor: pointer; transition: all var(--ds-ease-fast); }
  .demo-toggle:hover { border-color: var(--ds-text-tertiary); }
  .demo-toggle.on { border-color: color-mix(in srgb, var(--ds-amber) 50%, transparent); color: var(--ds-amber); background: var(--ds-amber-dim); box-shadow: var(--ds-glow-amber); }
  
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ds-green); box-shadow: var(--ds-glow-green); animation: pulse-slow 2s infinite; }
  @keyframes pulse-slow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
  
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: var(--ds-border-strong); border-radius: 4px; }
`;

export const useAdminDemoMode = () => {
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    setIsDemo(localStorage.getItem('admin_demo_mode') === 'true');
  }, []);
  const toggleDemo = () => {
    const val = !isDemo;
    setIsDemo(val);
    localStorage.setItem('admin_demo_mode', String(val));
    window.dispatchEvent(new Event('demo_mode_changed'));
  };
  return { isDemo, toggleDemo };
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user } = useUser();
  const { isDemo, toggleDemo } = useAdminDemoMode();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="admin-wrap">
        
        {/* SIDEBAR */}
        <div className="admin-sidebar">
          <div className="admin-logo">
            <div className="admin-logo-title">CHE.COMEX</div>
            <div className="admin-badge">ADMIN v2.0</div>
          </div>
          
          <div className="admin-nav">
            <div className="admin-section-title">Operaciones</div>
            <div className={`admin-link ${location === '/admin' ? 'active' : ''}`} onClick={() => navigate('/admin')}>
              <LayoutDashboard size={14} /> Command Center
            </div>
            <div className={`admin-link ${location === '/admin/analytics' ? 'active' : ''}`} onClick={() => navigate('/admin/analytics')}>
              <BarChart3 size={14} /> Analytics
            </div>
            
            <div className="admin-section-title">Sistema</div>
            <div className="admin-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <Settings size={14} /> Configuración
            </div>
          </div>
          
          <div className="admin-user">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ds-amber-dim)', color: 'var(--ds-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ds-font-display)', fontWeight: 700, fontSize: 'var(--ds-text-base)' }}>
                A
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(user as any)?.name || 'Admin User'}
                </div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-amber)', fontFamily: 'var(--ds-font-data)', marginTop: 2, textTransform: 'uppercase', tracking: 'var(--ds-tracking-data)' }}>Superadmin</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: '1px solid var(--ds-border-default)', borderRadius: 'var(--ds-radius-sm)', width: '100%', padding: '6px 0', color: 'var(--ds-text-secondary)', fontSize: '11px', fontFamily: 'var(--ds-font-data)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all var(--ds-ease-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--ds-bg-overlay)'; e.currentTarget.style.color = 'var(--ds-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ds-text-secondary)'; }}
            >
              <ArrowLeft size={12} /> Volver a la app
            </button>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="admin-main">
          
          {/* TOPBAR */}
          <div className="admin-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--ds-tracking-data)' }}>
                Admin / <span style={{ color: 'var(--ds-text-primary)' }}>{location === '/admin/analytics' ? 'Analytics' : 'Command Center'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <button className={`demo-toggle ${isDemo ? 'on' : ''}`} onClick={toggleDemo}>
                {isDemo ? '◐ MODO DEMO' : '● DATOS REALES'}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="status-dot" />
                <span style={{ fontFamily: 'var(--ds-font-data)', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--ds-tracking-data)' }}>Sistema Operativo</span>
              </div>
              
              <div style={{ fontFamily: 'var(--ds-font-data)', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', borderLeft: '1px solid var(--ds-border-default)', paddingLeft: 24 }}>
                {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
              </div>
            </div>
          </div>
          
          {/* CONTENT ROUTER MOUNT */}
          <div className="admin-content" id="admin-content-scroll">
            {children}
          </div>
          
        </div>
      </div>
    </>
  );
}
