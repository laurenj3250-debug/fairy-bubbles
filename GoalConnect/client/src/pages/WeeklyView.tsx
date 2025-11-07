import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Flame, Trophy, Sparkles, ChevronDown, ChevronUp, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/utils";

// Magical Canvas Component
function MagicalCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('weeklyCanvas');
    if (!canvas) return;

    const colors = ['#a7f3d0', '#fbbf24', '#a78bfa', '#fca5a5', '#93c5fd'];
    for (let i = 0; i < 30; i++) {
      const light = document.createElement('div');
      light.className = 'absolute rounded-full float-fairy blur-sm';
      light.style.background = colors[Math.floor(Math.random() * colors.length)];
      light.style.width = Math.random() * 4 + 2 + 'px';
      light.style.height = light.style.width;
      light.style.left = Math.random() * 100 + '%';
      light.style.top = Math.random() * 100 + '%';
      light.style.animationDelay = Math.random() * 8 + 's';
      light.style.animationDuration = (Math.random() * 4 + 6) + 's';
      canvas.appendChild(light);
    }

    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute w-0.5 h-0.5 bg-white rounded-full twinkle';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.boxShadow = '0 0 3px white, 0 0 6px white';
      canvas.appendChild(star);
    }

    return () => {
      if (canvas) canvas.innerHTML = '';
    };
  }, []);

  return (
    <div id="weeklyCanvas" className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
  );
}

export default function WeeklyView() {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [planningMode, setPlanningMode] = useState(false);

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Get current week (Monday to Sunday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toISOString().split('T')[0] === getToday()
      });
    }
    return days;
  }, []);

  // Fetch logs for entire week
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/week", weekDates[0]?.date],
    queryFn: async () => {
      const logs = await Promise.all(
        weekDates.map(day =>
          fetch(`/api/habit-logs/${day.date}`, { credentials: 'include' }).then(res => res.json())
        )
      );
      return logs.flat();
    },
    enabled: weekDates.length > 0
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", { habitId, date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
    },
  });

  // Calculate stats for each day
  const dayStats = useMemo(() => {
    return weekDates.map(day => {
      const dayLogs = allLogs.filter(log => log.date === day.date && log.completed);
      const totalHabits = habits.length;
      const completedHabits = dayLogs.length;

      // Calculate points (simple calculation)
      const points = dayLogs.reduce((sum, log) => {
        const habit = habits.find(h => h.id === log.habitId);
        const difficulty = habit?.difficulty || 'medium';
        const basePoints = { easy: 5, medium: 10, hard: 15 }[difficulty];
        return sum + basePoints;
      }, 0);

      return {
        ...day,
        completedHabits,
        totalHabits,
        points,
        isPerfect: completedHabits === totalHabits && totalHabits > 0
      };
    });
  }, [weekDates, allLogs, habits]);

  // Weekly totals
  const weeklyPoints = dayStats.reduce((sum, day) => sum + day.points, 0);
  const perfectDays = dayStats.filter(day => day.isPerfect).length;
  const weeklyTarget = 500; // Could be dynamic
  const progress = Math.min((weeklyPoints / weeklyTarget) * 100, 100);

  // This week's goals
  const weeklyGoals = useMemo(() => {
    return goals.filter(goal => {
      const deadline = goal.deadline;
      return deadline >= weekDates[0].date && deadline <= weekDates[6].date;
    });
  }, [goals, weekDates]);

  const handleToggle = (habitId: number, date: string) => {
    toggleHabitMutation.mutate({ habitId, date });
  };

  return (
    <div className="min-h-screen enchanted-bg pb-24">
      <MagicalCanvas />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Weekly Overview Header */}
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow shimmer-effect relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1
                  className="text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 20px rgba(167, 139, 250, 0.8)' }}
                >
                  ⭐ This Week's Magic
                </h1>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {weekDates[0]?.dayName} {weekDates[0]?.dayNumber} - {weekDates[6]?.dayName} {weekDates[6]?.dayNumber}
                </p>
              </div>
              <Button
                variant={planningMode ? "default" : "outline"}
                onClick={() => setPlanningMode(!planningMode)}
                className={cn(
                  "rounded-full px-6 py-3",
                  planningMode
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30"
                    : "border-2 border-white/30 text-white hover:bg-white/10"
                )}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {planningMode ? "Planning Mode" : "Tracking Mode"}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Points</span>
                </div>
                <div className="text-2xl font-bold text-white">{weeklyPoints}/{weeklyTarget}</div>
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-green-300" />
                  <span className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Perfect Days</span>
                </div>
                <div className="text-2xl font-bold text-white">{perfectDays}/7</div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-red-300" />
                  <span className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Streak</span>
                </div>
                <div className="text-2xl font-bold text-white">5 days</div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-purple-300" />
                  <span className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Level</span>
                </div>
                <div className="text-2xl font-bold text-white">12</div>
              </div>
            </div>
          </div>
        </div>

        {/* This Week's Goals */}
        {weeklyGoals.length > 0 && (
          <div className="glass-card-purple rounded-3xl p-6 mb-6 magical-glow">
            <h3
              className="text-lg font-bold text-white mb-4 flex items-center gap-2"
              style={{ fontFamily: "'Comfortaa', cursive" }}
            >
              <Target className="w-5 h-5 text-purple-300" />
              This Week's Focus
            </h3>
            <div className="space-y-3">
              {weeklyGoals.map(goal => {
                const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                return (
                  <div key={goal.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                        {goal.title}
                      </span>
                      <span className="text-white font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-3">
          {dayStats.map((day) => (
            <DayCard
              key={day.date}
              day={day}
              habits={habits}
              logs={allLogs.filter(log => log.date === day.date)}
              expanded={expandedDay === day.date}
              onToggle={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
              onHabitToggle={(habitId) => handleToggle(habitId, day.date)}
              planningMode={planningMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Day Card
function DayCard({
  day,
  habits,
  logs,
  expanded,
  onToggle,
  onHabitToggle,
  planningMode
}: {
  day: any;
  habits: Habit[];
  logs: HabitLog[];
  expanded: boolean;
  onToggle: () => void;
  onHabitToggle: (habitId: number) => void;
  planningMode: boolean;
}) {
  const completionPercent = habits.length > 0 ? (day.completedHabits / day.totalHabits) * 100 : 0;

  let bgColor = "bg-white/5";
  let borderColor = "border-white/20";
  let statusEmoji = "○";

  if (day.isPerfect) {
    bgColor = "bg-green-500/20";
    borderColor = "border-green-400/50";
    statusEmoji = "🏆";
  } else if (completionPercent >= 50) {
    bgColor = "bg-blue-500/20";
    borderColor = "border-blue-400/50";
    statusEmoji = "⚡";
  } else if (day.completedHabits > 0) {
    bgColor = "bg-orange-500/20";
    borderColor = "border-orange-400/50";
    statusEmoji = "○";
  }

  if (day.isToday) {
    borderColor = "border-yellow-400/70";
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-3 transition-all duration-300 cursor-pointer",
        bgColor,
        `border-2 ${borderColor}`,
        expanded && "md:col-span-2 md:row-span-2",
        day.isPerfect && "magical-glow"
      )}
      onClick={onToggle}
    >
      {/* Compact View */}
      <div className="text-center">
        <div className="text-xs text-white/70 mb-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          {day.dayName}
        </div>
        <div className={cn(
          "text-lg font-bold mb-2",
          day.isToday ? "text-yellow-300" : "text-white"
        )}>
          {day.dayNumber}
        </div>

        {/* Status Emoji */}
        <div className="text-3xl mb-2">{statusEmoji}</div>

        {/* Points */}
        <div className="text-sm font-bold text-white mb-1">{day.points}pts</div>

        {/* Mini Progress Dots */}
        <div className="flex justify-center gap-1 mb-2">
          {habits.slice(0, 3).map((habit, idx) => {
            const isCompleted = logs.some(log => log.habitId === habit.id && log.completed);
            return (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full",
                  isCompleted ? "bg-green-400" : "bg-white/30"
                )}
              />
            );
          })}
          {habits.length > 3 && (
            <span className="text-xs text-white/60">+{habits.length - 3}</span>
          )}
        </div>

        {/* Expand Button */}
        {!expanded && (
          <ChevronDown className="w-4 h-4 mx-auto text-white/60" />
        )}
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold" style={{ fontFamily: "'Comfortaa', cursive" }}>
              {day.dayName}'s Habits
            </h4>
            <ChevronUp className="w-4 h-4 text-white/60" />
          </div>

          <div className="space-y-2">
            {habits.map(habit => {
              const log = logs.find(l => l.habitId === habit.id);
              const isCompleted = log?.completed || false;

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl border transition-all",
                    isCompleted
                      ? "bg-green-500/20 border-green-400/50"
                      : "bg-white/5 border-white/20"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onHabitToggle(habit.id);
                  }}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs",
                      isCompleted
                        ? "bg-green-400 border-green-500 text-white"
                        : "border-white/40 text-white/40"
                    )}
                  >
                    {isCompleted && "✓"}
                  </div>
                  <span className="text-sm text-white flex-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    {habit.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
