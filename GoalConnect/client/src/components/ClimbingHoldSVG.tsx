import React from 'react';

// Helper to extract colors from gradient string
function extractGradientColors(gradient: string): { start: string; end: string } {
  // Match hex colors in the gradient string
  const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (matches && matches.length >= 2) {
    return { start: matches[0], end: matches[1] };
  }
  return { start: '#475569', end: '#334155' }; // fallback
}

interface ClimbingHoldSVGProps {
  variant?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
  gradient?: string;
  borderColor?: string;
}

// SVG path data for 3 different climbing holds
const HOLD_PATHS = [
  // Hold 1 - Undercling
  "M1065 1564 c-117 -18 -267 -66 -353 -115 -349 -195 -474 -555 -347 -1004 19 -70 42 -139 49 -154 38 -71 115 -106 216 -98 61 5 239 57 265 77 23 18 310 121 420 150 126 34 184 58 228 92 79 63 149 206 161 330 7 75 43 193 82 270 31 60 41 141 25 191 -31 93 -132 172 -295 230 -76 27 -93 30 -251 32 -93 2 -183 1 -200 -1z m20 -539 c53 -52 15 -137 -60 -137 -30 0 -45 6 -62 27 -48 55 -12 135 62 135 25 0 44 -8 60 -25z",

  // Hold 2 - Oval jug
  "M1135 1411 c-324 -62 -523 -220 -601 -476 -27 -89 -26 -281 2 -351 89 -219 327 -373 698 -448 152 -32 332 -50 413 -43 96 9 171 55 199 123 20 48 17 161 -6 235 -32 108 -43 196 -45 394 -1 106 -7 212 -14 240 -20 84 -70 172 -125 221 -65 59 -107 80 -208 104 -99 24 -192 24 -313 1z m110 -596 c47 -46 25 -119 -41 -139 -32 -10 -71 9 -89 43 -21 42 -19 64 10 95 32 35 86 36 120 1z",

  // Hold 3 - Pinch grip
  "M1036 1809 c-174 -88 -346 -194 -383 -236 -49 -54 -54 -87 -37 -227 8 -66 21 -176 29 -243 8 -68 19 -158 24 -200 6 -43 15 -139 22 -213 6 -75 17 -147 25 -162 9 -18 39 -41 82 -62 37 -19 103 -57 147 -85 43 -28 89 -51 101 -51 64 0 477 162 730 286 213 104 244 125 244 159 0 25 -8 33 -130 122 -132 97 -330 309 -440 472 -48 72 -178 336 -207 421 -10 30 -22 61 -26 68 -16 24 -63 11 -181 -49z m53 -855 c39 -32 43 -85 9 -121 -28 -30 -89 -32 -118 -3 -37 37 -19 121 29 139 40 14 47 13 80 -15z"
];

export function ClimbingHoldSVG({
  variant = 0,
  size = 80,
  className = '',
  onClick,
  gradient,
  borderColor
}: ClimbingHoldSVGProps) {
  const holdIndex = variant % HOLD_PATHS.length;
  const pathData = HOLD_PATHS[holdIndex];

  // Extract colors from gradient if provided
  const gradientColors = gradient ? extractGradientColors(gradient) : null;

  return (
    <div
      className={`climbing-hold-container ${className}`}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
      }}
    >
      {/* Glow layer */}
      <div
        className="climbing-hold-glow"
        style={{
          position: 'absolute',
          inset: '-20%',
          borderRadius: '50%',
          background: `radial-gradient(circle, hsl(var(--hold-glow) / 0.4) 0%, transparent 70%)`,
          filter: 'blur(15px)',
          pointerEvents: 'none',
        }}
      />

      {/* SVG hold with theme-dependent fill */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'relative',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      >
        <defs>
          {/* Gradient for depth */}
          <linearGradient id={`holdGradient-${holdIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {gradientColors ? (
              <>
                <stop offset="0%" style={{ stopColor: gradientColors.start, stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: gradientColors.end, stopOpacity: 0.55 }} />
              </>
            ) : (
              <>
                <stop offset="0%" style={{ stopColor: 'hsl(var(--hold-tint))', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--hold-tint))', stopOpacity: 0.4 }} />
              </>
            )}
          </linearGradient>

          {/* Radial gradient for highlight */}
          <radialGradient id={`holdHighlight-${holdIndex}`} cx="30%" cy="30%">
            <stop offset="0%" style={{ stopColor: borderColor || 'hsl(var(--hold-glow))', stopOpacity: 0.15 }} />
            <stop offset="50%" style={{ stopColor: borderColor || 'hsl(var(--hold-glow))', stopOpacity: 0.05 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <g transform="translate(0,200) scale(0.1,-0.1)">
          {/* Main hold shape with gradient */}
          <path
            d={pathData}
            fill={`url(#holdGradient-${holdIndex})`}
            stroke="none"
          />

          {/* Highlight overlay */}
          <path
            d={pathData}
            fill={`url(#holdHighlight-${holdIndex})`}
            stroke="none"
          />
        </g>
      </svg>

      {/* Glass shine effect */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '25%',
          height: '25%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
