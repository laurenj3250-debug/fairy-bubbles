import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getToday, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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

// ============================================================================
// UTILITIES
// ============================================================================

function getWeekDates(): { dates: string[]; dayNames: string[]; dayNamesShort: string[]; todayIndex: number } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dates: string[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const todayStr = today.toISOString().split('T')[0];
  const todayIndex = dates.indexOf(todayStr);

  return { dates, dayNames, dayNamesShort, todayIndex: todayIndex === -1 ? 0 : todayIndex };
}

function getWeekRange(): { start: string; end: string } {
  const { dates } = getWeekDates();
  return { start: dates[0], end: dates[6] };
}

function formatWeekRange(): string {
  const { dates } = getWeekDates();
  const start = new Date(dates[0]);
  const end = new Date(dates[6]);
  const month = start.toLocaleDateString('en-US', { month: 'long' });
  return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
}

function isHabitScheduledForDay(habit: HabitWithData, dayIndex: number): boolean {
  // Daily habits show every day
  if (habit.frequencyType === 'daily' || habit.cadence === 'daily') {
    return true;
  }

  // Weekly habits - check if scheduled for specific day
  if (habit.scheduledDay) {
    const { dates } = getWeekDates();
    return habit.scheduledDay === dates[dayIndex];
  }

  // For habits with targetPerWeek, show all days (user chooses when)
  if (habit.targetPerWeek && habit.targetPerWeek > 0) {
    return true;
  }

  // Default: show on all days
  return true;
}

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#F97316', '#10B981', '#3B82F6', '#8B5CF6'],
  });
}

// ============================================================================
// PROGRESS ARC COMPONENT
// ============================================================================

function ProgressArc({
  progress,
  color,
  size = 60
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = size > 50 ? 6 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function DashboardV3() {
  const [currentPage, setCurrentPage] = useState<'week' | 'study'>('week');
  const [isMobile, setIsMobile] = useState(false);
  const today = getToday();
  const { dates, dayNames, dayNamesShort, todayIndex } = getWeekDates();

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

  const { data: habits = [] } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/points'],
  });

  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['/api/habits/streak'],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const { data: todos = [] } = useQuery<TodoWithMetadata[]>({
    queryKey: ['/api/todos-with-metadata'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch habit logs for the current week
  const { data: weekLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs/range', dates[0], dates[6]],
    queryFn: async () => {
      const res = await fetch(`/api/habit-logs/range/${dates[0]}/${dates[6]}`);
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
    onSuccess: (_, variables) => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits/streak'] });
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
  });

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  // Create a map of habit completions by habitId and date
  const completionMap = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    weekLogs.forEach(log => {
      if (!map[log.habitId]) map[log.habitId] = {};
      map[log.habitId][log.date] = log.completed;
    });
    return map;
  }, [weekLogs]);

  // Filter goals by deadline
  const weeklyGoals = useMemo(() => {
    const { end } = getWeekRange();
    return goals.filter(g => g.deadline <= end && g.deadline >= dates[0]);
  }, [goals, dates]);

  const monthlyGoals = useMemo(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return goals.filter(g => g.deadline >= monthStart && g.deadline <= monthEnd).slice(0, 3);
  }, [goals]);

  // Group todos by due date
  const todosByDay = useMemo(() => {
    const byDay: Record<number, TodoWithMetadata[]> = {};
    dates.forEach((_, i) => { byDay[i] = []; });

    todos.forEach(todo => {
      if (todo.dueDate) {
        const idx = dates.indexOf(todo.dueDate);
        if (idx !== -1) {
          byDay[idx].push(todo);
        }
      }
    });

    return byDay;
  }, [todos, dates]);

  // Calculate project progress
  const projectsWithProgress = useMemo(() => {
    return projects.map(project => {
      const projectTodos = todos.filter(t => t.projectId === project.id);
      const completed = projectTodos.filter(t => t.completed).length;
      const total = projectTodos.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate deadline status based on earliest todo due date
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
          <p className="text-muted-foreground text-sm mt-1">{formatWeekRange()}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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
      <div className={cn(
        "grid gap-4 mb-5",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        {/* Weekly Goals */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h3 className="font-semibold text-foreground">Weekly Goals</h3>
          </div>

          {weeklyGoals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No goals due this week</p>
          ) : (
            weeklyGoals.map(goal => {
              const isComplete = goal.currentValue >= goal.targetValue;
              return (
                <div
                  key={goal.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg mb-2 transition-all",
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
              );
            })
          )}
        </div>

        {/* Monthly Goals */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏔️</span>
            <h3 className="font-semibold text-foreground">Monthly Summits</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date().toLocaleDateString('en-US', { month: 'long' })}
            </span>
          </div>

          <div className="flex justify-around gap-4">
            {monthlyGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No monthly goals</p>
            ) : (
              monthlyGoals.map((goal, i) => {
                const progress = goal.targetValue > 0
                  ? Math.round((goal.currentValue / goal.targetValue) * 100)
                  : 0;
                const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];
                return (
                  <div key={goal.id} className="flex flex-col items-center flex-1">
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Habit Grid */}
      <div className="glass-card p-4 mb-5 overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h3 className="font-semibold text-foreground">Daily Pitches</h3>
        </div>

        <div style={{ minWidth: isMobile ? '500px' : 'auto' }}>
          {/* Header Row */}
          <div className="flex mb-2">
            <div className={cn("flex-shrink-0", isMobile ? "w-24" : "w-36")} />
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "flex-1 text-center",
                  i === todayIndex ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="text-xs font-semibold">
                  {isMobile ? dayNamesShort[i] : day}
                </div>
                <div className={cn(
                  "text-sm font-bold mt-1",
                  i === todayIndex ? "text-primary" : "text-foreground"
                )}>
                  {new Date(dates[i]).getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Habit Rows */}
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center mb-1.5">
              <div className={cn(
                "flex-shrink-0 flex items-center gap-2",
                isMobile ? "w-24" : "w-36"
              )}>
                <span className="text-base">{habit.icon}</span>
                <span className="text-sm text-foreground truncate">{habit.title}</span>
              </div>

              {dates.map((date, i) => {
                const showOnDay = isHabitScheduledForDay(habit, i);
                const isCompleted = completionMap[habit.id]?.[date] ?? false;
                const isToday = i === todayIndex;

                return (
                  <div key={date} className="flex-1 flex justify-center py-1">
                    {showOnDay ? (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleHabitMutation.mutate({ habitId: habit.id, date })}
                        disabled={toggleHabitMutation.isPending}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          isCompleted
                            ? "bg-gradient-to-br from-success to-success/80 text-white shadow-lg shadow-success/30"
                            : isToday
                              ? "border-2 border-primary bg-primary/5"
                              : "border-2 border-border bg-card"
                        )}
                      >
                        {isCompleted && '✓'}
                      </motion.button>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted/30" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Todo Grid */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h3 className="font-semibold text-foreground">Route Beta</h3>
        </div>

        {isMobile ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "rounded-xl p-3 min-w-[140px] flex-shrink-0",
                  i === todayIndex
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/30 border border-border"
                )}
              >
                <p className={cn(
                  "text-xs font-semibold text-center mb-3",
                  i === todayIndex ? "text-primary" : "text-muted-foreground"
                )}>
                  {day} {new Date(dates[i]).getDate()}
                </p>

                {todosByDay[i]?.map(todo => (
                  <motion.div
                    key={todo.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !todo.completed && toggleTodoMutation.mutate(todo.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 mb-2 rounded-lg cursor-pointer transition-all",
                      todo.completed ? "bg-success/10 opacity-60" : "bg-card",
                      todo.projectId ? "border border-dashed border-secondary/50" : "border border-border"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] mt-0.5",
                      todo.completed
                        ? "bg-success text-white"
                        : "border-2 border-muted-foreground"
                    )}>
                      {todo.completed && '✓'}
                    </div>
                    <span className={cn(
                      "text-xs leading-tight",
                      todo.completed && "line-through text-muted-foreground"
                    )}>
                      {todo.title}
                    </span>
                  </motion.div>
                ))}

                {(!todosByDay[i] || todosByDay[i].length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Rest day 🧘
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "rounded-xl p-3 min-h-[120px]",
                  i === todayIndex
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/30 border border-border"
                )}
              >
                <p className={cn(
                  "text-xs font-semibold text-center mb-3",
                  i === todayIndex ? "text-primary" : "text-muted-foreground"
                )}>
                  {day}
                </p>

                {todosByDay[i]?.map(todo => (
                  <motion.div
                    key={todo.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !todo.completed && toggleTodoMutation.mutate(todo.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 mb-2 rounded-lg cursor-pointer transition-all",
                      todo.completed ? "bg-success/10 opacity-60" : "bg-card",
                      todo.projectId ? "border border-dashed border-secondary/50" : "border border-border"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] mt-0.5",
                      todo.completed
                        ? "bg-success text-white"
                        : "border-2 border-muted-foreground"
                    )}>
                      {todo.completed && '✓'}
                    </div>
                    <span className={cn(
                      "text-xs leading-tight",
                      todo.completed && "line-through text-muted-foreground"
                    )}>
                      {todo.title}
                    </span>
                  </motion.div>
                ))}

                {(!todosByDay[i] || todosByDay[i].length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Rest day 🧘
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // STUDY PLANNER VIEW
  // ============================================================================

  const [expandedProject, setExpandedProject] = useState<number | null>(null);

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
          <div
            key={project.id}
            className="glass-card overflow-hidden"
          >
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

              {/* Progress Bar */}
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

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedProject === project.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-muted/30 overflow-hidden"
                >
                  <div className="p-5">
                    {project.milestones.length > 0 && (
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
                                → {dayNames[dates.indexOf(milestone.dueDate)] || milestone.dueDate}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {project.milestones.length === 0 && (
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

        {/* Add New Project Card */}
        <div className="glass-card border-2 border-dashed border-border p-8 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl text-muted-foreground mb-3">
            +
          </div>
          <p className="text-muted-foreground text-sm">
            Plan New Expedition
          </p>
        </div>
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

      {/* Content */}
      {currentPage === 'week' ? <WeeklyView /> : <StudyPlanner />}
    </div>
  );
}
