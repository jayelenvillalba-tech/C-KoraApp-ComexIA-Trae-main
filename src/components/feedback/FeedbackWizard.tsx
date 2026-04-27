import React, { useState, useEffect } from 'react';
import { 
  Bug, FileX2, Lightbulb, HelpCircle, AlertTriangle, 
  CheckCircle2, Upload, X, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubmitFeedback } from '@/hooks/useFeedback';
import { FeedbackType, FeedbackSeverity } from '@/types/feedback';
import { useToast } from '@/hooks/use-toast';

const MODULES = [
  'Análisis de Mercado con IA (búsqueda HS, mapa, simuladores)',
  'Marketplace B2B (publicaciones, matching, filtros)',
  'Gestión Documental (generación docs, certificados, trazabilidad)',
  'Mapa Interactivo y Recomendaciones',
  'Noticias Personalizadas',
  'Chat Colaborativo',
  'Suscripción y Perfil Empresarial',
  'Pagos (Stripe/MercadoPago)',
  'Otro/No estoy seguro'
];

export function FeedbackWizard() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const submitMutation = useSubmitFeedback();
  
  // Form State
  const [type, setType] = useState<FeedbackType | null>(null);
  const [module, setModule] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<FeedbackSeverity | null>(null);
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [correctSource, setCorrectSource] = useState('');

  // Draft saving
  useEffect(() => {
    const saved = localStorage.getItem('feedbackDraft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setType(parsed.type || null);
        setModule(parsed.module || '');
        setDescription(parsed.description || '');
        setSeverity(parsed.severity || null);
        setScreenshotData(parsed.screenshotData || '');
      } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const draft = { type, module, description, severity, screenshotData };
    localStorage.setItem('feedbackDraft', JSON.stringify(draft));
  }, [type, module, description, severity, screenshotData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Imagen muy grande',
        description: 'Por favor subí una imagen menor a 2MB, o usá un link en la descripción.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!type || !module || !description || !severity) return;

    let finalDesc = description;
    if (type === 'data_error' && correctSource) {
      finalDesc += `\n\nFuente Correcta Provista: ${correctSource}`;
    }
    if (severity === 'critical' && isUrgent) {
      finalDesc = `[URGENTE - BLOQUEA OPERACIÓN]\n` + finalDesc;
    }

    submitMutation.mutate({
      type,
      module,
      description: finalDesc,
      severity,
      screenshotData: screenshotData || undefined,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    }, {
      onSuccess: (data) => {
        toast({
          title: '¡Gracias por tu reporte!',
          description: data.message,
          className: 'bg-green-600 text-white border-none',
        });
        // Reset form
        localStorage.removeItem('feedbackDraft');
        setStep(6); // Success step
      },
      onError: (err: any) => {
        toast({
          title: 'Error al enviar',
          description: err.message || 'Algo salió mal. Por favor intentá de nuevo.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-[600px] mx-auto bg-slate-50 dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Control de Calidad
          </CardTitle>
          {step < 6 && (
            <span className="text-sm font-medium text-slate-500">Paso {step} de 5</span>
          )}
        </div>
        {step < 6 && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-out" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6 min-h-[300px]">
        {/* STEP 1: TYPE */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-medium mb-4">¿Qué encontraste?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'bug', icon: Bug, label: 'Bug visual o de funcionamiento' },
                { id: 'data_error', icon: FileX2, label: 'Error en datos (aranceles, etc)' },
                { id: 'suggestion', icon: Lightbulb, label: 'Sugerencia de mejora' },
                { id: 'other', icon: HelpCircle, label: 'Otro' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as FeedbackType)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                    type === t.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <t.icon className="w-8 h-8" />
                  <span className="font-medium text-sm text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: MODULE */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-medium mb-4">¿Dónde ocurrió?</h3>
            <div className="space-y-2">
              {MODULES.map((m) => (
                <button
                  key={m}
                  onClick={() => setModule(m)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                    module === m
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DESCRIPTION */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-medium mb-4">Contanos qué pasó</h3>
            <textarea
              className="w-full h-32 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder={
                type === 'bug' ? 'Describí el paso a paso: ¿qué hiciste antes de que ocurriera? ¿Qué esperabas que pase? ¿Qué pasó en cambio?' :
                type === 'data_error' ? '¿Qué dato viste que estaba mal? ¿De dónde sabés que es incorrecto? (link o fuente si tenés)' :
                type === 'suggestion' ? '¿Qué te gustaría que haga la plataforma? ¿Por qué te sería útil?' :
                'Escribí tu reporte aquí...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            {type === 'data_error' && (
              <div className="mt-4">
                <label className="text-sm font-medium mb-1 block">Fuente correcta (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Link a documento oficial u otra fuente..."
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
                  value={correctSource}
                  onChange={(e) => setCorrectSource(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SEVERITY */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-medium mb-4">¿Qué tan grave es?</h3>
            <div className="flex flex-col gap-3">
              {[
                { id: 'critical', color: 'red', label: '🔴 Crítica', desc: 'No puedo continuar / Bloquea mi operación' },
                { id: 'high', color: 'orange', label: '🟠 Alta', desc: 'Funciona mal o muestra datos incorrectos' },
                { id: 'medium', color: 'yellow', label: '🟡 Media', desc: 'Incómodo pero puedo seguir' },
                { id: 'low', color: 'green', label: '🟢 Baja', desc: 'Detalle cosmético o mejora menor' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id as FeedbackSeverity)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    severity === s.id
                      ? `border-${s.color}-500 bg-${s.color}-50 dark:bg-${s.color}-900/20 shadow-sm`
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{s.label}</div>
                  <div className="text-sm text-slate-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            {severity === 'critical' && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="urgent" 
                  checked={isUrgent} 
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label htmlFor="urgent" className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                  ¿Te impide completar una operación urgente? (Prioridad Alta)
                </label>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: EVIDENCE */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-lg font-medium mb-2">Evidencia (Opcional)</h3>
            <p className="text-sm text-slate-500 mb-4">
              Una imagen vale más que mil palabras. Capturá la pantalla completa si es posible. (Max 2MB)
            </p>
            
            {!screenshotData ? (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="font-medium text-slate-600 dark:text-slate-300">Click para subir imagen</span>
                <span className="text-xs text-slate-400">JPG, PNG, WEBP</span>
                <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                <img src={screenshotData} alt="Evidencia" className="w-full h-auto object-cover max-h-[300px]" />
                <button 
                  onClick={() => setScreenshotData('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: SUCCESS */}
        {step === 6 && (
          <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-center">¡Reporte Enviado!</h3>
            <p className="text-slate-500 text-center max-w-md">
              Gracias por ayudarnos a mejorar Che.Comex. Vamos a revisar esto lo antes posible.
            </p>
            <div className="flex gap-4 mt-8">
              <Button onClick={() => window.location.href = '/control-panel/historial'} variant="outline">
                Ver mis reportes
              </Button>
              <Button onClick={() => {
                setType(null); setModule(''); setDescription(''); setSeverity(null); setScreenshotData(''); setStep(1);
              }}>
                Enviar otro
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {step < 6 && (
        <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || submitMutation.isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
          </Button>

          {step < 5 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !type) || 
                (step === 2 && !module) || 
                (step === 3 && description.trim().length < 5) || 
                (step === 4 && !severity)
              }
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={submitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Enviar Reporte
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
