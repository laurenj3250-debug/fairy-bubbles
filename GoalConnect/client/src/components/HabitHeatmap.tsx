import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HabitHeatmapProps {
  completionDates: string[]; // Array of dates in YYYY-MM-DD format
  startDate?: Date;
  weeksToShow?: number;
}

export function HabitHeatmap({ completionDates, startDate, weeksToShow = 52 }: HabitHeatmapProps) {
  const heatmapData = useMemo(() => {
    const end = new Date();
    const start = startDate || new Date(end.getTime() - (weeksToShow * 7 * 24 * 60 * 60 * 1000));

    // Adjust start to be a Sunday
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const weeks: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];
    let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];

    const current = new Date(start);
    const dateSet = new Set(completionDates);

    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();

      currentWeek.push({
        date: dateString,
        count: dateSet.has(dateString) ? 1 : 0,
        dayOfWeek,
      });

      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [completionDates, startDate, weeksToShow]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    return "bg-green-500";
  };

  const months = useMemo(() => {
    const monthLabels: Array<{ month: string; offset: number }> = [];
    let lastMonth = -1;

    heatmapData.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = new Date(week[0].date);
        const month = firstDay.getMonth();

        if (month !== lastMonth) {
          monthLabels.push({
            month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
            offset: weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return monthLabels;
  }, [heatmapData]);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Month labels */}
        <div className="flex gap-[3px] ml-6 text-xs text-muted-foreground">
          {months.map((m, idx) => (
            <div
              key={idx}
              style={{ marginLeft: idx === 0 ? `${m.offset * 13}px` : `${(m.offset - (months[idx - 1]?.offset || 0)) * 13 - 20}px` }}
            >
              {m.month}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] text-xs text-muted-foreground justify-between py-1">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week.find(d => d.dayOfWeek === dayIndex);

                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }

                  const date = new Date(day.date);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-3 h-3 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-primary",
                            getColor(day.count)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {day.count > 0 ? '✓ Completed' : 'Not completed'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formattedDate}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6 mt-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
