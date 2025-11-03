import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Target, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Planner() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, 1 = next week

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map(h =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then(res => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  const toggleHabitMutation = useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: number; date: string; completed: boolean }) =>
      apiRequest("/api/habit-logs/toggle", "POST", { habitId, date, completed }),
    onMutate: async ({ habitId, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habit-logs/all"] });
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["/api/habit-logs/all"]);

      queryClient.setQueryData<HabitLog[]>(["/api/habit-logs/all"], (old = []) => {
        const existingLog = old.find(log => log.habitId === habitId && log.date === date);
        if (existingLog) {
          return old.map(log =>
            log.habitId === habitId && log.date === date
              ? { ...log, completed }
              : log
          );
        } else {
          return [...old, { id: Date.now(), habitId, userId: 1, date, completed, note: null }];
        }
      });

      return { previousLogs };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["/api/habit-logs/all"], context.previousLogs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
    },
  });

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));
    monday.setDate(monday.getDate() + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    return dates;
  }, [weekOffset]);

  const weekStart = weekDates[0].date;
  const weekEnd = weekDates[6].date;

  // Filter goals for this week
  const weeklyGoals = useMemo(() => {
    return goals.filter(goal => {
      const deadline = goal.deadline;
      return deadline >= weekStart && deadline <= weekEnd;
    });
  }, [goals, weekStart, weekEnd]);

  // Calculate habit completions for the week
  const habitsWithWeekData = useMemo(() => {
    return habits.map(habit => {
      const weekLogs = weekDates.map(({ date }) => {
        const log = allLogs.find(l => l.habitId === habit.id && l.date === date);
        return {
          date,
          completed: log?.completed || false,
        };
      });

      const weekCompletions = weekLogs.filter(l => l.completed).length;

      return {
        ...habit,
        weekLogs,
        weekCompletions,
      };
    });
  }, [habits, allLogs, weekDates]);

  const handleToggleDay = (habitId: number, date: string, currentlyCompleted: boolean) => {
    toggleHabitMutation.mutate({
      habitId,
      date,
      completed: !currentlyCompleted,
    });
  };

  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const monthStart = start.toLocaleDateString('en-US', { month: 'short' });
    const monthEnd = end.toLocaleDateString('en-US', { month: 'short' });

    if (monthStart === monthEnd) {
      return `${monthStart} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${monthStart} ${start.getDate()} - ${monthEnd} ${end.getDate()}, ${start.getFullYear()}`;
  };

  const isCurrentWeek = weekOffset === 0;

  if (habitsLoading || goalsLoading || logsLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Week Navigation Header */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Weekly Planner</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatWeekRange()}
              {isCurrentWeek && <Badge variant="secondary" className="ml-2">This Week</Badge>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Goals Due This Week
              <Badge variant="secondary">{weeklyGoals.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No goals due this week
              </p>
            ) : (
              <div className="space-y-3">
                {weeklyGoals.map(goal => {
                  const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
                  const daysUntil = Math.ceil(
                    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{progress}%</div>
                          <div className="text-xs text-muted-foreground">
                            {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? '1 day left' : `${daysUntil} days left`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Habits This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No habits to track
              </p>
            ) : (
              <div className="space-y-4">
                {habitsWithWeekData.map(habit => {
                  const IconComponent = (Icons as any)[habit.icon] || Icons.CheckCircle2;
                  const targetMet = habit.targetPerWeek ? habit.weekCompletions >= habit.targetPerWeek : false;

                  return (
                    <div
                      key={habit.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-lg"
                            style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{habit.title}</h3>
                            {habit.targetPerWeek && (
                              <p className={cn(
                                "text-sm font-medium",
                                targetMet ? "text-green-600" : "text-muted-foreground"
                              )}>
                                {habit.weekCompletions}/{habit.targetPerWeek} completed
                                {targetMet && " ✓"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Day Checkboxes */}
                      <div className="grid grid-cols-7 gap-2">
                        {habit.weekLogs.map((log, idx) => {
                          const dayInfo = weekDates[idx];
                          return (
                            <button
                              key={log.date}
                              onClick={() => handleToggleDay(habit.id, log.date, log.completed)}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-all border-2",
                                log.completed
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-muted/30 border-muted hover:border-primary/50",
                                dayInfo.isToday && "ring-2 ring-primary/30"
                              )}
                            >
                              <span className="text-xs font-medium mb-1">{dayInfo.dayName}</span>
                              <span className="text-lg font-bold">{dayInfo.dayNumber}</span>
                              {log.completed && (
                                <CheckCircle2 className="w-4 h-4 mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
