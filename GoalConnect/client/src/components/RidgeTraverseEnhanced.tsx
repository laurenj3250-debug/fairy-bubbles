import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TopoProgressLines } from "./TopoProgressLines";

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

interface RidgeTraverseEnhancedProps {
  onDayClick?: (date: string) => void;
  selectedDate?: string;
  seasonProgress: number; // 0-90 days
}

export function RidgeTraverseEnhanced({ onDayClick, selectedDate, seasonProgress }: RidgeTraverseEnhancedProps) {
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
  const selected = selectedDate || today;

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

      const completedLogs = allLogs.filter(
        (log) => log.date === dateString && log.completed
      );
      const completed = completedLogs.length;
      const total = habits.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      // Mountain peak colors
      let color = "#64748b"; // gray -未完成
      if (percentage === 100) {
        color = "#46B3A9"; // alpine teal - 完成
      } else if (percentage >= 50) {
        color = "#F2C94C"; // summit gold - 一半
      }

      // Height ranges from 40% to 100%
      const height = 40 + percentage * 0.6;

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
    <div className="relative bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden">
      {/* Topo lines in background */}
      <TopoProgressLines seasonProgress={seasonProgress} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-lg font-semibold text-foreground">Ridge Traverse</h3>
        <span className="text-xs text-primary font-semibold">
          {peaksTraversed}/7 peaks
        </span>
      </div>

      {/* Ridge visualization */}
      <div className="relative w-full h-32 mb-4">
        {/* Rope baseline */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30"
          style={{
            background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 4px, transparent 4px, transparent 8px)",
          }}
        />

        <div className="absolute inset-0 flex items-end justify-between gap-2 relative z-10">
          {weekData.map((day, index) => {
            const isSelected = day.date === selected;

            return (
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
                    <div className="absolute -top-6 z-10 text-base animate-pulse-subtle">
                      🚩
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-8 z-10">
                      <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold shadow-lg">
                        Viewing
                      </div>
                    </div>
                  )}

                  {/* Mountain peak */}
                  <div
                    className={cn(
                      "w-full relative transition-all duration-300",
                      isSelected ? "scale-110 z-20" : "group-hover:scale-105"
                    )}
                    style={{
                      height: `${day.height}%`,
                      minHeight: "30px",
                    }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full"
                    >
                      <defs>
                        <linearGradient
                          id={`peak-gradient-${index}`}
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
                        fill={`url(#peak-gradient-${index})`}
                        className={cn(
                          "transition-all duration-300",
                          isSelected && "drop-shadow-lg"
                        )}
                        stroke={isSelected ? "#46B3A9" : "transparent"}
                        strokeWidth={isSelected ? "2" : "0"}
                      />
                      {/* Snow cap for completed */}
                      {day.completionPercentage === 100 && (
                        <polygon
                          points="50,0 65,20 35,20"
                          fill="rgba(255, 255, 255, 0.9)"
                        />
                      )}
                    </svg>

                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap">
                      <div className="bg-card border border-border text-foreground text-xs px-3 py-1.5 rounded shadow-lg">
                        <div className="font-semibold">{day.dayName}</div>
                        <div className="text-muted-foreground">
                          {day.completed}/{day.total} habits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day label */}
                <div className="mt-2">
                  <div
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      day.isToday
                        ? "text-primary"
                        : isSelected
                        ? "text-[#46B3A9]"
                        : day.completionPercentage === 100
                        ? "text-[#46B3A9]"
                        : day.completionPercentage >= 50
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {day.dayName}
                  </div>
                  {day.isToday && !isSelected && (
                    <div className="text-[10px] text-primary text-center">Today</div>
                  )}
                </div>
              </div>
            );
          })}
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
