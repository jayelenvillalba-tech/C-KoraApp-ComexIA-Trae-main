/**
 * Feature Flags Configuration
 * Utilizado para encender o apagar componentes de forma rápida.
 */

export const FEATURES = {
  // 3D & WebGL
  ENABLE_3D_GLOBE: true, // Si es false, muestra mapa 2D básico o apaga la sección
  ENABLE_GOD_MODE_ORB: true, // Apaga el orbe 3D del AI si causa problemas de performance
  
  // Experimental
  ENABLE_AI_MARKET_ANALYSIS: true,
  ENABLE_ADVANCED_FILTERS: true,
  
  // Monitization / Subscription
  ENABLE_SUBSCRIPTION_WALL: false, // Por ahora apagado para demos
  
  // Development
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
};

// Helper function
export const isFeatureEnabled = (featureName: keyof typeof FEATURES): boolean => {
  return FEATURES[featureName] ?? false;
};
