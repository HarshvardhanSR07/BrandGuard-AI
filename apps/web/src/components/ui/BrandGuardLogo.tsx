import React from 'react';

interface BrandGuardLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withWordmark?: boolean;
  className?: string;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', px: 24, font: 'text-xs' },
  sm: { box: 'w-8 h-8', px: 32, font: 'text-sm' },
  md: { box: 'w-9 h-9', px: 36, font: 'text-base' },
  lg: { box: 'w-11 h-11', px: 44, font: 'text-xl' },
  xl: { box: 'w-14 h-14', px: 56, font: 'text-2xl' },
};

export const BrandGuardLogo: React.FC<BrandGuardLogoProps> = ({
  size = 'md',
  withWordmark = false,
  className = '',
  animate = true,
}) => {
  const { box, px, font } = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Mark: Crisp Vector Shield + AI Governance Crest */}
      <div
        className={`${box} shrink-0 relative flex items-center justify-center transition-transform duration-200 ${
          animate ? 'hover:scale-105' : ''
        }`}
        style={{ width: px, height: px }}
      >
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xs"
        >
          <defs>
            {/* Outer Container Gradient - Deep Luxury Emerald */}
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e5430" />
              <stop offset="50%" stopColor="#143c22" />
              <stop offset="100%" stopColor="#0b2414" />
            </linearGradient>

            {/* Left Shield Wing (Pure Silver-White with subtle sheen) */}
            <linearGradient id="leftWing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#d1fae5" />
            </linearGradient>

            {/* Right Shield Wing (Cyber Emerald & Lime Gradient) */}
            <linearGradient id="rightWing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="60%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            {/* Inner Verification Core Checkmark */}
            <linearGradient id="coreCheck" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#04210e" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 1. Base Squircle with Metallic Accent Edge */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#bgGrad)"
            stroke="#2e7041"
            strokeWidth="1.2"
          />
          <rect
            x="3.2"
            y="3.2"
            width="41.6"
            height="41.6"
            rx="10.8"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="0.8"
          />

          {/* 2. Main Sculpted Guard Shield */}
          <g filter="url(#shieldGlow)">
            {/* Left Facet of Shield */}
            <path
              d="M24 10 L13 15.5 V25.5 C13 32.5 17.5 37.8 24 40.5 V10 Z"
              fill="url(#leftWing)"
              fillOpacity="0.95"
            />

            {/* Right Facet of Shield */}
            <path
              d="M24 10 L35 15.5 V25.5 C35 32.5 30.5 37.8 24 40.5 V10 Z"
              fill="url(#rightWing)"
            />

            {/* Center Crease / Depth Line */}
            <line
              x1="24"
              y1="10"
              x2="24"
              y2="40.5"
              stroke="#0b2414"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />

            {/* 3. Verified Precision Checkmark & AI Spark Core */}
            <path
              d="M18.5 24.5 L22.5 28.5 L29.5 20"
              stroke="url(#coreCheck)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 4. AI Spark at Crest (Star of Intelligence) */}
            <path
              d="M24 7.2 L24.8 9.5 L27 10 L24.8 10.5 L24 12.8 L23.2 10.5 L21 10 L23.2 9.5 Z"
              fill="#bef264"
            />
          </g>
        </svg>
      </div>

      {/* Optional Wordmark */}
      {withWordmark && (
        <div className="flex flex-col min-w-0">
          <span className={`font-playfair font-bold tracking-tight text-[#202820] leading-tight ${font}`}>
            BrandGuard <span className="text-[#295d36] font-extrabold">AI</span>
          </span>
          <span className="text-[9px] text-[#858d83] font-medium tracking-wider uppercase">
            Compliance Console
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandGuardLogo;
