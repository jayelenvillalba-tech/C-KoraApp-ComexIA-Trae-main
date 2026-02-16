/**
 * Distance Calculator Utility
 * Uses Haversine formula to calculate great-circle distance between two points
 */

interface Coordinates {
  lat: number;
  lon: number;
}

interface Distance {
  km: number;
  miles: number;
  nauticalMiles: number;
}

/**
 * Calculate distance between two geographic coordinates
 * @param lat1 Latitude of first point (degrees)
 * @param lon1 Longitude of first point (degrees)
 * @param lat2 Latitude of second point (degrees)
 * @param lon2 Longitude of second point (degrees)
 * @returns Distance in km, miles, and nautical miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Distance {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
    Math.cos(lat1Rad) * Math.cos(lat2Rad);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const km = R * c;
  const miles = km * 0.621371;
  const nauticalMiles = km * 0.539957;
  
  return {
    km: Math.round(km),
    miles: Math.round(miles),
    nauticalMiles: Math.round(nauticalMiles)
  };
}

/**
 * Calculate distance between two countries using their coordinates
 */
export function calculateCountryDistance(
  country1: Coordinates,
  country2: Coordinates
): Distance {
  return calculateDistance(
    country1.lat,
    country1.lon,
    country2.lat,
    country2.lon
  );
}

/**
 * Format distance for display
 */
export function formatDistance(distance: Distance, unit: 'km' | 'miles' = 'km'): string {
  const value = unit === 'km' ? distance.km : distance.miles;
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k ${unitLabel}`;
  }
  
  return `${value.toLocaleString()} ${unitLabel}`;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get estimated travel time by transport mode
 */
export function estimateTravelTime(
  distance: Distance,
  mode: 'air' | 'sea' | 'land'
): { hours: number; days: number } {
  let speedKmh: number;
  
  switch (mode) {
    case 'air':
      speedKmh = 800; // Average commercial flight speed
      break;
    case 'sea':
      speedKmh = 37; // Average cargo ship speed (20 knots)
      break;
    case 'land':
      speedKmh = 80; // Average truck speed
      break;
  }
  
  const hours = distance.km / speedKmh;
  const days = hours / 24;
  
  return {
    hours: Math.round(hours * 10) / 10,
    days: Math.round(days * 10) / 10
  };
}
