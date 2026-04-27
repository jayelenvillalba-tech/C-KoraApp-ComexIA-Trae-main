import React, { useEffect } from 'react';
import { ReportHistory } from '@/components/feedback/ReportHistory';
import { RouteBackground } from '@/design-system/RouteBackground';
import { History, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/context/user-context';

export default function FeedbackHistory() {
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/auth');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] pt-24 pb-12 px-4 relative">
      <RouteBackground />
      
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/control-panel">
            <a className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel de Control
            </a>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <History className="w-8 h-8 text-blue-500" />
              Mis Reportes
            </h1>
            <p className="text-slate-500 mt-2">
              Historial y estado de todos los reportes, bugs y sugerencias que enviaste.
            </p>
          </div>
        </div>

        <ReportHistory />
      </div>
    </div>
  );
}
