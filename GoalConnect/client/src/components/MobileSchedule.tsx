// client/src/components/MobileSchedule.tsx
import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

interface MobileScheduleProps {
  getTodosForDate: (date: string) => Todo[];
  onToggleTodo: (id: number) => void;
  maxOffset?: number; // Limit navigation range, default ±7
}

export function MobileSchedule({
  getTodosForDate,
  onToggleTodo,
  maxOffset = 7
}: MobileScheduleProps) {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  const threeDays = useMemo(() => {
    const centerDate = addDays(today, offset);
    return [-1, 0, 1].map(dayOffset => {
      const date = addDays(centerDate, dayOffset);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        isToday: dateStr === todayStr,
        todos: getTodosForDate(dateStr),
      };
    });
  }, [offset, today, todayStr, getTodosForDate]);

  const canGoBack = offset > -maxOffset;
  const canGoForward = offset < maxOffset;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canGoBack && setOffset(o => o - 1)}
        disabled={!canGoBack}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          canGoBack
            ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        aria-label="Previous days"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex gap-2 flex-1 overflow-hidden">
        {threeDays.map((day) => (
          <DayCard
            key={day.date}
            {...day}
            onToggle={onToggleTodo}
          />
        ))}
      </div>

      <button
        onClick={() => canGoForward && setOffset(o => o + 1)}
        disabled={!canGoForward}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          canGoForward
            ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
        aria-label="Next days"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

function DayCard({
  date,
  dayName,
  dayNum,
  isToday,
  todos,
  onToggle
}: {
  date: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
  todos: Todo[];
  onToggle: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-xl p-3 min-w-0 transition-colors",
        isToday
          ? "bg-peach-400/10 border border-peach-400/30"
          : "bg-white/5"
      )}
    >
      <div className={cn(
        "text-xs mb-1",
        isToday ? "text-peach-400 font-medium" : "text-[var(--text-muted)]"
      )}>
        {dayName}{isToday && " · Today"}
      </div>
      <div className={cn(
        "text-sm font-semibold mb-2",
        isToday ? "text-peach-400" : "text-white"
      )}>
        {dayNum}
      </div>
      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {todos.slice(0, 4).map(todo => (
          <button
            key={todo.id}
            onClick={() => onToggle(todo.id)}
            className={cn(
              "w-full text-left bg-white/5 rounded-lg px-2 py-2.5 min-h-[44px] text-xs transition-all",
              "hover:bg-white/10 active:scale-[0.98]",
              todo.completed && "line-through opacity-50"
            )}
          >
            {todo.title}
          </button>
        ))}
        {todos.length > 4 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-1">
            +{todos.length - 4} more
          </div>
        )}
        {todos.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-3">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
