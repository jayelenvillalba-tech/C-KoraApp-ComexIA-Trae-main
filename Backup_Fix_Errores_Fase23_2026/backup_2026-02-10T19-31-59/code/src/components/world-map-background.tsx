import React from 'react';

interface WorldMapBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function WorldMapBackground({ className = '', opacity = 0.15 }: WorldMapBackgroundProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <defs>
        {/* Gradient for continents */}
        <linearGradient id="continentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Glow effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Grid pattern */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Simplified world map continents */}
      <g filter="url(#glow)" fill="url(#continentGradient)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1">
        
        {/* North America */}
        <path d="M 150,100 L 180,80 L 220,85 L 250,95 L 280,110 L 290,140 L 280,170 L 260,190 L 240,200 L 220,195 L 200,180 L 180,160 L 160,140 L 150,120 Z" />
        
        {/* South America */}
        <path d="M 260,250 L 280,240 L 300,250 L 310,280 L 315,320 L 310,360 L 300,390 L 280,410 L 260,420 L 245,415 L 235,390 L 230,360 L 235,320 L 245,280 Z" />
        
        {/* Europe */}
        <path d="M 480,120 L 520,110 L 560,115 L 580,130 L 590,150 L 580,170 L 560,180 L 530,185 L 500,180 L 480,165 L 475,145 Z" />
        
        {/* Africa */}
        <path d="M 500,200 L 540,195 L 570,210 L 590,240 L 600,280 L 595,330 L 580,370 L 560,400 L 530,420 L 500,430 L 475,425 L 460,400 L 450,360 L 455,310 L 470,260 L 485,220 Z" />
        
        {/* Asia */}
        <path d="M 620,100 L 700,90 L 780,95 L 850,110 L 900,130 L 920,160 L 910,190 L 880,210 L 840,220 L 790,225 L 740,220 L 690,210 L 650,190 L 620,160 L 610,130 Z" />
        
        {/* Australia */}
        <path d="M 850,380 L 900,375 L 940,385 L 960,410 L 955,440 L 930,460 L 895,465 L 860,455 L 840,430 L 845,400 Z" />
        
        {/* Antarctica (simplified) */}
        <path d="M 100,550 L 1100,550 L 1080,570 L 120,570 Z" opacity="0.5" />
      </g>

      {/* Animated dots for major cities/ports */}
      <g className="animate-pulse">
        {/* Major trade hubs */}
        <circle cx="250" cy="150" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="280" cy="300" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="550" cy="150" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="530" cy="300" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="750" cy="180" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="850" cy="200" r="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="900" cy="420" r="2" fill="#06b6d4" opacity="0.8" />
      </g>

      {/* Trade routes (animated dashed lines) */}
      <g stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3">
        <line x1="250" y1="150" x2="550" y2="150">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="280" y1="300" x2="530" y2="300">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="550" y1="150" x2="750" y2="180">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="750" y1="180" x2="850" y2="200">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="850" y1="200" x2="900" y2="420">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  );
}
