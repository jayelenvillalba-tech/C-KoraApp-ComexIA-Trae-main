
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
        <div className="glass rounded-xl p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                <h3 className="text-white flex items-center gap-2 tracking-wide" style={{ fontFamily: 'Inter', fontWeight: 900 }}>
                    <div className="w-6 h-6 rounded bg-[var(--ds-cyan)]/20 flex items-center justify-center border border-[var(--ds-cyan)]/30">
                        <DollarSign className="w-3.5 h-3.5 text-[var(--ds-cyan)] drop-shadow-[0_0_5px_rgba(0,212,240,0.8)]" />
                    </div>
                    COSTO LANDED ESTIMADO
                </h3>
                <span className="text-[10px] bg-[var(--ds-cyan)]/10 border border-[var(--ds-cyan)]/30 text-[var(--ds-cyan)] font-data font-bold px-2 py-1 rounded uppercase tracking-widest">
                    {country}
                </span>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-[#0a1d2e] p-3 rounded-lg border-l-2 border-l-[var(--ds-cyan)]/50 border-y border-r border-white/5 hover:bg-black/40 transition-colors group">
                        <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-[10px] tracking-wider font-data">
                            <item.icon className={`w-3.5 h-3.5 ${item.color} group-hover:drop-shadow-[0_0_5px_currentColor]`} />
                            {item.label}
                        </div>
                        <div className="font-data text-white font-bold text-[14px]">
                            <span className="text-slate-500 mr-1">$</span>{itemId(item.amount)}
                        </div>
                    </div>
                ))}

                <div className="glass mt-5 flex items-center justify-between font-bold p-4 rounded-xl border border-[var(--ds-green)]/30 relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,255,0,0.1)]">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[var(--ds-green)]/10 to-transparent pointer-events-none" />
                    <span className="text-white font-data text-[11px] uppercase tracking-widest text-[#4a7090]">Total Estimado</span>
                    <span className="text-[20px] text-[var(--ds-green)] font-data font-bold drop-shadow-[0_0_10px_rgba(0,255,0,0.4)]">
                        <span className="text-slate-500 mr-1 text-[14px]">$</span>{itemId(landedCost)}
                    </span>
                </div>
            </div>
            
            <div className="mt-5 flex items-start gap-2 text-[9px] text-slate-500 bg-black/50 border border-white/5 p-3 rounded font-data uppercase tracking-wider">
                 <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--ds-cyan)]" />
                 Este cálculo es una estimación basada en promedios globales y aranceles vigentes. Confirme con su agente de aduanas.
            </div>
        </div>
    );
}

function itemId(amount: number) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
