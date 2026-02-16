import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PremiumGlobe3DProps {
  className?: string;
}

export default function PremiumGlobe3D({ className = '' }: PremiumGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load Textures
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const earthBump = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

    // Globe (Earth sphere)
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64); // Higher segments for better texture mapping
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: earthMap,
      bumpMap: earthBump,
      bumpScale: 0.05,
      specular: new THREE.Color('grey'),
      shininess: 10,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Atmosphere glow (Keep existing shader, it's nice)
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.3 },
        p: { value: 4.5 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 0.6) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Dimmer ambient for contrast
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Trade route hubs (major cities)
    const hubs = [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Sao Paulo', lat: -23.5505, lon: -46.6333 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 }, // Added relevant hub
      { name: 'Rotterdam', lat: 51.9225, lon: 4.47917 }
    ];

    // Convert lat/lon to 3D coordinates
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Create hub markers
    const hubMarkers: THREE.Mesh[] = [];
    hubs.forEach(hub => {
      const position = latLonToVector3(hub.lat, hub.lon, 1.01);
      const markerGeometry = new THREE.SphereGeometry(0.015, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffcc, // Cyan/Greenish for visibility
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      scene.add(marker);
      hubMarkers.push(marker);
    });

    // Trade routes (arcs between hubs) - More realistic curves
    const routes = [
      [0, 1], [1, 8], [8, 2], [2, 3], [3, 4], // Atlantic -> Europe -> Middle East -> Asia
      [0, 5], [7, 8], [3, 6], [1, 7] // Americas connections
    ];

    const routeCurves: THREE.QuadraticBezierCurve3[] = [];
    routes.forEach(([startIdx, endIdx]) => {
      const start = latLonToVector3(hubs[startIdx].lat, hubs[startIdx].lon, 1.01);
      const end = latLonToVector3(hubs[endIdx].lat, hubs[endIdx].lon, 1.01);
      
      // Create arc control point (midpoint elevated)
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(1 + dist * 0.5); // Elevation based on distance

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      routeCurves.push(curve);

      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xffaa00, // Gold/Yellow for visibility
        transparent: true,
        opacity: 0.3,
        linewidth: 1
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    });

    // Animated particles traveling on routes
    const particles: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.008, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, // White bright sparks
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      const randomCurve = routeCurves[Math.floor(Math.random() * routeCurves.length)];
      particles.push({
        mesh: particle,
        curve: randomCurve,
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.003
      });
      scene.add(particle);
    }

    // Parallax Scroll Logic
    let scrollY = 0;
    const handleScroll = () => {
        scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate globe slowly
      globe.rotation.y += 0.0005; // Slower, majestic rotation
      glow.rotation.y += 0.0005;

      // Parallax Effect: Move globe down slowly as user scrolls down
      // Creating depth perception
      const parallaxY = scrollY * -0.0005; 
      camera.position.y = parallaxY;
      camera.lookAt(0, parallaxY, 0); // Keep looking at center relative to movement

      // Animate particles
      particles.forEach(p => {
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.curve = routeCurves[Math.floor(Math.random() * routeCurves.length)];
        }
        const position = p.curve.getPoint(p.t);
        p.mesh.position.copy(position);
      });

      // Pulse hub markers
      const time = Date.now() * 0.001;
      hubMarkers.forEach((marker, i) => {
        marker.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.4);
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
