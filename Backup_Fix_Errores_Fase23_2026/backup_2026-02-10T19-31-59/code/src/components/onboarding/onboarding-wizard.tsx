import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { CompanyRole, LogisticsServiceType } from "@/types/onboarding";

import { StepRoleSelection } from "./step-role-selection";
import { StepServiceConfig } from "./step-service-config";
import { StepVerification } from "./step-verification";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [services, setServices] = useState<LogisticsServiceType[]>([]);
  const [institutionalParams, setInstitutionalParams] = useState<any>({});
  const { toast } = useToast();

  const totalSteps = role === 'TRADER' ? 2 : role === 'INSTITUTIONAL' ? 3 : 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 1 && !role) {
      toast({ title: "Selecciona un rol", variant: "destructive" });
      return;
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleFinish = () => {
      // Here we would save to backend
      toast({
          title: "¡Solicitud Enviada!",
          description: "Tu perfil está siendo verificado. Te avisaremos pronto.",
          duration: 5000
      });
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#0B1120] border-slate-800 text-slate-100 p-0 overflow-hidden flex flex-col h-[90vh] sm:h-auto">
        
        {/* Header with Progress */}
        <div className="bg-slate-950 p-6 border-b border-slate-800">
           <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-mono text-blue-400">PASO {step} DE {totalSteps}</span>
              <span className="text-sm text-slate-500 font-medium">
                {step === 1 ? 'Selección de Rol' : step === totalSteps ? 'Verificación' : 'Configuración'}
              </span>
           </div>
           <Progress value={progress} className="h-1 bg-slate-900" 
            // Custom indicator color would need CSS or inline style override if shadcn doesn't support class on indicator
           />
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[url('/grid-pattern.svg')] bg-fixed">
            {step === 1 && (
                <StepRoleSelection selectedRole={role} onSelectRole={setRole} />
            )}
            
            {step === 2 && role && (
                role === 'TRADER' ? (
                     // Trader simple finish
                     <div className="text-center space-y-4 py-8">
                        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold">¡Todo listo!</h3>
                        <p className="text-slate-400">Como Comerciante, ya puedes acceder al Marketplace y buscar oportunidades.</p>
                     </div>
                ) : (
                    role === 'INSTITUTIONAL' && step === totalSteps ? (
                         <StepVerification />
                    ) : (
                         <StepServiceConfig 
                            role={role} 
                            services={services} 
                            setServices={setServices}
                            institutionalParams={institutionalParams}
                            setInstitutionalParams={setInstitutionalParams}
                        />
                    )
                )
            )}

            {step === 3 && role === 'INSTITUTIONAL' && (
                <StepVerification />
            )}
             
            {step === 3 && role === 'PARTNER' && (
                 // Partner finish or verify? 
                 // Assuming Partner also has verification or just routes. 
                 // Let's assume Partner finishes at step 2 (Config) if not institutional?
                 // Or add a summary step. For now let's reuse Verification for Partner optionally or finish.
                 // The prompt images show verification mainly for Institutional.
                 // Let's finish Partner here.
                  <div className="text-center space-y-4 py-8">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Perfil Logístico Creado</h3>
                        <p className="text-slate-400">Tus rutas y servicios ahora son visibles para los importadores.</p>
                 </div>
            )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between">
            <Button 
                variant="ghost" 
                onClick={handleBack} 
                disabled={step === 1}
                className="hover:bg-slate-900 text-slate-400"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Atrás
            </Button>

            {step === totalSteps ? (
                 <Button 
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                >
                    Finalizar y Solicitar Aprobación
                </Button>
            ) : (
                <Button 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500"
                >
                    Continuar
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
