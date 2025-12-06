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
import { MountainHero } from '@/components/MountainHero';
import { ForestBackground } from '@/components/ForestBackground';

// V5 Luxury Components
import { LuxuryProgressRing } from '@/components/LuxuryProgressRing';
import { LuxuryWeeklyRhythm } from '@/components/LuxuryWeeklyRhythm';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { LuxuryGoalItem } from '@/components/LuxuryGoalItem';
import { LuxuryStudyTracker } from '@/components/LuxuryStudyTracker';
import { LuxuryFunFact } from '@/components/LuxuryFunFact';

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
// FUN FACTS - Curated climbing & adventure knowledge
// ============================================================================

const FUN_FACTS = [
  {
    title: "The Term 'Beta'",
    content: "Climbers call route information 'beta' after Bates Method videos in the 1980s. Jack Bates filmed climbers solving problems, and the footage became the original way to share route knowledge.",
    category: "Climbing Lore",
  },
  {
    title: "Crimping Science",
    content: "The crimp grip generates 3-4x more force than an open hand grip, but puts significantly more stress on finger pulleys. Training both grip types builds more resilient tendons.",
    category: "Training Tips",
  },
  {
    title: "The V-Scale Origin",
    content: "The V-scale for bouldering was created by John 'Vermin' Sherman at Hueco Tanks in the 1990s. The 'V' stands for Vermin, his nickname from his disheveled climbing lifestyle.",
    category: "Climbing History",
  },
  {
    title: "Rest Step Technique",
    content: "The mountaineer's 'rest step' locks your rear leg straight with each step, letting your skeleton bear weight instead of muscles. This technique can reduce energy expenditure by 30%.",
    category: "Mountain Skills",
  },
  {
    title: "Flash vs Onsight",
    content: "An 'onsight' means climbing a route first try with zero prior knowledge. A 'flash' means first try but with beta from others. Both are impressive, but onsights are considered more pure.",
    category: "Climbing Terms",
  },
  {
    title: "Heel Hook Power",
    content: "A proper heel hook can support up to 80% of your body weight, making it one of the most powerful techniques for overhanging terrain. The key is engaging your hamstring, not just placing the heel.",
    category: "Technique",
  },
  {
    title: "Chalk Chemistry",
    content: "Climbing chalk is magnesium carbonate, the same compound used in antacids. It absorbs moisture and increases friction, but too much can actually decrease grip on certain rock types.",
    category: "Gear Science",
  },
  {
    title: "The Crux",
    content: "The 'crux' of a climb is its hardest section. Routes can have multiple cruxes, and identifying them before climbing helps you conserve energy for when you need it most.",
    category: "Strategy",
  },
];

function getDailyFunFact() {
  // Use day of year as seed for consistent daily rotation
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return FUN_FACTS[dayOfYear % FUN_FACTS.length];
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

  // Inline task add state
  const [inlineAddDay, setInlineAddDay] = useState<number | null>(null);
  const [inlineAddTitle, setInlineAddTitle] = useState('');

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
    onError: (error: Error) => {
      toast({ title: "Failed to update habit", description: error.message, variant: "destructive" });
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
    onError: (error: Error) => {
      toast({ title: "Failed to complete task", description: error.message, variant: "destructive" });
    },
  });

  const incrementGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      return await apiRequest(`/api/goals/${goalId}`, 'PATCH', {
        currentValue: Math.min(goal.currentValue + 1, goal.targetValue),
      });
    },
    onSuccess: () => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update goal", description: error.message, variant: "destructive" });
    },
  });

  const createTodoMutation = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle || trimmedTitle.length > 500) {
        throw new Error('Task title must be 1-500 characters');
      }
      return await apiRequest('/api/todos', 'POST', {
        title: trimmedTitle,
        dueDate,
        priority: 4,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
      // Reset inline add form state after successful creation
      setInlineAddTitle('');
      setInlineAddDay(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
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
    return habits; // Show all habits
  }, [habits]);

  const completedTodayCount = useMemo(() => {
    return todayHabits.filter(h => completionMap[h.id]?.[todayStr]).length;
  }, [todayHabits, completionMap, todayStr]);

  const weeklyGoals = useMemo(() => {
    return goals
      .filter(g => {
        // Must have deadline in current week
        const hasWeeklyDeadline = g.deadline && g.deadline <= week.weekEnd && g.deadline >= week.weekStart;
        // Must NOT be completed (currentValue < targetValue)
        const isIncomplete = g.currentValue < g.targetValue;
        return hasWeeklyDeadline && isIncomplete;
      })
      .slice(0, 3);
  }, [goals, week.weekStart, week.weekEnd]);

  const monthlyGoals = useMemo(() => {
    const now = new Date();
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    const currentMonth = format(now, 'yyyy-MM'); // e.g., "2024-12"
    const weeklyIds = new Set(weeklyGoals.map(g => g.id));
    return goals
      .filter(g => {
        // Include if it's a monthly goal (has month field) OR deadline is within current month
        const isMonthlyGoal = g.month === currentMonth;
        const isInMonthDeadline = g.deadline && g.deadline >= monthStart && g.deadline <= monthEnd;
        return (isMonthlyGoal || isInMonthDeadline) && !weeklyIds.has(g.id) && !g.archived;
      })
      .slice(0, 3); // Show up to 3 monthly goals in gauges
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

  // Study tasks - tasks with study-related keywords
  const studyTasks = useMemo(() => {
    return todos.filter(t => {
      const title = t.title.toLowerCase();
      const isStudyTask = title.includes('study') ||
        title.includes('learn') ||
        title.includes('review') ||
        title.includes('flashcard') ||
        title.includes('anki') ||
        title.includes('remnote');
      return isStudyTask && !t.completed;
    }).slice(0, 3);
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

  // Calculate overall day streak (max streak across all habits)
  const dayStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak?.streak ?? h.streak ?? 0));
  }, [habits]);

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
    <div className="min-h-screen relative">
      {/* Forest background layers */}
      <ForestBackground />

      {/* Mountain hero section */}
      <MountainHero />

      {/* Main dashboard content */}
      <div className="relative z-10 px-5 md:px-8 pb-24">
        <div className="max-w-[900px] ml-[188px] space-y-5">

          {/* HEADER: Logo + Habit Orbs + Stats */}
          <header className="flex justify-center items-center mb-8">
            <div className="flex items-center gap-8">
              <h1 className="logo-text">
                GOAL CONNECT
              </h1>
              <div className="flex-shrink-0">
                <GlowingOrbHabits />
              </div>
              <Link href="/habits">
                <button className="text-[var(--text-muted)] hover:text-peach-400 transition-colors text-xs font-heading">
                  + habit
                </button>
              </Link>
            </div>
            <div className="flex gap-6 text-xs ml-8">
              <div className="font-body text-[var(--text-muted)]">
                <span className="font-heading text-base text-peach-400">{xp.toLocaleString()}</span>
                {' '}points
              </div>
              <div className="font-body text-[var(--text-muted)]">
                <span className="font-heading text-base text-peach-400">{dayStreak}</span>
                {' '}day streak
              </div>
            </div>
          </header>

          {/* ROW 1: Weekly Goals + Study Tracker + Monthly Progress */}
          <div className="card-grid grid grid-cols-3 gap-5">
            {/* Weekly Goals */}
            <div className="glass-card frost-accent min-h-[280px] flex flex-col">
              <span className="card-title">Weekly Goals</span>
              <div className="flex-1 flex flex-col justify-center">
                {goalsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                  </div>
                ) : weeklyGoals.length === 0 ? (
                  <Link href="/goals">
                    <div className="font-heading italic text-sm text-[var(--text-muted)] hover:text-peach-400 py-8 text-center cursor-pointer transition-colors">
                      + Add weekly goals
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    {weeklyGoals.map(goal => (
                      <LuxuryGoalItem
                        key={goal.id}
                        title={goal.title}
                        current={goal.currentValue}
                        target={goal.targetValue}
                        onIncrement={() => incrementGoalMutation.mutate(goal.id)}
                        isPending={incrementGoalMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Study Tracker */}
            <div className="glass-card frost-accent min-h-[280px] flex flex-col">
              <span className="card-title">Study Tracker</span>
              <div className="flex-1 flex items-center justify-center">
                <LuxuryStudyTracker
                  tasks={studyTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed }))}
                  onToggle={(id) => handleToggleTodo(id)}
                  onStartSession={() => {
                    window.location.href = '/study';
                  }}
                />
              </div>
            </div>

            {/* Monthly Progress */}
            <div className="glass-card frost-accent min-h-[280px] flex flex-col">
              <span className="card-title">Monthly Progress</span>
              <div className="flex-1 flex items-center justify-around">
                {monthlyGoals.length === 0 ? (
                  <Link href="/goals">
                    <div className="font-heading italic text-sm text-[var(--text-muted)] hover:text-peach-400 py-4 text-center cursor-pointer transition-colors">
                      + Add monthly goals
                    </div>
                  </Link>
                ) : (
                  monthlyGoals.slice(0, 3).map(goal => {
                    const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
                    return (
                      <LuxuryProgressRing
                        key={goal.id}
                        progress={progress}
                        label={goal.title}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Climbing Tip + Weekly Rhythm + This Week */}
          <div className="card-grid grid grid-cols-3 gap-5">
            {/* Climbing Tip */}
            <div className="glass-card frost-accent min-h-[220px] flex flex-col">
              <span className="card-title">Climbing Tip</span>
              <div className="flex-1">
                {(() => {
                  const fact = getDailyFunFact();
                  return (
                    <LuxuryFunFact
                      title={fact.title}
                      content={fact.content}
                      category={fact.category}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Weekly Rhythm */}
            <div className="glass-card frost-accent min-h-[220px] flex flex-col">
              <span className="card-title">Weekly Rhythm</span>
              <div className="flex-1 flex items-end">
                <LuxuryWeeklyRhythm data={weeklyRhythm} className="w-full" />
              </div>
            </div>

            {/* This Week */}
            <div className="glass-card frost-accent min-h-[220px] flex flex-col">
              <span className="card-title">This Week</span>
              <div className="flex-1 flex items-center">
                <LuxuryHabitGrid
                  habits={todayHabits.map(habit => ({
                    id: habit.id,
                    name: habit.title,
                    days: week.dates.map(date => ({
                      date,
                      completed: completionMap[habit.id]?.[date] ?? false,
                    })),
                    completed: week.dates.filter(date => completionMap[habit.id]?.[date]).length,
                    total: 7,
                  }))}
                  todayIndex={week.todayIndex}
                  onToggle={(habitId, date) => toggleHabitMutation.mutate({ habitId, date })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* ROW 3: Weekly Schedule (full-width, 7-day tasks) */}
          <div className="glass-card frost-accent">
            <div className="flex items-center justify-between mb-4">
              <span className="card-title">Schedule</span>
              <span className="font-heading italic text-xs text-[var(--text-muted)]">{week.formatRange}</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {week.dayNames.map((day, i) => {
                const dayTodos = todosByDay[i] || [];
                const isToday = i === week.todayIndex;

                return (
                  <div
                    key={`${day}-${i}`}
                    className={cn(
                      "rounded-xl p-3 min-h-[100px] text-center transition-all",
                      isToday
                        ? "bg-peach-400/10 border border-peach-400/25 shadow-[0_0_15px_rgba(228,168,128,0.1)]"
                        : "bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "font-heading-sc text-[0.6rem] tracking-wide mb-2",
                      isToday ? "text-peach-400" : "text-[var(--text-muted)]"
                    )}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTodos.slice(0, 4).map(todo => (
                        <button
                          type="button"
                          key={todo.id}
                          onClick={() => handleToggleTodo(todo.id)}
                          className={cn(
                            "w-full text-left font-body text-[0.65rem] p-1 rounded bg-ice-card/50 cursor-pointer truncate hover:bg-peach-400/10 transition-colors",
                            todo.completed && "opacity-50 line-through"
                          )}
                        >
                          {todo.title}
                        </button>
                      ))}
                      {dayTodos.length < 4 && (
                        inlineAddDay === i ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (inlineAddTitle.trim() && !createTodoMutation.isPending) {
                                createTodoMutation.mutate({ title: inlineAddTitle.trim(), dueDate: week.dates[i] });
                              }
                            }}
                            className="flex gap-1"
                            aria-label={`Add task for ${week.dayNames[i]}`}
                          >
                            <label htmlFor={`task-input-${i}`} className="sr-only">
                              Task title for {week.dayNames[i]}
                            </label>
                            <input
                              id={`task-input-${i}`}
                              type="text"
                              value={inlineAddTitle}
                              onChange={(e) => setInlineAddTitle(e.target.value)}
                              placeholder="Task..."
                              autoFocus
                              maxLength={500}
                              disabled={createTodoMutation.isPending}
                              onBlur={() => {
                                if (!inlineAddTitle.trim() && !createTodoMutation.isPending) {
                                  setInlineAddDay(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' && !createTodoMutation.isPending) {
                                  setInlineAddTitle('');
                                  setInlineAddDay(null);
                                }
                              }}
                              className={cn(
                                "flex-1 text-[0.6rem] p-1 rounded bg-white/10 border border-white/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50",
                                createTodoMutation.isPending && "opacity-50 cursor-not-allowed"
                              )}
                            />
                            {createTodoMutation.isPending && (
                              <span className="text-[0.5rem] text-peach-400 animate-pulse">...</span>
                            )}
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setInlineAddDay(i)}
                            disabled={createTodoMutation.isPending}
                            className={cn(
                              "w-full text-center font-body text-[0.55rem] p-1 rounded text-[var(--text-muted)] hover:bg-white/5 transition-colors opacity-50 hover:opacity-100",
                              createTodoMutation.isPending && "cursor-not-allowed"
                            )}
                          >
                            + add
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
