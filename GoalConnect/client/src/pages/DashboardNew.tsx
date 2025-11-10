import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GoalJourneyCard } from "@/components/GoalJourneyCard";
import { GoalBadge } from "@/components/GoalBadge";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { TodoDialog } from "@/components/TodoDialog";
import { MountainAchievements } from "@/components/MountainAchievements";
import { GradeBadge } from "@/components/GradeBadge";
import { MountainStatsPanel } from "@/components/MountainStatsPanel";
import { ExpeditionCard } from "@/components/ExpeditionCard";
import { Target, Calendar, CheckCircle, Plus, Sparkles, TrendingUp, Flame, Mountain, Tent, Flag, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Goal, Habit, HabitLog, Todo } from "@shared/schema";
import { getToday } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getWeatherFromStreak, WEATHER_INFO } from "@/lib/weatherEffects";
import { WeatherOverlay } from "@/components/WeatherOverlay";

interface HabitWithData extends Habit {
  streak?: { habitId: number; streak: number };
  weeklyProgress?: any;
  history?: any;
}

export default function DashboardNew() {
  const { user } = useAuth();
  const today = getToday();
  const userName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);

  // Fetch all data
  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Toggle habit mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  // Toggle todo mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async (todoId: number) => {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;
      return await apiRequest(`/api/todos/${todoId}`, "PATCH", {
        completed: !todo.completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  // Calculate stats
  const activeGoals = goals.filter(g => (g.currentValue / g.targetValue) * 100 < 100);
  const completedGoals = goals.filter(g => (g.currentValue / g.targetValue) >= 1);
  const completedHabits = todayLogs.filter(log => log.completed).length;
  const totalHabits = habits.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = todos.filter(t => !t.completed);

  // Calculate total habits completed across all time
  const totalHabitsCompletedAllTime = habits.reduce((sum, habit) => {
    const habitLogs = habit.history?.history || [];
    return sum + habitLogs.filter((h: any) => h.completed).length;
  }, 0);

  // Today's todos (due today or no due date)
  const todayTodos = pendingTodos.filter(t =>
    !t.dueDate || t.dueDate === today
  ).slice(0, 5);

  const completionPercentage = totalHabits > 0
    ? Math.round((completedHabits / totalHabits) * 100)
    : 0;

  // Calculate longest streak
  const longestStreak = habits.reduce((max, habit) => {
    const streak = habit.streak?.streak || 0;
    return Math.max(max, streak);
  }, 0);

  const isHabitCompletedToday = (habitId: number) => {
    return todayLogs.some(log => log.habitId === habitId && log.completed);
  };

  // Weather condition based on streak and performance
  const calculateMissedDaysThisWeek = () => {
    // Get all unique habit logs for this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Simple calculation: if completion percentage is low, count missed days
    const totalPossible = habits.length * 7;
    const completed = todayLogs.filter(log => log.completed).length * 7;
    const missedPercentage = totalPossible > 0 ? ((totalPossible - completed) / totalPossible) * 100 : 0;

    // Convert to missed days (0-7)
    return Math.min(Math.floor(missedPercentage / 15), 7);
  };

  const missedDaysThisWeek = calculateMissedDaysThisWeek();
  const weather = getWeatherFromStreak(longestStreak, missedDaysThisWeek);
  const weatherInfo = WEATHER_INFO[weather];

  // Celebration effect for habit completion
  const [celebratingHabitId, setCelebratingHabitId] = useState<number | null>(null);

  useEffect(() => {
    if (celebratingHabitId) {
      const timer = setTimeout(() => setCelebratingHabitId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [celebratingHabitId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Calculate altitude (0-1000m metaphor)
  const todayAltitude = Math.round(completionPercentage * 10); // 0-1000m

  if (goalsLoading || habitsLoading || logsLoading || todosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-foreground text-xl animate-pulse">Loading your climb...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-transparent" data-weather={weather}>
      {/* Weather overlay with animated effects */}
      <WeatherOverlay weather={weather} />

      {/* Enhanced Vertical Progress Bar - Left Side with Camp Markers */}
      <div className="fixed left-4 top-20 bottom-24 w-16 z-20 hidden md:flex flex-col items-center">
        <div className="relative flex-1 flex flex-col items-center">
          {/* Climbing rope */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 climbing-rope" />

          {/* Progress fill */}
          <div className="absolute left-1/2 top-0 bottom-0 w-3 -translate-x-1/2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-[hsl(var(--accent))] to-orange-300 rounded-full transition-all duration-500"
              style={{ height: `${completionPercentage}%` }}
            />
          </div>

          {/* Camp markers */}
          <div className="absolute inset-0 flex flex-col justify-between py-4">
            {/* Summit - 100% */}
            <div className="flex items-center gap-2 relative">
              <Flag className={cn(
                "w-5 h-5 transition-all duration-500",
                completionPercentage >= 100 ? "text-[hsl(var(--accent))] flag-plant" : "text-muted-foreground/30"
              )} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Summit</span>
            </div>

            {/* Camp 4 - 80% */}
            <div className="flex items-center gap-2">
              <Tent className={cn(
                "w-4 h-4 transition-all",
                completionPercentage >= 80 ? "text-primary" : "text-muted-foreground/30"
              )} />
              <span className="text-xs text-muted-foreground/70">C4</span>
            </div>

            {/* Camp 3 - 60% */}
            <div className="flex items-center gap-2">
              <Tent className={cn(
                "w-4 h-4 transition-all",
                completionPercentage >= 60 ? "text-primary" : "text-muted-foreground/30"
              )} />
              <span className="text-xs text-muted-foreground/70">C3</span>
            </div>

            {/* Camp 2 - 40% */}
            <div className="flex items-center gap-2">
              <Tent className={cn(
                "w-4 h-4 transition-all",
                completionPercentage >= 40 ? "text-primary" : "text-muted-foreground/30"
              )} />
              <span className="text-xs text-muted-foreground/70">C2</span>
            </div>

            {/* Camp 1 - 20% */}
            <div className="flex items-center gap-2">
              <Tent className={cn(
                "w-4 h-4 transition-all",
                completionPercentage >= 20 ? "text-primary" : "text-muted-foreground/30"
              )} />
              <span className="text-xs text-muted-foreground/70">C1</span>
            </div>

            {/* Base Camp - 0% */}
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground/70">Base</span>
            </div>
          </div>
        </div>

        <div className="mt-2 text-center">
          <div className="text-xs font-bold text-foreground">{todayAltitude}m</div>
          <div className="text-xs text-muted-foreground">altitude</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 md:ml-20">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 mb-6 shadow-lg topo-pattern card-tilt">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-muted-foreground text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-muted/20 rounded-xl px-4 py-2 text-center border border-border/50">
                <div className="text-2xl font-bold text-foreground">{completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              <div className="bg-muted/20 rounded-xl px-4 py-2 text-center border border-border/50">
                <div className="text-2xl font-bold text-foreground flex items-center gap-1">
                  {longestStreak > 0 && <Flame className="w-5 h-5 text-[hsl(var(--accent))]" />}
                  {longestStreak}
                </div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
            </div>
          </div>

          {/* Expedition Overview Stats - NEW */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl px-3 py-2 border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Habits</div>
              <div className="text-lg font-bold text-foreground">{completedHabits}/{totalHabits}</div>
              <div className="text-xs text-primary">Today</div>
            </div>
            <div className="bg-gradient-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 rounded-xl px-3 py-2 border border-[hsl(var(--accent))]/20">
              <div className="text-xs text-muted-foreground mb-1">Active Goals</div>
              <div className="text-lg font-bold text-foreground">{activeGoals.length}</div>
              <div className="text-xs text-[hsl(var(--accent))]">In Progress</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl px-3 py-2 border border-blue-500/20">
              <div className="text-xs text-muted-foreground mb-1">Tasks</div>
              <div className="text-lg font-bold text-foreground">{pendingTodos.length}</div>
              <div className="text-xs text-blue-400">Pending</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl px-3 py-2 border border-orange-500/20">
              <div className="text-xs text-muted-foreground mb-1">Altitude</div>
              <div className="text-lg font-bold text-foreground">{todayAltitude}m</div>
              <div className="text-xs text-orange-400">Today</div>
            </div>
          </div>

          {/* Weather Conditions Display */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/10 rounded-xl border border-border/30">
            <span className="text-2xl">{weatherInfo.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground">{weatherInfo.name}</div>
              <div className="text-xs text-muted-foreground">{weatherInfo.description}</div>
            </div>
            {longestStreak >= 7 && (
              <Badge className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30">
                Perfect Conditions
              </Badge>
            )}
            {missedDaysThisWeek >= 3 && (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                Take Shelter
              </Badge>
            )}
          </div>
        </div>

        {/* Mountain Stats Overview - NEW */}
        <div className="mb-6">
          <MountainStatsPanel
            totalHabitsCompleted={totalHabitsCompletedAllTime}
            totalGoalsCompleted={completedGoals.length}
            longestStreak={longestStreak}
            currentAltitude={todayAltitude}
          />
        </div>

        {/* SECTION 1: Today's Route (Today's Habits) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🧗</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Today's Route</h2>
              <p className="text-sm text-muted-foreground">Your daily habits</p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern mountain-card-depth">
            {/* Enhanced Progress Bar with Climbing Route Visualization */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Climbed today</span>
                <span className="text-sm font-bold text-[hsl(var(--accent))]">{todayAltitude}m / 1000m</span>
              </div>
              <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden">
                {/* Climbing route with pitons */}
                <div
                  className="h-full bg-gradient-to-r from-[hsl(var(--accent))] to-orange-400 transition-all duration-500 relative"
                  style={{ width: `${completionPercentage}%` }}
                >
                  {/* Piton markers at 25%, 50%, 75% */}
                  {completionPercentage >= 25 && (
                    <Anchor className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-white" style={{ left: "25%" }} />
                  )}
                  {completionPercentage >= 50 && (
                    <Anchor className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-white" style={{ left: "50%" }} />
                  )}
                  {completionPercentage >= 75 && (
                    <Anchor className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-white" style={{ left: "75%" }} />
                  )}
                </div>
                {/* Summit flag */}
                {completionPercentage >= 100 && (
                  <Flag className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-white flag-plant" />
                )}
              </div>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">No habits yet</p>
                <Button
                  onClick={() => window.location.href = '/habits'}
                  size="sm"
                  variant="outline"
                >
                  Create Habit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit, index) => {
                  const completed = isHabitCompletedToday(habit.id);
                  const isCelebrating = celebratingHabitId === habit.id;
                  const elevationGain = Math.round(1000 / totalHabits); // Each habit contributes equally

                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all border ice-crystal-border relative group",
                        completed ? "bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/30" : "bg-muted/10 border-border/50",
                        isCelebrating && "summit-pulse"
                      )}
                    >
                      {/* Elevation gain tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        +{elevationGain}m elevation
                      </div>

                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                        style={{ background: habit.color }}
                      >
                        {habit.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-foreground font-medium text-sm">{habit.title}</div>
                          {habit.grade && <GradeBadge grade={habit.grade} size="sm" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {habit.linkedGoalId && (
                            <span className="text-primary">
                              → Contributes to goal
                            </span>
                          )}
                          {habit.streak && habit.streak.streak > 0 && (
                            <span className="flex items-center gap-1 text-[hsl(var(--accent))]">
                              <Flame className="w-3 h-3" />
                              {habit.streak.streak} day{habit.streak.streak !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          toggleHabitMutation.mutate(habit.id);
                          if (!completed) {
                            setCelebratingHabitId(habit.id);
                          }
                        }}
                        disabled={toggleHabitMutation.isPending}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-all font-bold text-lg hover:scale-110 active:scale-95",
                          completed
                            ? "bg-[hsl(var(--accent))]/30 border-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                            : "border-muted-foreground/30 hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 text-muted-foreground"
                        )}
                      >
                        {completed ? "✓" : "○"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: This Week's Wall (Goals/Streaks) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mountain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">This Week's Wall</h2>
              <p className="text-sm text-muted-foreground">Active goals & streaks</p>
            </div>
          </div>

          {activeGoals.length === 0 ? (
            <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-8 text-center shadow-lg">
              <Target className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <h3 className="text-xl font-bold text-foreground mb-2">No Active Goals</h3>
              <p className="text-muted-foreground mb-4">Create your first goal to start tracking progress!</p>
              <Button
                onClick={() => window.location.href = '/goals'}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern mountain-card-depth">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {activeGoals.slice(0, 6).map(goal => (
                  <GoalBadge
                    key={goal.id}
                    goal={goal}
                    onClick={() => window.location.href = '/goals'}
                  />
                ))}
              </div>
              {activeGoals.length > 6 && (
                <Button
                  onClick={() => window.location.href = '/goals'}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  View All Goals →
                </Button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: Expeditions (World Map & Alpine Shop) */}
        <div className="mb-8">
          <ExpeditionCard />
        </div>

        {/* SECTION 4: Base Camp (Pet, Todos, Stats) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Tent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Base Camp</h2>
              <p className="text-sm text-muted-foreground">Quick tasks & overview</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Today's To-Dos */}
            <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern card-tilt">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  To-Do List
                </h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary font-bold border border-primary/30">
                    {pendingTodos.length} left
                  </Badge>
                  <button
                    onClick={() => setTodoDialogOpen(true)}
                    className="w-6 h-6 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary transition-all border border-primary/30"
                    title="Add Todo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {todayTodos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">
                    {todos.length === 0 ? "No todos yet" : "All caught up! 🎉"}
                  </p>
                  <Button
                    onClick={() => setTodoDialogOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Todo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTodos.map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50"
                    >
                      <button
                        onClick={() => toggleTodoMutation.mutate(todo.id)}
                        disabled={toggleTodoMutation.isPending}
                        className="w-6 h-6 rounded border-2 border-muted-foreground/30 hover:border-primary transition-all flex items-center justify-center text-xs"
                      >
                        {todo.completed && "✓"}
                      </button>
                      <div className="flex-1">
                        <div className={cn(
                          "text-foreground text-sm",
                          todo.completed && "line-through opacity-50"
                        )}>
                          {todo.title}
                        </div>
                        {todo.dueDate && (
                          <div className="text-xs text-[hsl(var(--accent))]">
                            Due {(() => {
                              const [year, month, day] = todo.dueDate.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString();
                            })()}
                          </div>
                        )}
                      </div>
                      {todo.difficulty && (
                        <Badge className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-xs border border-[hsl(var(--accent))]/30">
                          {todo.difficulty === 'easy' ? '5' : todo.difficulty === 'hard' ? '15' : '10'} tokens
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dream Scroll */}
            <DreamScrollWidget />
          </div>
        </div>

        {/* SECTION 5: Summit Badges (Achievements) - NEW */}
        <div className="mb-8">
          <MountainAchievements
            habits={habits}
            goals={goals}
            totalHabits={totalHabits}
            completedHabits={completedHabits}
            longestStreak={longestStreak}
            activeGoals={activeGoals}
          />
        </div>

        {/* Quick Actions with enhanced hover effects */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => window.location.href = '/habits'}
            className="h-20 bg-card/60 border-2 border-border/50 hover:border-primary/50 hover:bg-card/80 ice-crystal-border transition-all hover:scale-105 active:scale-95"
            variant="outline"
          >
            <div className="text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-1 text-primary transition-transform group-hover:scale-110" />
              <div className="text-sm font-bold text-foreground">Habits</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/goals'}
            className="h-20 bg-card/60 border-2 border-border/50 hover:border-primary/50 hover:bg-card/80 ice-crystal-border transition-all hover:scale-105 active:scale-95"
            variant="outline"
          >
            <div className="text-center">
              <Target className="w-6 h-6 mx-auto mb-1 text-primary transition-transform group-hover:scale-110" />
              <div className="text-sm font-bold text-foreground">Goals</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/weekly'}
            className="h-20 bg-card/60 border-2 border-border/50 hover:border-primary/50 hover:bg-card/80 ice-crystal-border transition-all hover:scale-105 active:scale-95"
            variant="outline"
          >
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto mb-1 text-primary transition-transform group-hover:scale-110" />
              <div className="text-sm font-bold text-foreground">Weekly</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/habits'}
            className="h-20 bg-card/60 border-2 border-border/50 hover:border-primary/50 hover:bg-card/80 ice-crystal-border transition-all hover:scale-105 active:scale-95"
            variant="outline"
          >
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-[hsl(var(--accent))] transition-transform group-hover:scale-110" />
              <div className="text-sm font-bold text-foreground">Progress</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Todo Dialog */}
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
    </div>
  );
}
