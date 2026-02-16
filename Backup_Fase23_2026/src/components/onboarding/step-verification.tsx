import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Upload, Lock, Check } from "lucide-react";

export function StepVerification() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Verificación de autoridad (Requerida)
            </h2>
            <p className="text-slate-400">Para garantizar máxima confianza, necesitamos verificar tu identidad oficial.</p>
        </div>

        <div className="flex justify-center py-4">
             <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-500/20 to-transparent flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <Lock className="w-10 h-10 text-blue-400" />
             </div>
        </div>

        <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-2">
                <Label>Email con dominio oficial (.gob o .org)</Label>
                <Input 
                    placeholder="nombre@ejemplo.gob.ar" 
                    className="bg-slate-900 border-slate-700 focus:border-blue-500 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

             <div className="space-y-2">
                <Label>Carta de Acreditación</Label>
                <div className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-lg p-6 text-center hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="font-medium">Subir PDF firmado por autoridad</span>
                        <span className="text-xs text-slate-600">Máx. 5MB</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
                
                <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-800 pb-2">Vista previa del Sello</h4>
                
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <div className="w-16 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform cursor-help">
                            <ShieldCheck className="text-yellow-900 w-8 h-8" />
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1 border-2 border-slate-900">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        </div>
                     </div>
                     <div>
                        <h3 className="font-bold text-yellow-500 text-lg">Miembro Verificado</h3>
                        <p className="text-xs text-slate-400">de la Cámara de Exportadores</p>
                     </div>
                </div>
            </div>
            
            <p className="text-xs text-center text-slate-500">
                Tu cuenta quedará en <span className="italic text-slate-400">Pendiente de Aprobación</span> hasta que nuestro equipo valide la documentación.
            </p>
        </div>
    </div>
  );
}
