import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClimbingHoldSVG } from "./ClimbingHoldSVG";
import { Plus } from "lucide-react";

// Mountain-themed color palette - same as HabitsMountain page
const habitColors = [
  { bg: "linear-gradient(135deg, #475569 0%, #334155 100%)", name: "Stone Peak", border: "#64748b" },
  { bg: "linear-gradient(135deg, #64748b 0%, #475569 100%)", name: "Granite Ridge", border: "#94a3b8" },
  { bg: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", name: "Forest Base", border: "#14b8a6" },
  { bg: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", name: "Glacier Ice", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0e7490 0%, #155e75 100%)", name: "Deep Ice", border: "#06b6d4" },
  { bg: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", name: "Sky Ridge", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", name: "Snowmelt Stream", border: "#22d3ee" },
  { bg: "linear-gradient(135deg, #78716c 0%, #57534e 100%)", name: "Rocky Cliff", border: "#a8a29e" },
];

// Get consistent color for a habit based on its ID
const getHabitColor = (id: number) => {
  return habitColors[id % habitColors.length];
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

  // Get the first 6 habits for display
  const displayHabits = habits.slice(0, 6);
  const completedCount = habits.filter(h => h.completed).length;

  return (
    <div className="space-y-4">

      {/* Climbing Route - Horizontal row of big holds */}
      <div className="flex gap-6 justify-center p-4 flex-wrap">
        {displayHabits.map((habit, index) => {
          const completed = habit.completed;
          const streakDays = habit.streak?.streak || 0;
          const color = getHabitColor(habit.id);

          return (
            <motion.div
              key={habit.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-3 cursor-pointer"
              onClick={(e) => handleOrbClick(habit.id, e)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Hold with name centered ON IT */}
              <div className="relative w-72 h-48 flex items-center justify-center">
                {/* The climbing hold - THE MAIN OBJECT */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={completed ? {
                    filter: [
                      `brightness(1.8) saturate(2) drop-shadow(0 0 25px ${color.border})`,
                      `brightness(2.2) saturate(2.5) drop-shadow(0 0 40px ${color.border})`,
                      `brightness(1.8) saturate(2) drop-shadow(0 0 25px ${color.border})`,
                    ]
                  } : {
                    filter: "brightness(0.6) saturate(0.5)"
                  }}
                  transition={{ duration: 1.2, repeat: completed ? Infinity : 0, repeatDelay: 0.5 }}
                >
                  <ClimbingHoldSVG
                    variant={index}
                    size={280}
                    gradient={color.bg}
                    borderColor={color.border}
                  />
                </motion.div>

                {/* Habit name centered ON the hold */}
                <div
                  className="relative z-20 px-4 py-2 text-base font-bold text-center drop-shadow-2xl pointer-events-none max-w-[150px]"
                  style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.3)' }}
                >
                  {habit.title}
                </div>

              </div>

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
