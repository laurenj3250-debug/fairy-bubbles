import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal, Todo } from "@shared/schema";
import { Target, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/utils";

interface HabitWithData extends Habit {
  linkedGoal?: Goal;
}

export default function WeeklyView() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Get week dates based on offset
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));

    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateString === getToday(),
        isPast: dateString < getToday(),
        isFuture: dateString > getToday(),
      });
    }
    return days;
  }, [weekOffset]);

  // Fetch logs for entire week
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/week", weekDates[0]?.date, weekOffset],
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

  const toggleTodoMutation = useMutation({
    mutationFn: async (todoId: number) => {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      if (todo.completed) {
        return await apiRequest(`/api/todos/${todoId}`, "PATCH", { completed: false, completedAt: null });
      } else {
        return await apiRequest(`/api/todos/${todoId}/complete`, "POST");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  // Enrich habits with goal data
  const habitsWithGoals: HabitWithData[] = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      linkedGoal: habit.linkedGoalId ? goals.find(g => g.id === habit.linkedGoalId) : undefined,
    }));
  }, [habits, goals]);

  // Separate daily and weekly habits
  const dailyHabits = habitsWithGoals.filter(h => h.cadence === "daily");
  const weeklyHabits = habitsWithGoals.filter(h => h.cadence === "weekly");

  // Calculate weekly habit progress
  const weeklyHabitProgress = useMemo(() => {
    return weeklyHabits.map(habit => {
      const completedDays = weekDates.filter(day => {
        const log = allLogs.find(l => l.habitId === habit.id && l.date === day.date && l.completed);
        return !!log;
      }).length;

      const target = habit.targetPerWeek || 3;
      const percentage = (completedDays / target) * 100;

      return {
        habit,
        completedDays,
        target,
        percentage: Math.min(percentage, 100),
        isComplete: completedDays >= target,
      };
    });
  }, [weeklyHabits, weekDates, allLogs]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    return weekDates.map(day => {
      const dayLogs = allLogs.filter(log => log.date === day.date && log.completed);
      const dayTodos = todos.filter(t => t.dueDate === day.date);
      const completedTodos = dayTodos.filter(t => t.completed);

      const habitPoints = dayLogs.reduce((sum, log) => {
        const habit = habits.find(h => h.id === log.habitId);
        const basePoints = { easy: 5, medium: 10, hard: 15 }[habit?.difficulty || 'medium'];
        return sum + basePoints;
      }, 0);

      const todoPoints = completedTodos.reduce((sum, todo) => {
        const points = { easy: 5, medium: 10, hard: 15 }[todo.difficulty || 'medium'];
        return sum + points;
      }, 0);

      return {
        ...day,
        completedHabits: dayLogs.filter(log => {
          const habit = habits.find(h => h.id === log.habitId);
          return habit?.cadence === "daily";
        }).length,
        totalHabits: dailyHabits.length,
        dayTodos,
        completedTodos: completedTodos.length,
        totalPoints: habitPoints + todoPoints,
        habitPoints,
        todoPoints,
      };
    });
  }, [weekDates, allLogs, habits, todos, dailyHabits]);

  const weeklyTotal = dailyStats.reduce((sum, day) => sum + day.totalPoints, 0);

  const handleHabitToggle = (habitId: number, date: string) => {
    toggleHabitMutation.mutate({ habitId, date });
  };

  const handleTodoToggle = (todoId: number) => {
    toggleTodoMutation.mutate(todoId);
  };

  const isCurrentWeek = weekOffset === 0;
  const canGoNext = weekOffset < 4; // Allow up to 4 weeks in the future

  return (
    <div className="min-h-screen enchanted-bg pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header with Navigation */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {isCurrentWeek ? "📅 This Week" : weekOffset < 0 ? "📅 Past Week" : "📅 Upcoming Week"}
              </h1>
              <p className="text-white/70 text-sm">
                {weekDates[0]?.monthName} {weekDates[0]?.dayNumber} - {weekDates[6]?.monthName} {weekDates[6]?.dayNumber}
              </p>
            </div>

            <button
              onClick={() => canGoNext && setWeekOffset(weekOffset + 1)}
              disabled={!canGoNext}
              className={cn(
                "p-2 rounded-xl transition-all",
                canGoNext ? "bg-white/10 hover:bg-white/20" : "bg-white/5 opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-2xl font-bold text-yellow-300">{weeklyTotal} 🪙</div>
              <div className="text-xs text-white/60">total points</div>
            </div>

            {isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                ← Back to current week
              </button>
            )}
          </div>
        </div>

        {/* Weekly Habits Summary */}
        {weeklyHabits.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-300" />
              Weekly Goals
            </h2>
            <div className="space-y-3">
              {weeklyHabitProgress.map(({ habit, completedDays, target, percentage, isComplete }) => (
                <div key={habit.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: habit.color }}
                    >
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{habit.title}</div>
                      <div className="text-xs text-white/60">
                        {completedDays} / {target} times this week
                      </div>
                    </div>
                    {isComplete && <span className="text-2xl">🏆</span>}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        isComplete ? "bg-green-400" : "bg-purple-400"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {dailyStats.map((day, index) => (
            <DayTimeline
              key={day.date}
              day={day}
              habits={dailyHabits}
              weeklyHabits={weeklyHabits}
              logs={allLogs.filter(log => log.date === day.date)}
              onHabitToggle={(habitId) => handleHabitToggle(habitId, day.date)}
              onTodoToggle={handleTodoToggle}
              isLast={index === dailyStats.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayTimeline({
  day,
  habits,
  weeklyHabits,
  logs,
  onHabitToggle,
  onTodoToggle,
  isLast,
}: {
  day: any;
  habits: HabitWithData[];
  weeklyHabits: HabitWithData[];
  logs: HabitLog[];
  onHabitToggle: (habitId: number) => void;
  onTodoToggle: (todoId: number) => void;
  isLast: boolean;
}) {
  const allHabitsForDay = [...habits, ...weeklyHabits];
  const completionRate = allHabitsForDay.length > 0 ?
    (logs.filter(l => l.completed).length / allHabitsForDay.length) * 100 : 0;
  const isPerfect = logs.filter(l => l.completed).length === allHabitsForDay.length && allHabitsForDay.length > 0;

  let statusColor = "bg-gray-400/20 border-gray-400/30";
  let statusIcon = <Circle className="w-5 h-5 text-gray-400" />;

  if (isPerfect) {
    statusColor = "bg-green-500/20 border-green-400/50";
    statusIcon = <CheckCircle2 className="w-5 h-5 text-green-400" />;
  } else if (completionRate >= 50) {
    statusColor = "bg-blue-500/20 border-blue-400/50";
    statusIcon = <CheckCircle2 className="w-5 h-5 text-blue-400" />;
  } else if (logs.some(l => l.completed)) {
    statusColor = "bg-orange-500/20 border-orange-400/50";
    statusIcon = <Circle className="w-5 h-5 text-orange-400" />;
  }

  return (
    <div className="relative flex gap-4">
      {/* Timeline Track */}
      <div className="flex flex-col items-center">
        {/* Day Badge */}
        <div
          className={cn(
            "glass-card rounded-2xl p-3 border-2 z-10 text-center min-w-[70px]",
            statusColor,
            day.isToday && "ring-2 ring-yellow-400/50",
            (day.isPast || day.isToday) && "cursor-help"
          )}
          title={day.isPast ? "Click habits below to mark complete" : ""}
        >
          <div className="text-xs text-white/70 font-medium">{day.shortName}</div>
          <div className={cn(
            "text-2xl font-bold",
            day.isToday ? "text-yellow-300" : "text-white"
          )}>
            {day.dayNumber}
          </div>
          <div className="mt-1">{statusIcon}</div>
        </div>

        {/* Connecting Line */}
        {!isLast && (
          <div className="w-0.5 h-full bg-white/20 flex-1 my-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        {/* Points Summary */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-xl font-bold text-yellow-300">{day.totalPoints} pts</div>
          {day.completedHabits > 0 && (
            <div className="text-sm text-white/60">
              {day.completedHabits}/{day.totalHabits} daily
            </div>
          )}
          {day.completedTodos > 0 && (
            <div className="text-sm text-white/60">
              {day.completedTodos}/{day.dayTodos.length} todos
            </div>
          )}
          {isPerfect && <span className="text-lg">🏆</span>}
        </div>

        {/* Clickable hint for past days */}
        {day.isPast && !day.isToday && (
          <div className="text-xs text-blue-300 mb-2 flex items-center gap-1">
            <span>💡</span>
            <span>Click habits to mark complete retroactively</span>
          </div>
        )}

        {/* Habits Section */}
        {allHabitsForDay.length > 0 && (
          <div className="space-y-2 mb-4">
            {allHabitsForDay.map(habit => {
              const log = logs.find(l => l.habitId === habit.id);
              const isCompleted = log?.completed || false;
              const points = { easy: 5, medium: 10, hard: 15 }[habit.difficulty];
              const isWeekly = habit.cadence === "weekly";

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "glass-card rounded-xl p-3 border transition-all cursor-pointer hover:scale-[1.02]",
                    isCompleted
                      ? "border-green-400/50 bg-green-500/10"
                      : day.isFuture
                        ? "border-white/10 opacity-50"
                        : "border-white/20 hover:border-white/40"
                  )}
                  onClick={() => !day.isFuture && onHabitToggle(habit.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: habit.color }}
                    >
                      {habit.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-semibold truncate",
                          isCompleted ? "text-white line-through" : "text-white"
                        )}>
                          {habit.title}
                        </span>
                        {isWeekly && (
                          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded">
                            Weekly
                          </span>
                        )}
                        {habit.linkedGoal && (
                          <div className="flex items-center gap-1 text-xs text-purple-300">
                            <Target className="w-3 h-3" />
                            <span className="hidden sm:inline">{habit.linkedGoal.title}</span>
                          </div>
                        )}
                      </div>
                      {habit.description && (
                        <div className="text-xs text-white/60">{habit.description}</div>
                      )}
                    </div>

                    {/* Status & Points */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-300 font-bold whitespace-nowrap">
                        🪙 {points}
                      </span>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          isCompleted
                            ? "bg-green-400 border-green-500 text-white"
                            : "border-white/40"
                        )}
                      >
                        {isCompleted && <span className="text-sm">✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Todos Section */}
        {day.dayTodos.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white/70 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              To-Do ({day.dayTodos.length})
            </h3>
            {day.dayTodos.map((todo: any) => {
              const points = { easy: 5, medium: 10, hard: 15 }[todo.difficulty || 'medium'];

              return (
                <div
                  key={todo.id}
                  className={cn(
                    "glass-card rounded-xl p-3 border transition-all cursor-pointer hover:scale-[1.02]",
                    todo.completed
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/20 hover:border-white/40"
                  )}
                  onClick={() => onTodoToggle(todo.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        todo.completed
                          ? "bg-blue-400 border-blue-500 text-white"
                          : "border-white/40"
                      )}
                    >
                      {todo.completed && <span className="text-xs">✓</span>}
                    </div>

                    <span className={cn(
                      "flex-1 text-sm",
                      todo.completed ? "text-white/70 line-through" : "text-white"
                    )}>
                      {todo.title}
                    </span>

                    <span className="text-xs text-yellow-300 font-bold whitespace-nowrap">
                      🪙 {points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {allHabitsForDay.length === 0 && day.dayTodos.length === 0 && (
          <div className="text-center py-8 text-white/40 text-sm">
            No habits or tasks for this day
          </div>
        )}
      </div>
    </div>
  );
}
