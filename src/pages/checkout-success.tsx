import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

    useEffect(() => {
        const checkStatus = async (attempts = 0) => {
            const token = localStorage.getItem('token');
            if (!token) {
                setStatus('error');
                return;
            }

            try {
                const res = await fetch('/api/payments/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.isActive) {
                        setStatus('success');
                        return;
                    }
                }
                
                if (attempts < 3) {
                    setTimeout(() => checkStatus(attempts + 1), 2000);
                } else {
                    setStatus('error');
                }
            } catch (e) {
                if (attempts < 3) {
                    setTimeout(() => checkStatus(attempts + 1), 2000);
                } else {
                    setStatus('error');
                }
            }
        };

        checkStatus();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {status === 'processing' && (
                    <div className="space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-2xl font-bold text-white">Procesando Pago...</h2>
                        <p className="text-slate-400">Estamos confirmando tu suscripción con el banco.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h2>
                            <p className="text-slate-300">Bienvenido al nivel Premium de ComexIA.</p>
                        </div>
                        <Button 
                            onClick={() => navigate('/')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                        >
                            Ir al Panel <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <div className="text-3xl text-red-500">✕</div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Error en el Pago</h2>
                        <p className="text-slate-400">No pudimos procesar tu solicitud. Intenta nuevamente.</p>
                        <Button onClick={() => navigate('/')} variant="outline" className="text-white border-slate-700">
                            Volver
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
