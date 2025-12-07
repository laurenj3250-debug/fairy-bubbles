import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface HabitWithData {
  id: number;
  name: string;
  streak?: { streak: number };
}

interface HabitLog {
  habitId: number;
  date: string;
  completed: boolean;
}

export function MountainHero() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [] } = useQuery<HabitWithData[]>({
    queryKey: ['/api/habits-with-data'],
  });

  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habit-logs/range', todayStr, todayStr],
    queryFn: async () => {
      const res = await fetch(`/api/habit-logs/range/${todayStr}/${todayStr}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
  });

  const completedToday = useMemo(() => {
    return todayLogs.filter(log => log.completed).length;
  }, [todayLogs]);

  const totalHabits = habits.length || 5;

  return (
    <div className="relative z-[2] h-[28vh] min-h-[220px] flex flex-col justify-start pt-6">
      {/* Hero title - centered over content area (250px left margin + 750px width) */}
      <div className="ml-[300px] max-w-[750px]">
        <h1 className="font-heading text-[3rem] md:text-[4rem] font-normal text-forest-cream mb-3 tracking-wide relative z-10 text-center italic">
          Your Summit Awaits
        </h1>
        <p className="text-base text-[var(--text-muted)] relative z-10 text-center">
          {completedToday} of {totalHabits} habits complete today. Keep climbing.
        </p>
      </div>
    </div>
  );
}
