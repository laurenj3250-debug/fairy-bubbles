import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GoalJourneyCard } from "@/components/GoalJourneyCard";
import { GoalBadge } from "@/components/GoalBadge";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { TodoDialog } from "@/components/TodoDialog";
import { Target, Calendar, CheckCircle, Plus, Sparkles, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Goal, Habit, HabitLog, Todo } from "@shared/schema";
import { getToday } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
  const completedHabits = todayLogs.filter(log => log.completed).length;
  const totalHabits = habits.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos = todos.filter(t => !t.completed);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (goalsLoading || habitsLoading || logsLoading || todosLoading) {
    return (
      <div className="min-h-screen enchanted-bg flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your day...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen enchanted-bg pb-24">
      {/* Header */}
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Comfortaa', cursive" }}>
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-white/70 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
                <div className="text-xs text-white/60">Today</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  {longestStreak > 0 && <Flame className="w-5 h-5 text-orange-400" />}
                  {longestStreak}
                </div>
                <div className="text-xs text-white/60">Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Goals Section */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Comfortaa', cursive" }}>
                <Target className="w-6 h-6 text-purple-300" />
                Your Active Goals
              </h2>
              <Button
                onClick={() => window.location.href = '/goals'}
                variant="ghost"
                className="text-white/70 hover:text-white text-sm"
              >
                View All →
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeGoals.slice(0, 8).map(goal => (
                <GoalBadge
                  key={goal.id}
                  goal={goal}
                  onClick={() => window.location.href = '/goals'}
                />
              ))}
            </div>
          </div>
        )}

        {activeGoals.length === 0 && (
          <div className="glass-card rounded-3xl p-8 mb-8 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-purple-300 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Goals</h3>
            <p className="text-white/60 mb-4">Create your first goal to start tracking progress!</p>
            <Button
              onClick={() => window.location.href = '/goals'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </div>
        )}

        {/* Today's Focus Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Comfortaa', cursive" }}>
            <Sparkles className="w-6 h-6 text-yellow-300" />
            Today's Focus
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Daily Habits */}
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  Daily Habits
                </h3>
                <Badge className={cn(
                  "font-bold",
                  completionPercentage === 100 ? "bg-green-500/30 text-green-200" : "bg-blue-500/30 text-blue-200"
                )}>
                  {completedHabits}/{totalHabits}
                </Badge>
              </div>

              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 mb-3">No habits yet</p>
                  <Button
                    onClick={() => window.location.href = '/habits'}
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white"
                  >
                    Create Habit
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.map(habit => {
                    const completed = isHabitCompletedToday(habit.id);
                    return (
                      <div
                        key={habit.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          completed ? "bg-green-500/10" : "bg-white/5"
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ background: habit.color }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{habit.title}</div>
                          {habit.linkedGoalId && (
                            <div className="text-xs text-purple-300">
                              → Contributes to goal
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleHabitMutation.mutate(habit.id)}
                          disabled={toggleHabitMutation.isPending}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 transition-all font-bold text-lg",
                            completed
                              ? "bg-green-500/30 border-green-400 text-green-200"
                              : "border-white/30 hover:border-green-400 hover:bg-green-500/10 text-white/50"
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

            {/* Today's To-Dos */}
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-300" />
                  To-Do List
                </h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/30 text-blue-200 font-bold">
                    {pendingTodos.length} left
                  </Badge>
                  <button
                    onClick={() => setTodoDialogOpen(true)}
                    className="w-6 h-6 rounded-full bg-blue-500/30 hover:bg-blue-500/50 flex items-center justify-center text-blue-200 transition-all"
                    title="Add Todo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {todayTodos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 mb-3">
                    {todos.length === 0 ? "No todos yet" : "All caught up! 🎉"}
                  </p>
                  <Button
                    onClick={() => setTodoDialogOpen(true)}
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white"
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
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl bg-white/5"
                      )}
                    >
                      <button
                        onClick={() => toggleTodoMutation.mutate(todo.id)}
                        disabled={toggleTodoMutation.isPending}
                        className="w-6 h-6 rounded border-2 border-white/30 hover:border-blue-400 transition-all flex items-center justify-center text-xs"
                      >
                        {todo.completed && "✓"}
                      </button>
                      <div className="flex-1">
                        <div className={cn(
                          "text-white text-sm",
                          todo.completed && "line-through opacity-50"
                        )}>
                          {todo.title}
                        </div>
                        {todo.dueDate && (
                          <div className="text-xs text-orange-300">
                            Due {(() => {
                              const [year, month, day] = todo.dueDate.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString();
                            })()}
                          </div>
                        )}
                      </div>
                      {todo.difficulty && (
                        <Badge className="bg-yellow-400/20 text-yellow-200 text-xs">
                          {todo.difficulty === 'easy' ? '5' : todo.difficulty === 'hard' ? '15' : '10'} coins
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => window.location.href = '/habits'}
            className="h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/30 hover:border-purple-400/50"
            variant="outline"
          >
            <div className="text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-1 text-purple-300" />
              <div className="text-sm font-bold text-white">Habits</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/goals'}
            className="h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/30 hover:border-blue-400/50"
            variant="outline"
          >
            <div className="text-center">
              <Target className="w-6 h-6 mx-auto mb-1 text-blue-300" />
              <div className="text-sm font-bold text-white">Goals</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/weekly'}
            className="h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/30 hover:border-green-400/50"
            variant="outline"
          >
            <div className="text-center">
              <Calendar className="w-6 h-6 mx-auto mb-1 text-green-300" />
              <div className="text-sm font-bold text-white">Weekly</div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = '/habits'}
            className="h-20 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-400/30 hover:border-orange-400/50"
            variant="outline"
          >
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-orange-300" />
              <div className="text-sm font-bold text-white">Progress</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Todo Dialog */}
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
    </div>
  );
}
