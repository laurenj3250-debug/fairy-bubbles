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
}

export function RidgeTraverseWeek() {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map(h =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then(res => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  // Calculate week data (Monday-Sunday)
  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days: DayData[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      // Count completed habits for this day
      const completedLogs = allLogs.filter(
        log => log.date === dateString && log.completed
      );
      const completed = completedLogs.length;
      const total = habits.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      // Determine color based on completion
      let color = '#64748b'; // gray - nothing completed or < 50%
      if (percentage === 100) {
        color = '#10b981'; // green - all completed
      } else if (percentage >= 50) {
        color = '#fbbf24'; // yellow - partial completion (50-99%)
      }

      // Height scales from 20% to 100% of container
      const height = 20 + (percentage * 0.8);

      days.push({
        date: dateString,
        dayName: dayNames[i],
        completionPercentage: percentage,
        completed,
        total,
        color,
        height,
      });
    }

    return days;
  }, [habits, allLogs]);

  // Count peaks traversed (days with 100% completion)
  const peaksTraversed = weekData.filter(day => day.completionPercentage === 100).length;

  // Generate SVG path for rope connecting peaks
  const generateRopePath = () => {
    if (weekData.length === 0) return '';

    const width = 100; // percentage
    const spacing = width / (weekData.length - 1);

    let path = '';
    weekData.forEach((day, index) => {
      const x = index * spacing;
      const y = 100 - day.height; // Invert y for SVG coordinates

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        // Use quadratic bezier curves for smooth connections
        const prevX = (index - 1) * spacing;
        const prevY = 100 - weekData[index - 1].height;
        const controlX = (prevX + x) / 2;
        const controlY = (prevY + y) / 2;
        path += ` Q ${controlX} ${controlY}, ${x} ${y}`;
      }
    });

    return path;
  };

  const handleDayClick = (date: string) => {
    // Navigate to that day's detail view (calendar)
    window.location.hash = `#calendar-${date}`;
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-3xl p-6 shadow-lg topo-pattern relative overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-xl font-bold text-white flex items-center gap-3 mb-2"
          style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
        >
          Ridge Traverse
        </h2>
        <p className="text-white/80 text-sm" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          You traversed <span className="font-bold text-teal-300">{peaksTraversed}/7</span> peaks this week
        </p>
      </div>

      {/* Mountain Ridge Visualization */}
      <div className="relative w-full h-64">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Climbing rope connecting peaks */}
          <path
            d={generateRopePath()}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            className="transition-all duration-500"
          />

          {/* Shadow/depth effect */}
          <defs>
            <filter id="peak-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Mountain Peaks */}
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {weekData.map((day, index) => (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1 group cursor-pointer"
              onClick={() => handleDayClick(day.date)}
              style={{
                animation: `peak-grow 0.6s ease-out ${index * 0.1}s backwards`,
              }}
            >
              {/* Peak */}
              <div className="relative w-full flex flex-col items-center">
                {/* Peak summit indicator */}
                {day.completionPercentage === 100 && (
                  <div
                    className="absolute -top-6 z-10 flag-plant"
                    style={{ animationDelay: `${index * 0.1 + 0.6}s` }}
                  >
                    <div className="text-xl">🚩</div>
                  </div>
                )}

                {/* Mountain peak shape */}
                <div
                  className="w-full relative transition-all duration-300 group-hover:scale-110"
                  style={{
                    height: `${day.height}%`,
                    minHeight: '30px',
                  }}
                >
                  {/* Peak triangle */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                    style={{ filter: 'url(#peak-shadow)' }}
                  >
                    <defs>
                      <linearGradient id={`peak-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={day.color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={day.color} stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="50,0 100,100 0,100"
                      fill={`url(#peak-gradient-${index})`}
                      className="transition-all duration-300"
                    />
                    {/* Snow cap for completed peaks */}
                    {day.completionPercentage === 100 && (
                      <polygon
                        points="50,0 65,20 35,20"
                        fill="rgba(255, 255, 255, 0.8)"
                        className="animate-pulse"
                      />
                    )}
                  </svg>

                  {/* Hover tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-xl border border-white/20">
                      <div className="font-semibold">{day.dayName}</div>
                      <div className="text-white/80">
                        {day.completed}/{day.total} complete
                      </div>
                      <div className="text-teal-300">{Math.round(day.completionPercentage)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day label */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-xs font-semibold transition-all duration-300",
                    day.completionPercentage === 100
                      ? "text-green-300"
                      : day.completionPercentage >= 50
                      ? "text-yellow-300"
                      : "text-white/60"
                  )}
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  {day.dayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/70">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>All Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>50-99%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span>&lt;50%</span>
        </div>
      </div>

      {/* Peak grow animation */}
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
