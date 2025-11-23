import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityDay {
  date: string; // ISO date (YYYY-MM-DD)
  count: number; // Number of activities
  totalMinutes: number; // Total duration
}

interface ActivityHeatmapProps {
  activities: ActivityDay[];
  year?: number;
  onDayClick?: (date: string) => void;
  colorScheme?: "orange" | "green" | "blue";
}

const colorSchemes = {
  orange: [
    "bg-muted/20",
    "bg-orange-900/40",
    "bg-orange-700/60",
    "bg-orange-500/80",
    "bg-orange-500",
  ],
  green: [
    "bg-muted/20",
    "bg-green-900/40",
    "bg-green-700/60",
    "bg-green-500/80",
    "bg-green-500",
  ],
  blue: [
    "bg-muted/20",
    "bg-blue-900/40",
    "bg-blue-700/60",
    "bg-blue-500/80",
    "bg-blue-500",
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function getIntensityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityHeatmap({
  activities,
  year: initialYear,
  onDayClick,
  colorScheme = "orange",
}: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear ?? currentYear);

  // Create a map of date -> activity data for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, ActivityDay>();
    activities.forEach((activity) => {
      map.set(activity.date, activity);
    });
    return map;
  }, [activities]);

  // Generate all weeks for the year
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: string; activity: ActivityDay | null }>> = [];

    // Start from first day of year
    const startDate = new Date(year, 0, 1);
    // Adjust to start from Monday of that week
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // End at last day of year
    const endDate = new Date(year, 11, 31);

    let currentDate = new Date(startDate);
    let currentWeek: Array<{ date: string; activity: ActivityDay | null }> = [];

    while (currentDate <= endDate || currentWeek.length > 0) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const isInYear = currentDate.getFullYear() === year;

      currentWeek.push({
        date: dateStr,
        activity: isInYear ? activityMap.get(dateStr) || null : null,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Stop if we've gone past the year and finished the week
      if (currentDate.getFullYear() > year && currentWeek.length === 0) {
        break;
      }
    }

    // Push any remaining partial week
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [year, activityMap]);

  // Calculate month label positions
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      // Check first day of week that's in the year
      const firstDayInYear = week.find((d) => new Date(d.date).getFullYear() === year);
      if (firstDayInYear) {
        const month = new Date(firstDayInYear.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks, year]);

  const colors = colorSchemes[colorScheme];

  // Stats for the year
  const yearStats = useMemo(() => {
    let totalActivities = 0;
    let totalMinutes = 0;
    let activeDays = 0;

    activities.forEach((a) => {
      if (a.date.startsWith(String(year))) {
        totalActivities += a.count;
        totalMinutes += a.totalMinutes;
        if (a.count > 0) activeDays++;
      }
    });

    return { totalActivities, totalMinutes, activeDays };
  }, [activities, year]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-16 text-center">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Year stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{yearStats.totalActivities}</strong> activities
          </span>
          <span>
            <strong className="text-foreground">{yearStats.activeDays}</strong> active days
          </span>
          <span>
            <strong className="text-foreground">{formatDuration(yearStats.totalMinutes)}</strong>{" "}
            total
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex ml-8">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <span
                key={`${month}-${i}`}
                className="text-xs text-muted-foreground"
                style={{
                  marginLeft: i === 0 ? weekIndex * 14 : (weekIndex - monthLabels[i - 1].weekIndex) * 14 - 20,
                  width: 28,
                }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Grid with day labels */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-2 pt-0">
              {DAYS.map((day, i) => (
                <span
                  key={i}
                  className="text-xs text-muted-foreground h-[12px] leading-[12px]"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Weeks grid */}
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-[2px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {week.map((day) => {
                      const activity = day.activity;
                      const minutes = activity?.totalMinutes || 0;
                      const count = activity?.count || 0;
                      const level = getIntensityLevel(minutes);
                      const isCurrentYear = new Date(day.date).getFullYear() === year;

                      if (!isCurrentYear) {
                        return (
                          <div
                            key={day.date}
                            className="w-[12px] h-[12px] rounded-sm bg-transparent"
                          />
                        );
                      }

                      return (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "w-[12px] h-[12px] rounded-sm transition-all duration-150",
                                "hover:scale-125 hover:z-10",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                colors[level]
                              )}
                              onClick={() => onDayClick?.(day.date)}
                              aria-label={`${formatDate(day.date)}: ${count} activities, ${formatDuration(minutes)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{formatDate(day.date)}</p>
                            {count > 0 ? (
                              <p className="text-muted-foreground">
                                {count} {count === 1 ? "activity" : "activities"} ({formatDuration(minutes)})
                              </p>
                            ) : (
                              <p className="text-muted-foreground">No activities</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 ml-8">
            <span className="text-xs text-muted-foreground">Less</span>
            {colors.map((color, i) => (
              <div key={i} className={cn("w-[12px] h-[12px] rounded-sm", color)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
