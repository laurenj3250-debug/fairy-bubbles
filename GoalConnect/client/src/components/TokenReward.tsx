/**
 * TokenReward - Glowing coin icon with token count
 * Shows reward tokens for completing habits/routes
 */

interface TokenRewardProps {
  /** Number of tokens */
  tokens: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show glow effect */
  glow?: boolean;
}

export function TokenReward({ tokens, size = 'md', glow = true }: TokenRewardProps) {
  const sizeMap = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 24, text: 'text-base' },
  };

  const { icon: iconSize, text: textClass } = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
        style={{
          filter: glow
            ? 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))'
            : 'none',
        }}
      >
        {/* Coin circle */}
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="url(#coinGradient)"
          stroke="url(#coinStroke)"
          strokeWidth="1.5"
        />

        {/* Inner highlight */}
        <circle
          cx="12"
          cy="12"
          r="6"
          fill="url(#coinHighlight)"
          opacity="0.4"
        />

        {/* Sparkle points */}
        <path
          d="M12 4L12.5 6.5L15 7L12.5 7.5L12 10L11.5 7.5L9 7L11.5 6.5L12 4Z"
          fill="white"
          opacity="0.8"
        />
        <path
          d="M18 12L18.3 13.3L19.5 13.5L18.3 13.7L18 15L17.7 13.7L16.5 13.5L17.7 13.3L18 12Z"
          fill="white"
          opacity="0.6"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="coinGradient" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="coinStroke" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <radialGradient id="coinHighlight" cx="12" cy="8" r="6" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      <span className={`font-semibold text-yellow-300 ${textClass}`}>
        +{tokens}
      </span>
    </div>
  );
}
