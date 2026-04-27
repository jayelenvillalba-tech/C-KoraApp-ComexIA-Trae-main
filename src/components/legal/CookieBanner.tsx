import React, { useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export default function CookieBanner() {
  const { consent, showBanner, acceptAll, acceptEssential, acceptCustom } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  
  // Local state for custom preferences
  const [prefs, setPrefs] = useState({
    analytics: consent?.analytics || false,
    functional: consent?.functional || false,
    marketing: consent?.marketing || false,
  });

  if (!showBanner) return null;

  const handleCustomSave = () => {
    acceptCustom(prefs);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[var(--ds-bg-overlay)] border-t border-[var(--ds-border-default)] p-4 md:p-6 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex-1 space-y-2">
            <h3 className="text-[var(--ds-text-primary)] font-bold text-lg flex items-center gap-2">
              <span>🍪</span> Usamos cookies para mejorar tu experiencia
            </h3>
            <p className="text-[var(--ds-text-secondary)] text-sm leading-relaxed max-w-3xl">
              Che.Comex usa cookies esenciales para funcionar y cookies opcionales para mejorar el servicio. Podés personalizar tu preferencia o aceptar todas.
            </p>
            <p className="text-[var(--ds-text-tertiary)] text-xs mt-1">
              Al continuar, aceptás nuestra <a href="/legal/privacy" className="text-[var(--ds-cyan)] hover:underline">Política de Privacidad</a>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm font-medium text-[var(--ds-text-secondary)] bg-transparent border border-[var(--ds-border-subtle)] hover:border-[var(--ds-border-default)] hover:text-[var(--ds-text-primary)] rounded-[var(--ds-radius-md)] transition-colors"
            >
              Personalizar
            </button>
            <button
              onClick={acceptEssential}
              className="px-4 py-2 text-sm font-medium text-[var(--ds-text-primary)] bg-[var(--ds-bg-subtle)] hover:bg-[var(--ds-bg-default)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-md)] transition-colors"
            >
              Solo esenciales
            </button>
            <button
              onClick={acceptAll}
              className="px-5 py-2 text-sm font-semibold text-black bg-[var(--ds-cyan)] hover:bg-[#00c8a5] rounded-[var(--ds-radius-md)] transition-colors"
            >
              Aceptar todas →
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-[var(--ds-border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Necessary */}
            <div className="bg-[var(--ds-bg-subtle)] p-4 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[var(--ds-text-primary)] text-sm">COOKIES NECESARIAS</h4>
                <span className="text-xs font-medium text-[var(--ds-cyan)]">● Siempre activas</span>
              </div>
              <p className="text-xs text-[var(--ds-text-secondary)]">
                Autenticación, seguridad, funcionamiento básico.
              </p>
            </div>

            {/* Functional */}
            <div className="bg-[var(--ds-bg-subtle)] p-4 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[var(--ds-text-primary)] text-sm">COOKIES FUNCIONALES</h4>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only peer" checked={prefs.functional} onChange={(e) => setPrefs({...prefs, functional: e.target.checked})} />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--ds-cyan)]"></div>
                </label>
              </div>
              <p className="text-xs text-[var(--ds-text-secondary)]">
                Idioma, preferencias de interfaz, tema.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-[var(--ds-bg-subtle)] p-4 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[var(--ds-text-primary)] text-sm">COOKIES ANALÍTICAS</h4>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only peer" checked={prefs.analytics} onChange={(e) => setPrefs({...prefs, analytics: e.target.checked})} />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--ds-cyan)]"></div>
                </label>
              </div>
              <p className="text-xs text-[var(--ds-text-secondary)]">
                Estadísticas anónimas de uso para mejorar el producto.
              </p>
            </div>

            {/* Marketing */}
            <div className="bg-[var(--ds-bg-subtle)] p-4 rounded-[var(--ds-radius-md)] border border-[var(--ds-border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[var(--ds-text-primary)] text-sm">COOKIES DE MARKETING</h4>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only peer" checked={prefs.marketing} onChange={(e) => setPrefs({...prefs, marketing: e.target.checked})} />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--ds-cyan)]"></div>
                </label>
              </div>
              <p className="text-xs text-[var(--ds-text-secondary)]">
                Publicidad personalizada y redes sociales.
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                onClick={handleCustomSave}
                className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-gray-200 rounded-[var(--ds-radius-md)] transition-colors"
              >
                Guardar preferencias
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
