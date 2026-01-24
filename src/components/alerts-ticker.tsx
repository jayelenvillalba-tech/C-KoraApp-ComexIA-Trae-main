import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface Alert {
  id: string;
  title: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export function AlertsTicker() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    queryFn: async () => {
        const res = await fetch("/api/alerts?urgency=high");
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    }
  });

  const criticalAlert = alerts?.find(a => a.severity === 'critical' || a.severity === 'high');

  if (!isVisible || !criticalAlert) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 backdrop-blur-md border-b border-red-500/20 px-4 py-2 text-sm font-medium flex items-center justify-between">
      <div 
        className="container mx-auto flex items-center gap-2 cursor-pointer"
        onClick={() => setLocation('/alerts')}
      >
        <div className="bg-red-500/20 p-1 rounded">
             <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        </div>
        <span className="uppercase tracking-wider font-bold text-red-400 mr-2">
            REGULATORY ALERT:
        </span>
        <span className="truncate text-red-100">
            {criticalAlert.title}
        </span>
        <span className="ml-2 text-xs text-red-400/80 hover:text-red-300 flex items-center gap-1 transition-colors">
            Ver detalles <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-red-400/50 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
