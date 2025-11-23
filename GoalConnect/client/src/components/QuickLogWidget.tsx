import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { cn, getToday } from "@/lib/utils";
import { Check, Flame } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history?: Array<{ date: string; completed: boolean }>;
}

/**
 * Quick-Log Widget: One-tap habit logging from dashboard
 *
 * Inspired by Streaks app - each habit is a tappable circle.
 * Single tap toggles completion with satisfying feedback.
 *
 * Psychology applied:
 * - Minimum Viable Friction: 1 tap to log
 * - Variable Reinforcement: Random celebration intensity
 * - Peak-End Rule: Satisfying completion animation
 */
export function QuickLogWidget() {
  const today = getToday();
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  // Fetch habits with streak data
  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  // Toggle habit completion
  const toggleMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const isCompletedToday = (habitId: number) => {
    return todayLogs.some((log) => log.habitId === habitId && log.completed);
  };

  const handleToggle = (habit: HabitWithData) => {
    const wasCompleted = isCompletedToday(habit.id);

    // Only celebrate when completing (not uncompleting)
    if (!wasCompleted) {
      setAnimatingId(habit.id);

      // Variable reinforcement: Random celebration intensity
      const intensity = Math.random();
      const particleCount = intensity > 0.7 ? 80 : intensity > 0.3 ? 50 : 30;

      confetti({
        particleCount,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["hsl(var(--primary))", "hsl(var(--accent))", "#FFD700"],
      });

      // Check if this completes all habits for the day
      const completedCount = todayLogs.filter((l) => l.completed).length;
      if (completedCount + 1 === habits.length) {
        // Summit celebration! All habits done!
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ["#FFD700", "#FFA500", "#FF6347", "hsl(var(--primary))"],
          });
        }, 300);
      }

      setTimeout(() => setAnimatingId(null), 600);
    }

    toggleMutation.mutate(habit.id);
  };

  // Calculate completion stats
  const completedCount = todayLogs.filter((l) => l.completed).length;
  const totalHabits = habits.length;
  const completionPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const allComplete = completedCount === totalHabits && totalHabits > 0;

  if (isLoading) {
    return (
      <div className="bg-background/60 backdrop-blur-sm border border-foreground/10 rounded-2xl p-4">
        <div className="animate-pulse flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-14 h-14 rounded-full bg-foreground/10" />
          ))}
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return null; // Don't show widget if no habits
  }

  return (
    <div
      className={cn(
        "bg-background/60 backdrop-blur-sm border border-foreground/10 rounded-2xl p-4 transition-all",
        allComplete && "border-primary/40 bg-primary/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground/70">Today's Habits</h3>
          {allComplete && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Summit! 🏔️
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-foreground/50">
          {completedCount}/{totalHabits}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-foreground/10 rounded-full mb-4 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            allComplete ? "bg-primary" : "bg-primary/70"
          )}
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Habit Circles Grid */}
      <div className="flex flex-wrap gap-3 justify-center">
        {habits.map((habit) => {
          const completed = isCompletedToday(habit.id);
          const streak = habit.streak?.streak || 0;
          const isAnimating = animatingId === habit.id;

          return (
            <button
              key={habit.id}
              onClick={() => handleToggle(habit)}
              disabled={toggleMutation.isPending}
              className={cn(
                "relative group flex flex-col items-center gap-1 transition-transform",
                "hover:scale-105 active:scale-95",
                isAnimating && "animate-bounce"
              )}
              title={habit.title}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                  "border-2 shadow-sm",
                  completed
                    ? "bg-primary border-primary text-primary-foreground shadow-primary/30"
                    : "bg-background/80 border-foreground/20 text-foreground/40 hover:border-primary/50 hover:text-primary"
                )}
              >
                {completed ? (
                  <Check className="w-6 h-6" strokeWidth={3} />
                ) : (
                  <span className="text-lg">{habit.icon || habit.title.charAt(0)}</span>
                )}
              </div>

              {/* Streak Badge */}
              {streak > 0 && (
                <div
                  className={cn(
                    "absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
                    streak >= 7
                      ? "bg-orange-500 text-white"
                      : "bg-foreground/10 text-foreground/60"
                  )}
                >
                  <Flame className="w-3 h-3" />
                  {streak}
                </div>
              )}

              {/* Habit Title (truncated) */}
              <span className="text-xs text-foreground/50 max-w-14 truncate">
                {habit.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Motivational Message */}
      {allComplete ? (
        <p className="text-center text-sm text-primary mt-4 font-medium">
          All habits complete! You've reached today's summit. 🎉
        </p>
      ) : completedCount > 0 ? (
        <p className="text-center text-xs text-foreground/40 mt-4">
          {totalHabits - completedCount} more to reach today's summit
        </p>
      ) : (
        <p className="text-center text-xs text-foreground/40 mt-4">
          Tap circles to log your habits
        </p>
      )}
    </div>
  );
}

export default QuickLogWidget;
