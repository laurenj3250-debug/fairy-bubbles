import { cn, getDayOfWeek } from "@/lib/utils";

interface WeeklyData {
  date: string;
  completed: number;
  total: number;
}

interface WeeklyProgressChartProps {
  data: WeeklyData[];
  className?: string;
}

export function WeeklyProgressChart({ data, className }: WeeklyProgressChartProps) {
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  
  return (
    <div className={cn("space-y-4", className)} data-testid="weekly-progress-chart">
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((day, index) => {
          const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
          const height = day.total > 0 ? (day.total / maxTotal) * 100 : 0;
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full min-w-8 max-w-12">
                  <div
                    className="w-full rounded-t-md bg-muted transition-all duration-300"
                    style={{ height: `${height}px` }}
                  >
                    <div
                      className="w-full rounded-t-md bg-primary transition-all duration-300"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground mt-1 tabular-nums">
                  {day.completed}/{day.total}
                </span>
              </div>
              <span className="text-xs text-muted-foreground" data-testid={`day-label-${index}`}>
                {getDayOfWeek(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
