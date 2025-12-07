import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

export function HabitHeatmap() {
  const queryClient = useQueryClient();

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

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", { habitId, date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/habit-logs')
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  // Build completion map
  const isCompleted = (habitId: number, date: string) => {
    return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
  };

  // Count completions per habit
  const getHabitCount = (habitId: number) => {
    return dates.filter(d => isCompleted(habitId, d)).length;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[var(--text-muted)] text-sm">Loading...</div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[var(--text-muted)] text-sm">No habits yet</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Day labels header */}
      <div className="flex gap-[0.4rem] mb-2" style={{ marginLeft: "5.5rem" }}>
        {DAYS.map((day, i) => (
          <div
            key={i}
            className="w-[1.1rem] text-center text-[0.55rem] uppercase font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Habit rows */}
      <div className="flex flex-col gap-3">
        {habits.slice(0, 4).map((habit) => (
          <div key={habit.id} className="flex items-center gap-3">
            {/* Habit name */}
            <span
              className="w-20 text-[0.7rem] truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {habit.title}
            </span>

            {/* Dots */}
            <div className="flex gap-[0.4rem] flex-1">
              {dates.map((date) => {
                const completed = isCompleted(habit.id, date);
                return (
                  <div
                    key={date}
                    onClick={() => toggleMutation.mutate({ habitId: habit.id, date })}
                    className="w-[1.1rem] h-[1.1rem] rounded-full cursor-pointer transition-all hover:scale-110"
                    style={{
                      background: completed ? "#d4a59a" : "rgba(61, 90, 80, 0.3)",
                      border: completed ? "none" : "1px solid rgba(61, 90, 80, 0.5)",
                      boxShadow: completed ? "0 0 10px rgba(212, 165, 154, 0.4)" : "none",
                    }}
                  />
                );
              })}
            </div>

            {/* Count */}
            <span
              className="w-8 text-right text-[0.7rem] font-medium"
              style={{ color: "#d4a59a" }}
            >
              {getHabitCount(habit.id)}/7
            </span>
          </div>
        ))}
      </div>

      {/* Show more link */}
      {habits.length > 4 && (
        <a
          href="/habits"
          className="text-xs mt-3 text-center transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          +{habits.length - 4} more →
        </a>
      )}
    </div>
  );
}
