import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Habit } from "@shared/schema";

// YDS Climbing Difficulty Color System
export const DIFFICULTY_COLORS = {
  easy: {
    bg: "#4ade80",
    border: "#22c55e",
    text: "#166534",
    label: "5.6 Easy",
    range: "5.0-5.6"
  },
  moderate: {
    bg: "#fbbf24",
    border: "#f59e0b",
    text: "#92400e",
    label: "5.9 Moderate",
    range: "5.7-5.9"
  },
  hard: {
    bg: "#fb923c",
    border: "#f97316",
    text: "#9a3412",
    label: "5.11c Hard",
    range: "5.10-5.11"
  },
  expert: {
    bg: "#ef4444",
    border: "#dc2626",
    text: "#991b1b",
    label: "5.13a Expert",
    range: "5.12+"
  },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_COLORS;

interface PitchProps {
  habit: Habit;
  completed: boolean;
  streak?: number;
  onClick: () => void;
  index: number;
}

/**
 * Pitch - A single habit represented as a climbing hold on the vertical route
 * Uses YDS climbing grades for difficulty visualization
 */
export function Pitch({ habit, completed, streak = 0, onClick, index }: PitchProps) {
  // Map habit difficulty to climbing difficulty (default to moderate if not set)
  const difficultyKey = (habit.difficulty || "moderate") as Difficulty;
  const difficulty = DIFFICULTY_COLORS[difficultyKey];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "pitch relative mb-4 px-5 py-4 rounded-xl border-l-4 transition-all duration-300 cursor-pointer",
        "bg-card/30 hover:bg-card/50 backdrop-blur-sm",
        completed && "opacity-70 bg-success/10"
      )}
      style={{
        borderLeftColor: difficulty.border,
      }}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Climbing Hold Indicator */}
      <div
        className={cn(
          "absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-3 transition-all",
          completed ? "bg-success border-success shadow-lg shadow-success/50" : "bg-card/80 backdrop-blur-sm"
        )}
        style={{
          borderColor: completed ? difficulty.bg : difficulty.border,
          borderWidth: "3px",
        }}
      />

      {/* Pitch Content */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Habit Name */}
          <div
            className={cn(
              "text-lg font-semibold mb-1",
              completed ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {habit.title}
          </div>

          {/* Meta Information */}
          <div className="flex items-center gap-4 text-sm">
            {/* Difficulty Badge */}
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium"
              style={{
                backgroundColor: `${difficulty.bg}20`,
                color: difficulty.text,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: difficulty.border }} />
              {difficulty.label}
            </span>

            {/* Streak if exists */}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                🔥 {streak} day streak
              </span>
            )}

            {/* New Habit Badge */}
            {streak === 0 && !completed && (
              <span className="text-xs text-muted-foreground font-medium">New habit!</span>
            )}
          </div>
        </div>

        {/* Completion Check */}
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0"
          >
            <span className="text-3xl" style={{ color: difficulty.bg }}>
              ✓
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
