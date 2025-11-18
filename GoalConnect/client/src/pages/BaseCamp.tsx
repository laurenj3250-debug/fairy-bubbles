import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Habit, HabitLog } from "@shared/schema";
import { MountainHeader } from "@/components/MountainHeader";
import { ClimbingRouteView } from "@/components/ClimbingRouteView";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { TodaysTasksPanel } from "@/components/TodaysTasksPanel";
import { GoalsSection } from "@/components/GoalsSection";
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

  // Fetch all habit logs for streak calculation
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground text-xl animate-pulse">Loading base camp...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Mountain Header - Shows current expedition */}
        <MountainHeader seasonProgress={seasonProgress} currentStreak={currentStreak} />

        {/* Active Expedition (if exists) */}
        <ActiveExpedition />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (70%) - TODAY'S ROUTE - Main Focus */}
          <div className="lg:col-span-8">
            <div className="glass-card interactive-glow p-6">
              <ClimbingRouteView habits={habits} habitLogs={todayLogs} date={today} />
            </div>
          </div>

          {/* Right Column (30%) - Supporting Widgets */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Goals */}
            <GoalsSection />

            {/* Today's Tasks */}
            <TodaysTasksPanel />

            {/* Summit Journal (Dream Scroll) */}
            <DreamScrollWidget />

            {/* Quick Links */}
            <div className="glass-card p-4">
              <div className="space-y-2">
                <a
                  href="/habits"
                  className="block px-4 py-3 rounded-lg bg-muted/20 hover:bg-muted/40 text-center transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">Manage Habits</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Add, edit, or archive your habits
                  </div>
                </a>
                <a
                  href="/weekly"
                  className="block px-4 py-3 rounded-lg bg-muted/20 hover:bg-muted/40 text-center transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">Week View</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    See your weekly progress
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Link to full analytics */}
        <div className="glass-card p-4 text-center">
          <a href="/habits" className="block">
            <p className="text-sm font-medium text-foreground">View Detailed Analytics</p>
            <p className="text-xs text-muted-foreground mt-1">
              Explore patterns, streaks, and climbing stats
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
