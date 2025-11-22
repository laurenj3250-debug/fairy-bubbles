import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HabitHeatmapCompact } from "./HabitHeatmapCompact";
import { HabitScoreIndicator } from "./HabitScoreIndicator";
import { Check, TrendingUp, TrendingDown, Minus, Edit2, Trash2 } from "lucide-react";
import type { Habit, HabitLog } from "@shared/schema";
import confetti from "canvas-confetti";

interface HabitCardProps {
  habit: Habit & {
    history?: Array<{ date: string; completed: boolean }>;
  };
  isCompletedToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isToggling?: boolean;
}

/**
 * Dopamine-maximizing habit card with:
 * - Large check button with satisfying animation
 * - 4-week heatmap
 * - Completion rate
 * - Trend indicator
 * - Score (uHabit-style strength)
 */
export function HabitCard({
  habit,
  isCompletedToday,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
}: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate completion rate from history
  const history = habit.history || [];
  const completedDays = history.filter(h => h.completed).length;
  const totalDays = history.length || 1;
  const completionRate = Math.round((completedDays / totalDays) * 100);

  // Calculate trend (compare last 7 days vs previous 7 days)
  const last7 = history.slice(-7);
  const prev7 = history.slice(-14, -7);
  const last7Rate = last7.filter(h => h.completed).length / Math.max(last7.length, 1);
  const prev7Rate = prev7.filter(h => h.completed).length / Math.max(prev7.length, 1);
  const trend = last7Rate > prev7Rate ? "up" : last7Rate < prev7Rate ? "down" : "flat";

  // Get score from habit (stored as decimal string)
  const score = parseFloat(habit.currentScore || "0");

  const handleToggle = () => {
    if (isToggling) return;

    // Only show confetti when completing (not uncompleting)
    if (!isCompletedToday) {
      setIsAnimating(true);

      // Confetti burst!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD700'],
      });

      setTimeout(() => setIsAnimating(false), 600);
    }

    onToggle();
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-400" : "text-foreground/50";

  return (
    <div
      className={cn(
        "bg-background/60 backdrop-blur-sm border border-foreground/10 rounded-2xl p-5 transition-all",
        "hover:border-foreground/20 hover:shadow-lg",
        isCompletedToday && "border-primary/30 bg-primary/5"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Check Button */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
              "border-2 hover:scale-110 active:scale-95",
              isCompletedToday
                ? "bg-primary border-primary text-primary-foreground"
                : "border-foreground/20 hover:border-primary/50 text-foreground/40 hover:text-primary",
              isAnimating && "animate-bounce",
              isToggling && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isCompletedToday ? "Mark incomplete" : "Mark complete"}
          >
            <Check className={cn("w-5 h-5 transition-all", isCompletedToday && "stroke-[3]")} />
          </button>

          {/* Habit Name & Score */}
          <div>
            <h3 className="font-semibold text-foreground text-lg">{habit.title}</h3>
            {score > 0 && (
              <HabitScoreIndicator score={score} size="sm" className="mt-1" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/40 hover:text-foreground"
            onClick={onEdit}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/40 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-4">
        <HabitHeatmapCompact history={history} />
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-sm">
        {/* Completion Rate */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground/60">All-time:</span>
          <span className="font-semibold text-foreground">{completionRate}%</span>
        </div>

        {/* Trend */}
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-xs font-medium">
            {trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Steady"}
          </span>
        </div>
      </div>
    </div>
  );
}
