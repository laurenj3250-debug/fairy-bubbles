interface ProgressArcProps {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function ProgressArc({
  progress,
  color,
  size = 60,
  strokeWidth,
}: ProgressArcProps) {
  const actualStrokeWidth = strokeWidth ?? (size > 50 ? 6 : 4);
  const radius = (size - actualStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={actualStrokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={actualStrokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}
