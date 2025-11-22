import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";

interface HabitLog {
  id: number;
  habitId: number;
  completed: boolean;
  date: string;
}

interface Habit {
  id: number;
  title: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_COLORS = [
  "#FF6B6B", // Sun - coral
  "#4ECDC4", // Mon - teal
  "#A855F7", // Tue - purple
  "#FBBF24", // Wed - amber
  "#60A5FA", // Thu - blue
  "#34D399", // Fri - green
  "#F472B6", // Sat - pink
];

function getLast4WeeksDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function WeeklyRhythm() {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const dates = getLast4WeeksDates();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const { data: logs = [], isLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/range/" + startDate + "/" + endDate],
    enabled: habits.length > 0,
  });

  const dayStats = DAYS.map((_, dayIndex) => {
    const datesOnDay = dates.filter((d) => {
      const date = new Date(d + "T12:00:00");
      return date.getDay() === dayIndex;
    });

    let completions = 0;
    let possible = datesOnDay.length * habits.length;

    datesOnDay.forEach((date) => {
      habits.forEach((habit) => {
        const log = logs.find(
          (l) => l.habitId === habit.id && l.date === date && l.completed
        );
        if (log) completions++;
      });
    });

    const rate = possible > 0 ? completions / possible : 0;
    return { completions, possible, rate };
  });

  const hasMockData = logs.length === 0;
  const displayStats = hasMockData
    ? [
        { rate: 0.65, completions: 8, possible: 12 },
        { rate: 0.85, completions: 10, possible: 12 },
        { rate: 0.75, completions: 9, possible: 12 },
        { rate: 0.50, completions: 6, possible: 12 },
        { rate: 0.70, completions: 8, possible: 12 },
        { rate: 0.40, completions: 5, possible: 12 },
        { rate: 0.55, completions: 7, possible: 12 },
      ]
    : dayStats;

  const maxRate = Math.max(...displayStats.map((s) => s.rate), 0.5);
  const bestDay = displayStats.reduce(
    (best, stat, i) => (stat.rate > displayStats[best].rate ? i : best),
    0
  );
  const worstDay = displayStats.reduce(
    (worst, stat, i) => (stat.rate < displayStats[worst].rate ? i : worst),
    0
  );

  // BIGGER radar chart
  const size = 195;
  const center = size / 2;
  const maxRadius = size / 2 - 20;

  const dataPoints = displayStats.map((stat, i) => {
    const angle = (i * 360) / 7 - 90;
    const radius = (stat.rate / maxRate) * maxRadius;
    const x = center + radius * Math.cos((angle * Math.PI) / 180);
    const y = center + radius * Math.sin((angle * Math.PI) / 180);
    return { x, y, angle, radius, rate: stat.rate };
  });

  const polygonPath = dataPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
  ).join(" ") + " Z";

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Weekly Rhythm</h3>
        </div>
      </div>

      {/* Main content - chart + stats side by side */}
      <div className="flex-1 flex items-center gap-4">
        {/* Chart - 60% */}
        <div className="flex-[6] flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[180px]">
            {/* Background circles */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <circle
                key={pct}
                cx={center}
                cy={center}
                r={maxRadius * pct}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />
            ))}

            {/* Axis lines */}
            {DAYS.map((_, i) => {
              const angle = (i * 360) / 7 - 90;
              const x2 = center + maxRadius * Math.cos((angle * Math.PI) / 180);
              const y2 = center + maxRadius * Math.sin((angle * Math.PI) / 180);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data polygon - glow */}
            <path
              d={polygonPath}
              fill="rgba(96, 165, 250, 0.12)"
              stroke="rgba(96, 165, 250, 0.4)"
              strokeWidth="2"
            />

            {/* Data polygon - main */}
            <path
              d={polygonPath}
              fill="rgba(96, 165, 250, 0.2)"
              stroke="#60A5FA"
              strokeWidth="2"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(96, 165, 250, 0.5))" }}
            />

            {/* Data points */}
            {dataPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill={DAY_COLORS[i]}
                stroke="white"
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 4px ${DAY_COLORS[i]})` }}
              />
            ))}

            {/* Day labels */}
            {DAYS.map((day, i) => {
              const angle = (i * 360) / 7 - 90;
              const labelRadius = maxRadius + 15;
              const x = center + labelRadius * Math.cos((angle * Math.PI) / 180);
              const y = center + labelRadius * Math.sin((angle * Math.PI) / 180);
              return (
                <text
                  key={day}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={DAY_COLORS[i]}
                >
                  {day.charAt(0)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Stats sidebar - 40% */}
        <div className="flex-[4] flex flex-col justify-center gap-2">
          {/* Best day */}
          <div
            className="p-3 rounded-xl"
            style={{
              background: `${DAY_COLORS[bestDay]}20`,
              border: `1px solid ${DAY_COLORS[bestDay]}40`,
              boxShadow: `0 0 15px ${DAY_COLORS[bestDay]}20`,
            }}
          >
            <div className="text-xs text-muted-foreground mb-1">Best Day</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold" style={{ color: DAY_COLORS[bestDay] }}>
                {DAYS[bestDay]}
              </span>
              <span className="text-lg font-semibold" style={{ color: DAY_COLORS[bestDay] }}>
                {Math.round(displayStats[bestDay].rate * 100)}%
              </span>
            </div>
          </div>

          {/* Worst day */}
          <div
            className="p-3 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div className="text-xs text-muted-foreground mb-1">Weakest</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-medium text-muted-foreground">
                {DAYS[worstDay]}
              </span>
              <span className="text-lg text-muted-foreground">
                {Math.round(displayStats[worstDay].rate * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
