import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Habit, HabitLog, Todo } from "@shared/schema";
import { WeeklyPlanner } from "@/components/WeeklyPlanner";
import { MonthlyGoals } from "@/components/MonthlyGoals";
import { CompactHabitTracker } from "@/components/CompactHabitTracker";
import { CheckSquare, Target, TrendingUp } from "lucide-react";

/**
 * BaseCamp - Weekly Planning Homepage
 *
 * NEW DESIGN HIERARCHY:
 * 1. Monthly Goals - Current month's focus areas
 * 2. Weekly Planner - See all 7 days, today highlighted
 * 3. Habits + Stats - Compact trackers at bottom
 */
export default function BaseCamp() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch todos for stats
  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Fetch habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Calculate week stats
  const weekStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Tasks completed this week
    const tasksCompletedThisWeek = todos.filter((todo) => {
      if (!todo.completed || !todo.completedAt) return false;
      const completedDate = new Date(todo.completedAt);
      return completedDate >= startOfWeek && completedDate <= endOfWeek;
    }).length;

    // Tasks scheduled for this week
    const tasksScheduledThisWeek = todos.filter((todo) => {
      if (!todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    }).length;

    return {
      completed: tasksCompletedThisWeek,
      scheduled: tasksScheduledThisWeek,
    };
  }, [todos]);

  if (habitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-foreground text-xl animate-pulse" aria-label="Loading base camp">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" role="main" aria-label="Weekly planning dashboard">
        {/* Monthly Goals - Top section */}
        <MonthlyGoals />

        {/* Weekly Planner - Main hero */}
        <WeeklyPlanner />

        {/* Bottom Row: Habits + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compact Habit Tracker */}
          <CompactHabitTracker />

          {/* Week Stats Card */}
          <div className="glass-card interactive-glow p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">This Week</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tasks Completed */}
              <div className="bg-card/50 rounded-xl p-4 text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-3xl font-bold text-foreground">
                  {weekStats.completed}
                </div>
                <div className="text-xs text-muted-foreground">
                  tasks completed
                </div>
              </div>

              {/* Tasks Scheduled */}
              <div className="bg-card/50 rounded-xl p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-foreground">
                  {weekStats.scheduled}
                </div>
                <div className="text-xs text-muted-foreground">
                  tasks scheduled
                </div>
              </div>
            </div>

            {/* Quick motivation */}
            {weekStats.completed > 0 && (
              <div className="mt-4 pt-4 border-t border-card-border text-center">
                <p className="text-sm text-muted-foreground">
                  {weekStats.completed >= weekStats.scheduled
                    ? "You're ahead of schedule!"
                    : weekStats.completed >= weekStats.scheduled / 2
                    ? "Great progress this week!"
                    : "Keep going, you've got this!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
