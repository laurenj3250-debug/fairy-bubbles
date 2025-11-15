import { DailyFocusHero } from "@/components/DailyFocusHero";
import { WeekOverviewStreak } from "@/components/WeekOverviewStreak";
import { GoalsSection } from "@/components/GoalsSection";
import { TodaysTasksPanel } from "@/components/TodaysTasksPanel";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { ExpeditionHeader } from "@/components/ExpeditionHeader";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { getClimbingRank } from "@/lib/climbingRanks";
import { useLocation } from "wouter";

/**
 * REDESIGNED WeeklyHub
 *
 * New hierarchy prioritizes daily clarity:
 * 1. Daily Focus Hero (60%) - "What do I need to do TODAY?"
 * 2. Week Overview + Streak (30%) - See patterns + motivation
 * 3. Goals (20% or less) - Collapsible, doesn't dominate
 * 4. Optional: Tasks + Journal below
 */
export default function WeeklyHub() {
  const [, setLocation] = useLocation();

  // Fetch habits and logs for expedition progress
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
  });

  const { data: climbingStats } = useQuery<{ climbingLevel: number }>({
    queryKey: ["/api/climbing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing/stats");
      if (!res.ok) return { climbingLevel: 1 };
      return res.json();
    },
  });

  // Calculate expedition progress (days with completed habits)
  const seasonProgress = useMemo(() => {
    const completedLogs = allLogs.filter((log) => log.completed);
    const uniqueDays = new Set(completedLogs.map((log) => log.date));
    const daysCompleted = uniqueDays.size;
    return { current: daysCompleted, total: 90 };
  }, [allLogs]);

  // Calculate this week's progress
  const weekProgress = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);

    const categories = { mind: 0, foundation: 0, adventure: 0 };
    const targets = { mind: 0, foundation: 0, adventure: 0 };

    habits.forEach((habit) => {
      if (habit.category && habit.category !== "training") {
        const category = habit.category as keyof typeof categories;
        const target = habit.targetPerWeek || (habit.cadence === "daily" ? 7 : 3);
        targets[category] += target;

        const weekLogs = allLogs.filter((log) => {
          if (log.habitId !== habit.id || !log.completed) return false;
          const logDate = new Date(log.date);
          return logDate >= monday && logDate <= weekEnd;
        });

        categories[category] += Math.min(weekLogs.length, target);
      }
    });

    return {
      mind: { completed: categories.mind, target: targets.mind },
      foundation: { completed: categories.foundation, target: targets.foundation },
      adventure: { completed: categories.adventure, target: targets.adventure },
    };
  }, [habits, allLogs]);

  // Get climbing rank
  const rank = useMemo(() => {
    const level = climbingStats?.climbingLevel || 1;
    return getClimbingRank(level);
  }, [climbingStats]);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Expedition Header */}
      <ExpeditionHeader
        seasonProgress={seasonProgress}
        climbingGrade={rank?.grade || "5.9"}
        climbingRank={rank?.name || "Crux Panicker"}
        weekSummary={weekProgress}
        onViewWeek={() => setLocation("/weekly")}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 section">
        {/* Hero: Daily Focus - BIGGEST section */}
        <DailyFocusHero />

        {/* Week Overview + Streak - Side by side */}
        <WeekOverviewStreak />

        {/* Active Goals - Collapsible, takes minimal space */}
        <GoalsSection />

        {/* Optional sections - Can be toggled or moved to separate views */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TodaysTasksPanel />
          <DreamScrollWidget />
        </div>

        {/* Link to full habit history */}
        <div className="card bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
          <a href="/habits" className="block text-center py-4">
            <p className="text-sm font-medium text-foreground">
              View Full Habit History
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              See detailed analytics, patterns, and past performance
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
