import { cn } from '@/lib/utils';

interface LuxuryProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function LuxuryProgressRing({
  progress,
  size = 72,
  strokeWidth = 6,
  label,
  className,
}: LuxuryProgressRingProps) {
  // Bounds check progress to 0-100 range
  const safeProgress = Math.max(0, Math.min(100, progress || 0));

  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (safeProgress / 100) * circumference;

  const isEmpty = safeProgress === 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {/* Percentage on top */}
      <span className="font-heading text-lg font-medium text-[var(--text-primary)]">
        {safeProgress}%
      </span>

      {/* Arc below percentage */}
      <div className="relative" style={{ width: size, height: size / 2 }}>
        <svg
          role="progressbar"
          aria-valuenow={safeProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ? `${label}: ${safeProgress}% complete` : `${safeProgress}% complete`}
          viewBox={`0 0 ${size} ${size / 2}`}
          className="w-full h-full"
        >
          {/* Track - half circle */}
          <path
            d={`M ${strokeWidth / 2} ${strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${strokeWidth / 2}`}
            fill="none"
            stroke="rgba(228, 168, 128, 0.2)"
            strokeWidth={strokeWidth}
            className={cn(isEmpty && "animate-shimmer")}
          />
          {/* Progress fill */}
          <path
            d={`M ${strokeWidth / 2} ${strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${strokeWidth / 2}`}
            fill="none"
            stroke="var(--peach-400)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              filter: safeProgress > 0 ? 'drop-shadow(0 0 6px rgba(228, 168, 128, 0.5))' : 'none',
            }}
          />
        </svg>
      </div>
      {/* Label */}
      {label && (
        <span
          className="font-body text-xs text-center max-w-[70px] truncate text-[var(--text-muted)]"
          title={label}
        >
          {label}
        </span>
      )}
    </div>
  );
}
