import React, { useEffect } from 'react';
import { FeedbackWizard } from '@/components/feedback/FeedbackWizard';
import { RouteBackground } from '@/design-system/RouteBackground';
import { Settings, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/context/user-context';

export default function ControlPanel() {
  const { isAuthenticated, isLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/auth');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) return null;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] pt-24 pb-12 px-4 relative">
      <RouteBackground />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              Panel de Control y Feedback
            </h1>
            <p className="text-slate-500 mt-2">
              Ayudanos a mejorar Che.Comex. Reportá bugs, errores de datos o sugerencias de mejora.
            </p>
          </div>
          
          <Link href="/control-panel/historial">
            <a className="hidden sm:flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">
              Ver mis reportes <ExternalLink className="w-4 h-4" />
            </a>
          </Link>
        </div>

        <FeedbackWizard />
        
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/control-panel/historial">
            <a className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Ver mis reportes <ExternalLink className="w-4 h-4" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
