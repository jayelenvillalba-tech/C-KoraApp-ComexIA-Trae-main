import { useState } from "react";
import { CompanyRole, LogisticsServiceType, InstitutionalScope } from "@/types/onboarding";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ship, Plane, FileText, Warehouse, Plus, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepServiceConfigProps {
  role: CompanyRole;
  services: LogisticsServiceType[];
  setServices: (services: LogisticsServiceType[]) => void;
  // Others
  institutionalParams?: any;
  setInstitutionalParams?: (params: any) => void;
}

export function StepServiceConfig({ 
  role, 
  services, 
  setServices,
  institutionalParams, 
  setInstitutionalParams 
}: StepServiceConfigProps) {
  const [routes, setRoutes] = useState<{from: string, to: string}[]>([]);
  const [newRoute, setNewRoute] = useState({from: '', to: ''});

  const toggleService = (service: LogisticsServiceType) => {
    if (services.includes(service)) {
      setServices(services.filter(s => s !== service));
    } else {
      setServices([...services, service]);
    }
  };

  const addRoute = () => {
    if (newRoute.from && newRoute.to) {
      setRoutes([...routes, { ...newRoute }]);
      setNewRoute({ from: '', to: '' });
    }
  };

  const logisticsOptions = [
    { id: 'MARITIME', label: 'Flete Marítimo', icon: <Ship className="w-8 h-8"/> },
    { id: 'AIR', label: 'Flete Aéreo', icon: <Plane className="w-8 h-8"/> },
    { id: 'CUSTOMS', label: 'Despachante', icon: <FileText className="w-8 h-8"/> },
    { id: 'WAREHOUSE', label: 'Depósito Fiscal', icon: <Warehouse className="w-8 h-8"/> },
  ] as const;

  if (role === 'PARTNER') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white">Definamos tus servicios logísticos</h2>
            <p className="text-slate-400">Esto nos ayuda a conectarte con cargas reales y optimizar tus rutas.</p>
        </div>

        {/* Section 1 - Services */}
        <div className="space-y-4">
            <Label className="text-base">¿Qué tipo de servicios ofrecés?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {logisticsOptions.map((opt) => {
                    const isSelected = services.includes(opt.id);
                    return (
                        <Card 
                            key={opt.id}
                            onClick={() => toggleService(opt.id)}
                            className={cn(
                                "cursor-pointer p-4 flex flex-col items-center gap-3 transition-colors border-2",
                                isSelected 
                                    ? "bg-slate-800 border-blue-500 text-blue-400" 
                                    : "bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-500"
                            )}
                        >
                            {opt.icon}
                            <span className="text-sm font-medium text-center">{opt.label}</span>
                        </Card>
                    );
                })}
            </div>
        </div>

        {/* Section 2 - Routes */}
        <div className="space-y-4">
             <Label className="text-base">Rutas Frecuentes</Label>
             <div className="flex gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Origen (ej. China)" 
                            className="pl-9 bg-slate-900 border-slate-700"
                            value={newRoute.from}
                            onChange={(e) => setNewRoute({...newRoute, from: e.target.value})}
                        />
                    </div>
                    <div className="relative">
                         <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Destino (ej. Buenos Aires)" 
                            className="pl-9 bg-slate-900 border-slate-700"
                            value={newRoute.to}
                            onChange={(e) => setNewRoute({...newRoute, to: e.target.value})}
                        />
                    </div>
                </div>
                <Button onClick={addRoute} className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4" />
                </Button>
             </div>

             <div className="flex flex-wrap gap-2">
                {routes.map((route, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 bg-slate-800 text-slate-300 gap-2 border border-slate-700">
                        {route.from} &rarr; {route.to}
                        <X 
                            className="w-3 h-3 cursor-pointer hover:text-red-400" 
                            onClick={() => setRoutes(routes.filter((_, i) => i !== idx))}
                        />
                    </Badge>
                ))}
             </div>
        </div>
      </div>
    );
  }

  if (role === 'INSTITUTIONAL') {
      return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-white">Configuración Institucional</h2>
                <p className="text-slate-400">Define el alcance y los servicios que ofrecerás a los socios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Jurisdicción</Label>
                    <Select 
                        value={institutionalParams?.jurisdiction || ''} 
                        onValueChange={(val) => setInstitutionalParams({...institutionalParams, jurisdiction: val})}
                    >
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NACIONAL">Nacional</SelectItem>
                            <SelectItem value="PROVINCIAL">Provincial</SelectItem>
                            <SelectItem value="MUNICIPAL">Municipal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Sector</Label>
                    <Select
                         value={institutionalParams?.sector || ''} 
                         onValueChange={(val) => setInstitutionalParams({...institutionalParams, sector: val})}
                    >
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                            <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AGRO">Agroindustria</SelectItem>
                            <SelectItem value="TECH">Tecnología</SelectItem>
                            <SelectItem value="MULTI">Multisectorial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
                 <Label className="text-base text-slate-300">Servicios digitales habilitados</Label>
                 <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                        <Checkbox id="cert" checked disabled className="mt-1" />
                        <div>
                            <Label htmlFor="cert" className="font-medium text-slate-200">Emitir Certificados de Origen</Label>
                            <p className="text-xs text-slate-500">Se habilitará el módulo de certificación en la app.</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                        <Checkbox id="cap" checked disabled className="mt-1" />
                        <div>
                            <Label htmlFor="cap" className="font-medium text-slate-200">Ofrecer Capacitaciones</Label>
                            <p className="text-xs text-slate-500">Vincular al blog y sistema de eventos.</p>
                        </div>
                    </div>
                 </div>
            </div>
          </div>
      );
  }

  return (
      <div className="text-center py-12 text-slate-500">
          <p>Configuración básica para Comerciantes (Sin pasos extra por ahora).</p>
      </div>
  );
}
