import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, TrendingUp, Calendar, Flame, Award } from "lucide-react";
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { useMemo } from "react";

interface Habit {
  id: number;
  title: string;
  userId: number;
}

interface HabitLog {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
}

interface HabitWithData {
  id: number;
  title: string;
  streak: {
    streak: number;
    lastCompletedDate: string | null;
  };
}

export default function ExpeditionLogbook() {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitsWithData = [] } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
  });

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const last30Days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    // Total completions in last 30 days
    const last30DaysLogs = allLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= subDays(today, 29) && log.completed;
    });

    // Current streaks
    const longestStreak = habitsWithData.reduce((max, habit) => {
      return Math.max(max, habit.streak?.streak || 0);
    }, 0);

    // Perfect days (all habits completed)
    const perfectDays = last30Days.filter(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const logsForDay = allLogs.filter(log => log.date === dayStr && log.completed);
      return logsForDay.length === habits.length && habits.length > 0;
    }).length;

    // Total holds sent
    const totalHoldsSent = last30DaysLogs.length;

    // Average per day
    const avgPerDay = habits.length > 0 ? (totalHoldsSent / 30).toFixed(1) : 0;

    return {
      totalHoldsSent,
      longestStreak,
      perfectDays,
      avgPerDay,
    };
  }, [allLogs, habits, habitsWithData]);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              📖 Expedition Logbook
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your climbing journey over the past 30 days
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Mountain className="w-5 h-5" />}
            label="Holds Sent"
            value={stats.totalHoldsSent}
            color="blue"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Longest Streak"
            value={`${stats.longestStreak} days`}
            color="orange"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Perfect Days"
            value={stats.perfectDays}
            color="emerald"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Daily Average"
            value={stats.avgPerDay}
            color="purple"
          />
        </div>

        {/* Heatmap */}
        <HabitHeatmap habits={habits} logs={allLogs} />

        {/* Individual Habit Stats */}
        <div className="glass-card interactive-glow p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Individual Routes
          </h2>
          <div className="space-y-4">
            {habitsWithData.map((habit) => (
              <HabitStreakCard key={habit.id} habit={habit} logs={allLogs} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "orange" | "emerald" | "purple";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card interactive-glow p-4"
    >
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3 border-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

interface HabitHeatmapProps {
  habits: Habit[];
  logs: HabitLog[];
}

function HabitHeatmap({ habits, logs }: HabitHeatmapProps) {
  const today = new Date();
  const weeks = 12; // Show 12 weeks
  const startDate = subDays(today, weeks * 7 - 1);

  const days = eachDayOfInterval({ start: startDate, end: today });

  // Group days by week
  const weekGroups = useMemo(() => {
    const groups: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (day.getDay() === 6 || index === days.length - 1) {
        // Saturday or last day
        groups.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return groups;
  }, [days]);

  const getIntensity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const logsForDay = logs.filter(log => log.date === dateStr && log.completed);
    const completionRate = habits.length > 0 ? logsForDay.length / habits.length : 0;

    if (completionRate === 0) return 0;
    if (completionRate < 0.33) return 1;
    if (completionRate < 0.66) return 2;
    if (completionRate < 1) return 3;
    return 4; // Perfect day
  };

  const getColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-muted/20 border-card-border/30";
      case 1: return "bg-blue-500/20 border-blue-500/30";
      case 2: return "bg-blue-500/40 border-blue-500/50";
      case 3: return "bg-blue-500/60 border-blue-500/70";
      case 4: return "bg-emerald-500/80 border-emerald-500";
      default: return "bg-muted/20 border-card-border/30";
    }
  };

  return (
    <div className="glass-card interactive-glow p-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        🗓️ Climbing Activity
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        Last {weeks} weeks • Darker = more holds sent
      </p>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weekGroups.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const intensity = getIntensity(day);
                const isToday = isSameDay(day, today);

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    className={`w-3 h-3 rounded-sm border ${getColor(intensity)} ${
                      isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                    } transition-all hover:scale-125`}
                    title={`${format(day, 'MMM d, yyyy')} - ${intensity === 4 ? 'Perfect day!' : intensity === 0 ? 'No activity' : `${intensity}/4 activity`}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-6 text-xs">
        <span className="text-muted-foreground">Less</span>
        {[0, 1, 2, 3, 4].map((intensity) => (
          <div
            key={intensity}
            className={`w-3 h-3 rounded-sm border ${getColor(intensity)}`}
          />
        ))}
        <span className="text-muted-foreground">More</span>
      </div>
    </div>
  );
}

interface HabitStreakCardProps {
  habit: HabitWithData;
  logs: HabitLog[];
}

function HabitStreakCard({ habit, logs }: HabitStreakCardProps) {
  const last7Days = useMemo(() => {
    const today = new Date();
    return eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });
  }, []);

  const completionData = last7Days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = logs.find(l => l.habitId === habit.id && l.date === dayStr);
    return {
      day,
      completed: log?.completed || false,
    };
  });

  const completionRate = (completionData.filter(d => d.completed).length / 7) * 100;

  return (
    <div className="p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all border border-card-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{habit.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {habit.streak.streak} day streak • {completionRate.toFixed(0)}% this week
          </p>
        </div>
        {habit.streak.streak >= 7 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/20 text-orange-400">
            <Flame className="w-3 h-3" />
            <span className="text-xs font-bold">{habit.streak.streak}</span>
          </div>
        )}
      </div>

      {/* Last 7 days mini calendar */}
      <div className="flex gap-1">
        {completionData.map(({ day, completed }) => {
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-muted-foreground">
                {format(day, 'EEE')[0]}
              </div>
              <div
                className={`w-full h-8 rounded-md border-2 transition-all ${
                  completed
                    ? 'bg-emerald-500/40 border-emerald-500/70'
                    : 'bg-muted/10 border-card-border/30'
                } ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
