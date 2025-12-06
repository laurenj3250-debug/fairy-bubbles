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

  // Empty state
  if (habits.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6", className)}>
        <span className="font-heading italic text-sm text-[var(--text-muted)]">
          No habits yet
        </span>
        <span className="font-body text-xs text-[var(--text-muted)] mt-1 opacity-60">
          Add habits to track your week
        </span>
      </div>
    );
  }

  return (
    <div role="grid" aria-label="Weekly habit tracker" className={cn("space-y-3", className)}>
      {/* Day headers */}
      <div className="flex items-center gap-2" role="row">
        <div className="w-20" /> {/* Spacer for habit names */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {dayLabels.map((day, i) => (
            <span
              key={i}
              className={cn(
                "font-heading-sc text-[10px] text-center",
                i === todayIndex ? "text-peach-400" : "text-[var(--text-muted)]"
              )}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="w-10" /> {/* Spacer for count */}
      </div>

      {/* Habit rows */}
      {habits.map((habit, i) => (
        <div key={i} role="row" className="flex items-center gap-2">
          {/* Habit name */}
          <span
            role="rowheader"
            className="w-20 font-body text-xs text-[var(--text-secondary)] truncate"
            title={habit.name}
          >
            {habit.name}
          </span>

          {/* Day circles */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {habit.days.map((day, j) => (
              <button
                key={j}
                type="button"
                onClick={() => onToggle?.(habit.id, day.date)}
                disabled={!onToggle}
                role="gridcell"
                aria-label={`${habit.name} on ${fullDayNames[j]}: ${day.completed ? 'completed' : 'not completed'}`}
                className={cn(
                  "w-3.5 h-3.5 rounded-full mx-auto transition-all habit-circle",
                  day.completed
                    ? "bg-peach-400 shadow-[0_0_6px_rgba(228,168,128,0.4)]"
                    : "bg-white/10 border border-white/5",
                  onToggle && "cursor-pointer hover:scale-125"
                )}
              />
            ))}
          </div>

          {/* Completion count */}
          <span className="w-8 font-heading text-xs text-right text-[var(--text-muted)]">
            {habit.completed}/{habit.total}
          </span>
        </div>
      ))}
    </div>
  );
}
