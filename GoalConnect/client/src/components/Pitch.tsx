import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Habit } from "@shared/schema";

// YDS Climbing Difficulty Color System
export const DIFFICULTY_COLORS = {
  easy: {
    bg: "#4ade80",
    bgLight: "#86efac",
    border: "#22c55e",
    text: "#166534",
    label: "5.6 Easy",
    range: "5.0-5.6"
  },
  moderate: {
    bg: "#fbbf24",
    bgLight: "#fcd34d",
    border: "#f59e0b",
    text: "#92400e",
    label: "5.9 Moderate",
    range: "5.7-5.9"
  },
  hard: {
    bg: "#fb923c",
    bgLight: "#fdba74",
    border: "#f97316",
    text: "#9a3412",
    label: "5.11c Hard",
    range: "5.10-5.11"
  },
  expert: {
    bg: "#ef4444",
    bgLight: "#f87171",
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
  // Ensure the difficulty key is valid, otherwise default to moderate
  let difficultyKey: Difficulty = "moderate";
  if (habit.difficulty && habit.difficulty in DIFFICULTY_COLORS) {
    difficultyKey = habit.difficulty as Difficulty;
  }
  const difficulty = DIFFICULTY_COLORS[difficultyKey];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative mb-3"
    >
      {/* Clickable Pitch Card */}
      <motion.button
        className={cn(
          "w-full text-left px-6 py-5 rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden",
          "border-2 shadow-lg hover:shadow-xl",
          completed
            ? "bg-card/40 border-success/30 opacity-80"
            : "bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:translate-x-1"
        )}
        style={{
          borderLeftWidth: "6px",
          borderLeftColor: difficulty.border,
        }}
        onClick={onClick}
        whileHover={{ scale: completed ? 1 : 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Background gradient accent */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${difficulty.bg} 0%, transparent 100%)`
          }}
        />

        {/* Pitch Content */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Climbing Hold Icon */}
          <div className="flex-shrink-0 mt-1">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                completed ? "shadow-lg" : "shadow-md hover:shadow-lg"
              )}
              style={{
                background: completed
                  ? `linear-gradient(135deg, ${difficulty.bg}, ${difficulty.bgLight})`
                  : `linear-gradient(135deg, ${difficulty.border}, ${difficulty.bg})`,
                transform: completed ? "rotate(0deg)" : undefined,
              }}
            >
              {completed ? (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 text-white drop-shadow-md"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                <div className="w-6 h-6 rounded-full border-3 border-white/40" />
              )}
            </div>
          </div>

          {/* Habit Info */}
          <div className="flex-1 min-w-0">
            {/* Habit Name */}
            <div
              className={cn(
                "text-lg font-bold mb-2 transition-all",
                completed ? "line-through text-muted-foreground" : "text-foreground"
              )}
            >
              {habit.title}
            </div>

            {/* Meta Information Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Difficulty Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold shadow-sm"
                style={{
                  backgroundColor: `${difficulty.bg}15`,
                  borderLeft: `3px solid ${difficulty.border}`,
                  color: difficulty.text,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: difficulty.border }}
                />
                <span>{difficulty.label}</span>
              </div>

              {/* Streak Badge */}
              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 font-medium border border-orange-500/20">
                  <span className="text-base">🔥</span>
                  <span>{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* New Habit Badge */}
              {streak === 0 && !completed && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 font-medium border border-blue-500/20">
                  <span className="text-base">✨</span>
                  <span>New!</span>
                </div>
              )}
            </div>
          </div>

          {/* Completion Indicator */}
          {completed && (
            <div className="flex-shrink-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${difficulty.bg}20`,
                  border: `2px solid ${difficulty.border}`
                }}
              >
                <span className="text-2xl">✓</span>
              </motion.div>
            </div>
          )}
        </div>

        {/* Chalk mark effect when completed */}
        {completed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white pointer-events-none blur-2xl"
          />
        )}
      </motion.button>
    </motion.div>
  );
}
