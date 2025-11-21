import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { TrendingUp, Calendar, Target, Flame, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateInput } from "@/lib/utils";

interface HabitStatsProps {
  habitId: number;
}

export function HabitDetailedStats({ habitId }: HabitStatsProps) {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  const habit = habits.find((h) => h.id === habitId);

  // Get logs for this specific habit
  const habitLogs = useMemo(() => {
    return allLogs.filter((log) => log.habitId === habitId).sort((a, b) => b.date.localeCompare(a.date));
  }, [allLogs, habitId]);

  // Calculate stats
  const stats = useMemo(() => {
    const completedLogs = habitLogs.filter((log) => log.completed);
    const totalLogs = habitLogs.length;
    const completionRate = totalLogs > 0 ? (completedLogs.length / totalLogs) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = formatDateInput(checkDate);
      const log = habitLogs.find((l) => l.date === dateStr);

      if (log && log.completed) {
        currentStreak++;
      } else if (i > 0) {
        // Only break if we're past today
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = completedLogs.map((l) => l.date).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1] + "T00:00:00");
        const currDate = new Date(sortedDates[i] + "T00:00:00");
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Last 7 days pattern
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDateInput(date);
      const log = habitLogs.find((l) => l.date === dateStr);
      last7Days.push({
        date: dateStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: log?.completed || false,
      });
    }

    // Weekly completion rate
    const last7DaysCompleted = last7Days.filter((d) => d.completed).length;
    const weeklyRate = (last7DaysCompleted / 7) * 100;

    // Monthly completion rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysLogs = habitLogs.filter((log) => {
      const logDate = new Date(log.date + "T00:00:00");
      return logDate >= thirtyDaysAgo;
    });
    const last30DaysCompleted = last30DaysLogs.filter((l) => l.completed).length;
    const monthlyRate = last30DaysLogs.length > 0 ? (last30DaysCompleted / last30DaysLogs.length) * 100 : 0;

    return {
      totalLogs,
      completedLogs: completedLogs.length,
      completionRate,
      currentStreak,
      longestStreak,
      last7Days,
      weeklyRate,
      monthlyRate,
    };
  }, [habitLogs]);

  if (!habit) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-6 border border-foreground/10">
        <p className="text-muted-foreground">Habit not found</p>
      </div>
    );
  }

  if (habitLogs.length === 0) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-6 border border-foreground/10">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">{habit.icon}</div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{habit.title}</h3>
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-center py-4">
          No data yet. Start logging this habit to see analytics!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-6 border border-foreground/10 shadow-lg relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="text-3xl">{habit.icon}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">{habit.title}</h3>
            {habit.description && (
              <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-semibold uppercase",
                  habit.difficulty === "easy" && "bg-green-500/20 text-green-300",
                  habit.difficulty === "medium" && "bg-yellow-500/20 text-yellow-300",
                  habit.difficulty === "hard" && "bg-red-500/20 text-red-300"
                )}
              >
                {habit.difficulty}
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-semibold uppercase bg-foreground/10 text-foreground">
                {habit.cadence === "daily" ? "Daily" : `${habit.targetPerWeek}× per week`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Flame className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />}
            label="Current Streak"
            value={`${stats.currentStreak} days`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-green-500" />}
            label="Longest Streak"
            value={`${stats.longestStreak} days`}
          />
          <StatCard
            icon={<Target className="w-4 h-4 text-blue-500" />}
            label="All-Time Rate"
            value={`${Math.round(stats.completionRate)}%`}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4 text-purple-500" />}
            label="Total Logs"
            value={`${stats.completedLogs}/${stats.totalLogs}`}
          />
        </div>

        {/* Last 7 Days Visual */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Last 7 Days
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {stats.last7Days.map((day, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {day.dayName}
                </div>
                <div
                  className={cn(
                    "h-14 rounded-lg border flex items-center justify-center transition-all",
                    day.completed
                      ? "bg-accent border-accent/40 shadow-lg"
                      : "bg-foreground/5 border-foreground/10"
                  )}
                  title={day.date}
                >
                  {day.completed ? (
                    <span className="text-2xl">✓</span>
                  ) : (
                    <span className="text-muted-foreground text-xl">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-muted-foreground">
              Weekly Rate: <span className="font-bold text-foreground">{Math.round(stats.weeklyRate)}%</span>
            </span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-foreground/5 rounded-xl p-4 border border-foreground/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              7-Day Performance
            </div>
            <div className="flex items-end gap-1 h-16 mb-2">
              {stats.last7Days.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.completed ? "bg-accent" : "bg-foreground/20"
                    )}
                    style={{ height: day.completed ? "100%" : "20%" }}
                    title={`${day.dayName}: ${day.completed ? "Completed" : "Missed"}`}
                  ></div>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {stats.last7Days.filter((d) => d.completed).length} of 7 days
            </div>
          </div>

          <div className="bg-foreground/5 rounded-xl p-4 border border-foreground/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              30-Day Performance
            </div>
            <div className="flex items-center justify-center h-16 mb-2">
              <div className="text-4xl font-bold text-foreground">
                {Math.round(stats.monthlyRate)}%
              </div>
            </div>
            <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${stats.monthlyRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-foreground/5 rounded-xl p-3 border border-foreground/10">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
