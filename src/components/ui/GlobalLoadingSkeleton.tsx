import React from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function GlobalLoadingSkeleton() {
  const [location] = useLocation();

  // Basic generic skeleton lines
  const renderLines = (count: number) => (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-white/5 rounded animate-pulse" 
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }} 
        />
      ))}
    </div>
  );

  // Layout matching /trade-flow or /company-map (Map centric)
  if (location.includes('trade-flow') || location.includes('map')) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col pt-24 pb-12 px-6 animate-in fade-in duration-500">
        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-6">
          <div className="h-12 w-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="flex-1 min-h-[60vh] bg-white/5 rounded-2xl border border-white/10 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Layout matching /analysis
  if (location.includes('analysis')) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col pt-24 pb-12 px-6 animate-in fade-in duration-500">
        <div className="max-w-7xl w-full mx-auto">
          <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-6">
              <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
              <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
            </div>
            <div className="md:col-span-8 space-y-6">
              <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout matching /marketplace
  if (location.includes('marketplace')) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col pt-24 pb-12 px-6 animate-in fade-in duration-500">
        <div className="max-w-7xl w-full mx-auto">
          <div className="flex justify-between mb-8">
            <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generic fallback
  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center pt-24 px-6">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-8" />
      <div className="max-w-2xl w-full mx-auto bg-white/5 p-8 rounded-2xl border border-white/10">
        {renderLines(4)}
      </div>
    </div>
  );
}
