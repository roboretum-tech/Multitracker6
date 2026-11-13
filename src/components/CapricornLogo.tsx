import React from 'react';

interface CapricornLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'emblem' | 'stacked' | 'horizontal';
  theme?: 'dark' | 'light' | 'auto' | 'orange';
  className?: string;
}

export default function CapricornLogo({
  size = 'md',
  variant = 'horizontal',
  theme = 'auto',
  className = '',
}: CapricornLogoProps) {
  // Exact brand color from user logo: #D98236 (Warm Capricorn Amber Orange)
  const BRAND_ORANGE = '#D98236';

  // Dimension presets
  const sizeMap = {
    sm: { emblem: 26, text: 'text-xs', sub: 'text-[8px]', gap: 'gap-2' },
    md: { emblem: 36, text: 'text-sm', sub: 'text-[9px]', gap: 'gap-2.5' },
    lg: { emblem: 50, text: 'text-lg', sub: 'text-[11px]', gap: 'gap-3.5' },
    xl: { emblem: 68, text: 'text-2xl', sub: 'text-xs', gap: 'gap-4' },
    '2xl': { emblem: 110, text: 'text-4xl', sub: 'text-sm', gap: 'gap-5' },
  };

  const currentSize = sizeMap[size];

  // Theme text coloring
  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const isOrange = theme === 'orange';

  const textFill = isOrange
    ? BRAND_ORANGE
    : isDark
    ? '#ffffff'
    : isLight
    ? '#0f172a'
    : undefined;

  // The Exact Geometric Diamond Emblem from Capricorn Naranja.png
  const Emblem = (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: currentSize.emblem, height: currentSize.emblem }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs select-none"
      >
        {/* Exact Geometric Interlocking Diamond Shapes in #D98236 */}
        <g fill={BRAND_ORANGE}>
          {/* Top-Right Outer Chevron & Arm */}
          <path
            d="M55.2 12.6L85.6 43.0L78.6 50.0L55.2 26.6L31.8 50.0L24.8 43.0L55.2 12.6Z"
          />

          {/* Top-Left Outer Diagonal Bar */}
          <path
            d="M42.4 15.2L18.8 38.8L25.8 45.8L49.4 22.2L42.4 15.2Z"
          />

          {/* Inner Upper-Right Parallel Bar */}
          <path
            d="M51.0 23.4L69.2 41.6L62.2 48.6L44.0 30.4L51.0 23.4Z"
          />

          {/* Bottom-Left Outer Chevron & Arm (180deg rotational counterpart) */}
          <path
            d="M44.8 87.4L14.4 57.0L21.4 50.0L44.8 73.4L68.2 50.0L75.2 57.0L44.8 87.4Z"
          />

          {/* Bottom-Right Outer Diagonal Bar */}
          <path
            d="M57.6 84.8L81.2 61.2L74.2 54.2L50.6 77.8L57.6 84.8Z"
          />

          {/* Inner Lower-Left Parallel Bar */}
          <path
            d="M49.0 76.6L30.8 58.4L37.8 51.4L56.0 69.6L49.0 76.6Z"
          />
        </g>
      </svg>
    </div>
  );

  // Pure emblem only
  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {Emblem}
      </div>
    );
  }

  // Stacked variant (Emblem centered with CAPRICORN below, exactly matching the uploaded image)
  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center ${currentSize.gap} ${className}`}>
        {Emblem}
        <span
          className={`font-black tracking-[0.18em] uppercase leading-none ${currentSize.text}`}
          style={{ 
            color: textFill || BRAND_ORANGE,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          CAPRICORN
        </span>
      </div>
    );
  }

  // Horizontal variant (Emblem left + CAPRICORN & Subtitle right)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {Emblem}

      <div className="flex flex-col text-left leading-none justify-center">
        <div className="flex items-center gap-1">
          <span
            className={`font-black tracking-[0.14em] uppercase ${currentSize.text} ${
              textFill ? '' : 'text-slate-900 dark:text-white'
            }`}
            style={{ 
              color: textFill || (isDark ? '#ffffff' : undefined),
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            CAPRICORN
          </span>
          <span 
            className="font-extrabold text-[9px] font-mono leading-none"
            style={{ color: BRAND_ORANGE }}
          >
            ®
          </span>
        </div>

        <span
          className={`font-bold tracking-[0.16em] uppercase ${currentSize.sub} mt-0.5`}
          style={{ color: BRAND_ORANGE }}
        >
          Strategic Execution
        </span>
      </div>
    </div>
  );
}
