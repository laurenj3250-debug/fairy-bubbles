/**
 * StreakFlame - Animated flame/fire icon for active streaks
 * Shows when a habit/route has been touched today
 */

interface StreakFlameProps {
  /** Size in pixels */
  size?: number;
  /** Animation speed (slow, normal, fast) */
  speed?: 'slow' | 'normal' | 'fast';
}

export function StreakFlame({ size = 20, speed = 'normal' }: StreakFlameProps) {
  const duration = speed === 'slow' ? '2s' : speed === 'fast' ? '0.8s' : '1.2s';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
      style={{
        filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.6))',
      }}
    >
      {/* Outer flame (orange) */}
      <path
        d="M12 2C12 2 8 6 8 10C8 13.31 10.69 16 14 16C17.31 16 20 13.31 20 10C20 6 16 2 16 2C16 4 14 6 12 8C12 6 12 2 12 2Z"
        fill="url(#flameGradientOuter)"
        className="animate-pulse"
        style={{
          animationDuration: duration,
          transformOrigin: 'center bottom',
        }}
      />

      {/* Inner flame (yellow) */}
      <path
        d="M12 8C12 8 10 10 10 12C10 13.66 11.34 15 13 15C14.66 15 16 13.66 16 12C16 10 14 8 14 8C14 9 13 10 12 11C12 10 12 8 12 8Z"
        fill="url(#flameGradientInner)"
        className="animate-pulse"
        style={{
          animationDuration: `calc(${duration} * 0.8)`,
          animationDelay: '0.1s',
          transformOrigin: 'center bottom',
        }}
      />

      {/* Gradients */}
      <defs>
        <linearGradient id="flameGradientOuter" x1="12" y1="2" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="flameGradientInner" x1="13" y1="8" x2="13" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
