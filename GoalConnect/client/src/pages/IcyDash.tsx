import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { triggerConfetti, checkAllHabitsComplete } from '@/lib/confetti';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FAB } from '@/components/FAB';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import CurrentExpeditionWidget from '@/components/CurrentExpeditionWidget';
import { GlowingOrbHabits } from '@/components/GlowingOrbHabits';
import { MountainHero } from '@/components/MountainHero';
import { ForestBackground } from '@/components/ForestBackground';
import { LuxuryWeeklyRhythm } from '@/components/LuxuryWeeklyRhythm';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { DreamScrollWidget } from '@/components/DreamScrollWidget';
import { HabitNoteDialog } from '@/components/HabitNoteDialog';
import { HabitDetailDialog } from '@/components/HabitDetailDialog';
import { QuickClimbingDayDialog } from '@/components/QuickClimbingDayDialog';
import { AddBookDialog } from '@/components/AddBookDialog';

// Drag and Drop
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DroppableDayColumn } from '@/components/dashboard/DroppableDayColumn';

import type { Habit, HabitLog, Goal, Todo, Project } from '@shared/schema';
import { useYearlyGoals } from '@/hooks/useYearlyGoals';
import { useClimbingLog } from '@/hooks/useClimbingLog';
import { useStudyPlanner } from '@/hooks/useStudyPlanner';
import { CompactGoalGrid } from '@/components/yearly-goals';
import { GoalCalendarWidget } from '@/components/GoalCalendarWidget';
import { GoalsDeadlinesWidget } from '@/components/GoalsDeadlinesWidget';
import { MilestoneDonutWidget } from '@/components/MilestoneDonutWidget';
import { ResidencyCountdownWidget } from '@/components/ResidencyCountdownWidget';
import { MediaWidget } from '@/components/MediaWidget';
import { useGoalCalendar } from '@/hooks/useGoalCalendar';

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
// DESTINATION SPOTLIGHT - Epic crags & mountain destinations
// ============================================================================

const FUN_FACTS = [
  {
    title: "Red River Gorge, Kentucky",
    content: "The Red has 1,500+ sport routes on bullet sandstone with steep overhangs and pockets. Best seasons: spring & fall. Miguel's Pizza is the legendary climber hangout.",
    category: "Sport Climbing",
  },
  {
    title: "Bishop, California",
    content: "World-class high desert bouldering on volcanic tablelands and the Buttermilks. Famous for the Mandala (V12) and perfect fall/winter weather at 4,000ft elevation.",
    category: "Bouldering",
  },
  {
    title: "Yosemite Valley, California",
    content: "The birthplace of American big wall climbing. El Capitan's 3,000ft granite face hosts The Nose and Dawn Wall. Best months: April-May and September-October.",
    category: "Big Wall",
  },
  {
    title: "Kalymnos, Greece",
    content: "Mediterranean limestone paradise with 3,500+ routes, crystal blue water, and perfect tufa climbing. Spring and fall offer ideal temps with cheap ferries from Athens.",
    category: "Sport Climbing",
  },
  {
    title: "Fontainebleau, France",
    content: "The world's most famous bouldering forest with 30,000+ problems on sandstone. Circuit system color-codes difficulty. An hour from Paris by train.",
    category: "Bouldering",
  },
  {
    title: "Indian Creek, Utah",
    content: "Desert crack climbing mecca with perfect parallel-sided sandstone splitters. Bring tape and expect to hand-jam. Best in spring/fall, camping at Creek Pasture.",
    category: "Trad Climbing",
  },
  {
    title: "Chamonix, France",
    content: "Alpine climbing capital at the base of Mont Blanc. The Aiguilles offer world-class granite from single-pitch to multi-day routes. Summer season June-September.",
    category: "Alpine",
  },
  {
    title: "Hueco Tanks, Texas",
    content: "Legendary bouldering on syenite porphyry with unique huecos (pockets). Limited daily permits required. Winter destination with problems from V0 to V15.",
    category: "Bouldering",
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
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday start to match grid labels
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
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
  const [, setLocation] = useLocation();

  // Inline task add state
  const [inlineAddDay, setInlineAddDay] = useState<number | null>(null);
  const [inlineAddTitle, setInlineAddTitle] = useState('');

  // Drag and drop state
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Hide completed toggle
  const [hideCompleted, setHideCompleted] = useState(false);

  // Track recently completed tasks for linger effect (task id -> completion timestamp)
  const [recentlyCompleted, setRecentlyCompleted] = useState<Record<number, number>>({});

  // Note dialog state for habits that require notes
  const [noteDialogHabit, setNoteDialogHabit] = useState<HabitWithData | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Detail dialog state for viewing habit history/notes
  const [detailDialogHabit, setDetailDialogHabit] = useState<HabitWithData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Climbing log dialog state
  const [climbingDialogOpen, setClimbingDialogOpen] = useState(false);

  // Add book dialog state
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);

  // Collapsed goal categories (all collapsed by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [goalsHidden, setGoalsHidden] = useState(true); // Start minimized

  const toggleCategoryCollapse = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Quick add handler - opens inline add for today
  const handleQuickAdd = useCallback(() => {
    setInlineAddDay(week.todayIndex);
    // Focus will happen via autoFocus on the input
  }, [week.todayIndex]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'New task',
      action: handleQuickAdd,
    },
    {
      key: 'h',
      description: 'Go to Habits',
      action: () => setLocation('/habits'),
    },
    {
      key: 'g',
      description: 'Go to Goals',
      action: () => setLocation('/goals'),
    },
    {
      key: 't',
      description: 'Go to Todos',
      action: () => setLocation('/todos'),
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

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

  // Goal milestones for the current week (for Schedule view)
  const { goalsByDate: weekGoalsByDate } = useGoalCalendar(new Date());

  // Yearly goals - show current year, or next year if in December (planning mode)
  const currentYear = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    return month === 11
      ? (now.getFullYear() + 1).toString()
      : now.getFullYear().toString();
  }, []);
  const {
    goals: yearlyGoals,
    goalsByCategory,
    categories: yearlyCategories,
    stats: yearlyStats,
    categoryLabels,
    toggleGoal,
    incrementGoal,
    toggleSubItem,
    claimReward,
    isToggling,
    isIncrementing,
    isClaimingReward,
  } = useYearlyGoals(currentYear);

  // Climbing log hook for quick logging days
  const { quickLogDay, isQuickLogging } = useClimbingLog();

  // Study planner hook for adding books
  const { createBook, isPending } = useStudyPlanner();

  const collapseAllCategories = useCallback(() => {
    setCollapsedCategories(new Set(yearlyCategories));
  }, [yearlyCategories]);

  const expandAllCategories = useCallback(() => {
    setCollapsedCategories(new Set());
  }, []);

  // Handler for viewing habit details (click on habit name, not toggle)
  const handleViewHabitDetail = useCallback((habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setDetailDialogHabit(habit);
      setDetailDialogOpen(true);
    }
  }, [habits]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date, note }: { habitId: number; date: string; note?: string }) => {
      return await apiRequest('/api/habit-logs/toggle', 'POST', { habitId, date, note });
    },
    onMutate: async ({ habitId, date }) => {
      const wasCompleted = completionMap[habitId]?.[date] ?? false;
      return { wasCompleted };
    },
    onSuccess: (_, __, context) => {
      // Only confetti if completing (not uncompleting) AND all habits now done
      if (!context?.wasCompleted) {
        const newCompletedCount = completedTodayCount + 1;
        if (checkAllHabitsComplete(newCompletedCount, todayHabits.length)) {
          triggerConfetti('all_habits_today');
        }
      }
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
    onSuccess: (_, todoId) => {
      // Track for linger effect - will be hidden after 2 seconds
      setRecentlyCompleted(prev => ({ ...prev, [todoId]: Date.now() }));
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to complete task", description: error.message, variant: "destructive" });
    },
  });

  const incrementGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      // Use yearly goals increment endpoint
      return await apiRequest(`/api/yearly-goals/${goalId}/increment`, 'POST', { amount: 1 });
    },
    onSuccess: () => {
      // No confetti for individual increments - save celebration for completion
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goal-calendar'] });
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

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title?: string; dueDate?: string }) => {
      return await apiRequest(`/api/todos/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
      toast({ title: "Task deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    },
  });

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as number;
    const overData = over.data.current as { date: string; dayIndex: number } | undefined;

    if (overData?.date) {
      const task = todos.find(t => t.id === taskId);
      if (task && task.dueDate !== overData.date) {
        updateTodoMutation.mutate({ id: taskId, dueDate: overData.date });
      }
    }
  };

  const activeTask = activeTaskId ? todos.find(t => t.id === activeTaskId) : null;

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

  // All habits shown on dashboard
  const todayHabits = habits;

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


  // Effect to clean up linger entries after 2 seconds
  useEffect(() => {
    const entries = Object.entries(recentlyCompleted);
    if (entries.length === 0) return;

    const now = Date.now();
    const LINGER_MS = 2000;

    // Check if any need cleanup
    const needsCleanup = entries.some(([, timestamp]) => now - timestamp >= LINGER_MS);
    if (needsCleanup) {
      setRecentlyCompleted(prev => {
        const updated: Record<number, number> = {};
        Object.entries(prev).forEach(([id, timestamp]) => {
          if (now - timestamp < LINGER_MS) {
            updated[Number(id)] = timestamp;
          }
        });
        return updated;
      });
    }

    // Set timeout for the next cleanup
    const nextExpiry = entries.reduce((min, [, timestamp]) => {
      const remaining = LINGER_MS - (now - timestamp);
      return remaining > 0 && remaining < min ? remaining : min;
    }, LINGER_MS);

    const timer = setTimeout(() => {
      setRecentlyCompleted(prev => {
        const updated: Record<number, number> = {};
        const checkTime = Date.now();
        Object.entries(prev).forEach(([id, timestamp]) => {
          if (checkTime - timestamp < LINGER_MS) {
            updated[Number(id)] = timestamp;
          }
        });
        return updated;
      });
    }, nextExpiry + 50);

    return () => clearTimeout(timer);
  }, [recentlyCompleted]);

  const todosByDay = useMemo(() => {
    const byDay: Record<number, TodoWithMetadata[]> = {};
    week.dates.forEach((_, i) => { byDay[i] = []; });

    const now = Date.now();
    const LINGER_MS = 2000;

    todos.forEach(todo => {
      if (todo.dueDate) {
        const idx = week.dates.indexOf(todo.dueDate);
        if (idx !== -1) {
          // Filter logic when hideCompleted is on
          if (hideCompleted && todo.completed) {
            // Check if it's still in linger period
            const completedAt = recentlyCompleted[todo.id];
            if (completedAt && now - completedAt < LINGER_MS) {
              // Still lingering - include it but mark for fade-out
              byDay[idx].push(todo);
            }
            // Otherwise skip (already hidden)
          } else {
            byDay[idx].push(todo);
          }
        }
      }
    });
    return byDay;
  }, [todos, week.dates, hideCompleted, recentlyCompleted]);

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

  // Calculate overall day streak (max streak across all habits)
  const dayStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak?.streak ?? h.streak ?? 0));
  }, [habits]);

  const handleToggleHabit = useCallback((habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = completionMap[habitId]?.[todayStr] ?? false;

    // If habit requires note and is not already completed, show the note dialog
    if (habit?.requiresNote && !isCompleted) {
      setNoteDialogHabit(habit);
      setNoteDialogOpen(true);
      return;
    }

    toggleHabitMutation.mutate({ habitId, date: todayStr });
  }, [toggleHabitMutation, todayStr, habits, completionMap]);

  // Handle note dialog submission
  const handleNoteDialogSubmit = useCallback((habitId: number, date: string, note: string) => {
    toggleHabitMutation.mutate({ habitId, date, note });
  }, [toggleHabitMutation]);

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

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex flex-col justify-center pl-6">
        <div className="space-y-4">
          <Link href="/">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              dashboard
            </span>
          </Link>
          <Link href="/habits">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              habits
            </span>
          </Link>
          <Link href="/goals">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              goals
            </span>
          </Link>
          <Link href="/todos">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              todos
            </span>
          </Link>
          <Link href="/journey">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/settings">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Main dashboard content */}
      <div className="relative z-10 px-5 md:px-8 pb-24">
        <div className="max-w-[900px] ml-[188px] space-y-5">

          {/* HEADER: Simplified - Logo + Stats */}
          <header className="flex items-center justify-between mb-6">
            {/* Left: Logo */}
            <h1 className="logo-text tracking-wider">
              GOAL CONNECT
            </h1>

            {/* Center: Habit Orbs (clickable to habits) */}
            <Link href="/habits" className="flex-shrink-0 hover:scale-105 transition-transform">
              <GlowingOrbHabits />
            </Link>

            {/* Right: Stats - subtle, not competing with content */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-[var(--text-muted)]">
                <span className="font-heading text-sm text-peach-400">{xp.toLocaleString()}</span>
                <span className="ml-1 opacity-70">pts</span>
              </div>
              <div className="w-px h-3 bg-white/20" />
              <div className="text-[var(--text-muted)]">
                <span className="font-heading text-sm text-peach-400">{dayStreak}</span>
                <span className="ml-1 opacity-70">streak</span>
              </div>
            </div>
          </header>

          {/* Current Expedition (if active) */}
          <CurrentExpeditionWidget />

          {/* ROW 1: Goals & Deadlines + Deadline Calendar (2 columns) */}
          <div className="card-grid grid grid-cols-2 gap-5">
            {/* All Goals Due This Month */}
            <GoalsDeadlinesWidget
              onIncrement={(id) => incrementGoalMutation.mutate(id)}
              isIncrementing={incrementGoalMutation.isPending}
            />

            {/* Goal Deadline Calendar */}
            <GoalCalendarWidget />
          </div>

          {/* ROW 2: This Week Habits + Dream Scroll (2 columns, tall) */}
          <div className="card-grid grid grid-cols-2 gap-5">
            {/* This Week Habits */}
            <div className="glass-card frost-accent min-h-[320px] flex flex-col">
              <span className="card-title">This Week</span>
              <div className="flex-1">
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
                  onHabitClick={handleViewHabitDetail}
                  className="w-full"
                />
              </div>
            </div>

            {/* Dream Scroll Widget */}
            <div className="min-h-[320px]">
              <DreamScrollWidget />
            </div>
          </div>

          {/* Residency bar - spans full width above ROW 3 */}
          <ResidencyCountdownWidget />

          {/* ROW 3: Milestone Donut + Weekly Rhythm + Destination (3 columns, small) */}
          <div className="card-grid grid grid-cols-3 gap-5">
            {/* Milestone Donut */}
            <MilestoneDonutWidget />

            {/* Weekly Rhythm */}
            <div className="glass-card frost-accent min-h-[200px] flex flex-col">
              <span className="card-title">Weekly Rhythm</span>
              <div className="flex-1 flex items-end">
                <LuxuryWeeklyRhythm data={weeklyRhythm} className="w-full" />
              </div>
            </div>

            {/* Media Library Widget */}
            <MediaWidget />
          </div>

          {/* ROW 4: Yearly Goals (grouped by category) */}
          {yearlyGoals.length > 0 && (
            <div className="glass-card frost-accent">
              <div className={cn("flex items-center justify-between", !goalsHidden && "mb-4")}>
                <button
                  onClick={() => setGoalsHidden(!goalsHidden)}
                  className="flex items-center gap-2 group"
                >
                  {goalsHidden ? (
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                  )}
                  <span className="card-title group-hover:text-peach-400 transition-colors">{currentYear} Goals</span>
                </button>
                <div className="flex items-center gap-3">
                  {!goalsHidden && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={expandAllCategories}
                        className="text-[10px] text-[var(--text-muted)] hover:text-peach-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                      >
                        expand
                      </button>
                      <span className="text-[var(--text-muted)]">·</span>
                      <button
                        onClick={collapseAllCategories}
                        className="text-[10px] text-[var(--text-muted)] hover:text-peach-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                      >
                        collapse
                      </button>
                    </div>
                  )}
                  <Link href="/goals">
                    <span className="text-xs text-peach-400 hover:underline cursor-pointer">
                      {yearlyStats.completedGoals}/{yearlyStats.totalGoals} complete
                    </span>
                  </Link>
                </div>
              </div>
              {!goalsHidden && <div className="space-y-3">
                {yearlyCategories.map((category) => {
                  const isCollapsed = collapsedCategories.has(category);
                  const categoryGoals = goalsByCategory[category];
                  const completedInCategory = categoryGoals.filter(g => g.isCompleted).length;

                  return (
                    <div key={category}>
                      <button
                        onClick={() => toggleCategoryCollapse(category)}
                        className="w-full flex items-center gap-2 py-1.5 text-left group"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                        )}
                        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">
                          {categoryLabels[category] || category}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                          {completedInCategory}/{categoryGoals.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="mt-2">
                          <CompactGoalGrid
                            goals={categoryGoals}
                            onToggle={async (goalId) => {
                              try {
                                await toggleGoal(goalId);
                                triggerConfetti('goal_completed');
                              } catch (err) {
                                toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle goal", variant: "destructive" });
                              }
                            }}
                            onIncrement={async (goalId, amount) => {
                              try {
                                await incrementGoal({ id: goalId, amount });
                              } catch (err) {
                                toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update progress", variant: "destructive" });
                              }
                            }}
                            onLogClimb={() => setClimbingDialogOpen(true)}
                            onAddBook={() => setAddBookDialogOpen(true)}
                            onToggleSubItem={async (goalId, subItemId) => {
                              try {
                                const result = await toggleSubItem({ goalId, subItemId });
                                if (result.isGoalCompleted) {
                                  triggerConfetti('goal_completed');
                                  toast({ title: "Goal completed!", description: "All sub-items are done!" });
                                }
                              } catch (err) {
                                toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle sub-item", variant: "destructive" });
                              }
                            }}
                            onClaimReward={async (goalId) => {
                              try {
                                const result = await claimReward(goalId);
                                triggerConfetti('reward_claimed');
                                toast({ title: "Reward claimed!", description: `+${result.pointsAwarded} XP earned` });
                              } catch (err) {
                                toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to claim reward", variant: "destructive" });
                              }
                            }}
                            isToggling={isToggling}
                            isIncrementing={isIncrementing}
                            isClaimingReward={isClaimingReward}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
            </div>
          )}

          {/* ROW 5: Weekly Schedule (full-width, 7-day tasks with drag-drop) */}
          <div className="glass-card frost-accent min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="card-title">Schedule</span>
                <button
                  onClick={() => setHideCompleted(!hideCompleted)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    hideCompleted
                      ? "text-peach-400 bg-peach-400/10"
                      : "text-[var(--text-muted)] hover:text-peach-400"
                  )}
                  title={hideCompleted ? "Show completed" : "Hide completed"}
                >
                  {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="font-body text-xs text-[var(--text-muted)]">{week.formatRange}</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveTaskId(e.active.id as number)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveTaskId(null)}
            >
              <div className="grid grid-cols-7 gap-2">
                {week.dayNames.map((day, i) => (
                  <DroppableDayColumn
                    key={`${day}-${i}`}
                    dayIndex={i}
                    dayName={day}
                    date={week.dates[i]}
                    isToday={i === week.todayIndex}
                    todos={todosByDay[i] || []}
                    goalMilestones={weekGoalsByDate.get(week.dates[i]) || []}
                    onToggle={handleToggleTodo}
                    onUpdate={(id, title) => updateTodoMutation.mutate({ id, title })}
                    onDelete={(id) => deleteTodoMutation.mutate(id)}
                    onAdd={() => setInlineAddDay(i)}
                    onGoalIncrement={(id) => incrementGoalMutation.mutate(id)}
                    isAddingDay={inlineAddDay}
                    inlineAddTitle={inlineAddTitle}
                    setInlineAddTitle={setInlineAddTitle}
                    setInlineAddDay={setInlineAddDay}
                    onSubmitAdd={(dueDate) => {
                      createTodoMutation.mutate({ title: inlineAddTitle.trim(), dueDate });
                    }}
                    isCreating={createTodoMutation.isPending}
                    isUpdating={updateTodoMutation.isPending}
                    isDeleting={deleteTodoMutation.isPending}
                  />
                ))}
              </div>

              {/* Drag overlay for visual feedback */}
              <DragOverlay>
                {activeTask && (
                  <div className="bg-ice-card/90 p-1 rounded shadow-lg text-[0.65rem] border border-peach-400/50 max-w-[100px] truncate">
                    {activeTask.title}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>

        </div>
      </div>

      {/* FAB for quick task add */}
      <FAB
        onClick={handleQuickAdd}
        className="bg-peach-400 hover:bg-peach-500 text-white"
      />

      {/* Habit Note Dialog */}
      <HabitNoteDialog
        habit={noteDialogHabit}
        date={todayStr}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onSubmit={handleNoteDialogSubmit}
      />

      {/* Habit Detail Dialog - view history and edit notes */}
      <HabitDetailDialog
        habit={detailDialogHabit}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Quick Climbing Day Dialog - log outdoor days */}
      <QuickClimbingDayDialog
        open={climbingDialogOpen}
        onOpenChange={setClimbingDialogOpen}
        onSubmit={async (data) => {
          await quickLogDay(data);
          toast({ title: "Climbing day logged!", description: "Your outdoor day has been recorded" });
          // Invalidate yearly goals to refresh the auto-tracked goal
          queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
        }}
        isSubmitting={isQuickLogging}
      />

      {/* Add Book Dialog - add books to study planner */}
      <AddBookDialog
        open={addBookDialogOpen}
        onOpenChange={setAddBookDialogOpen}
        onSubmit={(data) => {
          createBook(data);
          toast({ title: "Book added!", description: "Your book has been added to the study planner" });
          // Invalidate yearly goals to refresh the auto-tracked goal
          queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
        }}
        isSubmitting={isPending.createBook}
      />
    </div>
  );
}
