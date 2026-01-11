/**
 * ResidencyCountdownWidget
 * Compact horizontal bar showing residency progress
 * Residency: July 14, 2025 - July 14, 2028 (3 years)
 */

import { differenceInDays } from "date-fns";
import { GraduationCap } from "lucide-react";

const RESIDENCY_START = new Date(2025, 6, 14); // July 14, 2025
const RESIDENCY_END = new Date(2028, 6, 14);   // July 14, 2028

interface ResidencyCountdownWidgetProps {
  compact?: boolean;
}

export function ResidencyCountdownWidget({ compact = false }: ResidencyCountdownWidgetProps) {
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

  // Compact version for header - just icon + progress bar + days
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e4a880' }} />
        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(to right, #d4936a, #f0c9ae)'
            }}
          />
        </div>
        <span className="text-sm font-heading text-peach-400 tabular-nums">
          {isComplete ? "Done!" : `${yearsRemaining > 0 ? `${yearsRemaining}y` : `${monthsRemainder}m`}`}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card frost-accent px-3 py-2">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <GraduationCap className="w-4 h-4 flex-shrink-0" style={{ color: '#e4a880' }} />

        {/* Progress bar section */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(to right, #d4936a, #f0c9ae)'
              }}
            />
            {/* Year markers */}
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '33.33%' }} />
            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '66.66%' }} />
          </div>
        </div>

        {/* Days left */}
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-sm font-heading font-bold tabular-nums" style={{ color: '#e4a880' }}>
            {isComplete ? "Done!" : daysUntilEnd.toLocaleString()}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase">
            {yearsRemaining > 0 ? `${yearsRemaining}y ${monthsRemainder}m` : `${monthsRemainder}m`}
          </span>
        </div>
      </div>
    </div>
  );
}
