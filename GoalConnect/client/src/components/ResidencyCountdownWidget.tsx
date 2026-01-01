/**
 * ResidencyCountdownWidget
 * Compact inline widget showing residency progress
 * Residency: July 14, 2025 - July 14, 2028 (3 years)
 */

import { useId } from "react";
import { differenceInDays } from "date-fns";
import { GraduationCap } from "lucide-react";

const RESIDENCY_START = new Date(2025, 6, 14); // July 14, 2025
const RESIDENCY_END = new Date(2028, 6, 14);   // July 14, 2028

export function ResidencyCountdownWidget() {
  const gradientId = useId();
  // Calculate stats fresh each render (cheap calculation, ensures accuracy)
  const now = new Date();
  const totalDays = differenceInDays(RESIDENCY_END, RESIDENCY_START);
  const daysSinceStart = Math.max(0, differenceInDays(now, RESIDENCY_START));
  const daysUntilEnd = Math.max(0, differenceInDays(RESIDENCY_END, now));
  const progressPercent = Math.min(100, Math.max(0, (daysSinceStart / totalDays) * 100));

  // Calculate years and months remaining
  const monthsRemaining = Math.floor(daysUntilEnd / 30.44);
  const yearsRemaining = Math.floor(monthsRemaining / 12);
  const monthsRemainder = monthsRemaining % 12;

  const isComplete = daysUntilEnd <= 0;

  return (
    <div className="glass-card frost-accent p-3 min-h-[200px] flex flex-col">
      {/* Header */}
      <span className="card-title flex items-center gap-2">
        <GraduationCap className="w-4 h-4" />
        Residency
      </span>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* Circular progress indicator */}
        <div className="relative w-[100px] h-[100px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(228, 168, 128, 0.15)"
              strokeWidth="6"
            />
            {/* Progress arc with peach gradient effect */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - progressPercent / 100)}
              className="transition-all duration-1000 ease-out"
            />
            {/* Year markers */}
            {[33.33, 66.66].map((pct, i) => {
              const angle = (pct / 100) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 42 * Math.cos(rad);
              const y = 50 + 42 * Math.sin(rad);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="rgba(255,255,255,0.4)"
                />
              );
            })}
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4936a" />
                <stop offset="100%" stopColor="#f0c9ae" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-heading font-bold tabular-nums"
              style={{ color: '#e4a880' }}>
              {isComplete ? "Done!" : daysUntilEnd.toLocaleString()}
            </span>
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
              days left
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex flex-col items-center">
            <span className="font-medium tabular-nums" style={{ color: '#e4a880' }}>
              {daysSinceStart.toLocaleString()}
            </span>
            <span className="text-[var(--text-muted)]/60 uppercase tracking-wider">days in</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="font-medium text-[var(--text-muted)]">
              {yearsRemaining > 0 && `${yearsRemaining}y `}{monthsRemainder}m
            </span>
            <span className="text-[var(--text-muted)]/60 uppercase tracking-wider">remaining</span>
          </div>
        </div>
      </div>

      {/* Progress percentage footer */}
      <div className="text-center text-[10px] text-[var(--text-muted)]/50 -mt-1">
        {Math.round(progressPercent)}% complete
      </div>
    </div>
  );
}
