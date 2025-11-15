import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ExpeditionHeaderProps {
  seasonProgress: { current: number; total: number };
  climbingGrade: string;
  climbingRank: string;
  weekSummary: {
    mind: { completed: number; target: number };
    foundation: { completed: number; target: number };
    adventure: { completed: number; target: number };
  };
  onViewWeek?: () => void;
}

export function ExpeditionHeader({
  seasonProgress,
  climbingGrade,
  climbingRank,
  weekSummary,
  onViewWeek,
}: ExpeditionHeaderProps) {
  const totalWeekCompleted = useMemo(() => {
    return (
      weekSummary.mind.completed +
      weekSummary.foundation.completed +
      weekSummary.adventure.completed
    );
  }, [weekSummary]);

  const totalWeekTarget = useMemo(() => {
    return (
      weekSummary.mind.target +
      weekSummary.foundation.target +
      weekSummary.adventure.target
    );
  }, [weekSummary]);

  return (
    <div className="h-12 px-6 flex items-center justify-between bg-card/60 backdrop-blur-md border-b border-card-border relative overflow-hidden">
      {/* Granite texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      {/* Left: Expedition progress */}
      <div className="flex items-center gap-2 text-xs font-medium text-foreground relative z-10">
        <span className="text-muted-foreground">Expedition:</span>
        <span className="font-mono font-bold">
          {seasonProgress.current}/{seasonProgress.total} days
        </span>
      </div>

      {/* Center: Climbing grade/rank */}
      <div className="flex items-center gap-3 text-sm font-bold text-foreground relative z-10">
        <span className="text-primary">{climbingGrade}</span>
        <span className="text-muted-foreground">•</span>
        <span>{climbingRank}</span>
      </div>

      {/* Right: Week summary with view chevron */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">This week:</span>
          <span className="font-mono font-bold text-foreground">
            {totalWeekCompleted}/{totalWeekTarget}
          </span>
        </div>

        {onViewWeek && (
          <button
            onClick={onViewWeek}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <span>View week</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
