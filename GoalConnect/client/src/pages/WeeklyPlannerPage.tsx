import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, isToday, isBefore, getISOWeek, getYear } from "date-fns";
import type { Goal, Habit, HabitLog, Todo } from "@shared/schema";
import { TodoDialogEnhanced } from "@/components/TodoDialogEnhanced";
import { GoalDialog } from "@/components/GoalDialog";
import { cn } from "@/lib/utils";
import { Check, Plus, Target, Calendar, TrendingUp, Flag, Clock } from "lucide-react";

/**
 * WeeklyPlannerPage - Homepage Dashboard
 *
 * Layout:
 * - Hero stats section with clock
 * - Horizontal week view (habits + tasks)
 * - Sidebar: Today's habits, Goals progress
 */
export default function WeeklyPlannerPage() {
  const queryClient = useQueryClient();
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [defaultGoalType, setDefaultGoalType] = useState<"monthly" | "weekly">("monthly");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Current dates
  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");
  const currentWeek = `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Fetch data
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
  });

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Calculate week completion rate
  const weekCompletionRate = useMemo(() => {
    const totalPossible = habits.length * 7; // habits × days
    if (totalPossible === 0) return 0;

    const completedThisWeek = habitLogs.filter(log => {
      if (!log.completed) return false;
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= weekEnd;
    }).length;

    return Math.round((completedThisWeek / totalPossible) * 100);
  }, [habits, habitLogs, weekStart, weekEnd]);

  // Filter goals by type - separate active vs completed
  const monthlyGoals = useMemo(() => {
    return goals.filter(g => g.month === currentMonth && !g.archived && g.currentValue < g.targetValue);
  }, [goals, currentMonth]);

  const completedMonthlyGoals = useMemo(() => {
    return goals.filter(g => g.month === currentMonth && !g.archived && g.currentValue >= g.targetValue);
  }, [goals, currentMonth]);

  const weeklyGoals = useMemo(() => {
    return goals.filter(g => g.week === currentWeek && !g.archived && g.currentValue < g.targetValue);
  }, [goals, currentWeek]);

  const completedWeeklyGoals = useMemo(() => {
    return goals.filter(g => g.week === currentWeek && !g.archived && g.currentValue >= g.targetValue);
  }, [goals, currentWeek]);

  // Week days for planner
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dateStr: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEE"),
        dayNum: format(date, "d"),
        isToday: isToday(date),
        isPast: isBefore(date, now) && !isToday(date),
      };
    });
  }, [weekStart, now]);

  // Get todos for a specific day
  const getTodosForDay = (dateStr: string) => {
    return todos.filter(t => t.dueDate === dateStr);
  };

  // Habit completion for the week
  const habitWeekData = useMemo(() => {
    const data: Record<string, { completed: number; total: number }> = {};
    weekDays.forEach(day => {
      const dayLogs = habitLogs.filter(log => log.date === day.dateStr);
      const completed = dayLogs.filter(log => log.completed).length;
      data[day.dateStr] = { completed, total: habits.length };
    });
    return data;
  }, [habitLogs, habits, weekDays]);

  // Week stats
  const weekStats = useMemo(() => {
    const completedTasks = todos.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= weekStart && completedDate <= weekEnd;
    }).length;

    const scheduledTasks = todos.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    }).length;

    return { completed: completedTasks, scheduled: scheduledTasks };
  }, [todos, weekStart, weekEnd]);

  // Toggle todo completion
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleAddTask = (dateStr: string) => {
    setSelectedDate(dateStr);
    setTodoDialogOpen(true);
  };

  const handleAddMonthlyGoal = () => {
    setDefaultGoalType("monthly");
    setGoalDialogOpen(true);
  };

  const handleAddWeeklyGoal = () => {
    setDefaultGoalType("weekly");
    setGoalDialogOpen(true);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* Hero Section with Clock */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">{weekCompletionRate}%</span>
              <span className="text-sm text-primary">habits completed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {habits.length} active habits • {weekStats.completed} tasks done
            </p>
          </div>

          {/* Clock for ADHD time awareness */}
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-lg font-semibold tabular-nums">
              {format(currentTime, "HH:mm")}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(currentTime, "EEE, MMM d")}
            </span>
          </div>
        </div>

        {/* Top Row: Monthly Goals + Habits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly Goals */}
          <div className="md:col-span-2 glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {format(now, "MMMM")} Goals
                {completedMonthlyGoals.length > 0 && (
                  <span className="text-green-500 text-[10px] font-bold">
                    ✓ {completedMonthlyGoals.length} done
                  </span>
                )}
              </h3>
              <button
                onClick={handleAddMonthlyGoal}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + add
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {monthlyGoals.length === 0 ? (
                <div className="flex-1 text-center py-6">
                  {completedMonthlyGoals.length > 0 ? (
                    <>
                      <Check className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-green-600 font-medium mb-1">
                        All monthly goals completed!
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {completedMonthlyGoals.length} goal{completedMonthlyGoals.length > 1 ? 's' : ''} achieved in {format(now, "MMMM")}
                      </p>
                    </>
                  ) : (
                    <>
                      <Target className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Set your focus for {format(now, "MMMM")}
                      </p>
                      <button
                        onClick={handleAddMonthlyGoal}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Add Monthly Goal
                      </button>
                    </>
                  )}
                </div>
              ) : (
                monthlyGoals.map(goal => {
                  const progress = goal.targetValue > 0
                    ? Math.round((goal.currentValue / goal.targetValue) * 100)
                    : 0;
                  return (
                    <div
                      key={goal.id}
                      className="flex-1 min-w-[140px] bg-card/50 border border-card-border rounded-lg p-3"
                    >
                      <p className="text-sm font-medium truncate mb-2">{goal.title}</p>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            progress >= 75 ? "bg-green-500" :
                            progress >= 40 ? "bg-primary" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Habits Compact */}
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Habits
              </h3>
              {/* Overall streak */}
              {habits.length > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <span className="text-xs">🔥</span>
                  <span className="text-sm font-bold">
                    {Object.values(habitWeekData).reduce((sum, day) => sum + day.completed, 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">this week</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {weekDays.map(day => {
                const data = habitWeekData[day.dateStr];
                const allDone = data?.total > 0 && data.completed >= data.total;
                const partial = data?.completed > 0 && !allDone;

                // Two-day rule: check for consecutive misses
                const dayIndex = weekDays.findIndex(d => d.dateStr === day.dateStr);
                const prevDayData = dayIndex > 0 ? habitWeekData[weekDays[dayIndex - 1].dateStr] : null;
                const isTwoDayMiss = !allDone && !partial && prevDayData &&
                  prevDayData.total > 0 && prevDayData.completed === 0;

                return (
                  <div key={day.dateStr} className="flex flex-col items-center relative">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
                        day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        allDone && "bg-green-500 text-white",
                        partial && "bg-primary/30 text-primary",
                        !allDone && !partial && "bg-muted text-muted-foreground"
                      )}
                    >
                      {allDone ? <Check className="w-3 h-3" /> : data?.completed || ""}
                    </div>
                    {/* Two-day rule warning */}
                    {isTwoDayMiss && day.isToday && (
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"
                        title="2 days missed - don't break the chain!"
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {day.dayName.charAt(0)}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Two-day warning message */}
            {(() => {
              const todayData = habitWeekData[format(now, "yyyy-MM-dd")];
              const yesterdayData = habitWeekData[format(addDays(now, -1), "yyyy-MM-dd")];
              const twoConsecutiveMisses = todayData?.completed === 0 && yesterdayData?.completed === 0;

              return twoConsecutiveMisses && todayData?.total > 0 ? (
                <div className="mt-3 pt-3 border-t border-card-border">
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="animate-pulse">⚠️</span>
                    2-day rule: Don't miss today or you'll break your streak!
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Weekly Goals
              {completedWeeklyGoals.length > 0 && (
                <span className="text-green-500 text-[10px] font-bold">
                  ✓ {completedWeeklyGoals.length} done
                </span>
              )}
            </h3>
            <button
              onClick={handleAddWeeklyGoal}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + add
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {weeklyGoals.length === 0 ? (
              <div className="col-span-2 text-center py-6">
                {completedWeeklyGoals.length > 0 ? (
                  <>
                    <Check className="w-10 h-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-green-600 font-medium mb-1">
                      All weekly goals completed!
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {completedWeeklyGoals.length} goal{completedWeeklyGoals.length > 1 ? 's' : ''} done
                    </p>
                  </>
                ) : (
                  <>
                    <Flag className="w-10 h-10 mx-auto mb-2 text-amber-500/40" />
                    <p className="text-sm text-muted-foreground mb-3">
                      What do you want to accomplish this week?
                    </p>
                    <button
                      onClick={handleAddWeeklyGoal}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      Add Weekly Goal
                    </button>
                  </>
                )}
              </div>
            ) : (
              weeklyGoals.map(goal => {
                const progress = goal.targetValue > 0
                  ? Math.round((goal.currentValue / goal.targetValue) * 100)
                  : 0;
                const isDone = progress >= 100;
                // Find linked monthly goal (via real parentGoalId relationship)
                // Search both active and completed monthly goals
                const linkedMonthly = (goal as any).parentGoalId
                  ? [...monthlyGoals, ...completedMonthlyGoals].find(mg => mg.id === (goal as any).parentGoalId)
                  : null;
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
                      isDone && "opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 border-amber-500 flex-shrink-0",
                        isDone && "bg-amber-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", isDone && "line-through")}>
                        {goal.title}
                      </p>
                      {linkedMonthly && (
                        <p className="text-xs text-primary/70">→ {linkedMonthly.title}</p>
                      )}
                    </div>
                    {goal.targetValue > 1 && (
                      <span className="text-xs font-semibold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Weekly Planner Grid */}
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">
              Week of {format(weekStart, "MMM d")}–{format(weekEnd, "d")}
            </h3>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:bg-card/50 flex items-center justify-center text-sm">
                ‹
              </button>
              <button className="px-2 h-7 rounded-lg border border-card-border text-xs text-muted-foreground hover:text-foreground hover:bg-card/50">
                Today
              </button>
              <button className="w-7 h-7 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:bg-card/50 flex items-center justify-center text-sm">
                ›
              </button>
            </div>
          </div>

          <div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-card-border scrollbar-track-transparent">
            {weekDays.map(day => {
              const dayTodos = getTodosForDay(day.dateStr);
              return (
                <div
                  key={day.dateStr}
                  className={cn(
                    "min-w-[140px] md:min-w-0 min-h-[180px] rounded-lg border p-2 flex flex-col snap-start flex-shrink-0 md:flex-shrink",
                    "bg-card/30 border-card-border",
                    day.isToday && "bg-primary/5 border-primary/30",
                    day.isPast && "opacity-50"
                  )}
                >
                  {/* Day header */}
                  <div className="text-center pb-2 mb-2 border-b border-card-border">
                    <p className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      day.isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {day.dayName}
                    </p>
                    <p className={cn(
                      "text-lg font-semibold",
                      day.isToday && "text-primary"
                    )}>
                      {day.dayNum}
                    </p>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayTodos.map(todo => {
                      const linkedGoal = goals.find(g => g.id === todo.goalId);
                      return (
                        <div
                          key={todo.id}
                          className={cn(
                            "flex items-start gap-1.5 p-1.5 rounded text-xs cursor-pointer",
                            "bg-white/5 hover:bg-white/10",
                            todo.completed && "opacity-50"
                          )}
                          onClick={() => toggleTodoMutation.mutate({
                            id: todo.id,
                            completed: !todo.completed
                          })}
                        >
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full border border-muted-foreground flex-shrink-0 mt-0.5",
                              todo.completed && "bg-green-500 border-green-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "leading-tight break-words",
                              todo.completed && "line-through"
                            )}>
                              {todo.title}
                            </p>
                            {linkedGoal && (
                              <p className="text-[10px] text-primary/70 mt-0.5 truncate">
                                ● {linkedGoal.title}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add task button */}
                  <button
                    onClick={() => handleAddTask(day.dateStr)}
                    className="mt-auto pt-1 text-center text-[10px] text-muted-foreground hover:text-primary border border-dashed border-card-border rounded py-1 transition-colors"
                  >
                    + add
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weekStats.completed}</p>
              <p className="text-xs text-muted-foreground">completed this week</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weekStats.scheduled}</p>
              <p className="text-xs text-muted-foreground">scheduled this week</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {completedWeeklyGoals.length}/{weeklyGoals.length + completedWeeklyGoals.length}
              </p>
              <p className="text-xs text-muted-foreground">weekly goals done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Todo Dialog */}
      <TodoDialogEnhanced
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        defaultDueDate={selectedDate || undefined}
      />

      {/* Goal Dialog */}
      <GoalDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        defaultGoalType={defaultGoalType}
        monthlyGoals={monthlyGoals}
      />
    </div>
  );
}
