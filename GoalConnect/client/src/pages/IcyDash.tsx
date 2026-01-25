import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { triggerConfetti, checkAllHabitsComplete } from '@/lib/confetti';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CurrentExpeditionWidget from '@/components/CurrentExpeditionWidget';
import { GlowingOrbHabits } from '@/components/GlowingOrbHabits';
import { MountainHero } from '@/components/MountainHero';
import { ForestBackground } from '@/components/ForestBackground';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { HabitNoteDialog } from '@/components/HabitNoteDialog';
import { HabitDetailDialog } from '@/components/HabitDetailDialog';
import { QuickClimbingDayDialog } from '@/components/QuickClimbingDayDialog';
import { YearlyGoalsSection } from '@/components/dashboard/YearlyGoalsSection';
import { Skeleton } from '@/components/ui/skeleton';

import type { Habit, HabitLog, Goal } from '@shared/schema';
import { useYearlyGoals } from '@/hooks/useYearlyGoals';
import { useClimbingLog } from '@/hooks/useClimbingLog';
import { useAdventures } from '@/hooks/useAdventures';
import { AdventureModal } from '@/components/adventures/AdventureModal';
import { GoalsDeadlinesWidget } from '@/components/GoalsDeadlinesWidget';
import { MilestoneDonutWidget } from '@/components/MilestoneDonutWidget';
import { ResidencyCountdownWidget } from '@/components/ResidencyCountdownWidget';
import { MediaWidget } from '@/components/MediaWidget';
import { RecentAdventuresWidget } from '@/components/dashboard/RecentAdventuresWidget';

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
// LOADING SKELETONS
// ============================================================================

/** Skeleton for the GlowingOrbHabits - 5 circular orbs */
function GlowingOrbsSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="w-10 h-10 rounded-full" />
      ))}
    </div>
  );
}

/** Skeleton for LuxuryHabitGrid - habit rows with day cells */
function HabitsGridSkeleton() {
  return (
    <div className="space-y-1.5">
      {/* Day headers skeleton */}
      <div className="flex items-center">
        <div className="w-20 shrink-0" />
        <div className="flex-1 flex justify-between px-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="w-5 h-3 rounded" />
          ))}
        </div>
      </div>
      {/* Habit row skeletons (4 habits) */}
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center">
          <div className="w-20 shrink-0 pr-1">
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="flex-1 flex justify-between px-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <Skeleton key={day} className="w-5 h-5 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for YearlyGoalsSection - goal cards with progress */
function YearlyGoalsSkeleton() {
  return (
    <div className="glass-card frost-accent py-3 px-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3.5 h-3.5 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
        </div>
        <Skeleton className="w-8 h-3 rounded" />
      </div>
      {/* Goal cards skeleton (3 cards in a grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
            {/* Progress bar skeleton */}
            <Skeleton className="h-1.5 w-full rounded-full mb-2" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
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

  // Note dialog state for habits that require notes
  const [noteDialogHabit, setNoteDialogHabit] = useState<HabitWithData | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Detail dialog state for viewing habit history/notes
  const [detailDialogHabit, setDetailDialogHabit] = useState<HabitWithData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Climbing log dialog state
  const [climbingDialogOpen, setClimbingDialogOpen] = useState(false);
  const [adventureDialogOpen, setAdventureDialogOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
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

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: habits = [], isLoading: habitsLoading } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/points'],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const { data: weekLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs/range', week.weekStart, week.weekEnd],
    queryFn: async () => {
      const res = await fetch(`/api/habit-logs/range/${week.weekStart}/${week.weekEnd}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });

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
    isLoading: yearlyGoalsLoading,
  } = useYearlyGoals(currentYear);

  // Climbing log hook for quick logging days
  const { quickLogDay, isQuickLogging } = useClimbingLog();

  // Adventure hook for quick logging outdoor adventures
  const { createAdventure, isCreating: isCreatingAdventure } = useAdventures({
    year: currentYear,
    limit: 1
  });

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
      // Single shared data source - GlowingOrbHabits also uses this
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update habit", description: error.message, variant: "destructive" });
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

  // Date-aware toggle handler for LuxuryHabitGrid (checks requiresNote for today only)
  const handleToggleHabitForDate = useCallback((habitId: number, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = completionMap[habitId]?.[date] ?? false;

    // Only show note dialog for today and if habit requires note
    if (date === todayStr && habit?.requiresNote && !isCompleted) {
      setNoteDialogHabit(habit);
      setNoteDialogOpen(true);
      return;
    }

    toggleHabitMutation.mutate({ habitId, date });
  }, [toggleHabitMutation, todayStr, habits, completionMap]);

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
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-[160px] z-20 flex-col justify-center pl-6">
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
          <Link href="/adventures">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              adventures
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
        <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-5">

          {/* HEADER: Simplified - Logo + Stats */}
          <header className="flex items-center justify-between mb-6">
            {/* Left: Logo */}
            <h1 className="logo-text tracking-wider">
              GOAL CONNECT
            </h1>

            {/* Center: Habit Orbs (clickable to habits) */}
            <Link href="/habits" className="flex-shrink-0 hover:scale-105 transition-transform">
              {habitsLoading ? <GlowingOrbsSkeleton /> : <GlowingOrbHabits onToggle={handleToggleHabit} />}
            </Link>

            {/* Right: Stats + Residency */}
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
              <div className="w-px h-3 bg-white/20" />
              <ResidencyCountdownWidget compact />
            </div>
          </header>

          {/* Current Expedition (if active) */}
          <CurrentExpeditionWidget />

          {/* MAIN GRID: 3 columns - Habits (2col) + Right sidebar (1col) */}
          <div className="grid grid-cols-3 gap-5">
            {/* LEFT: Habits - spans 2 columns */}
            <div className="col-span-2 glass-card frost-accent flex flex-col">
              <span className="card-title">This Week</span>
              <div className="flex-1">
                {habitsLoading ? (
                  <HabitsGridSkeleton />
                ) : (
                  <LuxuryHabitGrid
                    habits={todayHabits.map(habit => ({
                      id: habit.id,
                      name: habit.title,
                      streak: habit.streak?.streak ?? 0,
                      days: week.dates.map(date => ({
                        date,
                        completed: completionMap[habit.id]?.[date] ?? false,
                      })),
                      completed: week.dates.filter(date => completionMap[habit.id]?.[date]).length,
                      total: 7,
                    }))}
                    todayIndex={week.todayIndex}
                    onToggle={handleToggleHabitForDate}
                    onHabitClick={handleViewHabitDetail}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR: Stacked widgets */}
            <div className="space-y-4">
              {/* Currently Reading/Watching */}
              <MediaWidget />

              {/* Recent Adventures */}
              <RecentAdventuresWidget />

              {/* Monthly Progress */}
              <MilestoneDonutWidget />
            </div>
          </div>

          {/* ROW 2: Goals Due This Month (full width, compact) */}
          <GoalsDeadlinesWidget
            onIncrement={(id) => incrementGoalMutation.mutate(id)}
            isIncrementing={incrementGoalMutation.isPending}
          />

          {/* ROW 4: Yearly Goals (grouped by category) */}
          {yearlyGoalsLoading ? (
            <YearlyGoalsSkeleton />
          ) : (
            <YearlyGoalsSection
              year={currentYear}
              goals={yearlyGoals}
              goalsByCategory={goalsByCategory}
              categories={yearlyCategories}
              categoryLabels={categoryLabels}
              stats={yearlyStats}
              toggleGoal={toggleGoal}
              incrementGoal={incrementGoal}
              toggleSubItem={toggleSubItem}
              claimReward={claimReward}
              isToggling={isToggling}
              isIncrementing={isIncrementing}
              isClaimingReward={isClaimingReward}
              onLogOutdoorDay={(type) => {
                if (type === "quick") setClimbingDialogOpen(true);
                else setAdventureDialogOpen(true);
              }}
            />
          )}

        </div>
      </div>

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

      {/* Quick Adventure Dialog */}
      {adventureDialogOpen && (
        <AdventureModal
          adventure={null}
          onClose={() => setAdventureDialogOpen(false)}
          onSubmit={async (input) => {
            try {
              await createAdventure(input);
              setAdventureDialogOpen(false); // Only close on success
              toast({ title: "Adventure logged!", description: "Your outdoor adventure has been recorded" });
            } catch (error) {
              toast({
                title: "Failed to log adventure",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive"
              });
              // Don't close - let user retry
              throw error; // Re-throw so AdventureModal's catch block also knows it failed
            }
          }}
          isSubmitting={isCreatingAdventure}
        />
      )}
    </div>
  );
}
