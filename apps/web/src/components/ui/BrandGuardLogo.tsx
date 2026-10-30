import React from 'react';

interface BrandGuardLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withWordmark?: boolean;
  className?: string;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', font: 'text-xs' },
  sm: { box: 'w-8 h-8', font: 'text-sm' },
  md: { box: 'w-9 h-9', font: 'text-base' },
  lg: { box: 'w-11 h-11', font: 'text-xl' },
  xl: { box: 'w-14 h-14', font: 'text-2xl' },
};

export const BrandGuardLogo: React.FC<BrandGuardLogoProps> = ({
  size = 'md',
  withWordmark = false,
  className = '',
  animate = true,
}) => {
  const { box, font } = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Authentic 3D Sculpted BrandGuard Emblem */}
      <div
        className={`${box} shrink-0 relative flex items-center justify-center transition-transform duration-200 ${
          animate ? 'hover:scale-105' : ''
        }`}
      >
        <img
          src="/brandguard-official-logo.png"
          alt="BrandGuard AI Emblem"
          className="w-full h-full object-contain filter drop-shadow-xs"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/brandguard-official-logo-transparent.png';
          }}
        />
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
