import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { getClimbingRank } from "@/lib/climbingRanks";
import { TokenCounter } from "./TokenCounter";
import { XPProgressBar } from "./XPProgressBar";
import { X } from "lucide-react";

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

  // Welcome back message for returning users
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisit');
    const dismissed = sessionStorage.getItem('welcomeBackDismissed');

    if (!dismissed && lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 2) {
        setShowWelcomeBack(true);
      }
    }

    // Update last visit
    localStorage.setItem('lastVisit', today);
  }, []);

  const dismissWelcomeBack = () => {
    sessionStorage.setItem('welcomeBackDismissed', 'true');
    setShowWelcomeBack(false);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Welcome Back Banner */}
      {showWelcomeBack && (
        <div className="bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 rounded-2xl p-4 shadow-lg relative animate-in fade-in slide-in-from-top duration-300">
          <button
            onClick={dismissWelcomeBack}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="pr-8">
            <h3 className="text-base font-bold text-foreground mb-1">Welcome back!</h3>
            <p className="text-sm text-muted-foreground">
              Conditions are good today. Ready to climb?
            </p>
          </div>
        </div>
      )}

      {/* Top status bar */}
      <div className="card-snow-layer p-3 shadow-lg topo-pattern">
        <div className="flex items-center justify-between text-xs text-foreground relative z-10">
          {/* Left: Token Counter + Season progress */}
          <div className="flex items-center gap-4">
            <TokenCounter />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Season:</span>
              <span className="font-mono">
                {seasonProgress.current}/{seasonProgress.total} days
              </span>
            </div>
          </div>

          {/* Center: Climbing grade/rank */}
          <div className="flex items-center gap-2">
            {rank && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="font-technical font-bold text-mountain-alpenglow">{rank.grade}</span>
                <span className="text-foreground hidden sm:inline font-semibold">{rank.name}</span>
              </>
            )}
          </div>

          {/* Right: Week summary */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground hidden md:inline">This week:</span>

            {weekProgress.mind.target > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[hsl(var(--accent))] font-semibold">
                  {weekProgress.mind.completed}/{weekProgress.mind.target}
                </span>
                <span className="text-muted-foreground">Mind</span>
              </div>
            )}

            {weekProgress.foundation.target > 0 && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-[hsl(var(--accent))] font-semibold">
                    {weekProgress.foundation.completed}/{weekProgress.foundation.target}
                  </span>
                  <span className="text-muted-foreground">Foundation</span>
                </div>
              </>
            )}

            {weekProgress.adventure.target > 0 && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-[hsl(var(--accent))] font-semibold">
                    {weekProgress.adventure.completed}/{weekProgress.adventure.target}
                  </span>
                  <span className="text-muted-foreground">Adventure</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <XPProgressBar />
    </div>
  );
}
