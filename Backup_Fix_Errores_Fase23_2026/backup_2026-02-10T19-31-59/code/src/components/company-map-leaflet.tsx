
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Company } from '@shared/schema';
import { calculateDistance, formatDistance } from '@/utils/distance-calculator';

// Fix for default marker icon
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface CompanyMapLeafletProps {
  companies: Company[];
}

// Country center coordinates
const countryCoords: Record<string, { lat: number; lon: number; name: string }> = {
  'AR': { lat: -38.4161, lon: -63.6167, name: 'Argentina' },
  'BR': { lat: -14.2350, lon: -51.9253, name: 'Brasil' },
  'UY': { lat: -32.5228, lon: -55.7658, name: 'Uruguay' },
  'PY': { lat: -23.4425, lon: -58.4438, name: 'Paraguay' },
  'CL': { lat: -35.6751, lon: -71.5430, name: 'Chile' }
};

export default function CompanyMapLeaflet({ companies }: CompanyMapLeafletProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  
  // Center of South America roughly
  const center: [number, number] = [-25.0, -60.0]; 

  // Group companies by country for stats
  const companiesByCountry = companies.reduce((acc, company) => {
    acc[company.country] = (acc[company.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate distance if two countries are selected
  const distanceInfo = selectedCountry && hoveredCountry && selectedCountry !== hoveredCountry
    ? calculateDistance(
        countryCoords[selectedCountry].lat,
        countryCoords[selectedCountry].lon,
        countryCoords[hoveredCountry].lat,
        countryCoords[hoveredCountry].lon
      )
    : null;

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-2xl border border-white/20 relative z-0">
      <MapContainer 
        center={center} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Distance line between selected and hovered country */}
        {distanceInfo && selectedCountry && hoveredCountry && (
          <Polyline
            positions={[
              [countryCoords[selectedCountry].lat, countryCoords[selectedCountry].lon],
              [countryCoords[hoveredCountry].lat, countryCoords[hoveredCountry].lon]
            ]}
            pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '10, 10' }}
          >
            <Tooltip permanent direction="center" className="bg-blue-600 text-white px-3 py-1 rounded-full font-semibold">
              {formatDistance(distanceInfo, 'km')} / {formatDistance(distanceInfo, 'miles')}
            </Tooltip>
          </Polyline>
        )}
        
        {companies.map((company) => {
          // Generate random coordinates near the country's center if not provided
          const lat = company.country === 'AR' ? -34.6 + (Math.random() - 0.5) * 5 :
                      company.country === 'BR' ? -15.8 + (Math.random() - 0.5) * 10 :
                      company.country === 'UY' ? -32.5 + (Math.random() - 0.5) * 2 :
                      company.country === 'PY' ? -23.4 + (Math.random() - 0.5) * 2 :
                      company.country === 'CL' ? -33.4 + (Math.random() - 0.5) * 5 :
                      -25.0 + (Math.random() - 0.5) * 10;
                      
          const lng = company.country === 'AR' ? -58.4 + (Math.random() - 0.5) * 5 :
                      company.country === 'BR' ? -47.9 + (Math.random() - 0.5) * 10 :
                      company.country === 'UY' ? -55.7 + (Math.random() - 0.5) * 2 :
                      company.country === 'PY' ? -58.4 + (Math.random() - 0.5) * 2 :
                      company.country === 'CL' ? -70.6 + (Math.random() - 0.5) * 2 :
                      -60.0 + (Math.random() - 0.5) * 10;

          return (
            <Marker 
              key={company.id} 
              position={[lat, lng]} 
              icon={defaultIcon}
              eventHandlers={{
                click: () => setSelectedCountry(company.country),
                mouseover: () => setHoveredCountry(company.country),
                mouseout: () => setHoveredCountry(null)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <h3 className="font-bold text-lg text-slate-800">{company.name}</h3>
                  <p className="text-slate-600 text-sm mb-2">{company.description}</p>
                  
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <p className="text-xs font-semibold text-slate-700 mb-1">País: {countryCoords[company.country]?.name || company.country}</p>
                    <p className="text-xs text-slate-600">Empresas en {company.country}: {companiesByCountry[company.country] || 0}</p>
                  </div>
                  
                  <div className="mt-2 flex gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {company.country}
                    </span>
                    {company.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verificado
                      </span>
                    )}
                  </div>
                  
                  {selectedCountry && selectedCountry !== company.country && (
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <p className="text-xs font-semibold text-blue-700">
                        📏 Distancia desde {countryCoords[selectedCountry]?.name}:
                      </p>
                      <p className="text-sm font-bold text-blue-900">
                        {formatDistance(
                          calculateDistance(
                            countryCoords[selectedCountry].lat,
                            countryCoords[selectedCountry].lon,
                            countryCoords[company.country].lat,
                            countryCoords[company.country].lon
                          ),
                          'km'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Distance info overlay */}
      {selectedCountry && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000] border border-blue-200">
          <p className="text-xs font-semibold text-slate-600">País seleccionado:</p>
          <p className="text-sm font-bold text-blue-700">{countryCoords[selectedCountry]?.name}</p>
          <p className="text-xs text-slate-500 mt-1">Haz hover en otro país para ver distancia</p>
        </div>
      )}
    </div>
  );
}
