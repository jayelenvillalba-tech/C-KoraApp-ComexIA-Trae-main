export function RouteBackground() {
  return (
    <svg
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', opacity: 0.035,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradiente para las líneas — se desvanecen en los extremos */}
        <linearGradient id="route-fade-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00d4f0" stopOpacity="0"/>
          <stop offset="30%" stopColor="#00d4f0" stopOpacity="1"/>
          <stop offset="70%" stopColor="#00d4f0" stopOpacity="1"/>
          <stop offset="100%" stopColor="#00d4f0" stopOpacity="0"/>
        </linearGradient>

        {/* Punto de ruta animado */}
        <circle id="route-dot" r="2" fill="#00d4f0">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/>
        </circle>
      </defs>

      {/* Líneas de rutas — curvas suaves simulando rutas marítimas */}
      {/* AR → CN */}
      <path
        d="M 200,600 Q 600,200 1200,300"
        fill="none" stroke="url(#route-fade-h)" strokeWidth="0.5"
      >
        <animate attributeName="stroke-dasharray" from="0,2000" to="2000,0" dur="8s" repeatCount="indefinite"/>
      </path>

      {/* BR → DE */}
      <path
        d="M 350,580 Q 700,150 1000,250"
        fill="none" stroke="url(#route-fade-h)" strokeWidth="0.5"
      >
        <animate attributeName="stroke-dasharray" from="0,2000" to="2000,0" dur="12s" begin="2s" repeatCount="indefinite"/>
      </path>

      {/* MX → US → EU */}
      <path
        d="M 180,380 Q 400,200 800,220"
        fill="none" stroke="url(#route-fade-h)" strokeWidth="0.5"
      >
        <animate attributeName="stroke-dasharray" from="0,2000" to="2000,0" dur="10s" begin="4s" repeatCount="indefinite"/>
      </path>

      {/* Grid de puntos de navegación — puertos */}
      {[
        [180,600], [350,580], [1200,300], [1000,250], [800,220],
        [600,400], [900,450], [400,350], [1100,500],
      ].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="#00d4f0" opacity="0.6">
          <animate
            attributeName="opacity"
            values="0.2;0.8;0.2"
            dur={`${3 + i * 0.7}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
