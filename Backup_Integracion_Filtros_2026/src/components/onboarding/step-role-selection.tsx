import { ROLES_INFO, CompanyRole } from "@/types/onboarding";
import { Card } from "@/components/ui/card";
import { Globe, Truck, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepRoleSelectionProps {
  selectedRole: CompanyRole | null;
  onSelectRole: (role: CompanyRole) => void;
}

export function StepRoleSelection({ selectedRole, onSelectRole }: StepRoleSelectionProps) {
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'globe': return <Globe className={className} />;
      case 'truck': return <Truck className={className} />;
      case 'building': return <Building2 className={className} />;
      default: return <Globe className={className} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ¿Cuál es el rol principal de tu empresa?
        </h2>
        <p className="text-slate-400">Selecciona la opción que mejor describa tu actividad en el ecosistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.entries(ROLES_INFO) as [CompanyRole, typeof ROLES_INFO.TRADER][]).map(([key, info]) => {
          const isSelected = selectedRole === key;
          
          return (
            <Card
              key={key}
              onClick={() => onSelectRole(key)}
              className={cn(
                "relative cursor-pointer transition-all duration-300 border-2 overflow-hidden group",
                "hover:scale-105 hover:shadow-xl",
                isSelected 
                  ? "bg-slate-900/80 border-blue-500 shadow-blue-500/20" 
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-600"
              )}
            >
              <div className="p-6 flex flex-col items-center text-center h-full gap-4">
                {isSelected && (
                  <div className="absolute top-3 right-3 text-blue-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
                
                <div className={cn(
                  "p-4 rounded-full transition-colors",
                  isSelected ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                )}>
                  {getIcon(info.icon, "w-12 h-12")}
                </div>

                <div>
                  <h3 className={cn("font-bold text-lg mb-2", isSelected ? "text-white" : "text-slate-200")}>
                    {info.title}
                  </h3>
                  <div className="h-px w-full bg-slate-800 my-3" />
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
