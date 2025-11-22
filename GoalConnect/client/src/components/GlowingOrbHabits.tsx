import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClimbingHoldSVG } from "./ClimbingHoldSVG";
import { Plus } from "lucide-react";

// Vibrant climbing hold colors - more saturated and varied
const getHabitColor = (id: number) => {
  const variations = [
    { bg: "linear-gradient(135deg, #FF6B6B, #FF8E53)", border: "#FF6B6B", glow: "#FF6B6B" }, // Coral/Orange
    { bg: "linear-gradient(135deg, #4ECDC4, #44A08D)", border: "#4ECDC4", glow: "#4ECDC4" }, // Teal
    { bg: "linear-gradient(135deg, #A855F7, #EC4899)", border: "#A855F7", glow: "#A855F7" }, // Purple/Pink
    { bg: "linear-gradient(135deg, #FBBF24, #F59E0B)", border: "#FBBF24", glow: "#FBBF24" }, // Golden
    { bg: "linear-gradient(135deg, #60A5FA, #3B82F6)", border: "#60A5FA", glow: "#60A5FA" }, // Blue
    { bg: "linear-gradient(135deg, #34D399, #10B981)", border: "#34D399", glow: "#34D399" }, // Emerald
    { bg: "linear-gradient(135deg, #F472B6, #EC4899)", border: "#F472B6", glow: "#F472B6" }, // Pink
    { bg: "linear-gradient(135deg, #FB923C, #EA580C)", border: "#FB923C", glow: "#FB923C" }, // Orange
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
  const [bursts, setBursts] = useState<{ id: number; habitId: number; color: string }[]>([]);
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
    const completed = isCompleted(habitId);
    const color = getHabitColor(habitId);

    // Only burst when completing (not uncompleting)
    if (!completed) {
      const burstId = Date.now();
      setBursts((prev) => [...prev, { id: burstId, habitId, color: color.glow }]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 1000);
    }

    // Toggle habit
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
              onClick={(e) => handleOrbClick(habit.id, e as any)}
              className="relative flex flex-col items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Climbing Hold */}
              <div className="relative w-20 h-20">
                {/* EXPLOSION BURST on click */}
                {bursts.filter(b => b.habitId === habit.id).map(burst => (
                  <div key={burst.id} className="absolute inset-0 pointer-events-none overflow-visible">
                    {/* Ring explosion */}
                    <motion.div
                      className="absolute inset-[-50%] rounded-full"
                      style={{
                        border: `4px solid ${burst.color}`,
                        boxShadow: `0 0 30px ${burst.color}, 0 0 60px ${burst.color}, inset 0 0 30px ${burst.color}`,
                      }}
                      initial={{ scale: 0.3, opacity: 1 }}
                      animate={{ scale: 4, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                    {/* Second ring */}
                    <motion.div
                      className="absolute inset-[-50%] rounded-full"
                      style={{
                        border: `2px solid ${burst.color}`,
                        boxShadow: `0 0 20px ${burst.color}`,
                      }}
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    />
                    {/* Particle explosion - 16 particles */}
                    {[...Array(16)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          background: burst.color,
                          boxShadow: `0 0 15px ${burst.color}, 0 0 30px ${burst.color}`,
                          left: '50%',
                          top: '50%',
                          marginLeft: '-8px',
                          marginTop: '-8px',
                        }}
                        initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [1, 2, 0],
                          x: Math.cos(i * 22.5 * Math.PI / 180) * 150,
                          y: Math.sin(i * 22.5 * Math.PI / 180) * 150,
                          opacity: [1, 1, 0],
                        }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                    {/* Inner sparkle particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`inner-${i}`}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: '#fff',
                          boxShadow: `0 0 10px #fff, 0 0 20px ${burst.color}`,
                          left: '50%',
                          top: '50%',
                          marginLeft: '-4px',
                          marginTop: '-4px',
                        }}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1.5, 0],
                          x: Math.cos((i * 45 + 22.5) * Math.PI / 180) * 60,
                          y: Math.sin((i * 45 + 22.5) * Math.PI / 180) * 60,
                          opacity: [1, 1, 0],
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                          delay: 0.05,
                        }}
                      />
                    ))}
                    {/* Flash */}
                    <motion.div
                      className="absolute inset-[-100%] rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${burst.color} 0%, transparent 50%)`,
                      }}
                      initial={{ opacity: 1, scale: 0.3 }}
                      animate={{ opacity: 0, scale: 3 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                ))}

                {/* Intense glow layer when completed */}
                {completed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-[-50%] rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${color.border} 0%, transparent 70%)`,
                      filter: 'blur(20px)',
                    }}
                  />
                )}

                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={completed ? {
                    filter: `brightness(1.4) saturate(1.8) drop-shadow(0 0 20px ${color.border}) drop-shadow(0 0 40px ${color.border})`
                  } : {
                    filter: "brightness(0.5) saturate(0.4) grayscale(0.5)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ClimbingHoldSVG
                    variant={index % 3}
                    size={80}
                    gradient={color.bg}
                    borderColor={color.border}
                  />
                </motion.div>

                {/* Sparkles burst effect */}
                {completed && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: color.glow,
                          boxShadow: `0 0 6px ${color.glow}`,
                          left: '50%',
                          top: '50%',
                        }}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1, 0],
                          x: [0, Math.cos(i * 60 * Math.PI / 180) * 50],
                          y: [0, Math.sin(i * 60 * Math.PI / 180) * 50],
                          opacity: [1, 1, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          delay: i * 0.05,
                          repeat: Infinity,
                          repeatDelay: 8,
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Shimmer effect on completed */}
                {completed && (
                  <motion.div
                    className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)`,
                      }}
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 10,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                )}

                {/* Check mark */}
                {completed && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
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
