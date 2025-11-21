import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Habit, HabitLog } from "@shared/schema";
import { MountainHeader } from "@/components/MountainHeader";
import { ClimbingRouteView } from "@/components/ClimbingRouteView";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { TodaysTasksPanel } from "@/components/TodaysTasksPanel";
import { GoalsSection } from "@/components/GoalsSection";
import { PeakLoreCard } from "@/components/PeakLoreCard";
import ActiveExpedition from "@/components/ActiveExpedition";

/**
 * BaseCamp - The main dashboard consolidating WeeklyHub and DashboardNew
 *
 * NEW DESIGN HIERARCHY:
 * 1. MountainHeader (60px) - Current expedition context
 * 2. ActiveExpedition (if exists) - Current mission
 * 3. ClimbingRouteView (60%) - TODAY'S ROUTE (main focus)
 * 4. Supporting widgets (30%) - Goals, Tasks, Dreams
 *
 * Implements vertical climbing route metaphor where habits are "pitches" to climb
 */
export default function BaseCamp() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch today's habit logs
  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs/${today}`],
  });

  // Fetch all habit logs for streak calculation - OPTIMIZED BATCH ENDPOINT
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      // Use batch endpoint to fetch all logs in a single request (fixes N+1 query problem)
      const habitIds = habits.map(h => h.id).join(',');
      const response = await fetch(`/api/habit-logs?habitIds=${habitIds}`);
      return response.json();
    },
    enabled: habits.length > 0,
  });

  // Calculate season progress (total unique days with completed habits)
  const seasonProgress = useMemo(() => {
    const completedLogs = allLogs.filter((log) => log.completed);
    const uniqueDays = new Set(completedLogs.map((log) => log.date));
    const daysCompleted = uniqueDays.size;
    return { current: daysCompleted, total: 90 };
  }, [allLogs]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    const sortedDates = Array.from(
      new Set(allLogs.filter((log) => log.completed).map((log) => log.date))
    ).sort()
      .reverse();

    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i]);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [allLogs]);

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-foreground text-xl animate-pulse" aria-label="Loading base camp">
          Loading base camp...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8" role="main" aria-label="Base camp dashboard">
        {/* Mountain Header - Shows current expedition */}
        <MountainHeader seasonProgress={seasonProgress} currentStreak={currentStreak} />

        {/* Active Expedition (if exists) */}
        <ActiveExpedition />

        {/* Main Climbing Route - Full Width Hero */}
        <div className="glass-card interactive-glow p-8 rounded-3xl">
          <ClimbingRouteView habits={habits} habitLogs={todayLogs} date={today} />
        </div>

        {/* Supporting Widgets - Stacked layout */}
        <div className="space-y-6">
          {/* Active Goals - Full width on top */}
          <GoalsSection />

          {/* Summit Journal, Tasks, and Peak Lore - Three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DreamScrollWidget />
            <TodaysTasksPanel />
            <PeakLoreCard />
          </div>
        </div>
      </div>
    </div>
  );
}
