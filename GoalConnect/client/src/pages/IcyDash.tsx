import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { triggerConfetti, checkAllHabitsComplete, shouldCelebrateStreak } from '@/lib/confetti';
import { playCompleteSound, playStreakSound, triggerHaptic } from '@/lib/sounds';
import { CriticalHit, rollCritical } from '@/components/CriticalHit';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LuxuryHabitGrid } from '@/components/LuxuryHabitGrid';
import { HabitNoteDialog } from '@/components/HabitNoteDialog';
import { HabitDetailDialog } from '@/components/HabitDetailDialog';
import { ProgressRing } from '@/components/ProgressRing';

import type { Habit, HabitLog } from '@shared/schema';
import { XP_CONFIG } from '@shared/xp-config';
import { useYearlyGoals, type YearlyGoalWithProgress } from '@/hooks/useYearlyGoals';
import { useAdventures } from '@/hooks/useAdventures';
import { AdventureModal } from '@/components/adventures/AdventureModal';
import { WeeklyMonthlyGoalsWidget } from '@/components/dashboard/WeeklyMonthlyGoalsWidget';

import { ResidencyCountdownWidget } from '@/components/ResidencyCountdownWidget';
import { MediaWidget } from '@/components/MediaWidget';
import { RecentAdventuresWidget } from '@/components/dashboard/RecentAdventuresWidget';
import NextRewardWidget from '@/components/dashboard/NextRewardWidget';
import { WellnessWheelWidget } from '@/components/dashboard/WellnessWheelWidget';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface HabitWithData extends Habit {
  streak: number;
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

interface UserPoints {
  available: number;
  total: number;
  spent: number;
}

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/habits', label: 'Habits' },
  { path: '/goals', label: 'Goals' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/adventures', label: 'Adventures' },
  { path: '/dream-scroll', label: 'Wishlist' },
  { path: '/wheel', label: 'Wellness' },
  { path: '/settings', label: 'Settings' },
];

// ============================================================================
// DATE UTILITIES
// ============================================================================

function useWeekData() {
  return useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
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
// TIME-OF-DAY HELPER
// ============================================================================

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getNextMilestone(streak: number): string {
  const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  for (const m of milestones) {
    if (streak < m) return `${m} days`;
  }
  return 'legend status';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardV4() {
  const { toast } = useToast();
  const week = useWeekData();
  const [location] = useLocation();
  const [, setLocation] = useLocation();

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

  const { data: points } = useQuery<UserPoints>({
    queryKey: ['/api/points'],
  });

  // Yearly goals
  const currentYear = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    return month === 11
      ? (now.getFullYear() + 1).toString()
      : now.getFullYear().toString();
  }, []);
  const {
    goals: yearlyGoals,
    isLoading: yearlyGoalsLoading,
  } = useYearlyGoals(currentYear);

  // Streak freezes for shield display
  const { data: freezeData } = useQuery<{ freezeCount: number; maxFreezes: number }>({
    queryKey: ['/api/streak-freezes'],
  });

  // Adventure hook for full adventure logging
  const { createAdventure, isCreating: isCreatingAdventure } = useAdventures({
    year: currentYear,
    limit: 1
  });

  // Quick outdoor day mutation
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

  // Handler for viewing habit details
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
      if (!context?.wasCompleted) {
        const isMilestone = data?.streakDays && shouldCelebrateStreak(data.streakDays);

        if (isMilestone) {
          playStreakSound();
          triggerHaptic('heavy');
        } else {
          playCompleteSound();
          triggerHaptic('light');
        }

        const crit = rollCritical();
        const hasCritical = crit.isCritical;
        if (hasCritical) {
          setCriticalHit({ show: true, multiplier: crit.multiplier });
        }

        if (!hasCritical) {
          if (isMilestone) {
            triggerConfetti('streak_milestone');
          } else {
            const newCompletedCount = context?.wasCompleted
              ? completedTodayCount - 1
              : completedTodayCount + 1;
            if (checkAllHabitsComplete(newCompletedCount, habits.length)) {
              triggerConfetti('all_habits_today');
            }
          }
        }

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
      queryClient.invalidateQueries({ queryKey: ['/api/habits-with-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs/range'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
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

  const completedTodayCount = useMemo(() => {
    return habits.filter(h => completionMap[h.id]?.[todayStr]).length;
  }, [habits, completionMap, todayStr]);

  const luxuryHabits = useMemo(() =>
    habits.map(habit => ({
      id: habit.id,
      name: habit.title,
      streak: habit.streak ?? 0,
      days: week.dates.map(date => ({
        date,
        completed: completionMap[habit.id]?.[date] ?? false,
      })),
      completed: week.dates.filter(date => completionMap[habit.id]?.[date]).length,
      total: 7,
    })),
    [habits, completionMap, week.dates]
  );

  // Max streak across all habits
  const dayStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak ?? 0));
  }, [habits]);

  const handleToggleHabit = useCallback((habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = completionMap[habitId]?.[todayStr] ?? false;

    if (habit?.requiresNote && !isCompleted) {
      setNoteDialogHabit(habit);
      setNoteDialogOpen(true);
      return;
    }

    toggleHabitMutation.mutate({ habitId, date: todayStr });
  }, [toggleHabitMutation, todayStr, habits, completionMap]);

  const handleNoteDialogSubmit = useCallback((habitId: number, date: string, note: string) => {
    toggleHabitMutation.mutate({ habitId, date, note });
  }, [toggleHabitMutation]);

  const handleToggleHabitForDate = useCallback((habitId: number, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = completionMap[habitId]?.[date] ?? false;

    if (date === todayStr && habit?.requiresNote && !isCompleted) {
      setNoteDialogHabit(habit);
      setNoteDialogOpen(true);
      return;
    }

    toggleHabitMutation.mutate({ habitId, date });
  }, [toggleHabitMutation, todayStr, habits, completionMap]);

  const handleAdventureSubmit = useCallback(async (input: any) => {
    try {
      const result = await createAdventure(input);
      setAdventureDialogOpen(false);
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
      throw error;
    }
  }, [createAdventure, toast]);

  // Top 4 yearly goals by progress (incomplete, non-zero progress first, then any)
  const topGoals = useMemo(() => {
    if (!yearlyGoals || yearlyGoals.length === 0) return [];
    const incomplete = yearlyGoals
      .filter((g: YearlyGoalWithProgress) => !g.completed)
      .sort((a: YearlyGoalWithProgress, b: YearlyGoalWithProgress) => b.progressPercent - a.progressPercent);
    return incomplete.slice(0, 4);
  }, [yearlyGoals]);

  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const completionPercentage = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;
  const xpTotal = points?.available ?? 0;
  const nextMilestone = getNextMilestone(dayStreak);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: '#1a1210' }}>

      {/* HERO BANNER - 150px */}
      <div className="relative h-[150px] flex-shrink-0 overflow-hidden">
        {/* Dark warm base */}
        <div className="absolute inset-0" style={{
          background: '#1a1210',
        }} />
        {/* Desert hero image — object-position bottom to show the landscape, not the white sky */}
        <img
          src="/backgrounds/desert-hero.png"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            zIndex: 1,
            objectFit: 'cover',
            objectPosition: 'center 75%',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Gradient overlays to blend image edges into dark base */}
        <div className="absolute inset-0" style={{
          zIndex: 2,
          background: `
            linear-gradient(to bottom, #1a1210 0%, transparent 30%, transparent 70%, #1a1210 100%),
            linear-gradient(to right, #1a1210 0%, transparent 15%, transparent 85%, #1a1210 100%)
          `,
        }} />
        {/* Content overlay */}
        <div className="relative h-full flex items-center justify-between px-8" style={{ zIndex: 10 }}>
          <div>
            <h1 className="text-lg tracking-[3px] uppercase" style={{ color: '#d4854a', fontFamily: 'var(--font-heading, system-ui)', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              Goal Connect
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,230,208,0.6)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              Good {timeOfDay}, Lauren
            </p>
          </div>
          <div className="text-center">
            <h2 className="text-3xl" style={{
              color: '#f5e6d0',
              fontFamily: 'var(--font-heading, system-ui)',
              fontWeight: 700,
              textShadow: '0 2px 24px rgba(0,0,0,0.8), 0 0 60px rgba(26,18,16,0.6)',
            }}>
              Your Summit Awaits
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(245,230,208,0.7)', textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}>
              {completedTodayCount} of {habits.length} habits complete today
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* XP pill */}
            <div className="px-3 py-1.5 rounded-full text-xs" style={{
              background: 'rgba(26,18,16,0.5)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(245,230,208,0.7)',
            }}>
              <span className="font-bold text-sm" style={{ color: '#d4854a' }}>{xpTotal}</span> XP
            </div>
            {/* Streak pill */}
            <div className="px-3 py-1.5 rounded-full text-xs" style={{
              background: 'rgba(26,18,16,0.5)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(245,230,208,0.7)',
            }}>
              <span className="font-bold text-sm" style={{ color: '#d4854a' }}>{dayStreak}</span> days
              {freezeData && freezeData.freezeCount > 0 && (
                <span className="ml-1 text-[10px]" style={{ color: 'rgba(147,197,253,0.7)' }}>
                  +{freezeData.freezeCount} shield{freezeData.freezeCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {/* Residency */}
            <ResidencyCountdownWidget compact />
          </div>
        </div>
      </div>

      {/* NAV BAR - 36px */}
      <nav className="h-9 flex-shrink-0 flex items-center justify-center" style={{
        background: 'rgba(26,18,16,0.6)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(212,133,74,0.1)',
      }}>
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(26,18,16,0.5)' }}>
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "px-3.5 py-1 rounded-md text-xs font-medium transition-all",
                )}
                style={{
                  background: isActive ? 'rgba(212,133,74,0.3)' : 'transparent',
                  color: isActive ? '#f5e6d0' : 'rgba(245,230,208,0.4)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MAIN TWO COLUMNS */}
      <div className="flex-1 min-h-0 grid gap-3 p-3 pb-2" style={{ gridTemplateColumns: '55fr 45fr' }}>

        {/* LEFT: Habits */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Habits card */}
          <div className="flex-1 min-h-0 rounded-2xl p-3 flex flex-col" style={{
            background: 'rgba(30,20,14,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,140,70,0.12)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl" style={{ color: '#f5e6d0', fontFamily: 'var(--font-heading, system-ui)', fontWeight: 700 }}>
                This Week
              </h3>
              {habits.length > 0 && (
                <div className="flex items-center gap-2">
                  <ProgressRing
                    progress={completionPercentage}
                    size={36}
                    strokeWidth={2.5}
                    color="#d4854a"
                    trackColor="rgba(200,140,70,0.12)"
                  >
                    <span className="text-[9px] font-bold" style={{ color: '#d4854a' }}>
                      {completedTodayCount}/{habits.length}
                    </span>
                  </ProgressRing>
                  <span className="text-[10px]" style={{ color: 'rgba(245,230,208,0.4)' }}>
                    {completedTodayCount === habits.length ? 'All done!' : `${habits.length - completedTodayCount} left`}
                  </span>
                </div>
              )}
            </div>
            {/* The habit grid */}
            <div className="flex-1 min-h-0">
              {habitsLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-6 rounded" style={{ background: 'rgba(200,140,70,0.08)' }} />
                  ))}
                </div>
              ) : (
                <LuxuryHabitGrid
                  habits={luxuryHabits}
                  todayIndex={week.todayIndex}
                  onToggle={handleToggleHabitForDate}
                  onHabitClick={handleViewHabitDetail}
                  className="w-full"
                />
              )}
            </div>
          </div>
          {/* Streak strip */}
          <div className="rounded-xl px-4 py-2 flex items-center justify-between" style={{
            background: 'rgba(30,20,14,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,140,70,0.12)',
          }}>
            <span className="text-xs" style={{ color: 'rgba(245,230,208,0.6)' }}>
              <strong style={{ color: '#d4854a' }}>{dayStreak} days strong</strong> — next milestone: {nextMilestone}
            </span>
            {/* Milestone dots */}
            <div className="flex gap-1">
              {[7, 14, 21, 30].map(m => (
                <div
                  key={m}
                  className="w-2 h-2 rounded-full"
                  title={`${m}-day milestone`}
                  style={{
                    background: dayStreak >= m ? '#d4854a' : 'rgba(200,140,70,0.15)',
                    boxShadow: dayStreak >= m ? '0 0 6px rgba(212,133,74,0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Goals */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Yearly goals */}
          <div className="flex-1 min-h-0 rounded-2xl p-3 flex flex-col" style={{
            background: 'rgba(30,20,14,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,140,70,0.12)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl" style={{ color: '#f5e6d0', fontFamily: 'var(--font-heading, system-ui)', fontWeight: 700 }}>
                Goals
              </h3>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(245,230,208,0.3)' }}>
                {currentYear}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
              {yearlyGoalsLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: 'rgba(200,140,70,0.06)' }}>
                    <div className="h-[52px] w-[52px] rounded-full mx-auto mb-2" style={{ background: 'rgba(200,140,70,0.1)' }} />
                    <div className="h-3 rounded" style={{ background: 'rgba(200,140,70,0.08)' }} />
                  </div>
                ))
              ) : topGoals.length > 0 ? (
                topGoals.map((goal) => (
                  <div key={goal.id} className="rounded-xl p-3 flex flex-col items-center justify-center" style={{
                    background: 'rgba(200,140,70,0.06)',
                    border: '1px solid rgba(200,140,70,0.08)',
                  }}>
                    <ProgressRing
                      progress={goal.progressPercent}
                      size={52}
                      strokeWidth={3}
                      color="#d4854a"
                      trackColor="rgba(200,140,70,0.12)"
                    >
                      <span className="text-[10px] font-bold" style={{ color: '#d4854a' }}>
                        {goal.progressPercent}%
                      </span>
                    </ProgressRing>
                    <p className="text-xs mt-2 text-center truncate w-full" style={{ color: '#f5e6d0' }}>
                      {goal.title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(245,230,208,0.4)' }}>
                      {goal.computedValue}/{goal.targetValue}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'rgba(245,230,208,0.3)' }}>No goals yet</p>
                </div>
              )}
            </div>
          </div>
          {/* Monthly/Weekly goals */}
          <div className="rounded-2xl overflow-hidden max-h-[200px]" style={{
            background: 'rgba(30,20,14,0.6)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(200,140,70,0.12)',
          }}>
            <div className="overflow-auto max-h-[200px] p-3">
              <WeeklyMonthlyGoalsWidget />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP - 64px */}
      <div className="h-16 flex-shrink-0 grid grid-cols-4 gap-2 px-3 pb-2">
        {/* Wellness mini */}
        <div className="rounded-xl overflow-hidden flex items-center justify-center px-3" style={{
          background: 'rgba(30,20,14,0.6)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,140,70,0.12)',
        }}>
          <Link href="/wheel" className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{
              background: 'rgba(212,133,74,0.15)',
            }}>
              <span role="img" aria-label="wellness">&#x2728;</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate" style={{ color: '#f5e6d0' }}>Wellness</p>
              <p className="text-[9px]" style={{ color: 'rgba(245,230,208,0.4)' }}>Check in</p>
            </div>
          </Link>
        </div>
        {/* Media mini */}
        <div className="rounded-xl overflow-hidden flex items-center justify-center px-3" style={{
          background: 'rgba(30,20,14,0.6)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,140,70,0.12)',
        }}>
          <Link href="/media" className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{
              background: 'rgba(212,133,74,0.15)',
            }}>
              <span role="img" aria-label="media">&#x1F4DA;</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate" style={{ color: '#f5e6d0' }}>Reading</p>
              <p className="text-[9px]" style={{ color: 'rgba(245,230,208,0.4)' }}>Current media</p>
            </div>
          </Link>
        </div>
        {/* Adventures mini */}
        <div className="rounded-xl overflow-hidden flex items-center justify-center px-3" style={{
          background: 'rgba(30,20,14,0.6)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,140,70,0.12)',
        }}>
          <button
            onClick={() => setAdventureDialogOpen(true)}
            className="flex items-center gap-2 w-full text-left"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{
              background: 'rgba(212,133,74,0.15)',
            }}>
              <span role="img" aria-label="adventures">&#x26F0;&#xFE0F;</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate" style={{ color: '#f5e6d0' }}>Adventures</p>
              <p className="text-[9px]" style={{ color: 'rgba(245,230,208,0.4)' }}>Log outdoor day</p>
            </div>
          </button>
        </div>
        {/* Next Reward mini */}
        <div className="rounded-xl overflow-hidden flex items-center justify-center px-3" style={{
          background: 'rgba(30,20,14,0.6)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,140,70,0.12)',
        }}>
          <Link href="/rewards" className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{
              background: 'rgba(212,133,74,0.15)',
            }}>
              <span role="img" aria-label="reward">&#x1F381;</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate" style={{ color: '#f5e6d0' }}>Rewards</p>
              <p className="text-[9px]" style={{ color: 'rgba(245,230,208,0.4)' }}>{xpTotal} XP available</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Modals - rendered but hidden */}
      <HabitNoteDialog
        habit={noteDialogHabit}
        date={todayStr}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onSubmit={handleNoteDialogSubmit}
      />

      <HabitDetailDialog
        habit={detailDialogHabit}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {adventureDialogOpen && (
        <AdventureModal
          adventure={null}
          onClose={() => setAdventureDialogOpen(false)}
          onSubmit={handleAdventureSubmit}
          isSubmitting={isCreatingAdventure}
        />
      )}

      <CriticalHit
        show={criticalHit.show}
        multiplier={criticalHit.multiplier}
        onComplete={() => setCriticalHit({ show: false, multiplier: 1 })}
      />
    </div>
  );
}
