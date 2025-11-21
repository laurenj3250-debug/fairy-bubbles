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
  metrics?: Array<{
    id: number;
    label: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    color: string;
  }>;
}

/**
 * Pitch - A single habit represented as a climbing hold on the vertical route
 * Uses YDS climbing grades for difficulty visualization
 */
export function Pitch({ habit, completed, streak = 0, onClick, index, metrics }: PitchProps) {
  // Map habit difficulty to climbing difficulty (default to moderate if not set)
  // Ensure the difficulty key is valid, otherwise default to moderate
  let difficultyKey: Difficulty = "moderate";
  if (habit.difficulty && habit.difficulty in DIFFICULTY_COLORS) {
    difficultyKey = habit.difficulty as Difficulty;
  }
  const difficulty = DIFFICULTY_COLORS[difficultyKey];

  // Check if this is a cumulative goal
  const isCumulative = habit.goalType === "cumulative";
  const hasMetrics = metrics && metrics.length > 0;

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
          "w-full text-left px-8 py-6 rounded-3xl transition-all duration-300 cursor-pointer relative overflow-hidden",
          "border-2 shadow-xl hover:shadow-2xl",
          completed
            ? "bg-card/30 border-success/40 opacity-75"
            : "bg-card/70 backdrop-blur-md hover:bg-card/90 hover:translate-x-2"
        )}
        style={{
          borderLeftWidth: "8px",
          borderLeftColor: difficulty.border,
          boxShadow: completed
            ? `0 4px 20px ${difficulty.border}40`
            : `0 4px 16px rgba(0,0,0,0.1), inset 0 0 0 1px ${difficulty.border}20`
        }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`${habit.title}, ${difficulty.label}, ${completed ? 'completed' : 'not completed'}${streak > 0 ? `, ${streak} day streak` : ''}`}
        aria-pressed={completed}
        role="button"
        tabIndex={0}
        whileHover={{ scale: completed ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
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
                "text-xl font-black mb-3 transition-all",
                completed ? "line-through text-muted-foreground" : "text-foreground"
              )}
            >
              {habit.title}
            </div>

            {/* Meta Information Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-md text-sm"
                style={{
                  backgroundColor: `${difficulty.bg}25`,
                  border: `2px solid ${difficulty.border}`,
                  color: difficulty.text,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: difficulty.border }}
                />
                <span>{difficulty.label}</span>
              </div>

              {/* Streak Badge */}
              {streak > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 text-orange-600 font-bold border-2 border-orange-500/30 shadow-md text-sm">
                  <span className="text-lg">🔥</span>
                  <span>{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>
              )}

              {/* New Habit Badge */}
              {streak === 0 && !completed && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 text-blue-600 font-bold border-2 border-blue-500/30 shadow-md text-sm">
                  <span className="text-lg">✨</span>
                  <span>New!</span>
                </div>
              )}
            </div>

            {/* Cumulative Goal Progress */}
            {isCumulative && hasMetrics && (
              <div className="mt-4 space-y-2">
                {/* Primary Goal Achievement */}
                {habit.primaryGoalAchieved && (
                  <div className="flex items-center gap-2 text-success font-semibold text-sm mb-2">
                    <span className="text-xl">🎯</span>
                    <span>{habit.title} — ACHIEVED!</span>
                    {habit.primaryGoalAchievedDate && (
                      <span className="text-xs text-muted-foreground">
                        on {new Date(habit.primaryGoalAchievedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Multi-Metric Progress Bars */}
                {metrics.map((metric) => {
                  const percentage = Math.min(100, Math.round((metric.currentValue / metric.targetValue) * 100));
                  const isComplete = percentage >= 100;

                  return (
                    <div key={metric.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{metric.label}</span>
                        <span className={cn("font-bold", isComplete ? "text-success" : "text-foreground")}>
                          {metric.currentValue}/{metric.targetValue} {metric.unit} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-card/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: metric.color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Days Left / Deadline */}
                {habit.targetDate && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {(() => {
                      const today = new Date();
                      const deadline = new Date(habit.targetDate);
                      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysLeft < 0) {
                        return <span className="text-destructive">⚠️ {Math.abs(daysLeft)} days overdue</span>;
                      } else if (daysLeft === 0) {
                        return <span className="text-warning">🔔 Due today!</span>;
                      } else {
                        return <span>📅 {daysLeft} days left until {new Date(habit.targetDate).toLocaleDateString()}</span>;
                      }
                    })()}
                  </div>
                )}
              </div>
            )}
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
