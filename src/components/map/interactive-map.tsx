import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';

interface InteractiveMapProps {
  hsCode?: string;
  year?: number;
  onCountryClick?: (country: string) => void;
}

export default function InteractiveMap({ hsCode, year = 2024, onCountryClick }: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<'routes' | 'heat' | 'both'>('routes');

  // Fetch trade flows data
  const { data: tradeData } = useQuery({
    queryKey: ['trade-flows', hsCode, year],
    queryFn: async () => {
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
      attributionControl: false
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update trade routes when data changes
  useEffect(() => {
    if (!mapRef.current || !tradeData?.routes) return;

    const map = mapRef.current;

    // Clear existing layers (except base tile)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    if (selectedLayer === 'routes' || selectedLayer === 'both') {
      // Draw trade routes
      tradeData.routes.forEach((route: any) => {
        const { origin, destination, valueUsd, hsChapter } = route;
        
        // Skip if origin is not valid specific country (e.g. World)
        if (origin.code === 'World') return;

        // Calculate curve control point (arc effect)
        const midLat = (origin.lat + destination.lat) / 2;
        const midLng = (origin.lng + destination.lng) / 2;
        const offset = Math.abs(origin.lng - destination.lng) * 0.2;
        
        // Create curved line
        const latlngs = [
          [origin.lat, origin.lng],
          [midLat + offset, midLng],
          [destination.lat, destination.lng]
        ];

        // Color by HS chapter
        const color = getChapterColor(hsChapter);
        
        // Weight by value
        const weight = Math.max(1, Math.min(6, Math.log10(valueUsd) - 4));

        const curve = L.polyline(latlngs as any, {
          color: color,
          weight: weight,
          opacity: 0.8,
          smoothFactor: 1,
          className: 'trade-route' // CSS Animation
        }).addTo(map);

        curve.bindPopup(`
          <div style="color: #fff; background: #0D2137; padding: 8px; border-radius: 4px;">
            <strong>${origin.code} → ${destination.code}</strong><br/>
            Value: $${(valueUsd / 1000000).toFixed(1)}M USD<br/>
            Product: Chapter ${hsChapter}
          </div>
        `);
      });

      // Add origin/destination markers
      const uniqueLocations = new Map();
      tradeData.routes.forEach((route: any) => {
        if (route.origin.code !== 'World') uniqueLocations.set(route.origin.code, route.origin);
        uniqueLocations.set(route.destination.code, route.destination);
      });

      uniqueLocations.forEach((loc: any) => {
        L.circleMarker([loc.lat, loc.lng], {
          radius: 4,
          fillColor: '#00d4ff',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`
          <div style="color: #fff; background: #0D2137; padding: 8px; border-radius: 4px;">
            <strong>${loc.code}</strong>
          </div>
        `);
      });
    }

    if (selectedLayer === 'heat' || selectedLayer === 'both') {
        const maxVal = Math.max(...tradeData.routes.map((r: any) => r.valueUsd)) || 1;
        
        const destStats = new Map();
        tradeData.routes.forEach((r: any) => {
            const code = r.destination.code;
            if (!destStats.has(code)) {
                destStats.set(code, { lat: r.destination.lat, lng: r.destination.lng, total: 0 });
            }
            destStats.get(code).total += r.valueUsd;
        });

        destStats.forEach((stat) => {
            // Logarithmic scale for radius
            const intensity = stat.total / maxVal;
            const radius = 200000 + (intensity * 1000000); 

            L.circle([stat.lat, stat.lng], {
                color: 'transparent',
                fillColor: '#f59e0b', // Amber/Orange for heat
                fillOpacity: 0.3 + (intensity * 0.4),
                radius: radius
            }).addTo(map);
        });
    }
  }, [tradeData, selectedLayer]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#0D2137]/90 backdrop-blur-md border border-cyan-900/30 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">Layers</div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSelectedLayer('routes')}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              selectedLayer === 'routes'
                ? 'bg-cyan-500 text-white'
                : 'bg-[#0A1929] text-gray-400 hover:text-white'
            }`}
          >
            Trade Routes
          </button>
          <button
            onClick={() => setSelectedLayer('heat')}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              selectedLayer === 'heat'
                ? 'bg-cyan-500 text-white'
                : 'bg-[#0A1929] text-gray-400 hover:text-white'
            }`}
          >
            Heat Map
          </button>
          <button
            onClick={() => setSelectedLayer('both')}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              selectedLayer === 'both'
                ? 'bg-cyan-500 text-white'
                : 'bg-[#0A1929] text-gray-400 hover:text-white'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0D2137]/90 backdrop-blur-md border border-cyan-900/30 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">Trade Volume</div>
        <div className="flex items-center gap-2 text-xs text-white">
          <div className="w-8 h-0.5 bg-cyan-400" style={{ opacity: 0.3 }}></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white mt-1">
          <div className="w-8 h-1 bg-cyan-400" style={{ opacity: 0.6 }}></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white mt-1">
          <div className="w-8 h-2 bg-cyan-400"></div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
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
