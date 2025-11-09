import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal, Todo } from "@shared/schema";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/utils";

interface HabitWithData extends Habit {
  linkedGoal?: Goal;
}

export default function WeeklyView() {
  const [weekOffset, setWeekOffset] = useState(0);

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
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
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
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/week"] });
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

  const handleHabitToggle = (habitId: number, date: string, isFuture: boolean) => {
    if (isFuture) return;
    toggleHabitMutation.mutate({ habitId, date });
  };

  const handleTodoToggle = (todoId: number) => {
    toggleTodoMutation.mutate(todoId);
  };

  const isCurrentWeek = weekOffset === 0;
  const canGoNext = weekOffset < 4;

  // Calculate total points for the week
  const weeklyTotal = useMemo(() => {
    let total = 0;

    // Habit points
    allLogs.forEach(log => {
      if (log.completed) {
        const habit = habits.find(h => h.id === log.habitId);
        const points = { easy: 5, medium: 10, hard: 15 }[habit?.difficulty || 'medium'];
        total += points;
      }
    });

    // Todo points for this week
    weekDates.forEach(day => {
      const dayTodos = todos.filter(t => t.dueDate === day.date && t.completed);
      dayTodos.forEach(todo => {
        const points = { easy: 5, medium: 10, hard: 15 }[todo.difficulty || 'medium'];
        total += points;
      });
    });

    return total;
  }, [allLogs, habits, todos, weekDates]);

  return (
    <div className="min-h-screen enchanted-bg pb-6">
      <div className="max-w-7xl mx-auto p-4">
        {/* Compact Header */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-white">
                {isCurrentWeek ? "This Week" : weekOffset < 0 ? "Past Week" : "Upcoming"}
              </h1>
              <p className="text-white/60 text-xs">
                {weekDates[0]?.monthName} {weekDates[0]?.dayNumber} - {weekDates[6]?.monthName} {weekDates[6]?.dayNumber}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-300">{weeklyTotal} 🪙</div>
              </div>
              <button
                onClick={() => canGoNext && setWeekOffset(weekOffset + 1)}
                disabled={!canGoNext}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canGoNext ? "bg-white/10 hover:bg-white/20" : "bg-white/5 opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Habits Summary - Compact */}
        {weeklyHabits.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-300" />
              Weekly Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weeklyHabitProgress.map(({ habit, completedDays, target, percentage, isComplete }) => (
                <div key={habit.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: habit.color }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{habit.title}</div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                      <div
                        className={cn(
                          "h-full transition-all",
                          isComplete ? "bg-green-400" : "bg-cyan-400"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-white/60 font-medium">
                    {completedDays}/{target}
                  </div>
                  {isComplete && <span className="text-lg">🏆</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid View - All 7 Days Side by Side */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((day) => {
            const dayLogs = allLogs.filter(log => log.date === day.date);
            const allHabitsForDay = [...dailyHabits, ...weeklyHabits];
            const dayTodos = todos.filter(t => t.dueDate === day.date);

            const completedHabits = dayLogs.filter(l => l.completed).length;
            const completedTodos = dayTodos.filter(t => t.completed).length;
            const totalTasks = allHabitsForDay.length + dayTodos.length;
            const completedTasks = completedHabits + completedTodos;

            const isPerfect = completedTasks === totalTasks && totalTasks > 0;

            return (
              <div
                key={day.date}
                className={cn(
                  "glass-card rounded-xl p-3 min-h-[300px]",
                  day.isToday && "ring-2 ring-yellow-400/50",
                  day.isFuture && "opacity-60"
                )}
              >
                {/* Day Header */}
                <div className="text-center mb-3 pb-2 border-b border-white/10">
                  <div className="text-xs text-white/60 font-medium">{day.dayName}</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    day.isToday ? "text-yellow-300" : "text-white"
                  )}>
                    {day.dayNumber}
                  </div>
                  {isPerfect && <div className="text-lg mt-1">🏆</div>}
                  {!isPerfect && totalTasks > 0 && (
                    <div className="text-xs text-white/50 mt-1">
                      {completedTasks}/{totalTasks}
                    </div>
                  )}
                </div>

                {/* Habits List */}
                <div className="space-y-2">
                  {allHabitsForDay.map(habit => {
                    const log = dayLogs.find(l => l.habitId === habit.id);
                    const isCompleted = log?.completed || false;

                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleHabitToggle(habit.id, day.date, day.isFuture)}
                        disabled={day.isFuture}
                        className={cn(
                          "w-full rounded-lg p-2 transition-all text-left",
                          isCompleted
                            ? "bg-green-500/20 border border-green-400/50"
                            : "bg-white/5 border border-white/10 hover:bg-white/10",
                          day.isFuture && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: habit.color }}
                          >
                            {habit.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-xs font-medium truncate",
                              isCompleted ? "text-white/70 line-through" : "text-white"
                            )}>
                              {habit.title}
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Todos */}
                  {dayTodos.map(todo => {
                    const isCompleted = todo.completed;

                    return (
                      <button
                        key={todo.id}
                        onClick={() => handleTodoToggle(todo.id)}
                        className={cn(
                          "w-full rounded-lg p-2 transition-all text-left",
                          isCompleted
                            ? "bg-blue-500/20 border border-blue-400/50"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                            isCompleted ? "bg-blue-400 border-blue-500" : "border-white/40"
                          )}>
                            {isCompleted && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div className={cn(
                            "text-xs truncate",
                            isCompleted ? "text-white/70 line-through" : "text-white"
                          )}>
                            {todo.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Empty State */}
                  {allHabitsForDay.length === 0 && dayTodos.length === 0 && (
                    <div className="text-center py-6 text-white/30 text-xs">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
