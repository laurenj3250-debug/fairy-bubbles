import { cn } from '@/lib/utils';

interface HabitRow {
  id: number;
  name: string;
  days: { date: string; completed: boolean }[];
  completed: number;
  total: number;
}

interface LuxuryHabitGridProps {
  habits: HabitRow[];
  dayLabels?: string[];
  todayIndex?: number;
  onToggle?: (habitId: number, date: string) => void;
  className?: string;
}

export function LuxuryHabitGrid({
  habits,
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  todayIndex = 0,
  onToggle,
  className,
}: LuxuryHabitGridProps) {
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (habits.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-3", className)}>
        <span className="font-body text-sm text-[var(--text-muted)]">No habits yet</span>
      </div>
    );
  }

  return (
    <div role="grid" aria-label="Weekly habit tracker" className={cn("space-y-1.5", className)}>
      {/* Day headers */}
      <div className="flex items-center" role="row">
        <div className="w-20 shrink-0" />
        <div className="flex-1 flex justify-between px-1">
          {dayLabels.map((day, i) => (
            <span
              key={i}
              className={cn(
                "w-5 text-center font-heading-sc text-[9px]",
                i === todayIndex ? "text-peach-400" : "text-[var(--text-muted)]"
              )}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Habit rows */}
      {habits.map((habit) => (
        <div key={habit.id} role="row" className="flex items-center">
          <span
            role="rowheader"
            className="w-20 shrink-0 font-body text-[11px] text-[var(--text-secondary)] truncate pr-2"
            title={habit.name}
          >
            {habit.name}
          </span>

          <div className="flex-1 flex justify-between px-1">
            {habit.days.map((day, j) => (
              <button
                key={j}
                type="button"
                onClick={() => onToggle?.(habit.id, day.date)}
                disabled={!onToggle}
                role="gridcell"
                aria-label={`${habit.name} on ${fullDayNames[j]}: ${day.completed ? 'completed' : 'not completed'}`}
                className={cn(
                  "w-5 h-5 rounded-full transition-all flex items-center justify-center",
                  day.completed
                    ? "bg-peach-400 shadow-[0_0_8px_rgba(228,168,128,0.5)]"
                    : "bg-white/15",
                  j === todayIndex && !day.completed && "ring-1 ring-peach-400/50",
                  onToggle && "cursor-pointer hover:scale-110"
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
