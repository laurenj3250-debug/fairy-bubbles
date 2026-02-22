import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { triggerConfetti, checkAllHabitsComplete, shouldCelebrateStreak } from '@/lib/confetti';
import { playCompleteSound, playStreakSound, triggerHaptic } from '@/lib/sounds';
import { CriticalHit, rollCritical } from '@/components/CriticalHit';
import { TokenCounter } from '@/components/TokenCounter';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CurrentExpeditionWidget from '@/components/CurrentExpeditionWidget';
import { GlowingOrbHabits } from '@/components/GlowingOrbHabits';
import { MountainHero } from '@/components/MountainHero';
import { ForestBackground } from '@/components/ForestBackground';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { HabitNoteDialog } from '@/components/HabitNoteDialog';
import { HabitDetailDialog } from '@/components/HabitDetailDialog';
import { YearlyGoalsSection } from '@/components/dashboard/YearlyGoalsSection';
import { Skeleton } from '@/components/ui/skeleton';

import type { Habit, HabitLog } from '@shared/schema';
import { XP_CONFIG } from '@shared/xp-config';
import { useYearlyGoals } from '@/hooks/useYearlyGoals';
import { useAdventures } from '@/hooks/useAdventures';
import { AdventureModal } from '@/components/adventures/AdventureModal';
import { WeeklyMonthlyGoalsWidget } from '@/components/dashboard/WeeklyMonthlyGoalsWidget';
import { DashboardInsights } from '@/components/dashboard/DashboardInsights';

import { ResidencyCountdownWidget } from '@/components/ResidencyCountdownWidget';
import { MediaWidget } from '@/components/MediaWidget';
import { RecentAdventuresWidget } from '@/components/dashboard/RecentAdventuresWidget';
import { PointsBreakdownPopover } from '@/components/dashboard/PointsBreakdownPopover';
import NextRewardWidget from '@/components/dashboard/NextRewardWidget';

// ============================================================================
// TYPES
// ============================================================================

interface HabitWithData extends Habit {
  streak: number; // API returns streak as a plain number
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
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
  const [location, setLocation] = useLocation();

  // Note dialog state for habits that require notes
  const [noteDialogHabit, setNoteDialogHabit] = useState<HabitWithData | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Detail dialog state for viewing habit history/notes
  const [detailDialogHabit, setDetailDialogHabit] = useState<HabitWithData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Adventure dialog state
  const [adventureDialogOpen, setAdventureDialogOpen] = useState(false);
  const [criticalHit, setCriticalHit] = useState<{ show: boolean; multiplier: number }>({ show: false, multiplier: 1 });

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

  // Adventure hook for full adventure logging

  const { createAdventure, isCreating: isCreatingAdventure } = useAdventures({
    year: currentYear,
    limit: 1
  });

  // Quick outdoor day mutation — one-click, creates outdoor_adventures entry for today
  const quickOutdoorDayMutation = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return await apiRequest('/api/adventures/quick', 'POST', {
        date: today,
        activity: 'Outdoor day',
      });
    },
    onSuccess: (data: any) => {
      playCompleteSound();
      triggerHaptic('light');
      const xpText = data?.pointsEarned ? ` (+${data.pointsEarned} XP)` : '';
      toast({ title: `Outdoor day logged!${xpText}` });
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/adventures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-outdoor-activities'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log outdoor day", description: error.message, variant: "destructive" });
    },
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
    onSuccess: (data: any, _, context) => {
      // Only celebrate if completing (not uncompleting)
      if (!context?.wasCompleted) {
        const isMilestone = data?.streakDays && shouldCelebrateStreak(data.streakDays);

        // Milestone gets its own louder sound; regular completion gets the default
        if (isMilestone) {
          playStreakSound();
          triggerHaptic('heavy');
        } else {
          playCompleteSound();
          triggerHaptic('light');
        }

        // Roll for critical hit (visual only — does not affect actual XP)
        // CriticalHit has its own confetti (150 particles), so skip other confetti if it fires
        const crit = rollCritical();
        const hasCritical = crit.isCritical;
        if (hasCritical) {
          setCriticalHit({ show: true, multiplier: crit.multiplier });
        }

        // All habits done today → confetti (skip if CriticalHit already firing its own)
        if (!hasCritical) {
          if (isMilestone) {
            triggerConfetti('streak_milestone');
          } else {
            const newCompletedCount = completedTodayCount + 1;
            if (checkAllHabitsComplete(newCompletedCount, todayHabits.length)) {
              triggerConfetti('all_habits_today');
            }
          }
        }

        // XP toast on habit completion
        if (data?.pointsEarned > 0) {
          if (isMilestone) {
            const milestoneBonus = XP_CONFIG.streakMilestone[data.streakDays] || 0;
            toast({
              title: `${data.streakDays}-day streak milestone!`,
              description: `+${data.pointsEarned} XP (includes +${milestoneBonus} bonus)`,
            });
          } else {
            const streakText = data.streakDays > 1 ? ` (${data.streakDays}-day streak!)` : '';
            toast({ title: `+${data.pointsEarned} XP${streakText}` });
          }
        }
      }
      // Single shared data source - GlowingOrbHabits also uses this
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points/transactions'] });
      // Yearly goals auto-track from habit_logs — refresh so linked goals update
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
      // Periodic goals compute on read — refetch to show updated weekly/monthly progress
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update habit", description: error.message, variant: "destructive" });
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

  // Calculate overall day streak (max streak across all habits)
  const dayStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak ?? 0));
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

      {/* Main dashboard content */}
      <div className="relative z-10 px-5 md:px-8 pb-24">
        <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-5">

          {/* HEADER: Simplified - Logo + Stats */}
          <header className="flex items-center justify-between mb-6">
            {/* Left: Logo */}
            <h1 className="logo-text tracking-wider">
              GOAL CONNECT
            </h1>

            {/* Center: Habit Orbs (toggle habits directly) */}
            <div className="flex-shrink-0">
              {habitsLoading ? <GlowingOrbsSkeleton /> : <GlowingOrbHabits onToggle={handleToggleHabit} />}
            </div>

            {/* Right: Stats + Residency */}
            <div className="flex items-center gap-4 text-xs">
              <PointsBreakdownPopover>
                <div>
                  <TokenCounter onClick={() => {}} />
                </div>
              </PointsBreakdownPopover>
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

          {/* MAIN GRID: 3 columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* LEFT: Habits - spans 2 columns on desktop */}
            <div className="md:col-span-2 glass-card frost-accent !p-4 !pt-3">
              <span className="card-title !mb-2 !text-sm">This Week</span>
              <div>
                {habitsLoading ? (
                  <HabitsGridSkeleton />
                ) : (
                  <LuxuryHabitGrid
                    habits={todayHabits.map(habit => ({
                      id: habit.id,
                      name: habit.title,
                      streak: habit.streak ?? 0,
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
              <RecentAdventuresWidget onLogAdventure={() => setAdventureDialogOpen(true)} />

              {/* Next Reward */}
              <NextRewardWidget />
            </div>
          </div>

          {/* ROW 2: Weekly & Monthly Goals (full width, compact) */}
          <WeeklyMonthlyGoalsWidget />

          {/* ROW 3: Collapsible Insights (SummitLog + HabitHeatmap + WeeklyRhythm) */}
          <DashboardInsights />

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
                if (type === "quick") {
                  if (!quickOutdoorDayMutation.isPending) quickOutdoorDayMutation.mutate();
                } else {
                  setAdventureDialogOpen(true);
                }
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

      {/* Quick Adventure Dialog */}
      {adventureDialogOpen && (
        <AdventureModal
          adventure={null}
          onClose={() => setAdventureDialogOpen(false)}
          onSubmit={async (input) => {
            try {
              const result = await createAdventure(input);
              setAdventureDialogOpen(false); // Only close on success
              playCompleteSound();
              triggerHaptic('light');
              const xpText = result?.pointsEarned ? ` +${result.pointsEarned} XP` : '';
              toast({ title: `Adventure logged!${xpText}`, description: "Your outdoor adventure has been recorded" });
              queryClient.invalidateQueries({ queryKey: ["/api/points"] });
              queryClient.invalidateQueries({ queryKey: ["/api/recent-outdoor-activities"] });
              queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
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

      {/* Critical Hit overlay — visual-only dopamine on habit completion (25% chance) */}
      <CriticalHit
        show={criticalHit.show}
        multiplier={criticalHit.multiplier}
        onComplete={() => setCriticalHit({ show: false, multiplier: 1 })}
      />

    </div>
  );
}
