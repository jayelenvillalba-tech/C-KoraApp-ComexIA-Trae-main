
import { DollarSign, ShieldCheck, Ship, Scale } from 'lucide-react';

interface CostItem {
    label: string;
    amount: number;
    icon: any;
    color: string;
}

interface LandedCostPanelProps {
    country: string;
    basePrice: number; // FOB
    landedCost: number;
    currency?: string;
}

export function LandedCostPanel({ country, basePrice, landedCost, currency = 'USD' }: LandedCostPanelProps) {
    // Estimación simplificada de componentes para visualización (ya que el backend manda el total)
    // En versión final el backend mandaría el desglose exacto
    const logistics = (landedCost - basePrice) * 0.7; // 70% del delta es flete/seguro
    const tariffs = (landedCost - basePrice) * 0.3;   // 30% del delta es aranceles/otros

    const items: CostItem[] = [
        { label: 'Precio FOB (Origen)', amount: basePrice, icon: DollarSign, color: 'text-blue-400' },
        { label: 'Flete & Seguro (Est.)', amount: logistics, icon: Ship, color: 'text-amber-400' },
        { label: 'Aranceles e Impuestos', amount: tariffs, icon: Scale, color: 'text-red-400' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-lg w-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Costo Landed Estimado
                </h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                    {country}
                </span>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            {item.label}
                        </div>
                        <div className="font-mono text-slate-200">
                            ${itemId(item.amount)}
                        </div>
                    </div>
                ))}

                <div className="border-t border-slate-700 pt-3 mt-2 flex items-center justify-between font-bold">
                    <span className="text-white">Total Estimado</span>
                    <span className="text-green-400 text-lg">${itemId(landedCost)}</span>
                </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-500 bg-slate-950 p-2 rounded">
                 <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                 Este cálculo es una estimación basada en promedios globales y aranceles vigentes. Confirme con su agente de aduanas.
            </div>
        </div>
    );
}

function itemId(amount: number) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
