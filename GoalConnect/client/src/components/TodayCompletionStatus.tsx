import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { getToday } from "@/lib/utils";
import { Check, Circle, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyProgress: { progress: number; targetPerWeek: number; isComplete: boolean } | null;
}

export function TodayCompletionStatus() {
  const today = getToday();

  // Fetch habits with data
  const { data: habits = [], isLoading: habitsLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Fetch today's logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  // Calculate completion statistics
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return {
        completed: 0,
        total: 0,
        percentage: 0,
        energyEarned: 0,
        longestStreak: 0,
      };
    }

    const completedHabits = habits.filter((habit) =>
      logs.some((log) => log.habitId === habit.id && log.completed && log.date === today)
    );

    // Calculate energy earned today
    const energyEarned = completedHabits.reduce((total, habit) => {
      const difficultyEnergy = {
        easy: 5,
        medium: 10,
        hard: 15,
      };
      const baseEnergy = difficultyEnergy[habit.difficulty as keyof typeof difficultyEnergy] || 10;
      const streakValue = habit.streak?.streak || 0;

      let multiplier = 1.0;
      if (streakValue >= 30) multiplier = 3.0;
      else if (streakValue >= 14) multiplier = 2.0;
      else if (streakValue >= 7) multiplier = 1.5;
      else if (streakValue >= 3) multiplier = 1.2;

      return total + Math.round(baseEnergy * multiplier);
    }, 0);

    const longestStreak = habits.reduce((max, habit) => {
      const streak = habit.streak?.streak || 0;
      return Math.max(max, streak);
    }, 0);

    return {
      completed: completedHabits.length,
      total: habits.length,
      percentage: Math.round((completedHabits.length / habits.length) * 100),
      energyEarned,
      longestStreak,
    };
  }, [habits, logs, today]);

  // Group habits by completion status
  const { completedHabits, incompleteHabits } = useMemo(() => {
    const completed: HabitWithData[] = [];
    const incomplete: HabitWithData[] = [];

    habits.forEach((habit) => {
      const isCompleted = logs.some(
        (log) => log.habitId === habit.id && log.completed && log.date === today
      );
      if (isCompleted) {
        completed.push(habit);
      } else {
        incomplete.push(habit);
      }
    });

    return { completedHabits: completed, incompleteHabits: incomplete };
  }, [habits, logs, today]);

  if (habitsLoading || logsLoading) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10 animate-pulse">
        <div className="h-32 bg-foreground/5 rounded-xl"></div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10">
        <p className="text-muted-foreground text-center">
          No habits yet. Create your first route to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10 shadow-xl relative overflow-hidden">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Today's Routes</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="hsl(var(--foreground) / 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="hsl(var(--accent))"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.percentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.percentage}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-foreground/5 rounded-xl p-3 border border-foreground/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Completed
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.completed}/{stats.total}
            </div>
          </div>

          <div className="bg-foreground/5 rounded-xl p-3 border border-foreground/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Energy
            </div>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--accent))" }}>
              {stats.energyEarned}
            </div>
          </div>

          <div className="bg-foreground/5 rounded-xl p-3 border border-foreground/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Streak
            </div>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--accent))" }}>
              {stats.longestStreak}
            </div>
          </div>
        </div>

        {/* Habit List - Incomplete First */}
        <div className="space-y-3">
          {incompleteHabits.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                To Do ({incompleteHabits.length})
              </h3>
              <div className="space-y-2">
                {incompleteHabits.map((habit) => (
                  <HabitStatusRow key={habit.id} habit={habit} completed={false} />
                ))}
              </div>
            </div>
          )}

          {completedHabits.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                Sent ({completedHabits.length})
              </h3>
              <div className="space-y-2">
                {completedHabits.map((habit) => (
                  <HabitStatusRow key={habit.id} habit={habit} completed={true} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Motivational Message */}
        {stats.percentage === 100 && (
          <div className="mt-6 p-4 rounded-xl border-2 border-accent/30 bg-accent/10">
            <p className="text-center font-bold text-foreground">
              🏔️ Perfect day! All routes sent!
            </p>
          </div>
        )}

        {stats.percentage >= 50 && stats.percentage < 100 && (
          <div className="mt-6 p-4 rounded-xl border border-foreground/10 bg-foreground/5">
            <p className="text-center text-sm text-muted-foreground">
              Keep going! You're over halfway there 💪
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HabitStatusRow({ habit, completed }: { habit: HabitWithData; completed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all",
        completed
          ? "bg-accent/10 border-accent/20"
          : "bg-background/60 border-foreground/10 hover:border-foreground/20"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all",
          completed
            ? "bg-accent border-accent"
            : "border-muted-foreground/30"
        )}
      >
        {completed && <Check className="w-4 h-4 text-accent-foreground stroke-[3]" />}
        {!completed && <Circle className="w-4 h-4 text-muted-foreground/30" />}
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center w-8 h-8 text-xl flex-shrink-0">
        {habit.icon}
      </div>

      {/* Title */}
      <div className="flex-1">
        <p
          className={cn(
            "font-medium transition-all",
            completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {habit.title}
        </p>
        {habit.streak && habit.streak.streak > 0 && !completed && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            {habit.streak.streak} day streak
          </p>
        )}
      </div>

      {/* Difficulty Badge */}
      <div
        className={cn(
          "px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider",
          habit.difficulty === "easy" && "bg-green-500/20 text-green-300",
          habit.difficulty === "medium" && "bg-yellow-500/20 text-yellow-300",
          habit.difficulty === "hard" && "bg-red-500/20 text-red-300"
        )}
      >
        {habit.difficulty}
      </div>
    </div>
  );
}
