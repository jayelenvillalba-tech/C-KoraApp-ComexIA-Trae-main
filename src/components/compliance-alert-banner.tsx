
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, Info, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';

export interface ComplianceWarning {
  message: string;
  messageEn: string;
  severity: 'info' | 'warning' | 'blocked';
  authority?: string;
}

export interface ComplianceAlertBannerProps {
  warnings: ComplianceWarning[];
  onClose?: () => void;
}

export const ComplianceAlertBanner = ({ warnings, onClose }: ComplianceAlertBannerProps) => {
  const { language } = useLanguage();

  if (!warnings || warnings.length === 0) return null;

  // Find the highest severity to determine banner style
  const maxSeverity = warnings.reduce((acc: 'info' | 'warning' | 'blocked', curr: ComplianceWarning) => {
    if (curr.severity === 'blocked') return 'blocked';
    if (curr.severity === 'warning' && acc !== 'blocked') return 'warning';
    return acc;
  }, 'info');

  const bannerStyles: Record<'info' | 'warning' | 'blocked', string> = {
    blocked: 'bg-red-600/20 border-red-500/50 text-red-100 shadow-red-900/40',
    warning: 'bg-amber-600/20 border-amber-500/50 text-amber-100 shadow-amber-900/40',
    info: 'bg-blue-600/20 border-blue-500/50 text-blue-100 shadow-blue-900/40'
  };

  const iconStyles: Record<'info' | 'warning' | 'blocked', React.ReactNode> = {
    blocked: <ShieldAlert className="w-6 h-6 text-red-400" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-400" />,
    info: <Info className="w-6 h-6 text-blue-400" />
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={`mb-6 p-4 rounded-xl border backdrop-blur-xl shadow-2xl relative overflow-hidden group ${bannerStyles[maxSeverity]}`}
      >
        {/* Animated background pulse for blockers */}
        {maxSeverity === 'blocked' && (
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/10 pointer-events-none"
          />
        )}

        <div className="flex items-start gap-4 relative z-10">
          <div className="mt-1 flex-shrink-0">
            {iconStyles[maxSeverity]}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              {maxSeverity === 'blocked' && (language === 'es' ? 'ALERTA DE CUMPLIMIENTO CRÍTICA' : 'CRITICAL COMPLIANCE ALERT')}
              {maxSeverity === 'warning' && (language === 'es' ? 'AVISO DE REGULACIÓN' : 'REGULATORY ADVISORY')}
              {maxSeverity === 'info' && (language === 'es' ? 'NOTIFICACIÓN DE COMERCIO' : 'TRADE NOTIFICATION')}
            </h3>
            
            <div className="space-y-2">
              {warnings.map((warning: ComplianceWarning, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <p className="text-sm font-medium leading-relaxed">
                    {language === 'es' ? warning.message : warning.messageEn}
                  </p>
                  {warning.authority && (
                    <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">
                      Source: {warning.authority}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-xs h-8">
                {language === 'es' ? 'MÁS DETALLES' : 'MORE DETAILS'}
              </Button>
              {maxSeverity !== 'blocked' && (
                 <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold ml-auto">
                    <ShieldCheck className="w-3 h-3" />
                    {language === 'es' ? 'VERIFICADO POR COMEXIA IA' : 'VERIFIED BY COMEXIA IA'}
                 </div>
              )}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8 ${
          maxSeverity === 'blocked' ? 'bg-red-400' : maxSeverity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
        } rounded-full blur-2xl`} />
      </motion.div>
    </AnimatePresence>
  );
};
