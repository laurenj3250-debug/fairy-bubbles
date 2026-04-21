import { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Habit, HabitLog } from '@shared/schema';
import { SundownLandscape } from '@/components/sundown/SundownLandscape';
import { SundownStardustTrail } from '@/components/sundown/SundownStardustTrail';

export default function Fresh() {
  const { toast } = useToast();

  const week = useMemo(() => {
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 0 });
    const we = endOfWeek(now, { weekStartsOn: 0 });
    const dates = eachDayOfInterval({ start: ws, end: we }).map(d => format(d, 'yyyy-MM-dd'));
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayIndex = Math.max(0, dates.indexOf(todayStr));
    return { dates, todayIndex };
  }, []);

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['/api/habits'] });
  const { data: habitLogs = [] } = useQuery<HabitLog[]>({ queryKey: ['/api/habit-logs'] });

  const toggleMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: number; date: string }) =>
      apiRequest('/api/habit-logs/toggle', 'POST', { habitId, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-logs'] });
    },
    onError: () => toast({ title: "Couldn't save that", variant: 'destructive' }),
  });

  const handleToggle = (habitId: number, date: string) => toggleMutation.mutate({ habitId, date });

  const habitCardData = useMemo(
    () => habits.map(h => ({ id: h.id, name: h.title, icon: h.icon, cadence: h.cadence, targetPerWeek: h.targetPerWeek })),
    [habits],
  );

  const habitLogCardData = useMemo(
    () => habitLogs.map(l => ({ habitId: l.habitId, date: l.date as string, completed: l.completed })),
    [habitLogs],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: "'Source Sans 3', sans-serif",
        color: 'var(--sd-text-primary)',
        background: 'var(--sd-bg-deep, #0a0507)',
        position: 'relative',
      }}
    >
      <SundownLandscape />
      <main
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 720 }}>
          <SundownStardustTrail
            habits={habitCardData}
            habitLogs={habitLogCardData}
            weekDates={week.dates}
            todayIndex={week.todayIndex}
            onToggle={handleToggle}
          />
        </div>
      </main>
    </div>
  );
}
