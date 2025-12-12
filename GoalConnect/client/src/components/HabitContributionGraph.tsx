import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionDay {
  date: string;
  completed: boolean;
  count?: number; // For all-habits view: count of habits completed
}

interface HabitContributionGraphProps {
  /** Array of completion data */
  history: ContributionDay[];
  /** Number of weeks to display (default: 12) */
  weeks?: number;
  /** Title shown above the graph */
  title?: string;
  /** Show month labels */
  showMonthLabels?: boolean;
  /** Color scheme */
  colorScheme?: "default" | "fire" | "ocean";
  /** Callback when a day cell is clicked (enables interactive mode) */
  onDayClick?: (date: string) => void;
  /** Currently selected date (for highlighting) */
  selectedDate?: string | null;
}

/**
 * GitHub-style Contribution Graph for Habits
 *
 * Inspired by GitHub's contribution graph - shows consistency at a glance.
 * Each cell represents a day, with color intensity showing completion.
 *
 * Psychology applied:
 * - Visual Progress: Patterns are immediately recognizable
 * - Loss Aversion: Empty cells create urgency to fill them
 * - Endowed Progress: Past completions feel like earned assets
 */
export function HabitContributionGraph({
  history,
  weeks = 12,
  title,
  showMonthLabels = true,
  colorScheme = "default",
  onDayClick,
  selectedDate,
}: HabitContributionGraphProps) {
  // Build the grid data
  const gridData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = weeks * 7;
    const grid: Array<{ date: Date; dateStr: string; completed: boolean; count?: number }> = [];

    // Create map for quick lookup
    const historyMap = new Map(
      history.map((h) => [h.date, { completed: h.completed, count: h.count }])
    );

    // Go back 'days' days and fill forward
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);

    // Adjust to start on Sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Fill grid
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - today.getDay())); // End on Saturday

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const historyEntry = historyMap.get(dateStr);

      grid.push({
        date: new Date(current),
        dateStr,
        completed: historyEntry?.completed ?? false,
        count: historyEntry?.count,
      });

      current.setDate(current.getDate() + 1);
    }

    return grid;
  }, [history, weeks]);

  // Organize into weeks (columns)
  const weekColumns = useMemo(() => {
    const columns: typeof gridData[] = [];
    for (let i = 0; i < gridData.length; i += 7) {
      columns.push(gridData.slice(i, i + 7));
    }
    return columns;
  }, [gridData]);

  // Get month labels
  const monthLabels = useMemo(() => {
    if (!showMonthLabels) return [];

    const labels: { month: string; colIndex: number }[] = [];
    let lastMonth = -1;

    weekColumns.forEach((week, colIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.date.getMonth();

      if (month !== lastMonth) {
        labels.push({
          month: firstDayOfWeek.date.toLocaleDateString("en-US", { month: "short" }),
          colIndex,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [weekColumns, showMonthLabels]);

  // Color schemes
  const getColorClass = (completed: boolean, count?: number) => {
    if (!completed && (count === undefined || count === 0)) {
      return "bg-foreground/5 dark:bg-foreground/10";
    }

    // For count-based coloring (all habits view)
    if (count !== undefined) {
      const intensity = Math.min(count, 4); // Cap at 4 levels
      switch (colorScheme) {
        case "fire":
          return [
            "bg-orange-200 dark:bg-orange-900/50",
            "bg-orange-300 dark:bg-orange-700",
            "bg-orange-400 dark:bg-orange-600",
            "bg-orange-500 dark:bg-orange-500",
            "bg-orange-600 dark:bg-orange-400",
          ][intensity];
        case "ocean":
          return [
            "bg-blue-200 dark:bg-blue-900/50",
            "bg-blue-300 dark:bg-blue-700",
            "bg-blue-400 dark:bg-blue-600",
            "bg-blue-500 dark:bg-blue-500",
            "bg-blue-600 dark:bg-blue-400",
          ][intensity];
        default:
          return [
            "bg-primary/20",
            "bg-primary/40",
            "bg-primary/60",
            "bg-primary/80",
            "bg-primary",
          ][intensity];
      }
    }

    // For boolean completion
    switch (colorScheme) {
      case "fire":
        return "bg-orange-500 dark:bg-orange-400";
      case "ocean":
        return "bg-blue-500 dark:bg-blue-400";
      default:
        return "bg-primary";
    }
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate stats
  const totalDays = gridData.length;
  const completedDays = gridData.filter((d) => d.completed || (d.count && d.count > 0)).length;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Find current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sortedHistory = [...gridData].reverse();

    // Start from today or yesterday (if today isn't logged yet)
    for (const day of sortedHistory) {
      if (day.date > today) continue;
      if (day.completed || (day.count && day.count > 0)) {
        streak++;
      } else if (day.date < today) {
        // If it's before today and not completed, streak is broken
        break;
      }
    }
    return streak;
  }, [gridData, today]);

  return (
    <div className="space-y-3">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground/70">{title}</h4>
          <div className="flex items-center gap-4 text-xs text-foreground/50">
            <span>{completionRate}% active</span>
            {currentStreak > 0 && <span>{currentStreak} day streak</span>}
          </div>
        </div>
      )}

      {/* Graph */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          {showMonthLabels && (
            <div className="flex ml-8" style={{ height: "16px" }}>
              {monthLabels.map(({ month, colIndex }) => (
                <span
                  key={`${month}-${colIndex}`}
                  className="text-xs text-foreground/50 absolute"
                  style={{ marginLeft: `${colIndex * 14}px` }}
                >
                  {month}
                </span>
              ))}
            </div>
          )}

          {/* Grid with day labels */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-1">
              {dayLabels.map((label, i) => (
                <span
                  key={i}
                  className="text-xs text-foreground/40 h-3 w-6 flex items-center justify-end"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Week columns */}
            {weekColumns.map((week, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const isToday = day.dateStr === today.toISOString().split("T")[0];
                  const isFuture = day.date > today;

                  return (
                    <Tooltip key={day.dateStr}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isFuture && onDayClick) {
                              onDayClick(day.dateStr);
                            }
                          }}
                          disabled={isFuture}
                          className={cn(
                            "w-3 h-3 rounded-sm transition-all",
                            isFuture
                              ? "bg-foreground/3 cursor-default"
                              : getColorClass(day.completed, day.count),
                            isToday && "ring-1 ring-foreground/30",
                            !isFuture && onDayClick && "cursor-pointer hover:ring-1 hover:ring-foreground/20 hover:scale-125",
                            selectedDate === day.dateStr && "ring-2 ring-primary scale-125"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {day.date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {isFuture ? (
                          <p className="text-foreground/60">Future</p>
                        ) : day.count !== undefined ? (
                          <p className="text-foreground/60">
                            {day.count} habit{day.count !== 1 ? "s" : ""} completed
                          </p>
                        ) : (
                          <p className="text-foreground/60">
                            {day.completed ? "Completed" : "Not completed"}
                          </p>
                        )}
                        {!isFuture && onDayClick && (
                          <p className="text-primary mt-1">Click to edit</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-2 text-xs text-foreground/50">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-foreground/5 dark:bg-foreground/10" />
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/50" />
              <div className="w-3 h-3 rounded-sm bg-primary/70" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitContributionGraph;
