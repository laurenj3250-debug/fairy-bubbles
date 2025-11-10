import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { getClimbingRank } from "@/lib/climbingRanks";

interface ClimbingStats {
  climbingLevel: number;
  totalExperience: number;
  summitsReached: number;
}

export function TopStatusBar() {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map((h) =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then((res) => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  const { data: climbingStats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing/stats");
      if (!res.ok) {
        // Return default stats if not found
        return { climbingLevel: 1, totalExperience: 0, summitsReached: 0 };
      }
      return res.json();
    },
  });

  // Calculate season progress (90-day season)
  const seasonProgress = useMemo(() => {
    const completedLogs = allLogs.filter((log) => log.completed);
    const uniqueDays = new Set(completedLogs.map((log) => log.date));
    const daysCompleted = uniqueDays.size;
    return { current: daysCompleted, total: 90 };
  }, [allLogs]);

  // Calculate this week's category progress
  const weekProgress = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);

    const categories = {
      mind: { completed: 0, target: 0 },
      foundation: { completed: 0, target: 0 },
      adventure: { completed: 0, target: 0 },
    };

    habits.forEach((habit) => {
      const category = habit.category;
      if (category === "mind" || category === "foundation" || category === "adventure") {
        const target = habit.targetPerWeek || (habit.cadence === "daily" ? 7 : 3);
        categories[category].target += target;

        const weekLogs = allLogs.filter((log) => {
          if (log.habitId !== habit.id || !log.completed) return false;
          const logDate = new Date(log.date);
          return logDate >= monday && logDate <= weekEnd;
        });

        categories[category].completed += weekLogs.length;
      }
    });

    return categories;
  }, [habits, allLogs]);

  const rank = climbingStats ? getClimbingRank(climbingStats.climbingLevel) : null;

  return (
    <div className="glass-card rounded-2xl p-3 mb-4 backdrop-blur-xl bg-white/10 border border-white/20">
      <div className="flex items-center justify-between text-xs text-white/90">
        {/* Left: Season progress */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-teal-300">Season:</span>
          <span className="font-mono">
            {seasonProgress.current}/{seasonProgress.total} days
          </span>
        </div>

        {/* Center: Climbing grade/rank */}
        <div className="flex items-center gap-2">
          {rank && (
            <>
              <span className="text-white/60">•</span>
              <span className="font-bold text-cyan-300">{rank.grade}</span>
              <span className="text-white/80 hidden sm:inline">{rank.name}</span>
            </>
          )}
        </div>

        {/* Right: Week summary */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/60 hidden md:inline">This week:</span>

          {weekProgress.mind.target > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-purple-300 font-semibold">
                {weekProgress.mind.completed}/{weekProgress.mind.target}
              </span>
              <span className="text-white/60">Mind</span>
            </div>
          )}

          {weekProgress.foundation.target > 0 && (
            <>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-semibold">
                  {weekProgress.foundation.completed}/{weekProgress.foundation.target}
                </span>
                <span className="text-white/60">Foundation</span>
              </div>
            </>
          )}

          {weekProgress.adventure.target > 0 && (
            <>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1">
                <span className="text-green-300 font-semibold">
                  {weekProgress.adventure.completed}/{weekProgress.adventure.target}
                </span>
                <span className="text-white/60">Adventure</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
