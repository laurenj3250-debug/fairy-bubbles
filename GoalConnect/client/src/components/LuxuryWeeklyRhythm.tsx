import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  height: number;
  isToday: boolean;
}

interface LuxuryWeeklyRhythmProps {
  data: DayData[];
  className?: string;
}

export function LuxuryWeeklyRhythm({ data, className }: LuxuryWeeklyRhythmProps) {
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // If no data or empty, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32", className)}>
        <span className="font-body text-sm text-[var(--text-muted)]">No data yet</span>
      </div>
    );
  }

  return (
    <div role="group" aria-label="Weekly activity chart" className={cn("flex flex-col", className)}>
      {/* Bars container */}
      <div className="flex items-end justify-around h-28 mb-2 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center justify-end h-full">
            {/* Bar */}
            <div
              role="presentation"
              aria-label={`${fullDayNames[i] || item.day}: ${item.height}% activity${item.isToday ? ' (today)' : ''}`}
              className={cn(
                "w-6 rounded-t-lg transition-all duration-300",
                item.isToday && "shadow-[0_0_12px_rgba(228,168,128,0.5)]"
              )}
              style={{
                height: `${Math.max(item.height, 15)}%`,
                background: item.isToday
                  ? 'linear-gradient(to top, #d4936a, #e4a880)'
                  : item.height > 0
                    ? 'linear-gradient(to top, #e4a880, #f0c9ae)'
                    : 'rgba(228, 168, 128, 0.2)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Baseline */}
      <div className="h-px bg-white/20 mx-2" />

      {/* Day labels */}
      <div className="flex justify-around mt-2 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={cn(
              "w-6 text-center font-heading-sc text-[10px] tracking-wide",
              item.isToday ? "text-peach-400" : "text-[var(--text-muted)]"
            )}
          >
            {item.day}
          </span>
        ))}
      </div>
    </div>
  );
}
