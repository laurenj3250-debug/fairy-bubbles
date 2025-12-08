import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';

interface SessionCalendarProps {
  sessions: Array<{ sessionDate: string; problemsSent: number }>;
  className?: string;
}

export function SessionCalendar({ sessions, className }: SessionCalendarProps) {
  // Generate last 12 weeks of dates (84 days)
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 77)); // ~11 weeks ago, start of that week

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

  // Create lookup for session data
  const sessionLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    sessions.forEach(s => {
      const dateKey = s.sessionDate.split('T')[0];
      lookup.set(dateKey, (lookup.get(dateKey) || 0) + s.problemsSent);
    });
    return lookup;
  }, [sessions]);

  // Find max for intensity scaling
  const maxSends = Math.max(...Array.from(sessionLookup.values()), 1);

  const getIntensity = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const sends = sessionLookup.get(dateKey) || 0;
    if (sends === 0) return 0;
    // Scale 1-4 based on relative activity
    return Math.min(4, Math.ceil((sends / maxSends) * 4));
  };

  const intensityColors = [
    'bg-white/5',           // 0: no activity
    'bg-purple-900/50',     // 1: low
    'bg-purple-700/60',     // 2: medium
    'bg-purple-500/70',     // 3: high
    'bg-purple-400',        // 4: very high
  ];

  // Month labels for the weeks
  const getMonthLabels = () => {
    const labels: { month: string; position: number }[] = [];
    let lastMonth = -1;

    calendarData.forEach((week, weekIdx) => {
      const month = week[0].getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: format(week[0], 'MMM'),
          position: weekIdx,
        });
        lastMonth = month;
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
        Session History
      </div>

      {/* Month labels */}
      <div className="flex mb-1 text-[10px] text-muted-foreground/60 relative h-4">
        {monthLabels.map(({ month, position }) => (
          <div
            key={`${month}-${position}`}
            className="absolute"
            style={{ left: `${position * 14 + 4}px` }}
          >
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
              const sends = sessionLookup.get(format(date, 'yyyy-MM-dd')) || 0;
              const isFuture = date > new Date();

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "w-[10px] h-[10px] rounded-[2px] transition-all duration-200",
                    isFuture ? "bg-transparent" : intensityColors[intensity],
                    isToday && "ring-1 ring-purple-400 ring-offset-1 ring-offset-slate-900",
                    intensity > 0 && "hover:scale-150 hover:z-10 cursor-default"
                  )}
                  title={isFuture ? '' : `${format(date, 'MMM d, yyyy')}: ${sends} sends`}
                />
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
        </div>
        <div className="text-[10px] text-muted-foreground">
          {sessions.length} sessions
        </div>
      </div>
    </div>
  );
}
