import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Flame } from "lucide-react";

interface HabitLog {
  id: number;
  habitId: number;
  userId: number;
  date: string;
  completed: boolean;
}

interface Habit {
  id: number;
  title: string;
}

export function HabitHeatmapDashboard() {
  // Fetch all habits
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch all habit logs
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Generate last 90 days
  const dates = useMemo(() => {
    const today = new Date();
    const daysToShow = 90;
    const result: Date[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push(date);
    }

    return result;
  }, []);

  // Calculate completion stats by date
  const dateStats = useMemo(() => {
    const stats = new Map<string, { completed: number; total: number }>();

    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const logsForDate = allLogs.filter(log => log.date === dateStr && log.completed);

      stats.set(dateStr, {
        completed: logsForDate.length,
        total: habits.length || 1, // Avoid division by zero
      });
    });

    return stats;
  }, [dates, allLogs, habits]);

  // Get color based on completion percentage
  const getColor = (completed: number, total: number): string => {
    if (total === 0) return "bg-muted/30";

    const percentage = (completed / total) * 100;

    if (percentage === 0) return "bg-muted/30";
    if (percentage < 25) return "bg-orange-400/30";
    if (percentage < 50) return "bg-orange-400/50";
    if (percentage < 75) return "bg-orange-400/70";
    if (percentage < 100) return "bg-orange-400/90";
    return "bg-gradient-to-br from-orange-400 to-orange-500";
  };

  // Group dates by week
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];

    dates.forEach((date, index) => {
      currentWeek.push(date);

      // Start new week on Sunday or at the end
      if (date.getDay() === 6 || index === dates.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [dates]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedDates = [...dates].reverse();

    for (const date of sortedDates) {
      const dateStr = date.toISOString().split('T')[0];
      const stats = dateStats.get(dateStr);

      if (!stats || stats.completed === 0) {
        // If today has no completions, that's ok, keep going
        if (dateStr === today) continue;
        break;
      }

      if (stats.completed > 0) {
        streak++;
      }
    }

    return streak;
  }, [dates, dateStats]);

  // Calculate total completions
  const totalCompletions = useMemo(() => {
    return Array.from(dateStats.values()).reduce((sum, stats) => sum + stats.completed, 0);
  }, [dateStats]);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Training Log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last 90 days of habit completions
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
          <div className="text-xs text-muted-foreground">day streak</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto relative z-10">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const stats = dateStats.get(dateStr) || { completed: 0, total: 0 };
                const color = getColor(stats.completed, stats.total);
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={dateStr}
                    className={`w-3 h-3 rounded-sm transition-all duration-200 hover:scale-150 cursor-pointer ${color} ${
                      isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''
                    }`}
                    title={`${date.toLocaleDateString()}: ${stats.completed}/${stats.total} habits completed`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="mt-4 flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-orange-400/30" />
            <div className="w-3 h-3 rounded-sm bg-orange-400/50" />
            <div className="w-3 h-3 rounded-sm bg-orange-400/70" />
            <div className="w-3 h-3 rounded-sm bg-orange-400/90" />
            <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-orange-400 to-orange-500" />
          </div>
          <span className="text-muted-foreground">More</span>
        </div>
        <div className="text-muted-foreground">
          {totalCompletions} completions in last 90 days
        </div>
      </div>
    </div>
  );
}
