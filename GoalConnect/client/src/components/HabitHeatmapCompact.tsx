import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HabitHeatmapCompactProps {
  history: Array<{ date: string; completed: boolean }>;
  className?: string;
  onDayClick?: (date: string) => void;
}

/**
 * Compact 4-week calendar heatmap for habit cards
 * Shows S M T W T F S as columns, weeks as rows (like the uHabit style)
 */
export function HabitHeatmapCompact({ history, className, onDayClick }: HabitHeatmapCompactProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Build a map for quick lookup
  const completionMap = new Map<string, boolean>();
  history.forEach(h => completionMap.set(h.date, h.completed));

  // Generate 4 weeks ending with current week
  // Find the Sunday of the current week
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());

  // Go back 3 more weeks to get 4 weeks total
  const startSunday = new Date(currentSunday);
  startSunday.setDate(startSunday.getDate() - 21);

  const weeks: Array<Array<{ date: string; dateObj: Date; completed: boolean | null; isToday: boolean }>> = [];

  let weekStart = new Date(startSunday);
  for (let w = 0; w < 4; w++) {
    const week: Array<{ date: string; dateObj: Date; completed: boolean | null; isToday: boolean }> = [];

    for (let d = 0; d < 7; d++) {
      const dateObj = new Date(weekStart);
      dateObj.setDate(weekStart.getDate() + d);
      const dateStr = dateObj.toISOString().split('T')[0];
      const isFuture = dateObj > today;

      week.push({
        date: dateStr,
        dateObj,
        completed: isFuture ? null : (completionMap.get(dateStr) ?? false),
        isToday: dateStr === todayStr,
      });
    }

    weeks.push(week);
    weekStart.setDate(weekStart.getDate() + 7);
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-1", className)}>
        {/* Day labels */}
        <div className="flex gap-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-5 h-4 text-[10px] text-center text-foreground/40 font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks (rows) */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (day.completed !== null && onDayClick) {
                        onDayClick(day.date);
                      }
                    }}
                    disabled={day.completed === null}
                    className={cn(
                      "w-5 h-5 rounded-sm transition-all",
                      day.completed === null
                        ? "bg-foreground/5 cursor-not-allowed" // Future date
                        : "cursor-pointer",
                      day.completed === true && "bg-primary hover:bg-primary/80", // Completed
                      day.completed === false && "bg-foreground/10 hover:bg-foreground/20", // Missed
                      day.isToday && "ring-2 ring-accent ring-offset-1 ring-offset-background"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">
                    {day.completed === null
                      ? "Future"
                      : day.completed
                        ? "Completed"
                        : "Missed"}
                  </p>
                  <p className="text-foreground/60">
                    {day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
