
// Helper functions for country mapping
function getCountryCode(countryName: string | null): string {
    if (!countryName) return 'XX';
    const map: Record<string, string> = {
        'China': 'CN', 'India': 'IN', 'Estados Unidos': 'US', 'Brasil': 'BR', 'Alemania': 'DE',
        'Reino Unido': 'GB', 'Francia': 'FR', 'Italia': 'IT', 'Rusia': 'RU', 'Japón': 'JP',
        'Corea del Sur': 'KR', 'Chile': 'CL', 'Argentina': 'AR', 'México': 'MX', 'España': 'ES',
        'Australia': 'AU', 'Canadá': 'CA', 'Egipto': 'EG', 'Países Bajos': 'NL', 'Vietnam': 'VN',
        'Indonesia': 'ID', 'Argelia': 'DZ', 'Arabia Saudita': 'SA', 'Turquía': 'TR'
    };
    return map[countryName] || Object.values(map).includes(countryName) ? countryName : 'XX';
}

function getCountryCoordinates(countryCode: string): [number, number] {
    const coords: Record<string, [number, number]> = {
        'CN': [35.8617, 104.1954], 'IN': [20.5937, 78.9629], 'US': [37.0902, -95.7129],
        'BR': [-14.2350, -51.9253], 'DE': [51.1657, 10.4515], 'GB': [55.3781, -3.4360],
        'FR': [46.2276, 2.2137], 'IT': [41.8719, 12.5674], 'RU': [61.5240, 105.3188],
        'JP': [36.2048, 138.2529], 'KR': [35.9078, 127.7669], 'CL': [-35.6751, -71.5430],
        'AR': [-38.4161, -63.6167], 'MX': [23.6345, -102.5528], 'ES': [40.4637, -3.7492],
        'AU': [-25.2744, 133.7751], 'CA': [56.1304, -106.3468], 'EG': [26.8206, 30.8025],
        'NL': [52.1326, 5.2913], 'VN': [14.0583, 108.2772], 'ID': [-0.7893, 113.9213],
        'DZ': [28.0339, 1.6596], 'SA': [23.8859, 45.0792], 'TR': [38.9637, 35.2433]
    };
    return coords[countryCode] || [0, 0];
}
