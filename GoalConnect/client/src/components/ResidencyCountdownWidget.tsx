/**
 * ResidencyCountdownWidget
 * Shows days since residency started and days until completion
 * Residency: July 14, 2025 - July 14, 2028 (3 years)
 */

import { differenceInDays, format } from "date-fns";
import { GraduationCap } from "lucide-react";

const RESIDENCY_START = new Date(2025, 6, 14); // July 14, 2025
const RESIDENCY_END = new Date(2028, 6, 14);   // July 14, 2028

export function ResidencyCountdownWidget() {
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
    <div className="glass-card frost-accent p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-peach-400" />
        <span className="text-xs font-medium text-[var(--text-primary)]">Residency</span>
      </div>

      {/* Main countdown */}
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-heading font-bold text-peach-400 tabular-nums">
            {isComplete ? "Done!" : daysUntilEnd.toLocaleString()}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
            days to go
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-[var(--text-muted)] tabular-nums">
            {daysSinceStart.toLocaleString()}
          </span>
          <span className="text-[9px] text-[var(--text-muted)]/60 uppercase tracking-wider">
            days in
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-peach-400 to-amber-400 transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Year markers at 33% and 66% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: "33.33%" }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: "66.66%" }}
        />
      </div>

      {/* Time remaining breakdown */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>{format(RESIDENCY_START, "MMM d, yyyy")}</span>
        <span className="text-[var(--text-muted)]/60">
          {yearsRemaining > 0 && `${yearsRemaining}y `}
          {monthsRemainder}m left
        </span>
        <span>{format(RESIDENCY_END, "MMM d, yyyy")}</span>
      </div>
    </div>
  );
}
