
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType?: 'company' | 'employee';
  countryCode?: string; // e.g., 'AR', 'BR', 'UY', 'PY'
}

// MERCOSUR Requirements Mapping
const COUNTRY_REQUIREMENTS: Record<string, { label: string; key: string; required: boolean }[]> = {
  // Argentina
  'AR': [
    { label: 'Constancia de CUIT (AFIP)', key: 'cuit', required: true },
    { label: 'Estatuto Social / Contrato', key: 'bylaws', required: true },
    { label: 'DNI Representante Legal', key: 'identity', required: true }
  ],
  // Brazil
  'BR': [
    { label: 'Cartão CNPJ', key: 'cnpj', required: true },
    { label: 'Contrato Social', key: 'bylaws', required: true },
    { label: 'RG/CPF Representante', key: 'identity', required: true }
  ],
  // Uruguay
  'UY': [
    { label: 'Tarjeta RUT (DGI)', key: 'rut', required: true },
    { label: 'Certificado Notarial', key: 'notary', required: true },
    { label: 'CI Representante', key: 'identity', required: true }
  ],
  // Paraguay
  'PY': [
    { label: 'Constancia de RUC', key: 'ruc', required: true },
    { label: 'Escritura de Constitución', key: 'bylaws', required: true },
    { label: 'Cédula Representante', key: 'identity', required: true }
  ],
  // Default / International
  'default': [
    { label: 'Official Tax ID / Registration', key: 'tax_id', required: true },
    { label: 'Incorporation Document', key: 'bylaws', required: true },
    { label: 'Director ID / Passport', key: 'identity', required: true }
  ]
};

export default function VerificationModal({ 
  open, 
  onOpenChange,
  entityId,
  entityType = 'company',
  countryCode = 'AR' // Default fallback
}: VerificationModalProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [notes, setNotes] = useState("");

  const actualCountry = countryCode || 'default';
  const requirements = COUNTRY_REQUIREMENTS[actualCountry] || COUNTRY_REQUIREMENTS['default'];

  // Reset when opening
  useEffect(() => {
    if (open) {
      setUploadedFiles({});
      setNotes("");
    }
  }, [open]);

  const handleFileSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isValidType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType || !isValidSize) {
        toast({
          title: "Archivo inválido",
          description: "Solo PDF, JPG, PNG menor a 5MB.",
          variant: "destructive"
        });
        return;
      }

      setUploadedFiles(prev => ({ ...prev, [key]: file }));
    }
  };

  const removeFile = (key: string) => {
    const newFiles = { ...uploadedFiles };
    delete newFiles[key];
    setUploadedFiles(newFiles);
  };

  const handleSubmit = async () => {
    // Validate all required files are present
    const missing = requirements.filter(req => req.required && !uploadedFiles[req.key]);
    
    if (missing.length > 0) {
      toast({
        title: "Faltan documentos",
        description: `Por favor sube: ${missing.map(m => m.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    
    // Append Notes with Country Context
    const contextNote = `[Country: ${actualCountry}] ${notes}`;
    formData.append('notes', contextNote);
    
    // Append files with labeled names
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      // Rename file to include type for Admin convenience e.g. "CUIT_filename.pdf"
      const reqLabel = requirements.find(r => r.key === key)?.label.split(' ')[0] || key;
      const cleanLabel = reqLabel.replace(/[^a-zA-Z0-9]/g, '');
      const newName = `${cleanLabel}_${file.name}`;
      formData.append('documents', file, newName);
    });

    try {
      const res = await fetch('/api/verifications/request', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to submit verification');

      toast({
        title: language === 'es' ? 'Solicitud enviada' : 'Request sent',
        description: language === 'es' 
          ? 'Tus documentos serán revisados por un administrador.' 
          : 'Your documents will be reviewed by an administrator.',
      });
      
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass bg-[#0a1d2e]/80 border-white/5 backdrop-blur-[30px] text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Scanning Laser Animation during upload */}
        {isSubmitting && (
          <div className="absolute left-0 w-full h-[2px] bg-[var(--ds-cyan)] shadow-[0_0_20px_var(--ds-cyan)] z-50 animate-[scan_2s_ease-in-out_infinite]" />
        )}
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-full">
               <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <DialogTitle className="text-xl">
              {language === 'es' ? 'Verificación de Identidad' : 'Identity Verification'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            {language === 'es' 
              ? `Requisitos según tu país (${actualCountry}). Sube la documentación oficial para obtener la insignia.` 
              : `Requirements for your country (${actualCountry}). Upload official documentation to get the badge.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Dynamic Requirements List */}
          <div className="space-y-3 relative z-10">
            {requirements.map((req) => (
              <div 
                key={req.key} 
                className={`glass p-4 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  uploadedFiles[req.key] 
                    ? 'border-[var(--ds-amber)]/50 shadow-[0_0_15px_rgba(255,140,0,0.15)] bg-[var(--ds-amber)]/5' 
                    : 'border-white/5 opacity-80 grayscale hover:grayscale-[50%] hover:opacity-100 hover:border-white/20'
                }`}
              >
                {/* Background glow for uploaded */}
                {uploadedFiles[req.key] && (
                   <div className="absolute inset-0 bg-gradient-to-r from-[var(--ds-amber)]/0 via-[var(--ds-amber)]/10 to-[var(--ds-amber)]/0 opacity-50 pointer-events-none animate-pulse" />
                )}
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <Label className="text-white font-bold flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                      {req.label}
                      {req.required && <span className="text-red-400 text-[10px] uppercase font-data tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">REQ</span>}
                    </Label>
                    <p className="text-[10px] text-slate-400 font-data tracking-widest uppercase">
                      PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {uploadedFiles[req.key] ? (
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-[var(--ds-amber)]/30 shadow-inner">
                        <CheckCircle className="w-4 h-4 text-[var(--ds-amber)] drop-shadow-[0_0_5px_rgba(255,140,0,0.8)]" />
                        <span className="text-[11px] text-[var(--ds-amber)] font-bold font-data tracking-wider max-w-[100px] truncate">
                          {uploadedFiles[req.key].name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(req.key)}
                          className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect(req.key, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-300 hover:border-[var(--ds-cyan)] hover:text-[var(--ds-cyan)] hover:shadow-[0_0_15px_rgba(0,212,240,0.2)] transition-all font-bold">
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          {language === 'es' ? 'Subir' : 'Upload'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400 font-data text-[10px] uppercase tracking-widest">
                {language === 'es' ? 'Notas Adicionales (Opcional)' : 'Additional Notes (Optional)'}
            </Label>
            <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder={language === 'es' ? 'Comentarios para el revisor...' : 'Comments for the reviewer...'}
                className="bg-black/50 border-transparent text-white focus:border-[var(--ds-cyan)] focus:ring-1 focus:ring-[var(--ds-cyan)] focus:shadow-[0_0_15px_rgba(0,212,240,0.2)] transition-all rounded-xl shadow-inner placeholder:text-slate-600 min-h-[80px] p-3"
            />
          </div>
        </div>

        <DialogFooter className="relative z-10 pt-4 border-t border-white/5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-transparent text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]" style={{ fontFamily: 'var(--ds-font-data)' }}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-[var(--ds-cyan)] hover:bg-cyan-400 text-[#010609] min-w-[150px] shadow-[0_0_20px_rgba(0,212,240,0.3)] font-bold uppercase tracking-wider text-[11px] rounded-full"
            style={{ fontFamily: 'var(--ds-font-data)' }}
            disabled={isSubmitting}
          >
            {isSubmitting 
                ? (language === 'es' ? 'Enviando...' : 'Sending...') 
                : (language === 'es' ? 'Enviar Solicitud' : 'Submit Request')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
