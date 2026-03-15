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
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,133,74,0.1)' }}>
          <Flame className="w-5 h-5" style={{ color: '#d4854a' }} />
        </div>
        <p className="font-body text-sm" style={{ color: 'rgba(245,230,208,0.5)' }}>No habits yet</p>
        <Link href="/habits" className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#d4854a' }}>
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
              className="w-4 text-center text-[9px]"
              style={{
                fontFamily: 'var(--font-heading-sc, var(--font-heading, system-ui))',
                color: i === todayIndex ? '#d4854a' : 'rgba(245,230,208,0.4)',
              }}
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
                "text-[11px] truncate text-left flex-1 min-w-0 transition-colors",
                onHabitClick && "cursor-pointer"
              )}
              style={{
                fontFamily: 'var(--font-body, system-ui)',
                color: '#f5e6d0',
              }}
              onMouseEnter={(e) => { if (onHabitClick) (e.target as HTMLElement).style.color = '#d4854a'; }}
              onMouseLeave={(e) => { if (onHabitClick) (e.target as HTMLElement).style.color = '#f5e6d0'; }}
              title={habit.name}
            >
              {habit.name}
            </button>
            {habit.streak && habit.streak > 0 && (
              <span
                className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-medium flex-shrink-0"
                style={{
                  background: habit.streak >= 30 ? 'rgba(212,133,74,0.25)' :
                    habit.streak >= 7 ? 'rgba(212,133,74,0.2)' :
                    'rgba(245,230,208,0.1)',
                  color: habit.streak >= 7 ? '#d4854a' : 'rgba(245,230,208,0.5)',
                }}
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
                  onToggle && "cursor-pointer hover:scale-110"
                )}
                style={{
                  background: day.completed ? '#d4854a' : 'rgba(245,230,208,0.15)',
                  boxShadow: day.completed ? '0 0 8px rgba(212,133,74,0.5)' : 'none',
                  outline: j === todayIndex && !day.completed ? '1px solid rgba(212,133,74,0.5)' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
