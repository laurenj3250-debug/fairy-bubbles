import { cn } from '@/lib/utils';
import { Flame, Plus } from 'lucide-react';
import { Link } from 'wouter';

interface HabitRow {
  id: number;
  name: string;
  streak?: number;
  days: { date: string; completed: boolean }[];
  completed: number;
  total: number;
}

interface LuxuryHabitGridProps {
  habits: HabitRow[];
  dayLabels?: string[];
  todayIndex?: number;
  onToggle?: (habitId: number, date: string) => void;
  onHabitClick?: (habitId: number) => void;
  className?: string;
}

export function LuxuryHabitGrid({
  habits,
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  todayIndex = 0,
  onToggle,
  onHabitClick,
  className,
}: LuxuryHabitGridProps) {
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (habits.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 gap-3", className)}>
        <div className="w-10 h-10 rounded-full bg-[var(--peach-400,#f0a67a)]/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-[var(--peach-400,#f0a67a)]" />
        </div>
        <p className="font-body text-sm text-[var(--text-muted)]">No habits yet</p>
        <Link href="/habits" className="flex items-center gap-1 text-xs text-[var(--peach-400,#f0a67a)] hover:underline">
          <Plus className="w-3 h-3" /> Create your first habit
        </Link>
      </div>
    );
  }

  return (
    <div role="grid" aria-label="Weekly habit tracker" className={cn("space-y-1", className)}>
      {/* Day headers */}
      <div className="flex items-center" role="row">
        <div className="w-[72px] shrink-0" />
        <div className="flex-1 flex justify-between px-1">
          {dayLabels.map((day, i) => (
            <span
              key={i}
              className={cn(
                "w-4 text-center font-heading-sc text-[9px]",
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
          <div className="w-[72px] shrink-0 flex items-center gap-1 pr-1">
            <button
              type="button"
              role="rowheader"
              onClick={() => onHabitClick?.(habit.id)}
              className={cn(
                "font-body text-[11px] text-[var(--text-secondary)] truncate text-left flex-1 min-w-0",
                onHabitClick && "cursor-pointer hover:text-peach-400 transition-colors"
              )}
              title={habit.name}
            >
              {habit.name}
            </button>
            {habit.streak && habit.streak > 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-medium flex-shrink-0",
                  habit.streak >= 30 ? "bg-orange-500/20 text-orange-400" :
                  habit.streak >= 7 ? "bg-amber-500/20 text-amber-400" :
                  "bg-white/10 text-[var(--text-muted)]"
                )}
                title={`${habit.streak} day streak`}
              >
                <Flame className="w-2.5 h-2.5" />
                {habit.streak}
              </span>
            )}
          </div>

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
                  "w-4 h-4 rounded-full transition-all flex items-center justify-center",
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
