import { useQuery } from "@tanstack/react-query";

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

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getLast7Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
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

  const dates = getLast7Days();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const { data: logs = [], isLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/range/" + startDate + "/" + endDate],
    enabled: habits.length > 0,
  });

  // Calculate completions per day
  const dayData = dates.map((date, i) => {
    const completions = habits.filter(habit =>
      logs.some(l => l.habitId === habit.id && l.date === date && l.completed)
    ).length;
    const total = habits.length || 1;
    const percentage = Math.round((completions / total) * 100);
    return { day: DAYS[new Date(date + "T12:00:00").getDay()], percentage };
  });

  // Mock data if no logs
  const displayData = logs.length === 0
    ? [
        { day: "S", percentage: 40 },
        { day: "M", percentage: 85 },
        { day: "T", percentage: 60 },
        { day: "W", percentage: 50 },
        { day: "T", percentage: 75 },
        { day: "F", percentage: 95 },
        { day: "S", percentage: 45 },
      ]
    : dayData;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[var(--text-muted)] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Bar chart */}
      <div className="flex-1 flex items-end justify-around pt-2">
        {displayData.map((data, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {/* Bar */}
            <div
              className="w-[9px] rounded"
              style={{
                height: `${Math.max(data.percentage * 0.7, 8)}px`,
                background: "linear-gradient(to top, #d4a59a, #e8c4bc)",
                boxShadow: "0 0 8px rgba(212, 165, 154, 0.4)",
              }}
            />
            {/* Day label */}
            <span
              className="text-[0.55rem] uppercase font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {data.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
