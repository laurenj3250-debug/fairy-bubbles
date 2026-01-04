/**
 * ActivityHeatmapWidget
 * Shows 4-week habit completion heatmap
 */

import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface ActivityHeatmapWidgetProps {
  /** Array of 28 intensity levels (0-4), oldest first */
  data: number[];
  className?: string;
}

export function ActivityHeatmapWidget({ data, className }: ActivityHeatmapWidgetProps) {
  const today = new Date();

  // Build 4 weeks of cells
  const weeks: Array<Array<{ date: Date; level: number }>> = [];

  // Find the Sunday of the current week
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());

  // Go back 3 more weeks to get 4 weeks total
  const startSunday = new Date(currentSunday);
  startSunday.setDate(startSunday.getDate() - 21);

  // Map data indices to dates
  for (let w = 0; w < 4; w++) {
    const week: Array<{ date: Date; level: number }> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startSunday);
      date.setDate(startSunday.getDate() + (w * 7) + d);

      // Calculate the index in the data array
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const dataIndex = 27 - daysAgo;

      week.push({
        date,
        level: dataIndex >= 0 && dataIndex < data.length ? data[dataIndex] : 0,
      });
    }
    weeks.push(week);
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div className={cn("glass-card frost-accent", className)}>
      <h3 className="card-title mb-3">Activity</h3>
      <div className="flex flex-col gap-1">
        {/* Day labels */}
        <div className="flex gap-1 justify-end pr-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-4 h-3 text-[9px] text-center text-[var(--text-muted)] font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1 justify-end pr-1">
            {week.map((day, dayIndex) => {
              const isToday = format(day.date, 'yyyy-MM-dd') === todayStr;
              const isFuture = day.date > today;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "w-4 h-4 rounded-sm transition-all",
                    isFuture ? "bg-white/5" :
                    day.level === 0 ? "bg-white/10" :
                    day.level === 1 ? "bg-emerald-500/20" :
                    day.level === 2 ? "bg-emerald-500/40" :
                    day.level === 3 ? "bg-emerald-500/60" :
                    "bg-emerald-500/80",
                    isToday && "ring-1 ring-peach-400"
                  )}
                  title={`${format(day.date, 'MMM d')}: ${isFuture ? 'Future' : `${Math.round((day.level / 4) * 100)}% complete`}`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-2 text-[9px] text-[var(--text-muted)]">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  level === 0 ? "bg-white/10" :
                  level === 1 ? "bg-emerald-500/20" :
                  level === 2 ? "bg-emerald-500/40" :
                  level === 3 ? "bg-emerald-500/60" :
                  "bg-emerald-500/80"
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
