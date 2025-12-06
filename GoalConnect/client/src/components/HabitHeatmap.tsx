import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Link } from "wouter";
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
  color?: string;
}

// Unified theme color - using CSS variables for consistency
const THEME_COLOR = {
  solid: "hsl(var(--primary))",
  bright: "hsl(var(--warning))",
  gradient: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--warning)) 100%)"
};

// Generate last N days as YYYY-MM-DD strings
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// Get day labels (M T W T F S S)
function getDayLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
}

export function HabitHeatmap() {
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Toggle habit completion for a specific date
  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date,
      });
    },
    onSuccess: () => {
      // Invalidate all habit-related queries for consistency across components
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/habit-logs/range/')
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  // Generate last 7 days
  const days = getLastNDays(7);
  const startDate = days[0];
  const endDate = days[days.length - 1];

  const { data: allLogs = [], isLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/range/" + startDate + "/" + endDate],
    enabled: habits.length > 0,
  });

  // Build completion map: habitId -> Set of completed dates
  const completionMap = new Map<number, Set<string>>();
  allLogs.forEach((log) => {
    if (log.completed) {
      if (!completionMap.has(log.habitId)) {
        completionMap.set(log.habitId, new Set());
      }
      completionMap.get(log.habitId)!.add(log.date);
    }
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">
          Loading activity...
        </div>
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

  // Calculate total completions this week
  const totalCompletions = habits.reduce((sum, habit) => {
    const completed = completionMap.get(habit.id) || new Set();
    return sum + days.filter(d => completed.has(d)).length;
  }, 0);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Floating ambient particles - subtle glow */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full pointer-events-none bg-primary/60"
          style={{
            left: `${8 + (i * 15) % 85}%`,
            top: `${15 + (i * 12) % 75}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Header - using theme colors */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <Link href="/habits" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">This Week</h3>
        </Link>
        <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
          {totalCompletions}
        </span>
      </div>

      {/* Day labels header */}
      <div className="flex gap-1 mb-2 ml-auto mr-8 relative z-10">
        {days.map((date, i) => {
          const isToday = i === days.length - 1;
          return (
            <div
              key={date}
              className={
                "w-6 text-center text-xs font-semibold " +
                (isToday ? "text-primary" : "text-muted-foreground")
              }
            >
              {getDayLabel(date)}
            </div>
          );
        })}
      </div>

      {/* Per-habit rows - simplified style */}
      <div className="flex-1 overflow-y-auto space-y-2.5 relative z-10">
        {habits.slice(0, 4).map((habit, habitIndex) => {
          const colors = THEME_COLOR; // Use unified theme color
          const completedDates = completionMap.get(habit.id) || new Set();
          const completedCount = days.filter((d) => completedDates.has(d)).length;
          const allComplete = completedCount === 7;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: habitIndex * 0.08, type: "spring" }}
              className="relative flex items-center gap-2 p-2 rounded-xl overflow-hidden bg-primary/10 border border-primary/20"
            >

              {/* Habit name - clickable to toggle today */}
              <button
                onClick={() => {
                  const today = days[days.length - 1];
                  toggleMutation.mutate({ habitId: habit.id, date: today });
                }}
                className="w-16 shrink-0 text-xs font-semibold text-left cursor-pointer hover:opacity-80 transition-opacity truncate"
                style={{
                  color: colors.bright,
                  textShadow: `0 0 8px ${colors.solid}80`,
                }}
                title={habit.title}
              >
                {habit.title}
              </button>

              {/* Week cells - glowing orbs style */}
              <div className="flex gap-1 flex-1 justify-end">
                {days.map((date, dayIndex) => {
                  const isCompleted = completedDates.has(date);
                  const isToday = dayIndex === days.length - 1;

                  return (
                    <motion.div
                      key={date}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: habitIndex * 0.05 + dayIndex * 0.03,
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                      }}
                      className="relative"
                    >
                      {/* MEGA pulsing glow behind completed cells */}
                      {isCompleted && (
                        <>
                          {/* Outer bloom */}
                          <motion.div
                            className="absolute inset-[-12px] rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${colors.solid}40 0%, ${colors.solid}20 40%, transparent 70%)`,
                              filter: "blur(4px)",
                            }}
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              scale: [0.9, 1.3, 0.9],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: dayIndex * 0.15,
                            }}
                          />
                          {/* Inner intense glow */}
                          <motion.div
                            className="absolute inset-[-6px] rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${colors.bright}70 0%, ${colors.solid}50 50%, transparent 80%)`,
                            }}
                            animate={{
                              opacity: [0.6, 1, 0.6],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: dayIndex * 0.1,
                            }}
                          />
                        </>
                      )}

                      {/* Cell with hover wobble - ULTRA SHINY */}
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        onClick={() => toggleMutation.mutate({ habitId: habit.id, date })}
                        className={
                          "relative w-6 h-6 rounded-full cursor-pointer " +
                          (isToday && !isCompleted ? "ring-2 ring-white/40 ring-offset-1 ring-offset-transparent" : "")
                        }
                        style={{
                          background: isCompleted
                            ? `${colors.gradient}, radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)`
                            : "rgba(255, 255, 255, 0.08)",
                          boxShadow: isCompleted
                            ? `0 0 30px ${colors.solid}, 0 0 50px ${colors.solid}80, 0 0 70px ${colors.solid}40, inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)`
                            : "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.05)",
                          filter: isCompleted
                            ? "brightness(1.25) saturate(1.4) contrast(1.1)"
                            : "none",
                        }}
                      >
                        {/* INTENSE shimmer sweep effect */}
                        {isCompleted && (
                          <>
                            {/* Main shimmer */}
                            <motion.div
                              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.8) 48%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.8) 52%, transparent 70%)`,
                                }}
                                animate={{ x: ["-150%", "250%"] }}
                                transition={{
                                  duration: 1.8,
                                  repeat: Infinity,
                                  repeatDelay: 3 + dayIndex * 0.5,
                                  ease: "easeInOut",
                                }}
                              />
                            </motion.div>
                            {/* Specular highlight - top left */}
                            <div
                              className="absolute top-1 left-1.5 w-2 h-2 rounded-full pointer-events-none"
                              style={{
                                background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                              }}
                            />
                            {/* Secondary highlight - bottom right */}
                            <div
                              className="absolute bottom-2 right-1.5 w-1 h-1 rounded-full pointer-events-none"
                              style={{
                                background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
                              }}
                            />
                          </>
                        )}

                        {/* Checkmark for completed */}
                        {isCompleted && (
                          <motion.svg
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className="absolute inset-0 w-full h-full p-1.5 text-white drop-shadow-sm"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Streak count with MEGA glow */}
              <div
                className="w-8 text-center text-xs font-bold relative z-10 shrink-0"
                style={{
                  color: completedCount > 0 ? colors.bright : "var(--muted-foreground)",
                  textShadow: completedCount > 0
                    ? `0 0 8px ${colors.solid}, 0 0 16px ${colors.solid}80, 0 0 24px ${colors.solid}40`
                    : "none",
                  filter: completedCount > 0 ? "brightness(1.2)" : "none",
                }}
              >
                {completedCount}/7
              </div>

              {/* Perfect week badge */}
              {allComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1"
                >
                  <span className="text-sm">🔥</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Show more link if needed */}
      {habits.length > 4 && (
        <a
          href="/habits"
          className="text-sm text-muted-foreground hover:text-foreground text-center mt-3 transition-colors"
        >
          +{habits.length - 4} more →
        </a>
      )}
    </div>
  );
}
