import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";

interface Habit {
  id: number;
  title: string;
  currentStreak: number;
  longestStreak: number;
  color?: string;
}

// Color schemes for each habit
const STREAK_COLORS = [
  { bar: "#FF6B6B", glow: "rgba(255, 107, 107, 0.4)", text: "#FF8888" },
  { bar: "#4ECDC4", glow: "rgba(78, 205, 196, 0.4)", text: "#6EEEE6" },
  { bar: "#A855F7", glow: "rgba(168, 85, 247, 0.4)", text: "#C77DFF" },
  { bar: "#FBBF24", glow: "rgba(251, 191, 36, 0.4)", text: "#FFD54F" },
  { bar: "#60A5FA", glow: "rgba(96, 165, 250, 0.4)", text: "#93C5FD" },
];

export function StreakFlames() {
  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Add mock streaks for demo
  const habitsWithStreaks = habits.map((h, i) => ({
    ...h,
    currentStreak: h.currentStreak || (i === 0 ? 8 : i === 1 ? 4 : i === 2 ? 2 : i === 3 ? 1 : 0),
    longestStreak: h.longestStreak || (i === 0 ? 12 : i === 1 ? 6 : 3),
  }));

  const topStreaks = [...habitsWithStreaks]
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5);

  const maxStreak = Math.max(...habitsWithStreaks.map(h => h.currentStreak), 7);
  const totalStreak = habitsWithStreaks.reduce((sum, h) => sum + h.currentStreak, 0);
  const bestEver = Math.max(...habitsWithStreaks.map(h => h.longestStreak));

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Flame className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground text-sm">No habits yet</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold">Streaks</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">
            Best: {bestEver}
          </span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(255, 107, 0, 0.15)",
              color: "#FF6B6B",
              boxShadow: "0 0 8px rgba(255, 107, 107, 0.3)",
            }}
          >
            {totalStreak} 🔥
          </span>
        </div>
      </div>

      {/* Streak bars */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {topStreaks.map((habit, index) => {
          const colors = STREAK_COLORS[index % STREAK_COLORS.length];
          const percentage = Math.max(5, (habit.currentStreak / maxStreak) * 100);

          return (
            <div key={habit.id} className="flex items-center gap-2">
              {/* Habit name */}
              <div
                className="w-16 text-[11px] font-medium truncate"
                style={{ color: colors.text }}
                title={habit.title}
              >
                {habit.title}
              </div>

              {/* Bar container */}
              <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden relative">
                {/* Filled bar */}
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${colors.bar}90, ${colors.bar})`,
                    boxShadow: `0 0 12px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                />

                {/* Streak number inside bar */}
                {habit.currentStreak > 0 && (
                  <div
                    className="absolute inset-y-0 left-2 flex items-center text-[11px] font-bold text-white"
                    style={{
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {habit.currentStreak}
                  </div>
                )}
              </div>

              {/* Days label */}
              <div className="w-8 text-[10px] text-muted-foreground text-right">
                {habit.currentStreak === 1 ? "day" : "days"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
