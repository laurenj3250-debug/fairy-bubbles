import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Components
import { HabitGrid, HabitGridSkeleton } from '@/components/dashboard/HabitGrid';
import { TodoDayColumn } from '@/components/dashboard/TodoDayColumn';
import { ProgressArc } from '@/components/dashboard/ProgressArc';
import { MoodButton } from '@/components/dashboard/MoodTracker';

// Types
import type { Habit, HabitLog, Goal, Todo, Project } from '@shared/schema';

// ============================================================================
// TYPES
// ============================================================================

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

interface UserPoints {
  available: number;
  total: number;
  spent: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

interface TodoWithMetadata extends Todo {
  project?: Project | null;
  labels?: Array<{ id: number; name: string; color: string }>;
}

interface VirtualPet {
  id: number;
  name: string;
  species: string;
  happiness: number;
  health: number;
  level: number;
  evolution: string;
}

// ============================================================================
// DATE UTILITIES (using date-fns)
// ============================================================================

function useWeekData() {
  return useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const dates = days.map(d => format(d, 'yyyy-MM-dd'));
    const dayNames = days.map(d => format(d, 'EEE'));
    const dayNamesShort = days.map(d => format(d, 'EEEEE'));

    const todayStr = format(now, 'yyyy-MM-dd');
    const todayIndex = dates.indexOf(todayStr);

    return {
      dates,
      dayNames,
      dayNamesShort,
      todayIndex: todayIndex === -1 ? 0 : todayIndex,
      weekStart: dates[0],
      weekEnd: dates[6],
      formatRange: `${format(weekStart, 'MMMM d')}–${format(weekEnd, 'd, yyyy')}`,
    };
  }, []);
}

// ============================================================================
// HABIT SCHEDULING
// ============================================================================

function isHabitScheduledForDay(habit: HabitWithData, dayIndex: number, dates: string[]): boolean {
  if (habit.frequencyType === 'daily' || habit.cadence === 'daily') {
    return true;
  }
  if (habit.scheduledDay) {
    return habit.scheduledDay === dates[dayIndex];
  }
  if (habit.targetPerWeek && habit.targetPerWeek > 0) {
    return true;
  }
  return true;
}

// ============================================================================
// CONFETTI (smart - only on completions)
// ============================================================================

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#F97316', '#10B981', '#3B82F6', '#8B5CF6'],
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardV3() {
  const [currentPage, setCurrentPage] = useState<'week' | 'study'>('week');
  const [isMobile, setIsMobile] = useState(false);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const { toast } = useToast();

  // Get week data (memoized, calculated once)
  const week = useWeekData();

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: habits = [],
    isLoading: habitsLoading,
    error: habitsError,
  } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/points'],
  });

  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['/api/habits/streak'],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const { data: todos = [], isLoading: todosLoading } = useQuery<TodoWithMetadata[]>({
    queryKey: ['/api/todos-with-metadata'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: pet } = useQuery<VirtualPet>({
    queryKey: ['/api/pet'],
  });

  // Fetch habit logs for the current week
  const { data: weekLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs/range', week.weekStart, week.weekEnd],
    queryFn: async () => {
      const res = await fetch(`/api/habit-logs/range/${week.weekStart}/${week.weekEnd}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest('/api/habit-logs/toggle', 'POST', { habitId, date });
    },
    onMutate: async ({ habitId, date }) => {
      // Check if this will be a completion (for smart confetti)
      const wasCompleted = completionMap[habitId]?.[date] ?? false;
      return { wasCompleted };
    },
    onSuccess: (_, variables, context) => {
      // Only confetti if it was a completion (not un-completion)
      if (!context?.wasCompleted) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits/streak'] });
    },
    onError: () => {
      toast({
        title: 'Failed to update habit',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async (todoId: number) => {
      return await apiRequest(`/api/todos/${todoId}/complete`, 'POST');
    },
    onSuccess: () => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
    onError: () => {
      toast({
        title: 'Failed to complete task',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const createTodoMutation = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      return await apiRequest('/api/todos', 'POST', { title, dueDate, priority: 'medium' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
      toast({
        title: 'Task added!',
        description: 'Keep climbing 🧗',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to add task',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // COMPUTED DATA (properly memoized)
  // ============================================================================

  const completionMap = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    weekLogs.forEach(log => {
      if (!map[log.habitId]) map[log.habitId] = {};
      map[log.habitId][log.date] = log.completed;
    });
    return map;
  }, [weekLogs]);

  const weeklyGoals = useMemo(() => {
    return goals.filter(g => g.deadline && g.deadline <= week.weekEnd && g.deadline >= week.weekStart);
  }, [goals, week.weekStart, week.weekEnd]);

  const monthlyGoals = useMemo(() => {
    const now = new Date();
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    // Exclude goals already shown in weekly section
    const weeklyIds = new Set(weeklyGoals.map(g => g.id));
    return goals
      .filter(g => g.deadline && g.deadline >= monthStart && g.deadline <= monthEnd && !weeklyIds.has(g.id))
      .slice(0, 3);
  }, [goals, weeklyGoals]);

  const todosByDay = useMemo(() => {
    const byDay: Record<number, TodoWithMetadata[]> = {};
    week.dates.forEach((_, i) => { byDay[i] = []; });

    todos.forEach(todo => {
      if (todo.dueDate) {
        const idx = week.dates.indexOf(todo.dueDate);
        if (idx !== -1) {
          byDay[idx].push(todo);
        }
      }
    });

    return byDay;
  }, [todos, week.dates]);

  const projectsWithProgress = useMemo(() => {
    return projects.map(project => {
      const projectTodos = todos.filter(t => t.projectId === project.id);
      const completed = projectTodos.filter(t => t.completed).length;
      const total = projectTodos.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      const dueDates = projectTodos
        .filter(t => t.dueDate && !t.completed)
        .map(t => t.dueDate!)
        .sort();

      const nextDeadline = dueDates[0];
      let deadlineStatus: 'green' | 'yellow' | 'red' = 'green';

      if (nextDeadline) {
        const daysUntil = Math.ceil((new Date(nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 3) deadlineStatus = 'red';
        else if (daysUntil < 7) deadlineStatus = 'yellow';
      }

      return {
        ...project,
        progress,
        deadlineStatus,
        nextDeadline,
        milestones: projectTodos.filter(t => !t.completed),
        completedCount: completed,
        totalCount: total,
      };
    });
  }, [projects, todos]);

  // Callbacks (stable references)
  const handleToggleHabit = useCallback((habitId: number, date: string) => {
    toggleHabitMutation.mutate({ habitId, date });
  }, [toggleHabitMutation]);

  const handleToggleTodo = useCallback((todoId: number) => {
    toggleTodoMutation.mutate(todoId);
  }, [toggleTodoMutation]);

  const handleAddTodo = useCallback((title: string, dueDate: string) => {
    createTodoMutation.mutate({ title, dueDate });
  }, [createTodoMutation]);

  const isScheduledForDay = useCallback((habit: HabitWithData, dayIndex: number) => {
    return isHabitScheduledForDay(habit, dayIndex, week.dates);
  }, [week.dates]);

  const xp = points?.available ?? 0;
  const streak = streakData?.currentStreak ?? 0;

  // ============================================================================
  // WEEKLY VIEW
  // ============================================================================

  const WeeklyView = () => (
    <div className={cn("min-h-screen", isMobile ? "p-4" : "p-5 md:p-7")}>
      {/* Header */}
      <div className={cn(
        "flex justify-between items-center mb-5",
        isMobile && "flex-col items-start gap-3"
      )}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            This Week ⛰️
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{week.formatRange}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Pet Widget */}
          {pet && (
            <Link href="/settings">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/30 cursor-pointer hover:bg-accent/20 transition-colors">
                <span className="text-lg">
                  {pet.evolution === 'seed' && '🌱'}
                  {pet.evolution === 'sprout' && '🌿'}
                  {pet.evolution === 'sapling' && '🌳'}
                  {pet.evolution === 'tree' && '🌲'}
                  {pet.evolution === 'ancient' && '🏔️'}
                </span>
                <span className="text-xs text-accent font-medium">Lv.{pet.level}</span>
              </div>
            </Link>
          )}

          {/* XP Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
            <span className="text-lg">⚡</span>
            <span className="font-bold text-primary">{xp.toLocaleString()} XP</span>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-foreground">{streak}</span>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className={cn("grid gap-4 mb-5", isMobile ? "grid-cols-1" : "grid-cols-2")}>
        {/* Weekly Goals */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="font-semibold text-foreground">Weekly Goals</h3>
            </div>
            <Link href="/goals">
              <button className="w-6 h-6 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-sm">
                +
              </button>
            </Link>
          </div>

          {goalsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : weeklyGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No goals due this week. Set some targets! 🎯
            </p>
          ) : (
            weeklyGoals.map(goal => {
              const isComplete = goal.currentValue >= goal.targetValue;
              return (
                <Link key={goal.id} href="/goals">
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg mb-2 transition-all cursor-pointer hover:opacity-80",
                      isComplete ? "bg-success/10" : "bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs",
                      isComplete
                        ? "bg-success border-success text-success-foreground"
                        : "border-muted-foreground"
                    )}>
                      {isComplete && '✓'}
                    </div>
                    <span className={cn(
                      "text-sm flex-1",
                      isComplete && "line-through text-muted-foreground"
                    )}>
                      {goal.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goal.currentValue}/{goal.targetValue} {goal.unit}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Monthly Goals */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏔️</span>
              <h3 className="font-semibold text-foreground">Monthly Summits</h3>
              <span className="text-xs text-muted-foreground">
                {format(new Date(), 'MMMM')}
              </span>
            </div>
            <Link href="/goals">
              <button className="w-6 h-6 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-sm">
                +
              </button>
            </Link>
          </div>

          <div className="flex justify-around gap-4">
            {goalsLoading ? (
              <div className="flex gap-4 justify-around w-full">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-muted animate-pulse rounded-full" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded mt-2" />
                  </div>
                ))}
              </div>
            ) : monthlyGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No monthly goals set</p>
            ) : (
              monthlyGoals.map((goal, i) => {
                const progress = goal.targetValue > 0
                  ? Math.round((goal.currentValue / goal.targetValue) * 100)
                  : 0;
                const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];
                return (
                  <Link key={goal.id} href="/goals" className="flex flex-col items-center flex-1 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="relative mb-2">
                      <ProgressArc
                        progress={progress}
                        color={colors[i % colors.length]}
                        size={isMobile ? 48 : 56}
                      />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold">
                        {progress}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center line-clamp-2">
                      {goal.title}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Habit Grid */}
      <div className="glass-card p-4 mb-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="font-semibold text-foreground">Daily Pitches</h3>
          </div>
          <Link href="/habits">
            <button className="w-6 h-6 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-sm">
              +
            </button>
          </Link>
        </div>

        {habitsLoading ? (
          <HabitGridSkeleton isMobile={isMobile} />
        ) : habitsError ? (
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-2">Failed to load habits</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] })}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <HabitGrid
            habits={habits}
            dates={week.dates}
            dayNames={week.dayNames}
            dayNamesShort={week.dayNamesShort}
            todayIndex={week.todayIndex}
            completionMap={completionMap}
            isMobile={isMobile}
            isScheduledForDay={isScheduledForDay}
            onToggleHabit={handleToggleHabit}
            isPending={toggleHabitMutation.isPending}
          />
        )}
      </div>

      {/* Todo Grid */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h3 className="font-semibold text-foreground">Route Beta</h3>
          </div>
          <Link href="/todos">
            <button className="w-6 h-6 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-sm">
              +
            </button>
          </Link>
        </div>

        {todosLoading ? (
          <div className={cn(
            "gap-3",
            isMobile ? "flex overflow-x-auto pb-2" : "grid grid-cols-7"
          )}>
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-3 bg-muted animate-pulse",
                  isMobile ? "min-w-[140px] h-32" : "min-h-[120px]"
                )}
              />
            ))}
          </div>
        ) : (
          <div className={cn(
            "gap-3",
            isMobile ? "flex overflow-x-auto pb-2 -mr-4 pr-4" : "grid grid-cols-7"
          )}>
            {week.dayNames.map((day, i) => (
              <TodoDayColumn
                key={day}
                dayName={day}
                date={week.dates[i]}
                todos={todosByDay[i] || []}
                isToday={i === week.todayIndex}
                isMobile={isMobile}
                onToggleTodo={handleToggleTodo}
                onAddTodo={handleAddTodo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // STUDY PLANNER VIEW
  // ============================================================================

  const StudyPlanner = () => (
    <div className={cn("min-h-screen", isMobile ? "p-4" : "p-5 md:p-7")}>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Expedition Planner 🗺️
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your long-term ascents
        </p>
      </div>

      <div className={cn(
        "grid gap-5",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {projectsWithProgress.map(project => (
          <div key={project.id} className="glass-card overflow-hidden">
            <div
              onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              className="p-5 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-foreground flex-1 mr-3">
                  {project.name}
                </h3>
                {project.nextDeadline && (
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    project.deadlineStatus === 'green' && "bg-success/10 text-success",
                    project.deadlineStatus === 'yellow' && "bg-warning/10 text-warning",
                    project.deadlineStatus === 'red' && "bg-destructive/10 text-destructive"
                  )}>
                    {project.nextDeadline}
                  </span>
                )}
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-success to-success/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {project.progress}% complete ({project.completedCount}/{project.totalCount})
                </span>
                <span className="text-lg">
                  {expandedProject === project.id ? '↑' : '↓'}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {expandedProject === project.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-muted/30 overflow-hidden"
                >
                  <div className="p-5">
                    {project.milestones.length > 0 ? (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Upcoming Pitches
                        </p>
                        {project.milestones.slice(0, 5).map(milestone => (
                          <div
                            key={milestone.id}
                            className="flex items-center justify-between p-3 bg-card rounded-lg mb-2 border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                              <span className="text-sm">{milestone.title}</span>
                            </div>
                            {milestone.dueDate && (
                              <span className="text-xs text-primary">
                                → {week.dayNames[week.dates.indexOf(milestone.dueDate)] || milestone.dueDate}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        🏔️ All pitches complete! Summit reached!
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Add New Project Button */}
        <Link href="/todos">
          <div className="glass-card border-2 border-dashed border-border p-8 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl text-muted-foreground mb-3">
              +
            </div>
            <p className="text-muted-foreground text-sm">
              Plan New Expedition
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation Tabs */}
      <div className={cn(
        "flex justify-center gap-2 sticky top-0 z-50 py-4 px-4",
        "bg-gradient-to-b from-background to-background/80 backdrop-blur-sm"
      )}>
        <button
          onClick={() => setCurrentPage('week')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-semibold transition-all",
            currentPage === 'week'
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          📅 Weekly
        </button>
        <button
          onClick={() => setCurrentPage('study')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-semibold transition-all",
            currentPage === 'study'
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          🗺️ Expeditions
        </button>
      </div>

      {currentPage === 'week' ? <WeeklyView /> : <StudyPlanner />}

      {/* Floating Mood Button */}
      <MoodButton isMobile={isMobile} />
    </div>
  );
}
