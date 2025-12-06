import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// V2 Components
import { GlowingOrbHabits } from '@/components/GlowingOrbHabits';
import { HabitHeatmap } from '@/components/HabitHeatmap';
import { WeeklyRhythm } from '@/components/WeeklyRhythm';
import { PeakLoreWidget } from '@/components/PeakLoreWidget';
import { AlpenglowOrb } from '@/components/AlpenglowOrb';
import { SummitPill } from '@/components/SummitPill';

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
// DATE UTILITIES
// ============================================================================

function useWeekData() {
  return useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const dates = days.map(d => format(d, 'yyyy-MM-dd'));
    const dayNames = days.map(d => format(d, 'EEE'));
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayIndex = dates.indexOf(todayStr);

    return {
      dates,
      dayNames,
      todayIndex: todayIndex === -1 ? 0 : todayIndex,
      weekStart: dates[0],
      weekEnd: dates[6],
      formatRange: `${format(weekStart, 'MMMM d')}–${format(weekEnd, 'd')}`,
    };
  }, []);
}

// ============================================================================
// CONFETTI
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
// COMPONENTS
// ============================================================================

function ProgressRing({ progress, color, size = 56 }: { progress: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-semibold">{progress}%</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardV4() {
  const { toast } = useToast();
  const week = useWeekData();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: habits = [], isLoading: habitsLoading } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/points'],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const { data: todos = [], isLoading: todosLoading } = useQuery<TodoWithMetadata[]>({
    queryKey: ['/api/todos-with-metadata'],
  });

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
      const wasCompleted = completionMap[habitId]?.[date] ?? false;
      return { wasCompleted };
    },
    onSuccess: (_, __, context) => {
      if (!context?.wasCompleted) triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
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

  const completionMap = useMemo(() => {
    const map: Record<number, Record<string, boolean>> = {};
    weekLogs.forEach(log => {
      if (!map[log.habitId]) map[log.habitId] = {};
      map[log.habitId][log.date] = log.completed;
    });
    return map;
  }, [weekLogs]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayHabits = useMemo(() => {
    return habits.slice(0, 5); // Max 5 habits displayed
  }, [habits]);

  const completedTodayCount = useMemo(() => {
    return todayHabits.filter(h => completionMap[h.id]?.[todayStr]).length;
  }, [todayHabits, completionMap, todayStr]);

  const weeklyGoals = useMemo(() => {
    return goals.filter(g => g.deadline && g.deadline <= week.weekEnd && g.deadline >= week.weekStart).slice(0, 3);
  }, [goals, week.weekStart, week.weekEnd]);

  const monthlyGoals = useMemo(() => {
    const now = new Date();
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    const weeklyIds = new Set(weeklyGoals.map(g => g.id));
    return goals
      .filter(g => g.deadline && g.deadline >= monthStart && g.deadline <= monthEnd && !weeklyIds.has(g.id))
      .slice(0, 2);
  }, [goals, weeklyGoals]);

  const todosByDay = useMemo(() => {
    const byDay: Record<number, TodoWithMetadata[]> = {};
    week.dates.forEach((_, i) => { byDay[i] = []; });
    todos.forEach(todo => {
      if (todo.dueDate) {
        const idx = week.dates.indexOf(todo.dueDate);
        if (idx !== -1) byDay[idx].push(todo);
      }
    });
    return byDay;
  }, [todos, week.dates]);

  const quickTasks = useMemo(() => {
    return todos.filter(t => !t.completed).slice(0, 5);
  }, [todos]);

  // Weekly rhythm data (habits completed per day)
  const weeklyRhythm = useMemo(() => {
    return week.dates.map((date, i) => {
      const completed = habits.filter(h => completionMap[h.id]?.[date]).length;
      const total = habits.length || 1;
      return { day: week.dayNames[i].charAt(0), height: Math.round((completed / total) * 100), isToday: i === week.todayIndex };
    });
  }, [habits, completionMap, week]);

  // Heatmap data (last 28 days)
  const heatmapData = useMemo(() => {
    const data: number[] = [];
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completed = habits.filter(h => completionMap[h.id]?.[dateStr]).length;
      const total = habits.length || 1;
      const level = Math.ceil((completed / total) * 4);
      data.push(level);
    }
    return data;
  }, [habits, completionMap]);

  const xp = points?.available ?? 0;

  const handleToggleHabit = useCallback((habitId: number) => {
    toggleHabitMutation.mutate({ habitId, date: todayStr });
  }, [toggleHabitMutation, todayStr]);

  const handleToggleTodo = useCallback((todoId: number) => {
    toggleTodoMutation.mutate(todoId);
  }, [toggleTodoMutation]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen p-5 md:p-6 pb-24">
      <div className="max-w-[1200px] mx-auto space-y-5">

        {/* ROW 1: Habits on left + Stats on right */}
        <div className="flex justify-between items-start gap-6">
          <div className="flex-shrink-0">
            <GlowingOrbHabits />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30">
              <span>⚡</span>
              <span className="text-sm font-bold text-primary">{xp.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/15 border border-warning/30">
              <span>🪙</span>
              <span className="text-sm font-bold text-warning">156</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Weekly Goals + Monthly Summits (2 equal columns) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Goals */}
          <div className="glass-card p-4 min-h-[180px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <span className="text-sm font-semibold">Weekly Goals</span>
            </div>
            {goalsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : weeklyGoals.length === 0 ? (
              <Link href="/goals">
                <div className="text-sm text-muted-foreground hover:text-primary py-4 text-center cursor-pointer">
                  + Add weekly goals
                </div>
              </Link>
            ) : (
              <div className="space-y-2">
                {weeklyGoals.map(goal => {
                  const isComplete = goal.currentValue >= goal.targetValue;
                  return (
                    <div
                      key={goal.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg",
                        isComplete ? "bg-success/10" : "bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                        isComplete ? "bg-success text-white" : "border-2 border-border"
                      )}>
                        {isComplete && '✓'}
                      </div>
                      <span className={cn("text-sm font-medium flex-1", isComplete && "line-through opacity-60")}>
                        {goal.title}
                      </span>
                      <span className={cn("text-xs font-semibold", isComplete ? "text-success" : "text-muted-foreground")}>
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Goals */}
          <div className="glass-card p-4 min-h-[180px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📊</span>
              <span className="text-sm font-semibold">Monthly Goals</span>
            </div>
            <div className="flex-1 flex items-center justify-around">
              {/* Gauge Meters */}
              {[
                { name: 'Fitness', progress: 75 },
                { name: 'Learning', progress: 40 },
                { name: 'Reading', progress: 100 },
              ].map((goal, i) => {
                const color = goal.progress >= 90 ? '#FFD700' : goal.progress >= 70 ? '#FF6B35' : goal.progress >= 50 ? '#4ECDC4' : '#6495ED';
                const size = 90;
                const strokeWidth = 8;
                const radius = (size - strokeWidth) / 2;
                const circumference = Math.PI * radius; // Half circle
                const offset = circumference - (goal.progress / 100) * circumference;

                return (
                  <motion.div
                    key={goal.name}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                  >
                    <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(ellipse at 50% 100%, ${color}40 0%, transparent 60%)`,
                          filter: 'blur(8px)',
                        }}
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />

                      <svg width={size} height={size / 2 + 10} className="overflow-visible">
                        {/* Background arc */}
                        <path
                          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                        />

                        {/* Progress arc */}
                        <motion.path
                          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                          fill="none"
                          stroke={color}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: offset }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.15 }}
                          style={{
                            filter: `drop-shadow(0 0 6px ${color})`,
                          }}
                        />

                        {/* Tick marks */}
                        {[0, 25, 50, 75, 100].map((tick) => {
                          const angle = Math.PI - (tick / 100) * Math.PI;
                          const x1 = size / 2 + (radius - 12) * Math.cos(angle);
                          const y1 = size / 2 - (radius - 12) * Math.sin(angle);
                          const x2 = size / 2 + (radius - 6) * Math.cos(angle);
                          const y2 = size / 2 - (radius - 6) * Math.sin(angle);
                          return (
                            <line
                              key={tick}
                              x1={x1} y1={y1} x2={x2} y2={y2}
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Percentage text */}
                        <text
                          x={size / 2}
                          y={size / 2 - 5}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fontFamily="Inter, sans-serif"
                          fill="white"
                        >
                          {goal.progress}%
                        </text>
                      </svg>

                      {/* Summit sparkle */}
                      {goal.progress >= 100 && (
                        <motion.div
                          className="absolute -top-1 left-1/2 -translate-x-1/2"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ✨
                        </motion.div>
                      )}
                    </div>

                    <span className="text-xs font-semibold mt-1" style={{ color }}>
                      {goal.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ROW 3: Tip of Day + Rhythm + Heatmap (3 equal columns) */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tip of the Day */}
          <div className="glass-card p-4 min-h-[200px]">
            <PeakLoreWidget />
          </div>

          {/* Weekly Rhythm */}
          <div className="glass-card p-4 min-h-[200px]">
            <WeeklyRhythm />
          </div>

          {/* Habit Heatmap */}
          <div className="glass-card p-4 min-h-[200px]">
            <HabitHeatmap />
          </div>
        </div>

        {/* ROW 4: Weekly Schedule (7-day tasks) */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">📅</span>
            <span className="text-sm font-semibold">Weekly Schedule</span>
            <span className="text-xs text-muted-foreground ml-2">{week.formatRange}</span>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {week.dayNames.map((day, i) => {
              const dayTodos = todosByDay[i] || [];
              const isToday = i === week.todayIndex;
              const dateNum = parseInt(week.dates[i].split('-')[2]);

              return (
                <div
                  key={day}
                  className={cn(
                    "rounded-xl p-3 min-h-[120px]",
                    isToday ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "text-xs font-semibold mb-2 text-center",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {day} {dateNum}
                  </div>
                  <div className="space-y-1">
                    {dayTodos.slice(0, 4).map(todo => (
                      <div
                        key={todo.id}
                        onClick={() => handleToggleTodo(todo.id)}
                        className={cn(
                          "flex items-center gap-1.5 p-1.5 rounded bg-card cursor-pointer text-xs",
                          todo.completed && "opacity-50"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded-sm border flex-shrink-0",
                          todo.completed ? "bg-success border-success" : "border-border"
                        )} />
                        <span className={cn("truncate", todo.completed && "line-through")}>
                          {todo.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
