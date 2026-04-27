import React, { useState } from 'react';
import { useMyFeedbackReports } from '@/hooks/useFeedback';
import { FeedbackReportResponse } from '@/types/feedback';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Bug, FileX2, Lightbulb, HelpCircle, 
  MessageSquareWarning, ExternalLink, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TYPE_ICONS = {
  bug: <Bug className="w-4 h-4 text-red-500" />,
  data_error: <FileX2 className="w-4 h-4 text-orange-500" />,
  suggestion: <Lightbulb className="w-4 h-4 text-blue-500" />,
  other: <HelpCircle className="w-4 h-4 text-slate-500" />
};

const TYPE_LABELS = {
  bug: 'Bug',
  data_error: 'Error Datos',
  suggestion: 'Sugerencia',
  other: 'Otro'
};

const STATUS_CONFIG = {
  received: { label: 'Recibido', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_review: { label: 'En Revisión', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  resolved: { label: 'Resuelto', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  needs_info: { label: 'Necesita Info', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
};

export function ReportHistory() {
  const { data: reports, isLoading, error } = useMyFeedbackReports();
  const [selectedReport, setSelectedReport] = useState<FeedbackReportResponse | null>(null);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-12 bg-red-50 rounded-lg text-red-600">
        Algo salió mal al cargar tus reportes. Por favor recargá la página.
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="w-full text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
          Todavía no enviaste reportes
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          ¿Encontraste algo raro? Tu feedback nos ayuda a mejorar Che.Comex todos los días.
        </p>
        <button 
          onClick={() => window.location.href = '/control-panel'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Enviar mi primer reporte
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3 hidden sm:table-cell">Módulo</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                {report.reportId}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {TYPE_ICONS[report.type]}
                  <span className="font-medium">{TYPE_LABELS[report.type]}</span>
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                {report.module}
              </td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {format(new Date(report.createdAt), "d MMM, yy", { locale: es })}
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className={`border-none ${STATUS_CONFIG[report.status].className}`}>
                  {STATUS_CONFIG[report.status].label}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => setSelectedReport(report)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs flex items-center justify-end gap-1 w-full"
                >
                  Ver detalle <ExternalLink className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          {selectedReport && (
            <>
              <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-xl mb-1">
                      {TYPE_ICONS[selectedReport.type]} {TYPE_LABELS[selectedReport.type]}
                    </DialogTitle>
                    <p className="text-sm font-mono text-slate-500">{selectedReport.reportId}</p>
                  </div>
                  <Badge variant="secondary" className={`border-none ${STATUS_CONFIG[selectedReport.status].className}`}>
                    {STATUS_CONFIG[selectedReport.status].label}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Módulo</h4>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedReport.module}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Descripción</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                {selectedReport.adminNotes && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-500 uppercase tracking-wider mb-2">Respuesta del Equipo</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                      {selectedReport.adminNotes}
                    </div>
                  </div>
                )}

                {selectedReport.screenshotData && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidencia Adjunta</h4>
                    <img 
                      src={selectedReport.screenshotData} 
                      alt="Captura de pantalla adjunta" 
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                )}
                
                <div className="text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  Enviado el {format(new Date(selectedReport.createdAt), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
