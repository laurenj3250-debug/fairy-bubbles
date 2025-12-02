import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import type { Habit } from '@shared/schema';

interface HabitWithData extends Habit {
  streak: { streak: number };
  weeklyCompletion: number;
  history: Array<{ date: string; completed: boolean }>;
}

interface HabitGridProps {
  habits: HabitWithData[];
  dates: string[];
  dayNames: string[];
  dayNamesShort: string[];
  todayIndex: number;
  completionMap: Record<number, Record<string, boolean>>;
  isMobile: boolean;
  isScheduledForDay: (habit: HabitWithData, dayIndex: number) => boolean;
  onToggleHabit: (habitId: number, date: string) => void;
  isPending?: boolean;
}

export function HabitGrid({
  habits,
  dates,
  dayNames,
  dayNamesShort,
  todayIndex,
  completionMap,
  isMobile,
  isScheduledForDay,
  onToggleHabit,
  isPending = false,
}: HabitGridProps) {
  return (
    <div style={{ minWidth: isMobile ? '500px' : 'auto' }}>
      {/* Header Row */}
      <div className="flex mb-2">
        <div className={cn("flex-shrink-0", isMobile ? "w-24" : "w-36")} />
        {dayNames.map((day, i) => (
          <div
            key={day}
            className={cn(
              "flex-1 text-center",
              i === todayIndex ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="text-xs font-semibold">
              {isMobile ? dayNamesShort[i] : day}
            </div>
            <div className={cn(
              "text-sm font-bold mt-1",
              i === todayIndex ? "text-primary" : "text-foreground"
            )}>
              {new Date(dates[i]).getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Habit Rows */}
      {habits.map(habit => (
        <div key={habit.id} className="flex items-center mb-1.5">
          <Link href="/habits" className={cn(
            "flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer",
            isMobile ? "w-24" : "w-36"
          )}>
            <span className="text-base">{habit.icon}</span>
            <span className="text-sm text-foreground truncate" title={habit.title}>
              {habit.title}
            </span>
            {/* Climbing grade badge */}
            {habit.grade && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium hidden md:inline">
                {habit.grade}
              </span>
            )}
          </Link>

          {dates.map((date, i) => {
            const showOnDay = isScheduledForDay(habit, i);
            const isCompleted = completionMap[habit.id]?.[date] ?? false;
            const isToday = i === todayIndex;

            return (
              <div key={date} className="flex-1 flex justify-center py-1">
                {showOnDay ? (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggleHabit(habit.id, date)}
                    disabled={isPending}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      isCompleted
                        ? "bg-gradient-to-br from-success to-success/80 text-white shadow-lg shadow-success/30"
                        : isToday
                          ? "border-2 border-primary bg-primary/5"
                          : "border-2 border-border bg-card"
                    )}
                  >
                    {isCompleted && '✓'}
                  </motion.button>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-muted/30" />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No habits yet. Start your climb! 🧗</p>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
export function HabitGridSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ minWidth: isMobile ? '500px' : 'auto' }}>
      {/* Header skeleton */}
      <div className="flex mb-2">
        <div className={cn("flex-shrink-0", isMobile ? "w-24" : "w-36")} />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="h-3 w-6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Row skeletons */}
      {[...Array(4)].map((_, rowIdx) => (
        <div key={rowIdx} className="flex items-center mb-1.5">
          <div className={cn("flex-shrink-0 flex items-center gap-2", isMobile ? "w-24" : "w-36")}>
            <div className="w-6 h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex justify-center py-1">
              <div className="w-8 h-8 bg-muted animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
