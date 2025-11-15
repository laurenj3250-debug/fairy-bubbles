import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Ring size in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Ring color (CSS color or CSS variable) */
  color?: string;
  /** Track color (background ring) */
  trackColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show percentage text in center */
  showPercentage?: boolean;
  /** Children to render inside the ring */
  children?: React.ReactNode;
}

/**
 * ProgressRing - SVG circle that shows completion progress as a stroke
 * Used to wrap expedition holds and show daily completion percentage
 */
export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 3,
  color = "hsl(var(--primary))",
  trackColor = "rgba(255, 255, 255, 0.1)",
  className,
  showPercentage = false,
  children,
}: ProgressRingProps) {
  // Clamp progress to 0-100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Calculate inner radius accounting for stroke width
  const radius = (size - strokeWidth) / 2;
  // Total path length of the circle
  const circumference = radius * 2 * Math.PI;
  // How much of the circle to "hide" based on progress (stroke-dashoffset)
  const offset = circumference - (clampedProgress / 100) * circumference;

  // Add glow effect when complete
  const isComplete = clampedProgress === 100;
  const percentLabel = Math.round(clampedProgress);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`Progress ring showing ${percentLabel}% completion`}
      data-testid="progress-ring"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute top-0 left-0 transform -rotate-90 transition-all duration-700"
        aria-hidden="true"
        style={{
          filter: isComplete ? `drop-shadow(0 0 8px ${color})` : "none",
        }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Content inside ring */}
      <div className="relative z-10 flex items-center justify-center" style={{ maxWidth: size - strokeWidth * 4 }}>
        {showPercentage ? (
          <span className="text-2xl font-bold tabular-nums" data-testid="progress-percentage">
            {Math.round(clampedProgress)}%
          </span>
        ) : children}
      </div>
    </div>
  );
}
