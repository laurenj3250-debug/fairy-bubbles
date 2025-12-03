import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Flame, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { Link } from "wouter";

interface CompactHabitTrackerProps {
  className?: string;
}

export function CompactHabitTracker({ className }: CompactHabitTrackerProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  // Calculate week range for fetching logs
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dateStr: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEE")[0], // M, T, W, etc.
        isToday: isToday(date),
      };
    });
  }, [weekStart]);

  // Fetch habits
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch week's habit logs
  const { data: weekLogs = [] } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs/range/${weekStartStr}/${weekEndStr}`],
  });

  // Fetch all logs for streak calculation
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const habitIds = habits.map((h) => h.id).join(",");
      const response = await fetch(`/api/habit-logs?habitIds=${habitIds}`);
      return response.json();
    },
    enabled: habits.length > 0,
  });

  // Calculate streak
  const currentStreak = useMemo(() => {
    const sortedDates = Array.from(
      new Set(allLogs.filter((log) => log.completed).map((log) => log.date))
    )
      .sort()
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

  // Calculate completion dots for each day
  const weekCompletionStatus = useMemo(() => {
    return weekDays.map((day) => {
      const dayLogs = weekLogs.filter((log) => log.date === day.dateStr);
      const completedCount = dayLogs.filter((log) => log.completed).length;
      const totalHabits = habits.length;

      // Check if at least one habit was completed
      const hasActivity = completedCount > 0;
      // Check if all habits were completed
      const allComplete = totalHabits > 0 && completedCount >= totalHabits;

      return {
        ...day,
        hasActivity,
        allComplete,
        completedCount,
        totalHabits,
      };
    });
  }, [weekDays, weekLogs, habits]);

  // Toggle habit mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest(`/api/habits/${habitId}/log`, "POST", {
        date,
        completed: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/habit-logs/range/${weekStartStr}/${weekEndStr}`],
      });
    },
  });

  // Today's habits status
  const todayStatus = useMemo(() => {
    const todayLogs = weekLogs.filter((log) => log.date === today);
    const completedToday = todayLogs.filter((log) => log.completed).length;
    return {
      completed: completedToday,
      total: habits.length,
      remaining: habits.length - completedToday,
    };
  }, [weekLogs, habits, today]);

  return (
    <div className={cn("glass-card interactive-glow p-6 rounded-3xl", className)}>
      {/* Header with streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-foreground">Habits</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Streak:</span>
          <span className="font-bold text-orange-500">{currentStreak} days</span>
        </div>
      </div>

      {/* Week dots */}
      <div className="flex items-center justify-between mb-4">
        {weekCompletionStatus.map((day) => (
          <div key={day.dateStr} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "text-xs font-medium",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}
            >
              {day.dayName}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                day.allComplete
                  ? "bg-green-500 text-white"
                  : day.hasActivity
                  ? "bg-primary/30 text-primary"
                  : "bg-muted/50",
                day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {day.allComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : day.hasActivity ? (
                <span className="text-xs font-bold">{day.completedCount}</span>
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Today's status */}
      <div className="bg-card/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Today</p>
            <p className="text-xs text-muted-foreground">
              {todayStatus.remaining === 0
                ? "All habits complete!"
                : `${todayStatus.remaining} habit${todayStatus.remaining > 1 ? "s" : ""} remaining`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              {todayStatus.completed}
            </span>
            <span className="text-muted-foreground">/{todayStatus.total}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                todayStatus.completed >= todayStatus.total
                  ? "bg-green-500"
                  : "bg-primary"
              )}
              style={{
                width: `${todayStatus.total > 0 ? (todayStatus.completed / todayStatus.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-4 border-t border-card-border">
        <Link href="/habits">
          <a className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
            View all habits
            <ChevronRight className="w-4 h-4" />
          </a>
        </Link>
      </div>
    </div>
  );
}
