import React, { useEffect, useRef } from 'react';

interface WorldMap4DProps {
  className?: string;
}

export default function WorldMap4D({ className = '' }: WorldMap4DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // DATOS GEOGRÁFICOS (Coordenadas Normalizadas 1000x500)
    // Usamos esto para generar la "Nube de Puntos" (Dot Matrix)
    const worldPolygons = [
        // North America (Simplified)
        [ [150,60], [280,45], [360,120], [280,260], [200,240], [140,180], [100,100] ],
        // Greenland
        [ [370,40], [430,30], [450,80], [400,100], [380,80] ],
        // South America
        [ [280,270], [380,300], [340,430], [300,490], [260,400], [250,300] ],
        // Europe
        [ [460,90], [520,70], [600,60], [550,150], [500,160], [460,140], [440,140] ],
        // Africa
        [ [460,175], [560,170], [610,240], [560,400], [480,380], [430,250] ],
        // Asia (Mainland + India)
        [ [600,60], [800,50], [920,100], [950,250], [850,320], [750,350], [700,280], [620,180] ],
        // Japan
        [ [930,150], [950,160], [940,190], [920,170] ],
        // Australia
        [ [800,360], [900,350], [920,430], [840,460], [790,410] ],
        // UK
        [ [460, 110], [480, 100], [480, 130], [460, 120] ],
        // Indonesia Area
        [ [750, 310], [820, 310], [800, 340], [760, 330] ]
    ];

    // Algoritmo "Point in Polygon" para determinar si un punto de la grilla es tierra
    const isPointInPolygon = (x: number, y: number, poly: number[][]) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i][0], yi = poly[i][1];
            const xj = poly[j][0], yj = poly[j][1];
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // GENERACIÓN DE DOT MATRIX (Una sola vez)
    // Creamos una grilla densa y guardamos los puntos que caen dentro de los continentes
    const DOT_SPACING = 8; // Espaciado entre puntos (menor = mas resolucion)
    const mapDots: {x: number, y: number, brightness: number}[] = [];
    
    // Normal grid generation (0-1000, 0-500 reference space)
    for(let x=0; x<=1000; x+=DOT_SPACING) {
        for(let y=0; y<=500; y+=DOT_SPACING) {
            // Check collisions
            let isLand = false;
            for(const poly of worldPolygons) {
                if(isPointInPolygon(x, y, poly)) {
                    isLand = true;
                    break;
                }
            }
            if(isLand) {
                mapDots.push({ 
                    x: x / 1000, // Normalize 0-1
                    y: y / 500,  // Normalize 0-1 
                    brightness: Math.random() // Variación aleatoria inicial
                });
            }
        }
    }

    const hubs = [
        { name: "New York", x: 0.26, y: 0.28 },
        { name: "London", x: 0.47, y: 0.23 },
        { name: "Dubai", x: 0.61, y: 0.35 },
        { name: "Shanghai", x: 0.79, y: 0.32 },
        { name: "Tokyo", x: 0.89, y: 0.30 },
        { name: "Sao Paulo", x: 0.33, y: 0.68 },
        { name: "Sydney", x: 0.86, y: 0.76 },
        { name: "Cape Town", x: 0.52, y: 0.72 }
    ];

    const routes = [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [3, 6], [1, 7], [7, 3], [0, 3] 
    ];

    const particles: any[] = [];
    for(let i=0; i<80; i++) { // Más partículas para más actividad
        particles.push({
            routeIdx: Math.floor(Math.random() * routes.length),
            t: Math.random(),
            speed: 0.001 + Math.random() * 0.002,
            size: 1 + Math.random() * 1.5
        });
    }

    let time = 0;

    const render = () => {
        const w = canvas.width;
        const h = canvas.height;
        
        // 1. Limpiar Fondo
        ctx.fillStyle = '#020617'; // Slate-950 Deep Space
        ctx.fillRect(0, 0, w, h);

        // 2. CONFIGURAR PERSPECTIVA 3D (Simulada)
        // Transformamos el canvas para dar efecto de "Mesa Digital" o globo inclinado
        ctx.save();
        
        // Center of screen
        const cx = w / 2;
        const cy = h / 2;
        
        // Tilt Effect: Comprimimos un poco en Y y rotamos
        // No usaremos transformaciones nativas complicadas para mantener nitidez de puntos,
        // sino que proyectaremos las coordenadas X,Y manualmente si fuera necesario.
        // Pero `setTransform` es más rápido.
        // scale(1, 0.8) da un efecto de inclinación básico.
        // O mejor: mantenemos plano frontal pero "Digital". La petición "4D" suele referirse a movimiento/profundidad.
        // Vamos a hacer que el mapa "respire" (onda senoidal en brillo).

        // Grid de Fondo Tecnológico (Perspectiva de suelo)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // A simple moving grid? No, lets keep it static for stability.
        
        // 3. DIBUJAR PUNTOS DE TIERRA (Dot Matrix)
        mapDots.forEach(dot => {
            const px = dot.x * w;
            const py = dot.y * h;
            
            // "Respiración" del mapa: Brillo varia con el tiempo y onda sinusoidal a lo largo del mapa (X)
            // Crea un efecto de escaneo
            const wave = Math.sin(dot.x * 10 + time * 2) * 0.5 + 0.5; 
            const alpha = 0.2 + (wave * 0.6); // Base 0.2, Max 0.8

            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2); 
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; // Sky-400
            ctx.fill();
        });

        // 4. DIBUJAR RUTAS (Arcos elevados)
        routes.forEach(pair => {
            const h1 = hubs[pair[0]];
            const h2 = hubs[pair[1]];
            
            const x1 = h1.x * w;
            const y1 = h1.y * h;
            const x2 = h2.x * w;
            const y2 = h2.y * h;

            const cxControl = (x1 + x2) / 2;
            const cyControl = Math.min(y1, y2) - (Math.abs(x1-x2) * 0.5); // Arco alto para simular vuelo

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cxControl, cyControl, x2, y2);
            
            // Gradiente en la linea
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)'); // Cyan center
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Dibujar Particulas en esta ruta
            // (Movemos la logica de dibujo de particulas aqui para aprovechar la curva calculada si fuera compleja,
            //  pero para quadraticCurveTo es fácil calcular puntos interpolados)
        });

        // 5. DIBUJAR PARTICULAS
        particles.forEach(p => {
            p.t += p.speed;
            if(p.t >= 1) {
                p.t = 0;
                p.routeIdx = Math.floor(Math.random() * routes.length);
            }

            const route = routes[p.routeIdx];
            const h1 = hubs[route[0]];
            const h2 = hubs[route[1]];
            
            const x1 = h1.x * w;
            const y1 = h1.y * h;
            const x2 = h2.x * w;
            const y2 = h2.y * h;
            const cxControl = (x1 + x2) / 2;
            const cyControl = Math.min(y1, y2) - (Math.abs(x1-x2) * 0.5);

            // Bezier Point Calculation
            const invT = 1 - p.t;
            const qx = invT*invT*x1 + 2*invT*p.t*cxControl + p.t*p.t*x2;
            const qy = invT*invT*y1 + 2*invT*p.t*cyControl + p.t*p.t*y2;

            ctx.beginPath();
            ctx.arc(qx, qy, p.size, 0, Math.PI*2);
            // Golden/Orange data packets for high contrast against blue map
            ctx.fillStyle = '#fbbf24'; // Amber-400
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#f59e0b';
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        ctx.restore(); // Restaurar transformaciones si las hubiera

        // 6. HUBS (Ciudades) - Brillantes encima de todo
        hubs.forEach(h => {
            const x = h.x * w;
            const y = h.y * h;
            
            // Outer Pulse
            const r = 5 + Math.sin(time * 4) * 3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.max(0, Math.sin(time*2)) * 0.3})`;
            ctx.stroke();

            // Center Dot
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI*2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Labels (Opcional: solo si el mouse está cerca? Por ahora mostremos los principales)
            if(['New York', 'London', 'Tokyo'].includes(h.name)) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '10px sans-serif';
                ctx.fillText(h.name.toUpperCase(), x + 10, y + 3);
            }
        });

        time += 0.01;
        requestAnimationFrame(render);
    };

    render();

    return () => {};
  }, []);

  return (
    <div className={`relative w-full h-full ${className} overflow-hidden font-sans bg-slate-950`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Vignette para integrar con el resto de la UI */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#020617_100%)] pointer-events-none"></div>
    </div>
  );
}
