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

  // Get color based on completion percentage - terrain-based elevation
  const getColor = (completed: number, total: number): string => {
    if (total === 0) return "bg-mountain-granite/20";

    const percentage = (completed / total) * 100;

    // Base camp -> Tree line -> Alpine -> Ice -> Summit
    if (percentage === 0) return "bg-mountain-granite/20";
    if (percentage < 25) return "bg-mountain-tree-line/30";
    if (percentage < 50) return "bg-mountain-alpine-meadow/50";
    if (percentage < 75) return "bg-mountain-glacier-ice/60";
    if (percentage < 100) return "bg-mountain-sky-light/80";
    return "bg-gradient-to-br from-mountain-glacier-ice to-mountain-sky-light shadow-[0_0_8px_hsl(var(--accent))]";
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
    <div className="card-snow-layer p-6 shadow-lg topo-pattern">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-mountain-alpenglow" />
            Training Log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last 90 days of habit completions
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-technical font-bold text-foreground">{currentStreak}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">day streak</div>
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
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Base Camp</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-mountain-granite/20 border border-mountain-granite/30" />
            <div className="w-3 h-3 rounded-sm bg-mountain-tree-line/30 border border-mountain-tree-line/40" />
            <div className="w-3 h-3 rounded-sm bg-mountain-alpine-meadow/50 border border-mountain-alpine-meadow/50" />
            <div className="w-3 h-3 rounded-sm bg-mountain-glacier-ice/60 border border-mountain-glacier-ice/60" />
            <div className="w-3 h-3 rounded-sm bg-mountain-sky-light/80 border border-mountain-sky-light" />
            <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-mountain-glacier-ice to-mountain-sky-light border border-mountain-sky-light shadow-sm" />
          </div>
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Summit</span>
        </div>
        <div className="text-muted-foreground font-technical">
          {totalCompletions} completions
        </div>
      </div>
    </div>
  );
}
