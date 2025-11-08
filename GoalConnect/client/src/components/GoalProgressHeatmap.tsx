import { useQuery } from "@tanstack/react-query";
import type { GoalUpdate } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GoalProgressHeatmapProps {
  goalId: number;
  days?: number; // Number of days to show (default: 30)
}

export function GoalProgressHeatmap({ goalId, days = 30 }: GoalProgressHeatmapProps) {
  const { data: updates = [] } = useQuery<GoalUpdate[]>({
    queryKey: [`/api/goal-updates/${goalId}`],
  });

  // Generate date range
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return date.toISOString().split("T")[0];
  });

  // Group updates by date and sum values
  const progressByDate = updates.reduce((acc, update) => {
    const date = update.date;
    acc[date] = (acc[date] || 0) + update.value;
    return acc;
  }, {} as Record<string, number>);

  // Find max progress value for color intensity
  const maxProgress = Math.max(...Object.values(progressByDate), 1);

  // Get color intensity based on progress
  const getColorIntensity = (value: number) => {
    if (value === 0) return "bg-white/10 border-white/20";
    const intensity = Math.min((value / maxProgress) * 100, 100);

    if (intensity >= 75) return "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50";
    if (intensity >= 50) return "bg-purple-400 border-purple-300 shadow-md shadow-purple-400/40";
    if (intensity >= 25) return "bg-purple-300 border-purple-200 shadow-sm shadow-purple-300/30";
    return "bg-purple-200 border-purple-100";
  };

  // Group dates by week
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  dateRange.forEach((date, index) => {
    const dayOfWeek = new Date(date).getDay();

    // Start a new week on Sunday (0)
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    currentWeek.push(date);

    // Push the last week
    if (index === dateRange.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          Progress Heatmap (Last {days} days)
        </h4>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/10 border border-white/20" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500 border border-purple-400" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Day labels */}
          <div className="flex gap-1">
            <div className="w-8" /> {/* Spacer for row labels */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((date) => {
                  const dayOfWeek = new Date(date).getDay();
                  const isFirstDayOfMonth = new Date(date).getDate() === 1;
                  return (
                    <div key={date} className="w-6 h-4 text-center text-xs text-white/60">
                      {isFirstDayOfMonth && (
                        <div style={{ fontFamily: "'Quicksand', sans-serif", fontSize: "10px" }}>
                          {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
            <div key={dayOfWeek} className="flex gap-1 items-center">
              {/* Day of week label */}
              <div className="w-8 text-xs text-white/60 text-right pr-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                {dayLabels[dayOfWeek][0]}
              </div>

              {/* Cells for this day across all weeks */}
              {weeks.map((week, weekIndex) => {
                const date = week.find((d) => new Date(d).getDay() === dayOfWeek);
                if (!date) {
                  return <div key={`empty-${weekIndex}`} className="w-6 h-6" />;
                }

                const progress = progressByDate[date] || 0;
                const colorClass = getColorIntensity(progress);
                const today = new Date().toISOString().split("T")[0];
                const isToday = date === today;

                return (
                  <div
                    key={date}
                    className={cn(
                      "w-6 h-6 rounded transition-all duration-200 cursor-pointer border-2",
                      colorClass,
                      isToday && "ring-2 ring-white/50",
                      progress > 0 && "hover:scale-125 hover:z-10"
                    )}
                    title={`${new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}: ${progress > 0 ? `+${progress}` : "No progress"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-3 flex items-center gap-4 text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>
        <div>
          <span className="font-semibold text-white">
            {Object.keys(progressByDate).length}
          </span>{" "}
          active days
        </div>
        <div>
          <span className="font-semibold text-white">
            {Object.values(progressByDate).reduce((sum, val) => sum + val, 0)}
          </span>{" "}
          total progress
        </div>
      </div>
    </div>
  );
}
