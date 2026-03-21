import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { triggerConfetti, checkAllHabitsComplete, shouldCelebrateStreak } from '@/lib/confetti';
import { playCompleteSound, playStreakSound, triggerHaptic } from '@/lib/sounds';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

import type { Habit, HabitLog } from '@shared/schema';
import { XP_CONFIG } from '@shared/xp-config';
import { useYearlyGoals } from '@/hooks/useYearlyGoals';

import { SundownLandscape } from '@/components/sundown/SundownLandscape';
import { SundownHero } from '@/components/sundown/SundownHero';
import { SundownTabDock } from '@/components/sundown/SundownTabDock';
import { SundownCountdown } from '@/components/sundown/SundownCountdown';
import { SundownStardustTrail } from '@/components/sundown/SundownStardustTrail';
import { SundownAuroraReward } from '@/components/sundown/SundownAuroraReward';
import { SundownStardustRing } from '@/components/sundown/SundownStardustRing';
import { SundownMonthlyGoals } from '@/components/sundown/SundownMonthlyGoals';

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
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayIndex = dates.indexOf(todayStr);

    return {
      dates,
      todayIndex: todayIndex === -1 ? 0 : todayIndex,
      todayStr,
    };
  }, []);
}

// ============================================================================
// SUNDOWN DASH
// ============================================================================

export default function SundownDash() {
  const [activeTab, setActiveTab] = useState('Overview');
  const week = useWeekData();
  const { toast } = useToast();

  // ---- Data fetching ----
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs'],
  });

  const { goals } = useYearlyGoals();

  // ---- Habit toggle mutation (with streak + confetti) ----
  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      const res = await apiRequest('POST', `/api/habits/${habitId}/toggle`, { date });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });

      if (data?.completed) {
        playCompleteSound();
        triggerHaptic();

        // Streak milestone check
        const isMilestone = data?.streakDays && shouldCelebrateStreak(data.streakDays);
        if (isMilestone) {
          playStreakSound();
          triggerConfetti('streak_milestone');
          toast({
            title: `${data.streakDays}-day streak milestone!`,
            description: `+${XP_CONFIG.streakMilestone[data.streakDays] || 0} bonus XP`,
          });
        } else {
          const streakText = data.streakDays > 1 ? ` (${data.streakDays}-day streak!)` : '';
          toast({ title: `+${data.pointsEarned || 0} XP${streakText}` });
        }

        // All habits complete check
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayCompleted = habitLogs.filter(
          l => l.date === todayStr && l.completed,
        ).length + 1;
        if (todayCompleted >= habits.length && habits.length > 0) {
          triggerConfetti('all_habits_today');
        }
      }
    },
    onError: () => {
      toast({ title: 'Failed to update habit', variant: 'destructive' });
    },
  });

  const handleToggle = useCallback(
    (habitId: number, date: string) => {
      toggleMutation.mutate({ habitId, date });
    },
    [toggleMutation],
  );

  // ---- Derived data ----
  const todayLogs = useMemo(
    () => habitLogs.filter(l => l.date === week.todayStr),
    [habitLogs, week.todayStr],
  );

  const tasksDone = todayLogs.filter(l => l.completed).length;
  const tasksTotal = habits.length;

  // Completion percentage for the week
  const weekDateSet = useMemo(() => new Set(week.dates), [week.dates]);
  const completionPct = useMemo(() => {
    const weekLogs = habitLogs.filter(l => weekDateSet.has(l.date as string));
    const totalSlots = habits.length * week.dates.length;
    if (totalSlots === 0) return 0;
    const completed = weekLogs.filter(l => l.completed).length;
    return Math.round((completed / totalSlots) * 100);
  }, [habitLogs, habits, week.dates, weekDateSet]);

  // Streak: max consecutive days with all habits done (simple approximation)
  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let d = 0; d < 365; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - d);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayLogs = habitLogs.filter(l => l.date === dateStr && l.completed);
      if (dayLogs.length >= habits.length && habits.length > 0) {
        count++;
      } else if (d > 0) {
        break;
      }
    }
    return count;
  }, [habitLogs, habits]);

  // Map habits for StardusTrail
  const habitCardData = useMemo(
    () => habits.map(h => ({ id: h.id, name: h.title, icon: h.icon })),
    [habits],
  );

  const habitLogCardData = useMemo(
    () =>
      habitLogs.map(l => ({
        habitId: l.habitId,
        date: l.date as string,
        completed: l.completed,
      })),
    [habitLogs],
  );

  // Map yearly goals for MonthlyGoals
  const yearlyGoalsData = useMemo(
    () =>
      goals.map(g => ({
        id: g.id,
        title: g.title,
        current: g.computedValue,
        target: g.targetValue,
        category: g.category || 'Personal',
      })),
    [goals],
  );

  // ---- Render ----
  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: "'Source Sans 3', sans-serif",
        color: 'var(--sd-text-primary)',
        background: '#0a0507',
      }}
    >
      {/* Fixed scenic background + particles + sun glow + lens flares */}
      <SundownLandscape />

      {/* Content wrapper */}
      <div className="sd-content">
        {/* Hero: small title + stat pills */}
        <SundownHero
          tasksDone={tasksDone}
          tasksTotal={tasksTotal}
          streak={streak}
        />

        {/* Residency strip */}
        <SundownCountdown />

        {/* Tab dock */}
        <SundownTabDock activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Arrangement A: 2-column layout */}
        <div className="sd-row">
          <div className="sd-layout-2col">
            {/* Column 1: Stardust Trail habit tracker */}
            <SundownStardustTrail
              habits={habitCardData}
              habitLogs={habitLogCardData}
              weekDates={week.dates}
              todayIndex={week.todayIndex}
              onToggle={handleToggle}
            />

            {/* Column 2: Aurora + Ring stacked */}
            <div className="sd-col-stack">
              <SundownAuroraReward streak={streak} />
              <SundownStardustRing percentage={completionPct} />
            </div>
          </div>

          {/* Monthly Goals Grid — full width below */}
          <SundownMonthlyGoals goals={yearlyGoalsData} />

          {/* Nav links */}
          <div className="sd-nav-row">
            {[
              { href: '/habits', label: 'Habits' },
              { href: '/goals', label: 'Goals' },
              { href: '/analytics', label: 'Analytics' },
              { href: '/adventures', label: 'Adventures' },
              { href: '/wheel', label: 'Wellness' },
              { href: '/settings', label: 'Settings' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="sd-nav-link"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
