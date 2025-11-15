import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Habit {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  streak?: {
    streak: number;
  };
}

interface CompletionStatus {
  habitId: number;
  completedAt: string | null;
}

export function GlowingOrbHabits() {
  const queryClient = useQueryClient();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: completions = [] } = useQuery<CompletionStatus[]>({
    queryKey: ["/api/habits/today"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      const response = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const isCompleted = (habitId: number) => {
    return completions.some((c) => c.habitId === habitId && c.completedAt);
  };

  const handleOrbClick = (habitId: number, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Add ripple effect
    const rippleId = Date.now();
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // Toggle habit
    const completed = isCompleted(habitId);
    toggleMutation.mutate({ habitId, completed: !completed });
  };

  // Get the first 6 habits for display
  const displayHabits = habits.slice(0, 6);

  const getOrbColor = (habit: Habit, completed: boolean) => {
    const streak = habit.streak?.streak || 0;

    if (completed) {
      // Completed today - bright glow
      if (streak >= 30) return "from-emerald-400 to-teal-500";
      if (streak >= 14) return "from-cyan-400 to-blue-500";
      if (streak >= 7) return "from-blue-400 to-indigo-500";
      return "from-green-400 to-emerald-500";
    } else {
      // Not completed - dimmer
      if (streak >= 7) return "from-slate-600 to-slate-700";
      return "from-slate-500 to-slate-600";
    }
  };

  const getOrbSize = (index: number) => {
    // Vary sizes for visual interest
    const sizes = ["w-16 h-16", "w-20 h-20", "w-18 h-18", "w-16 h-16", "w-20 h-20", "w-18 h-18"];
    return sizes[index] || "w-16 h-16";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today's Habits</h3>
        <div className="text-sm text-muted-foreground">
          {completions.filter((c) => c.completedAt).length} / {habits.length} completed
        </div>
      </div>

      {/* Glowing Orbs Grid */}
      <div className="flex flex-wrap gap-4 justify-center p-6">
        {displayHabits.map((habit, index) => {
          const completed = isCompleted(habit.id);
          const orbColor = getOrbColor(habit, completed);
          const orbSize = getOrbSize(index);

          return (
            <motion.div
              key={habit.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                onClick={(e) => handleOrbClick(habit.id, e)}
                className={`
                  ${orbSize}
                  rounded-full
                  bg-gradient-to-br ${orbColor}
                  glowing-orb
                  interactive-glow
                  cursor-pointer
                  relative
                  overflow-hidden
                  ${completed ? "opacity-100" : "opacity-50"}
                `}
                style={{
                  animation: completed
                    ? "orb-glow 2s ease-in-out infinite"
                    : "none",
                }}
              >
                {/* Ripple effects */}
                {ripples
                  .filter((r) => r.id)
                  .map((ripple) => (
                    <div
                      key={ripple.id}
                      className="ripple-effect"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                      }}
                    />
                  ))}

                {/* Sparkles for completed habits */}
                {completed && (
                  <>
                    <div
                      className="sparkle"
                      style={{ top: "20%", left: "30%", animationDelay: "0s" }}
                    />
                    <div
                      className="sparkle"
                      style={{ top: "60%", left: "70%", animationDelay: "0.5s" }}
                    />
                    <div
                      className="sparkle"
                      style={{ top: "40%", left: "80%", animationDelay: "1s" }}
                    />
                  </>
                )}

                {/* Inner glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

                {/* Checkmark for completed */}
                {completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>

              {/* Habit name */}
              <div className="text-xs text-center max-w-[80px] opacity-0 group-hover:opacity-100 transition-opacity">
                {habit.name}
              </div>

              {/* Streak indicator */}
              {habit.streak && habit.streak.streak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-bold text-amber-400"
                >
                  {habit.streak.streak}🔥
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* View all habits link */}
      {habits.length > 6 && (
        <div className="text-center">
          <a
            href="/habits"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {habits.length} habits →
          </a>
        </div>
      )}
    </div>
  );
}
