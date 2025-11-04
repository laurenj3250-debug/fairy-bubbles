import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FAB } from "@/components/FAB";
import { StreakPill } from "@/components/StreakPill";
import { StreakTrail } from "@/components/StreakTrail";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2, Pencil, TrendingUp } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { calculateStreak, getToday } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HabitDialog } from "@/components/HabitDialog";

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
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

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"], exact: false });
    },
  });

  const habitsWithStats = useMemo(() => {
    const today = getToday();

    // Get current week's start (Monday) and end (Sunday)
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(currentDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    return habits.map(habit => {
      const habitLogs = allLogs.filter(log => log.habitId === habit.id && log.completed);
      const dates = habitLogs.map(log => log.date);
      const streak = calculateStreak(dates);
      const totalCompletions = habitLogs.length;
      const completedToday = dates.includes(today);

      // Calculate this week's completions
      const weekCompletions = dates.filter(date => date >= weekStartStr).length;

      return {
        ...habit,
        streak,
        totalCompletions,
        completedDates: dates,
        completedToday,
        weekCompletions
      };
    });
  }, [habits, allLogs]);

  const todayStats = useMemo(() => {
    const completed = habitsWithStats.filter(h => h.completedToday).length;
    const total = habitsWithStats.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [habitsWithStats]);

  const handleFabClick = () => {
    setEditingHabit(undefined);
    setHabitDialogOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitDialogOpen(true);
  };

  const handleDeleteHabit = (id: number) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      deleteHabitMutation.mutate(id);
    }
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <FAB onClick={handleFabClick} />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4">
          <EmptyState
            icon={CheckCircle}
            title="No habits yet"
            description="Start building better habits by creating your first one"
            actionLabel="Create Habit"
            onAction={handleFabClick}
          />
        </main>
        <FAB onClick={handleFabClick} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Daily Snapshot Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Today's Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {todayStats.completed === todayStats.total && todayStats.total > 0
                      ? "Perfect day! All habits completed!"
                      : todayStats.completed > 0
                      ? "Great work! Keep the momentum going!"
                      : "Ready to start your day?"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {todayStats.completed}/{todayStats.total}
                </div>
                <div className="text-sm text-muted-foreground">{todayStats.percentage}% complete</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Your Habits</h2>
          <span className="text-sm text-muted-foreground">{habits.length} habits</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habitsWithStats.map(habit => {
            const IconComponent = (Icons as any)[habit.icon] || Icons.Sparkles;
            
            return (
              <Card
                key={habit.id}
                className="hover-elevate transition-all"
                data-testid={`habit-card-${habit.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">{habit.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {habit.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 w-8 h-8"
                      onClick={() => handleEditHabit(habit)}
                      data-testid={`button-edit-habit-${habit.id}`}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 w-8 h-8"
                      onClick={() => handleDeleteHabit(habit.id)}
                      data-testid={`button-delete-habit-${habit.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <StreakPill streak={habit.streak} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cadence</span>
                    <Badge variant="secondary" className="capitalize">
                      {habit.cadence}
                    </Badge>
                  </div>
                  {habit.targetPerWeek && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className={`text-sm font-semibold tabular-nums ${
                        (habit.weekCompletions ?? 0) >= habit.targetPerWeek ? 'text-green-600' : ''
                      }`}>
                        {habit.weekCompletions ?? 0}/{habit.targetPerWeek}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {habit.totalCompletions} completions
                    </span>
                  </div>
                  {/* Streak Trail */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Last 14 days</span>
                    </div>
                    <StreakTrail dates={habit.completedDates} daysToShow={14} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      
      <FAB onClick={handleFabClick} />
      <HabitDialog
        open={habitDialogOpen}
        onOpenChange={(open) => {
          setHabitDialogOpen(open);
          if (!open) setEditingHabit(undefined);
        }}
        habit={editingHabit}
      />
    </div>
  );
}
