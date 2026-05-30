# Changelog

Todos los cambios notables del proyecto Che.Comex estarán documentados en este archivo.

## [Unreleased] - Sprint 4 (Final)

### 🚀 Añadido
- **Global Error Boundary**: Implementación de una pantalla de error premium para capturar excepciones no controladas de React en producción, mejorando drásticamente la resiliencia de la app.
- **Global Error Handler**: Captura automática de `unhandledrejection` y `window.onerror`.
- **Feature Flags**: Nuevo sistema base en `src/config/features.ts` para encender/apagar características experimentales (ej: `ENABLE_3D_GLOBE`).
- **SEO Liviano**: Títulos dinámicos en todas las rutas a través del nuevo hook `useDocumentTitle`, prescindiendo de librerías de terceros.
- **Navegación Móvil (Header)**: Drawer deslizante responsivo (utilizando Shadcn `Sheet`) para navegación fluida en dispositivos móviles.

### ⚡ Optimizado
- **Rendimiento 3D**: Lazy loading y code-splitting (con `React.Suspense`) para componentes masivos como `PremiumGlobe3D`, `WorldMap4D` y `GodModeOrb`.
- **React Rendering**: Aplicación intensiva de `React.memo` y `useMemo` para evitar re-renders en componentes de alto coste computacional.
- **Gestión de Caché**: Reducción de repeticiones de llamadas a red optimizando `staleTime` (5 mins) y `gcTime` (30 mins) en `queryClient.ts`.
- **Limpieza de Código**: Removidos todos los `console.log` residuales de la carpeta `src/`.
- **Code Splitting (Rutas)**: División de rutas pesadas en `App.tsx` para aligerar el `index.js` inicial.

### 💅 Mejorado
- **Legal Layout**: Refactorizado de barra lateral a menú estilo acordeón/dropdown para uso móvil.
- **Responsive Tables y Footer**: Ajustes estructurales finos para asegurar fluidez en cualquier resolución de dispositivo.
