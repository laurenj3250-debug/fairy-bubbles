import { cn, formatDateInput, getHeatmapIntensity } from "@/lib/utils";
import { useMemo } from "react";

interface HeatmapData {
  date: string;
  value: number;
}

interface HeatmapGridProps {
  data: HeatmapData[];
  weeks?: number;
  className?: string;
}

export function HeatmapGrid({ data, weeks = 12, className }: HeatmapGridProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));
    
    const dateMap = new Map(data.map(d => [d.date, d.value]));
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    const grid: { date: string; value: number; intensity: number }[][] = [];
    
    for (let week = 0; week < weeks; week++) {
      const weekData: { date: string; value: number; intensity: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + week * 7 + day);
        
        if (currentDate > today) {
          weekData.push({ date: "", value: 0, intensity: 0 });
        } else {
          const dateStr = formatDateInput(currentDate);
          const value = dateMap.get(dateStr) || 0;
          const intensity = getHeatmapIntensity(value, maxValue);
          weekData.push({ date: dateStr, value, intensity });
        }
      }
      grid.push(weekData);
    }
    
    return grid;
  }, [data, weeks]);

  return (
    <div className={cn("overflow-x-auto pb-2", className)} data-testid="heatmap-grid">
      <div className="inline-flex gap-1 min-w-full">
        {heatmapData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "w-3 h-3 md:w-4 md:h-4 rounded-sm transition-all duration-200",
                  day.date
                    ? "hover:ring-2 hover:ring-primary hover:ring-offset-1 cursor-pointer"
                    : "opacity-20"
                )}
                style={{
                  backgroundColor: day.intensity > 0
                    ? `hsl(var(--primary) / ${day.intensity})`
                    : "hsl(var(--border))",
                }}
                title={day.date ? `${day.date}: ${day.value} completions` : ""}
                data-testid={`heatmap-cell-${day.date}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
