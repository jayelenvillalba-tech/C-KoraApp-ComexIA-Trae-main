import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  dataPoints?: number;
}

export default function ConfidenceBadge({ level, dataPoints }: ConfidenceBadgeProps) {
  const config = {
    high: {
      icon: CheckCircle2,
      color: 'bg-green-600/20 text-green-400 border-green-600/50',
      label: 'Alta Confianza',
      description: dataPoints ? `${dataPoints} años de datos históricos` : 'Datos verificados'
    },
    medium: {
      icon: AlertTriangle,
      color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50',
      label: 'Confianza Media',
      description: dataPoints ? `${dataPoints} años de datos` : 'Datos parciales'
    },
    low: {
      icon: Info,
      color: 'bg-gray-600/20 text-gray-400 border-gray-600/50',
      label: 'Confianza Baja',
      description: 'Estimación basada en patrones'
    }
  };

  const { icon: Icon, color, label, description } = config[level];

  return (
    <div className="inline-flex items-center gap-2">
      <Badge className={`${color} border px-3 py-1.5 flex items-center gap-2`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{label}</span>
      </Badge>
      <span className="text-xs text-gray-500">{description}</span>
    </div>
  );
}
