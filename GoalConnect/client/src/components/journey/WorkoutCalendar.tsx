import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Flame } from 'lucide-react';

interface WorkoutCalendarProps {
  workouts: Array<{
    workoutDate: string;
    totalVolume: number;
    hasPR?: boolean;
  }>;
  className?: string;
}

export function WorkoutCalendar({ workouts, className }: WorkoutCalendarProps) {
  // Generate last 12 weeks of dates
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 77));

    const weeks: Date[][] = [];
    let currentDate = startDate;

    for (let w = 0; w < 12; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(currentDate);
        currentDate = addDays(currentDate, 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, []);

  // Create lookup for workout data
  const workoutLookup = useMemo(() => {
    const lookup = new Map<string, { volume: number; hasPR: boolean }>();
    workouts.forEach(w => {
      const dateKey = w.workoutDate.split('T')[0];
      lookup.set(dateKey, {
        volume: w.totalVolume,
        hasPR: w.hasPR || false,
      });
    });
    return lookup;
  }, [workouts]);

  // Find max for intensity scaling
  const maxVolume = Math.max(...workouts.map(w => w.totalVolume), 1);

  const getIntensity = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const data = workoutLookup.get(dateKey);
    if (!data) return 0;
    return Math.min(4, Math.ceil((data.volume / maxVolume) * 4));
  };

  const hasPR = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return workoutLookup.get(dateKey)?.hasPR || false;
  };

  const intensityColors = [
    'bg-white/5',
    'bg-purple-900/50',
    'bg-purple-700/60',
    'bg-purple-500/70',
    'bg-orange-400/80',
  ];

  const getMonthLabels = () => {
    const labels: { month: string; position: number }[] = [];
    let lastMonth = -1;

    calendarData.forEach((week, weekIdx) => {
      const month = week[0].getMonth();
      if (month !== lastMonth) {
        labels.push({ month: format(week[0], 'MMM'), position: weekIdx });
        lastMonth = month;
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">
        Workout History
      </div>

      {/* Month labels */}
      <div className="flex mb-1 text-[10px] text-muted-foreground/60 relative h-4">
        {monthLabels.map(({ month, position }) => (
          <div key={`${month}-${position}`} className="absolute" style={{ left: `${position * 14 + 4}px` }}>
            {month}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-[2px] relative pt-4">
        {calendarData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[2px]">
            {week.map((date, dayIdx) => {
              const intensity = getIntensity(date);
              const isToday = isSameDay(date, new Date());
              const isPRDay = hasPR(date);
              const isFuture = date > new Date();

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "w-[10px] h-[10px] rounded-[2px] transition-all duration-200 relative",
                    isFuture ? "bg-transparent" : intensityColors[intensity],
                    isToday && "ring-1 ring-purple-400 ring-offset-1 ring-offset-slate-900",
                    intensity > 0 && "hover:scale-150 hover:z-10 cursor-default"
                  )}
                  title={isFuture ? '' : `${format(date, 'MMM d')}: ${workoutLookup.get(format(date, 'yyyy-MM-dd'))?.volume || 0} lbs`}
                >
                  {isPRDay && !isFuture && (
                    <Flame className="absolute -top-1 -right-1 w-2 h-2 text-amber-400" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={cn("w-[10px] h-[10px] rounded-[2px]", color)} />
          ))}
          <span>More</span>
          <Flame className="w-3 h-3 text-amber-400 ml-2" />
          <span>PR</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {workouts.length} workouts
        </div>
      </div>
    </div>
  );
}
