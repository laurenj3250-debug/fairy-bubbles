import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClimbingHoldSVG } from "./ClimbingHoldSVG";
import { Plus } from "lucide-react";

// Get climbing hold color variations using mountain theme colors
const getHabitColor = (id: number) => {
  // Rotate through different combinations of primary, accent, and secondary
  const variations = [
    { bg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", border: "hsl(var(--primary))" },
    { bg: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))", border: "hsl(var(--accent))" },
    { bg: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))", border: "hsl(var(--secondary))" },
    { bg: "linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.9))", border: "hsl(var(--primary) / 0.8)" },
    { bg: "linear-gradient(135deg, hsl(var(--accent) / 0.8), hsl(var(--secondary) / 0.9))", border: "hsl(var(--accent) / 0.8)" },
    { bg: "linear-gradient(135deg, hsl(var(--secondary) / 0.8), hsl(var(--primary) / 0.9))", border: "hsl(var(--secondary) / 0.8)" },
  ];
  return variations[id % variations.length];
};

interface Habit {
  id: number;
  title: string;
  description?: string;
  categoryId?: number;
  cadence?: "daily" | "weekly";
  targetPerWeek?: number;
  streak?: {
    streak: number;
  };
}

interface HabitLog {
  id: number;
  habitId: number;
  completed: boolean;
  habit?: Habit;
}

export function GlowingOrbHabits() {
  const queryClient = useQueryClient();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data: allHabits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [] } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs/${today}`],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      const response = await fetch(`/api/habit-logs/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
    },
  });

  const isCompleted = (habitId: number) => {
    const log = habitLogs.find((l) => l.habitId === habitId);
    return log?.completed || false;
  };

  const habits = allHabits.map(habit => ({
    ...habit,
    completed: isCompleted(habit.id)
  }));

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

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {completedCount}/{habits.length} holds sent today
        </p>
      </div>

      {/* Climbing Wall - Grid of holds */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {habits.map((habit, index) => {
          const completed = habit.completed;
          const color = getHabitColor(habit.id);

          return (
            <motion.button
              key={habit.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={(e) => handleOrbClick(habit.id, e)}
              className="relative flex flex-col items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Climbing Hold */}
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={completed ? {
                    filter: `brightness(1.2) saturate(1.5) drop-shadow(0 2px 8px ${color.border})`
                  } : {
                    filter: "brightness(0.7) saturate(0.6) grayscale(0.3)"
                  }}
                >
                  <ClimbingHoldSVG
                    variant={index % 3}
                    size={80}
                    gradient={color.bg}
                    borderColor={color.border}
                  />
                </motion.div>

                {/* Chalk mark when completed */}
                {completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm" />
                  </motion.div>
                )}

                {/* Check mark */}
                {completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>

              {/* Habit name */}
              <span className={`text-sm font-medium text-center max-w-[90px] line-clamp-2 ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {habit.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Add new habit */}
      {habits.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No holds on your wall yet</p>
          <a
            href="/habits"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition text-white shadow-lg hover:scale-105 hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            }}
          >
            <Plus className="w-4 h-4" />
            Add Your First Hold
          </a>
        </div>
      )}
    </div>
  );
}
