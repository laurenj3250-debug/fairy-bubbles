import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  dayName: string;
  completionPercentage: number;
  completed: number;
  total: number;
  color: string;
  height: number;
  isToday: boolean;
}

interface RidgeTraverseWeekCompactProps {
  onDayClick?: (date: string) => void;
}

export function RidgeTraverseWeekCompact({ onDayClick }: RidgeTraverseWeekCompactProps) {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map((h) =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then((res) => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  const today = new Date().toISOString().split("T")[0];

  // Calculate week data (Monday-Sunday)
  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days: DayData[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateString = date.toISOString().split("T")[0];

      // Count completed habits for this day
      const completedLogs = allLogs.filter(
        (log) => log.date === dateString && log.completed
      );
      const completed = completedLogs.length;
      const total = habits.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      // Determine color based on completion - mountain-inspired
      let color = "#64748b"; // granite (incomplete)
      if (percentage === 100) {
        color = "#7dd3fc"; // glacier-ice (summit reached)
      } else if (percentage >= 50) {
        color = "#f97316"; // alpenglow (climbing)
      }

      // Height scales from 30% to 100% of container for compact view
      const height = 30 + percentage * 0.7;

      days.push({
        date: dateString,
        dayName: dayNames[i],
        completionPercentage: percentage,
        completed,
        total,
        color,
        height,
        isToday: dateString === today,
      });
    }

    return days;
  }, [habits, allLogs, today]);

  const peaksTraversed = weekData.filter((day) => day.completionPercentage === 100).length;

  const handleDayClick = (date: string) => {
    if (onDayClick) {
      onDayClick(date);
    }
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className="card-snow-layer p-4 shadow-lg topo-pattern">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h3 className="text-sm font-altitude font-bold text-foreground uppercase tracking-tight">
          Ridge Traverse
        </h3>
        <span className="text-xs text-mountain-glacier-ice font-technical font-bold">
          {peaksTraversed}/7 peaks
        </span>
      </div>

      {/* Compact mountain ridge visualization */}
      <div className="relative w-full h-24">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {weekData.map((day, index) => (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1 group cursor-pointer"
              onClick={() => handleDayClick(day.date)}
              style={{
                animation: `peak-grow 0.5s ease-out ${index * 0.08}s backwards`,
              }}
            >
              {/* Peak */}
              <div className="relative w-full flex flex-col items-center">
                {/* Summit flag for completed days */}
                {day.completionPercentage === 100 && (
                  <div className="absolute -top-4 z-10 text-sm animate-pulse">🚩</div>
                )}

                {/* Mountain peak */}
                <div
                  className="w-full relative transition-all duration-300 group-hover:scale-110"
                  style={{
                    height: `${day.height}%`,
                    minHeight: "20px",
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                  >
                    <defs>
                      <linearGradient
                        id={`compact-peak-gradient-${index}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={day.color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={day.color} stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="50,0 100,100 0,100"
                      fill={`url(#compact-peak-gradient-${index})`}
                      className="transition-all duration-300"
                    />
                    {/* Snow cap */}
                    {day.completionPercentage === 100 && (
                      <polygon
                        points="50,0 65,20 35,20"
                        fill="rgba(255, 255, 255, 0.9)"
                      />
                    )}
                  </svg>

                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                    <div className="bg-card border border-border text-foreground text-xs px-2 py-1 rounded shadow-lg">
                      <div className="font-semibold">{day.dayName}</div>
                      <div className="text-muted-foreground">
                        {day.completed}/{day.total}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day label */}
              <div className="mt-1">
                <div
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    day.isToday
                      ? "text-primary"
                      : day.completionPercentage === 100
                      ? "text-[hsl(var(--accent))]"
                      : day.completionPercentage >= 50
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak animation */}
      <style>{`
        @keyframes peak-grow {
          0% {
            transform: translateY(100%) scaleY(0);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
