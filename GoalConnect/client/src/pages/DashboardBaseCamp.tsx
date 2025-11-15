import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal, Todo, DreamScrollItem } from "@shared/schema";
import { MountainHeroCard } from "@/components/MountainHeroCard";
import { TodayCard } from "@/components/TodayCard";
import { WeekOverviewCard } from "@/components/WeekOverviewCard";
import { GoalsCard } from "@/components/GoalsCard";
import { LookingForwardCard } from "@/components/LookingForwardCard";
import { PeakLoreCard } from "@/components/PeakLoreCard";
import { LittleWinsStrip } from "@/components/LittleWinsStrip";
import { ComboTracker } from "@/components/ComboTracker";
import { DailyQuests } from "@/components/DailyQuests";
import { StreakFreeze } from "@/components/StreakFreeze";

interface ClimbingStats {
  climbingLevel: number;
  totalExperience: number;
  summitsReached: number;
}

interface UserData {
  coins: number;
}

export default function DashboardBaseCamp() {
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

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: dreamScrollItems = [] } = useQuery<DreamScrollItem[]>({
    queryKey: ["/api/dream-scroll"],
  });

  const { data: userData } = useQuery<UserData>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) {
        return { coins: 0 };
      }
      return res.json();
    },
  });

  // Calculate expedition progress (30-day period)
  const expeditionProgress = useMemo(() => {
    const completedLogs = allLogs.filter((log) => log.completed);
    const uniqueDays = new Set(completedLogs.map((log) => log.date));
    const daysCompleted = uniqueDays.size;
    return { current: daysCompleted, total: 30 };
  }, [allLogs]);

  // Calculate longest streak
  const longestStreak = useMemo(() => {
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

  // Handler for toggling habit completion
  const handleToggleHabit = async (habitId: number) => {
    const res = await fetch(`/api/habit-logs/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date: viewDate }),
    });
    if (res.ok) {
      // Refetch logs
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
    }
  };

  // Handler for toggling todo completion
  const handleToggleTodo = async (todoId: number) => {
    const res = await fetch(`/api/todos/${todoId}/toggle`, {
      method: "POST",
    });
    if (res.ok) {
      // Refetch todos
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    }
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl animate-pulse">Reaching Base Camp...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Gradient background for warmth */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      {/* Main Container - Responsive: mobile-first with desktop optimization (1440x900) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-10">
        {/* Mountain Hero - Responsive height */}
        <div className="h-[240px] sm:h-[300px] lg:h-[360px]">
          <MountainHeroCard
            mountainName="El Capitan"
            currentDay={expeditionProgress.current}
            totalDays={expeditionProgress.total}
            expeditionProgress={Math.round((expeditionProgress.current / expeditionProgress.total) * 100)}
            level={climbingStats?.climbingLevel || 1}
            coins={userData?.coins || 0}
          />
        </div>

        {/* Asymmetric Grid Layout - Stacks on mobile, asymmetric on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column - Full width on mobile, 7/12 on desktop */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Today Card - Prominent */}
            <TodayCard
              habits={habits}
              habitLogs={todayLogs}
              todos={todos}
              onToggleHabit={handleToggleHabit}
              onToggleTodo={handleToggleTodo}
            />

            {/* Goals Card */}
            <GoalsCard goals={goals} />

            {/* Peak Lore - Climbing inspiration (hidden on mobile) */}
            <div className="hidden md:block">
              <PeakLoreCard />
            </div>
          </div>

          {/* Right Column - Full width on mobile, 5/12 on desktop */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Week Overview */}
            <WeekOverviewCard
              habitLogs={allLogs}
              todos={todos}
              goals={goals}
            />

            {/* Looking Forward - Dream Scroll integration */}
            <LookingForwardCard
              dreamScrollItems={dreamScrollItems}
              selectedCategories={["do", "visit", "experience"]}
            />

            {/* Daily Quests - Compact on mobile */}
            <DailyQuests />

            {/* Streak Freeze - Compact on mobile */}
            <StreakFreeze />

            {/* Peak Lore - Show on mobile at bottom */}
            <div className="md:hidden">
              <PeakLoreCard />
            </div>
          </div>
        </div>

        {/* Bottom Strip - Little Wins */}
        <LittleWinsStrip
          todayCompletedCount={todayLogs.filter(log => log.completed).length}
          currentStreak={longestStreak}
          expeditionProgress={Math.round((expeditionProgress.current / expeditionProgress.total) * 100)}
          habitLogs={todayLogs}
        />
      </div>

      {/* Floating Combo Tracker */}
      <ComboTracker />
    </div>
  );
}
