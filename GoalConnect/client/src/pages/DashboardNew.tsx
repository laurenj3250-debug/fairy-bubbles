import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { getWeatherFromStreak } from "@/lib/weatherEffects";
import { getClimbingRank } from "@/lib/climbingRanks";
import { WeatherMoodSystem } from "@/components/WeatherMoodSystem";
import { ExpeditionHeader } from "@/components/ExpeditionHeader";
import { BasecampIndicator } from "@/components/BasecampIndicator";
import { TodaysPitchEnhanced } from "@/components/TodaysPitchEnhanced";
import { RoutesPanelEnhanced } from "@/components/RoutesPanelEnhanced";
import { RidgeTraverseEnhanced } from "@/components/RidgeTraverseEnhanced";
import { ComboTracker } from "@/components/ComboTracker";
import { DailyQuests } from "@/components/DailyQuests";
import { StreakFreeze } from "@/components/StreakFreeze";
import { Altimeter } from "@/components/Altimeter";
import { ClimbingInspirationTile } from "@/components/ClimbingInspirationTile";
import ActiveExpedition from "@/components/ActiveExpedition";
import CurrentExpeditionWidget from "@/components/CurrentExpeditionWidget";
import { QuickLogWidget } from "@/components/QuickLogWidget";
import { Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClimbingStats {
  climbingLevel: number;
  totalExperience: number;
  summitsReached: number;
}

export default function DashboardNew() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const viewDate = selectedDate || today;

  // Fetch data
  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
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

  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const { data: climbingStats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing/stats");
      if (!res.ok) {
        return { climbingLevel: 1, totalExperience: 0, summitsReached: 0 };
      }
      return res.json();
    },
  });

  // Calculate season progress
  const seasonProgress = useMemo(() => {
    const completedLogs = allLogs.filter((log) => log.completed);
    const uniqueDays = new Set(completedLogs.map((log) => log.date));
    const daysCompleted = uniqueDays.size;
    return { current: daysCompleted, total: 90 };
  }, [allLogs]);

  // Calculate longest streak
  const longestStreak = useMemo(() => {
    // Simple streak calculation based on recent consecutive days
    const sortedDates = Array.from(
      new Set(allLogs.filter((log) => log.completed).map((log) => log.date))
    ).sort();

    if (sortedDates.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }, [allLogs]);

  // Calculate this week's category progress
  const weekProgress = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
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

  // Calculate missed days this week
  const missedDaysThisWeek = useMemo(() => {
    const totalPossible = habits.length * 7;
    const completed = todayLogs.filter((log) => log.completed).length * 7;
    const missedPercentage = totalPossible > 0 ? ((totalPossible - completed) / totalPossible) * 100 : 0;
    return Math.min(Math.floor(missedPercentage / 15), 7);
  }, [habits, todayLogs]);

  // Weather based on streak
  const weather = getWeatherFromStreak(longestStreak, missedDaysThisWeek);

  // Climbing rank
  const rank = climbingStats ? getClimbingRank(climbingStats.climbingLevel) : null;

  // Completion percentage for today
  const completionPercentage = useMemo(() => {
    const total = habits.length;
    const completed = todayLogs.filter((log) => log.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [habits, todayLogs]);

  // Routes sent this week
  const routesSent = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);

    return habits.filter((habit) => {
      if (habit.category === "adventure") return false;
      const target = habit.targetPerWeek || (habit.cadence === "daily" ? 7 : 3);
      const weekLogs = allLogs.filter((log) => {
        if (log.habitId !== habit.id || !log.completed) return false;
        const logDate = new Date(log.date);
        return logDate >= monday && logDate <= weekEnd;
      });
      return weekLogs.length >= target;
    }).length;
  }, [habits, allLogs]);

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground text-xl animate-pulse">Loading basecamp...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" data-weather={weather}>
      {/* Weather mood background */}
      <WeatherMoodSystem weather={weather} />

      {/* Expedition Header - 48px */}
      <ExpeditionHeader
        seasonProgress={seasonProgress}
        climbingGrade={rank?.grade || "5.9"}
        climbingRank={rank?.name || "Crux Panicker"}
        weekSummary={weekProgress}
        onViewWeek={() => (window.location.href = "/weekly")}
      />

      {/* Main Canvas - Desktop-first layout (1440x900 optimized) */}
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6 relative z-10">
        {/* Active Expedition (if exists) */}
        <ActiveExpedition />

        {/* Quick Log Widget - One-tap habit logging */}
        <QuickLogWidget />

        {/* Row 1: Hero Band - Today's Pitch (left 62%) + Routes (right 34%) with 4% gap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px]">
          {/* Today's Pitch - Expanded Preview */}
          <div className="lg:col-span-7">
            <TodaysPitchEnhanced selectedDate={viewDate} />
          </div>

          {/* Routes & Goals Compact */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Current Expedition Widget */}
            <CurrentExpeditionWidget />

            {/* Altimeter - shows current elevation/altitude */}
            <Altimeter compact={false} />

            {/* Daily Quests */}
            <DailyQuests />

            {/* Climbing Inspiration - Daily rotation of locations, facts, tips, quotes */}
            <ClimbingInspirationTile />

            {/* Streak Freeze */}
            <StreakFreeze />

            <RoutesPanelEnhanced />

            {/* Basecamp status */}
            <div className="relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-4 shadow-lg overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
                }}
              />
              <BasecampIndicator progressPercentage={completionPercentage} />

              <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground relative z-10">
                <div className="flex justify-between">
                  <span>Routes sent this week:</span>
                  <span className="text-foreground font-semibold">{routesSent}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Season progress:</span>
                  <span className="text-foreground font-semibold">
                    {Math.round((seasonProgress.current / seasonProgress.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Ridge Traverse Visual Band - Full width */}
        <div className="relative">
          <RidgeTraverseEnhanced
            onDayClick={(date) => setSelectedDate(date)}
            selectedDate={viewDate}
            seasonProgress={seasonProgress.current}
          />

          {/* Quick Actions pill - bottom-left overlay */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-card/40 backdrop-blur-sm border border-card-border rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={() => (window.location.href = "/habits")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Habit</span>
            </button>

            <div className="w-px h-4 bg-border/50" />

            <button
              onClick={() => (window.location.href = "/weekly")}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary/10"
            >
              <Calendar className="w-4 h-4" />
              <span>Week View</span>
            </button>
          </div>
        </div>

        {/* Bottom strip: Recent events / notifications (optional) */}
        {routesSent > 0 && (
          <div className="relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-4 shadow-lg overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <div className="text-2xl">🎯</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {routesSent === 1
                    ? "Route sent - clean redpoint!"
                    : `${routesSent} routes sent this week!`}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Keep climbing. Conditions are improving.
                </div>
              </div>
            </div>
          </div>
        )}

        {missedDaysThisWeek >= 3 && (
          <div className="relative bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <div className="text-2xl">⛅</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  Weather break? Conditions improving.
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Try one light pitch today - no pressure.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Combo Tracker - Fixed floating widget */}
      <ComboTracker />
    </div>
  );
}
