import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMountainTheme } from "@/hooks/useMountainTheme";
import { getClimbingRank } from "@/lib/climbingRanks";

interface MountainHeaderProps {
  seasonProgress: { current: number; total: number };
  currentStreak?: number;
}

/**
 * MountainHeader - Shows current expedition/mountain with key stats
 * Implements the warm granite El Capitan aesthetic from the redesign
 */
export function MountainHeader({ seasonProgress, currentStreak = 0 }: MountainHeaderProps) {
  const { theme } = useMountainTheme();

  // Fetch climbing stats
  const { data: climbingStats } = useQuery<{ climbingLevel: number }>({
    queryKey: ["/api/climbing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing/stats");
      if (!res.ok) return { climbingLevel: 1 };
      return res.json();
    },
  });

  const rank = useMemo(() => {
    const level = climbingStats?.climbingLevel || 1;
    return getClimbingRank(level);
  }, [climbingStats]);

  // Calculate week number
  const weekNumber = useMemo(() => {
    return Math.floor(seasonProgress.current / 7) + 1;
  }, [seasonProgress.current]);

  const totalWeeks = Math.ceil(seasonProgress.total / 7);

  return (
    <div className="mountain-header glass-card interactive-glow p-6 mb-6 animate-fade-in">
      {/* Expedition Badge */}
      <div className="inline-block bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] px-4 py-2 rounded-full text-sm font-semibold mb-3">
        🏔️ CURRENT EXPEDITION
      </div>

      {/* Mountain Name */}
      <h1 className="text-5xl font-black mb-2 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
        {theme?.mountainName || "EL CAPITAN"}
      </h1>

      {/* Location - from mountain data if available */}
      <p className="text-sm text-muted-foreground mb-4">
        Current Expedition • Season Progress
      </p>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-6">
        {/* Energy/Progress */}
        <div className="flex items-center gap-2 text-sm">
          <span>⚡</span>
          <span className="text-muted-foreground">
            <span className="font-bold text-[hsl(var(--accent))]">
              {seasonProgress.current}/{seasonProgress.total}
            </span>{" "}
            Days
          </span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 text-sm">
          <span>🔥</span>
          <span className="text-muted-foreground">
            <span className="font-bold text-[hsl(var(--accent))]">{currentStreak} days</span> Streak
          </span>
        </div>

        {/* Grade */}
        <div className="flex items-center gap-2 text-sm">
          <span>📊</span>
          <span className="text-muted-foreground">
            <span className="font-bold text-[hsl(var(--accent))]">{rank?.grade || "5.9"}</span> Grade
          </span>
        </div>

        {/* Week */}
        <div className="flex items-center gap-2 text-sm">
          <span>🗓️</span>
          <span className="text-muted-foreground">
            Week{" "}
            <span className="font-bold text-[hsl(var(--accent))]">
              {weekNumber}/{totalWeeks}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
