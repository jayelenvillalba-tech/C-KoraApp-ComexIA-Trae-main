import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';

interface InteractiveMapProps {
  hsCode?: string;
  year?: number;
  onCountryClick?: (country: string) => void;
  topBuyers?: any[];
  recommended?: any[];
  cheComex?: any[];
}

export default function InteractiveMap({ 
  hsCode, 
  year = 2024, 
  onCountryClick,
  topBuyers = [],
  recommended = [],
  cheComex = [] 
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<'routes' | 'heat' | 'marketplace' | 'treaties' | 'macro' | 'all'>('all');

  // Fetch trade flows data (Keep this for context lines)
  const { data: tradeData } = useQuery({
    queryKey: ['trade-flows', hsCode, year],
    queryFn: async () => {
      // Return empty if no hsCode to prevent errors
      if (!hsCode) return { routes: [], heatmap: {} };
      const params = new URLSearchParams();
      if (hsCode) params.append('hsChapter', hsCode.substring(0, 2));
      params.append('year', year.toString());
      
      const res = await fetch(`/api/map/trade-flows?${params}`);
      if (!res.ok) return { routes: [], heatmap: {} };
      return res.json();
    }
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      noWrap: false
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map layers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing layers (except base tile)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // 1. Draw Trade Routes (Subtle background)
    if ((selectedLayer === 'routes' || selectedLayer === 'all') && tradeData?.routes) {
        // ... existing route logic (simplified for brevity) ...
    }

    // 2. MACRO DATA: Top 3 Buyers (Blue)
    if ((selectedLayer === 'macro' || selectedLayer === 'all') && topBuyers.length > 0) {
        topBuyers.forEach((buyer: any) => {
            if (buyer.coordinates) {
                const [lat, lng] = buyer.coordinates;
                // Add jitter
                const jLat = lat + (Math.random() * 0.5 - 0.25);
                const jLng = lng + (Math.random() * 0.5 - 0.25);

                const blueIcon = L.divIcon({
                    className: 'custom-blue-pin',
                    html: `<div class="w-6 h-6 rounded-full bg-blue-500/80 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center text-[10px] font-bold text-white">${buyer.rank}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                L.marker([jLat, jLng], { icon: blueIcon }).addTo(map)
                .bindPopup(`
                    <div class="p-2 bg-[#0A1929] text-white rounded text-xs border border-cyan-500/50">
                        <div class="font-bold text-cyan-400 mb-1">Top #${buyer.rank} Buyer</div>
                        <div class="font-medium">${buyer.country}</div>
                        ${buyer.volume ? `<div class="text-gray-400">${(buyer.volume/1000000).toFixed(1)}M tons</div>` : ''}
                    </div>
                `);

                // Also connect to origin (AR) if possible? No, clutter.
            }
        });
    }

    // 3. TREATY DATA (Green)
    if ((selectedLayer === 'treaties' || selectedLayer === 'all') && recommended.length > 0) {
        recommended.forEach((rec: any) => {
            if (rec.coordinates) {
                const [lat, lng] = rec.coordinates;
                const greenIcon = L.divIcon({
                    className: 'custom-green-pin',
                    html: `<div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([lat, lng], { icon: greenIcon }).addTo(map)
                .bindPopup(`
                    <div class="p-2 bg-[#0A1929] text-white rounded text-xs border border-green-500/50">
                        <div class="font-bold text-green-400 mb-1">Trade Agreement</div>
                        <div class="font-medium">${rec.country}</div>
                        <div class="text-gray-400 italic">${rec.treaty || 'Active Treaty'}</div>
                    </div>
                `);
            }
        });
    }

    // 4. MARKETPLACE DATA (Gold) - Using PROP now
    if ((selectedLayer === 'marketplace' || selectedLayer === 'all') && cheComex.length > 0) {
        cheComex.forEach((post: any) => {
             if (post.coordinates) {
                const [lat, lng] = post.coordinates;
                // Add jitter
                const jLat = lat + (Math.random() * 1.5 - 0.75);
                const jLng = lng + (Math.random() * 1.5 - 0.75);

                const goldIcon = L.divIcon({
                    className: 'custom-gold-pin',
                    html: `<div class="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([jLat, jLng], { icon: goldIcon }).addTo(map)
                 .bindPopup(`
                    <div class="min-w-[200px] p-0 overflow-hidden rounded-lg bg-slate-900 border border-amber-500/50 text-white">
                        <div class="bg-amber-500/10 p-2 border-b border-amber-500/20 flex items-center justify-between">
                            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Marketplace</span>
                            <span class="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">${post.activeOrders} orders</span>
                        </div>
                        <div class="p-3">
                            <h4 class="font-bold text-sm mb-1">${post.country}</h4>
                            <div class="text-xs text-slate-400 mb-2">Active Buyer Demand</div>
                        </div>
                    </div>
                 `);
             }
        });
    }

    // 5. [NEW] FLOW LINES (Animated Routes)
    // Draw lines from Origin (e.g., AR) to Top Buyers
    const originCoords = [-38.4161, -63.6167]; // Argentina coordinates (hardcoded for now as origin is usually AR)
    
    // Only draw flow lines if displaying Top Buyers or Recommendations
    if ((selectedLayer === 'macro' || selectedLayer === 'all') && topBuyers.length > 0) {
        topBuyers.forEach((buyer: any) => {
            if (buyer.coordinates) {
                 const latlngs: L.LatLngExpression[] = [
                    originCoords as [number, number],
                    buyer.coordinates as [number, number]
                ];
                
                const flowLine = L.polyline(latlngs, {
                    color: '#06b6d4', // Cyan
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '10, 10', // Dashed line
                    className: 'flow-line-anim' // We will add CSS animation
                }).addTo(map);

                // Add simple tooltip on hover
                flowLine.bindTooltip(`Trade Flow: AR -> ${buyer.countryCode}`, {
                    sticky: true,
                    direction: 'center',
                    className: 'bg-slate-900 text-cyan-400 border border-cyan-500/50'
                });
            }
        });
    }

  }, [tradeData, topBuyers, recommended, cheComex, selectedLayer]);

  return (
    <div className="relative w-full h-full bg-[#020617]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Styles */}
      <style>{`
        .leaflet-container { background: #020617; }
        .trade-route-subtle { stroke-dasharray: 5, 10; opacity: 0.4; }
        .leaflet-popup-content-wrapper { background: transparent; box-shadow: none; border: none; padding: 0; }
        .leaflet-popup-tip { background: #0f172a; border: 1px solid #f59e0b; }
        
        /* Flow Line Animation */
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-line-anim {
          animation: dash 5s linear infinite;
        }
      `}</style>
      
      {/* Layer Controls - Updated */}
      <div className="absolute top-4 right-4 z-10 bg-[#0f172a]/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 shadow-xl">
        <div className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">Che.Comex View</div>

        <div className="flex flex-col gap-2">
            <button onClick={() => setSelectedLayer('all')} className={`px-3 py-1.5 rounded text-xs text-left flex items-center gap-2 ${selectedLayer === 'all' ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-500/50' : 'text-gray-400 hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div> All Layers
            </button>
            <button onClick={() => setSelectedLayer('marketplace')} className={`px-3 py-1.5 rounded text-xs text-left flex items-center gap-2 ${selectedLayer === 'marketplace' ? 'bg-amber-900/30 text-amber-200 border border-amber-500/50' : 'text-gray-400 hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_#fbbf24]"></div> ⭐ Marketplace
            </button>
            <button onClick={() => setSelectedLayer('macro')} className={`px-3 py-1.5 rounded text-xs text-left flex items-center gap-2 ${selectedLayer === 'macro' ? 'bg-blue-900/30 text-blue-200 border border-blue-500/50' : 'text-gray-400 hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 🌍 Top Buyers
            </button>
            <button onClick={() => setSelectedLayer('treaties')} className={`px-3 py-1.5 rounded text-xs text-left flex items-center gap-2 ${selectedLayer === 'treaties' ? 'bg-green-900/30 text-green-200 border border-green-500/50' : 'text-gray-400 hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full bg-green-500"></div> 📜 Treaties
            </button>
        </div>
      </div>
    </div>
  );
}

// Simple Coordinate Helper - In real app, import from a shared data file
function getCountryCoords(code: string): [number, number] | null {
    const map: Record<string, [number, number]> = {
        'AR': [-34.6037, -58.3816],
        'BR': [-14.2350, -51.9253],
        'US': [37.0902, -95.7129],
        'CN': [35.8617, 104.1954],
        'DE': [51.1657, 10.4515],
        'ES': [40.4637, -3.7492],
        'IN': [20.5937, 78.9629],
        'JP': [36.2048, 138.2529],
        'RU': [61.5240, 105.3188],
        'AU': [-25.2744, 133.7751],
        // Default to a world-view point or null
    };
    return map[code] || map[code?.substring(0,2).toUpperCase()] || null;
}

// Helper function to get color by HS chapter
function getChapterColor(chapter: string): string {
  const colors: Record<string, string> = {
    '01': '#ef4444', // Red - Live animals
    '02': '#f97316', // Orange - Meat
    '10': '#eab308', // Yellow - Cereals
    '27': '#8b5cf6', // Purple - Oil
    '84': '#3b82f6', // Blue - Machinery
    '85': '#06b6d4', // Cyan - Electronics
    '87': '#10b981', // Green - Vehicles
  };
  return colors[chapter] || '#00d4ff'; // Default cyan
}
