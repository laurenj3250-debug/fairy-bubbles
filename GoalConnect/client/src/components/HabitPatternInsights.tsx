import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { TrendingUp, TrendingDown, Calendar, Zap, Link2, AlertCircle } from "lucide-react";
import { getToday } from "@/lib/utils";

interface HabitWithData extends Habit {
  streak: { streak: number };
}

interface DayPattern {
  dayName: string;
  dayNumber: number;
  completionRate: number;
  totalLogs: number;
  completedLogs: number;
}

interface HabitCorrelation {
  habit1: Habit;
  habit2: Habit;
  correlation: number;
  timesCompletedTogether: number;
}

interface TrendData {
  period: string;
  completionRate: number;
}

export function HabitPatternInsights() {
  const { data: habits = [] } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Calculate day-of-week patterns
  const dayPatterns = useMemo((): DayPattern[] => {
    const dayMap = new Map<number, { completed: number; total: number }>();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    allLogs.forEach((log) => {
      const date = new Date(log.date + "T00:00:00");
      const dayNumber = date.getDay();
      const current = dayMap.get(dayNumber) || { completed: 0, total: 0 };

      dayMap.set(dayNumber, {
        completed: current.completed + (log.completed ? 1 : 0),
        total: current.total + 1,
      });
    });

    return Array.from(dayMap.entries())
      .map(([dayNumber, stats]) => ({
        dayName: dayNames[dayNumber],
        dayNumber,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        totalLogs: stats.total,
        completedLogs: stats.completed,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [allLogs]);

  // Calculate habit correlations
  const habitCorrelations = useMemo((): HabitCorrelation[] => {
    if (habits.length < 2) return [];

    const correlations: HabitCorrelation[] = [];

    // Group logs by date
    const logsByDate = new Map<string, Set<number>>();
    allLogs.forEach((log) => {
      if (log.completed) {
        if (!logsByDate.has(log.date)) {
          logsByDate.set(log.date, new Set());
        }
        logsByDate.get(log.date)!.add(log.habitId);
      }
    });

    // Calculate correlation for each pair of habits
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habit1 = habits[i];
        const habit2 = habits[j];

        let timesCompletedTogether = 0;
        let timesHabit1Completed = 0;

        logsByDate.forEach((habitIds) => {
          const has1 = habitIds.has(habit1.id);
          const has2 = habitIds.has(habit2.id);

          if (has1) timesHabit1Completed++;
          if (has1 && has2) timesCompletedTogether++;
        });

        // Calculate correlation as percentage
        const correlation =
          timesHabit1Completed > 0
            ? (timesCompletedTogether / timesHabit1Completed) * 100
            : 0;

        if (correlation >= 70 && timesCompletedTogether >= 3) {
          correlations.push({
            habit1,
            habit2,
            correlation,
            timesCompletedTogether,
          });
        }
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation).slice(0, 3);
  }, [habits, allLogs]);

  // Calculate trend (last 4 weeks)
  const trend = useMemo((): { direction: "up" | "down" | "stable"; change: number; weeklyData: TrendData[] } => {
    const today = new Date();
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyData: TrendData[] = [];

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(weekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const logsInWeek = allLogs.filter((log) => {
        const logDate = new Date(log.date + "T00:00:00");
        return logDate >= weekStart && logDate <= weekEnd;
      });

      const completed = logsInWeek.filter((log) => log.completed).length;
      const total = logsInWeek.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      weeklyData.push({
        period: `Week ${week + 1}`,
        completionRate: Math.round(completionRate),
      });
    }

    if (weeklyData.length < 2) {
      return { direction: "stable", change: 0, weeklyData };
    }

    const firstWeek = weeklyData[0].completionRate;
    const lastWeek = weeklyData[weeklyData.length - 1].completionRate;
    const change = lastWeek - firstWeek;

    let direction: "up" | "down" | "stable";
    if (change > 5) direction = "up";
    else if (change < -5) direction = "down";
    else direction = "stable";

    return { direction, change: Math.round(change), weeklyData };
  }, [allLogs]);

  // Calculate current overall stats
  const overallStats = useMemo(() => {
    const last30Days = allLogs.filter((log) => {
      const logDate = new Date(log.date + "T00:00:00");
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return logDate >= thirtyDaysAgo;
    });

    const completed = last30Days.filter((log) => log.completed).length;
    const total = last30Days.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completionRate, completed, total };
  }, [allLogs]);

  if (habits.length === 0 || allLogs.length < 7) {
    return (
      <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10">
        <h2 className="text-xl font-bold text-foreground mb-4">📊 Pattern Insights</h2>
        <p className="text-muted-foreground text-center py-8">
          Complete habits for at least a week to unlock pattern insights
        </p>
      </div>
    );
  }

  const bestDay = dayPatterns[0];
  const worstDay = dayPatterns[dayPatterns.length - 1];

  return (
    <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10 shadow-xl relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, hsl(var(--accent) / 0.3), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
          Pattern Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Day Insight */}
          {bestDay && bestDay.totalLogs >= 3 && (
            <InsightCard
              icon={<TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />}
              title="Your Best Day"
              value={bestDay.dayName}
              subtitle={`${Math.round(bestDay.completionRate)}% completion rate`}
              trend="positive"
            />
          )}

          {/* Worst Day Warning */}
          {worstDay && worstDay.totalLogs >= 3 && worstDay.completionRate < 50 && (
            <InsightCard
              icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
              title="Watch Out"
              value={worstDay.dayName}
              subtitle={`Only ${Math.round(worstDay.completionRate)}% completion`}
              trend="warning"
            />
          )}

          {/* Trend Analysis */}
          <InsightCard
            icon={
              trend.direction === "up" ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : (
                <Calendar className="w-5 h-5 text-blue-500" />
              )
            }
            title={
              trend.direction === "up"
                ? "Trending Up"
                : trend.direction === "down"
                ? "Trending Down"
                : "Holding Steady"
            }
            value={
              trend.direction === "stable"
                ? `${overallStats.completionRate}%`
                : `${trend.change > 0 ? "+" : ""}${trend.change}%`
            }
            subtitle={`Last 4 weeks: ${trend.weeklyData.map(w => w.completionRate + "%").join(" → ")}`}
            trend={trend.direction === "up" ? "positive" : trend.direction === "down" ? "negative" : "neutral"}
          />

          {/* Overall Performance */}
          <InsightCard
            icon={<Calendar className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />}
            title="Last 30 Days"
            value={`${overallStats.completionRate}%`}
            subtitle={`${overallStats.completed} of ${overallStats.total} habits completed`}
            trend="neutral"
          />

          {/* Habit Correlations */}
          {habitCorrelations.map((correlation, idx) => (
            <InsightCard
              key={idx}
              icon={<Link2 className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />}
              title="Power Combo"
              value={`${correlation.habit1.icon} → ${correlation.habit2.icon}`}
              subtitle={`When you complete "${correlation.habit1.title}", you complete "${correlation.habit2.title}" ${Math.round(correlation.correlation)}% of the time`}
              trend="positive"
            />
          ))}
        </div>

        {/* Day of Week Breakdown */}
        {dayPatterns.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Weekly Performance
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
                const pattern = dayPatterns.find((p) => p.dayNumber === idx);
                const rate = pattern?.completionRate || 0;
                const opacity = Math.max(0.2, rate / 100);

                return (
                  <div key={day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">{day}</div>
                    <div
                      className="h-16 rounded-lg border border-foreground/10 flex items-center justify-center transition-all hover:scale-105"
                      style={{
                        background: `hsl(var(--accent) / ${opacity})`,
                      }}
                      title={`${pattern?.completedLogs || 0} of ${pattern?.totalLogs || 0} completed`}
                    >
                      <span className="text-sm font-bold text-foreground">
                        {pattern ? Math.round(rate) : 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  trend: "positive" | "negative" | "neutral" | "warning";
}) {
  const borderColor =
    trend === "positive"
      ? "border-accent/30"
      : trend === "negative"
      ? "border-red-500/30"
      : trend === "warning"
      ? "border-yellow-500/30"
      : "border-foreground/10";

  const bgColor =
    trend === "positive"
      ? "bg-accent/5"
      : trend === "negative"
      ? "bg-red-500/5"
      : trend === "warning"
      ? "bg-yellow-500/5"
      : "bg-foreground/5";

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </div>
          <div className="text-lg font-bold text-foreground mb-1 truncate">{value}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
