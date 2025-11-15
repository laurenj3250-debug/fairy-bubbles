import { GlassCard } from "@/components/ui/GlassCard";
import { Check, Flame, Mountain } from "lucide-react";
import type { HabitLog } from "@shared/schema";

interface LittleWinsStripProps {
  todayCompletedCount: number;
  currentStreak: number;
  expeditionProgress: number;
  habitLogs: HabitLog[];
}

interface WinPill {
  icon: typeof Check;
  text: string;
  color: string;
}

/**
 * LittleWinsStrip - Horizontal strip showing today's achievements
 *
 * Features:
 * - Slim card with achievement pills
 * - Habits done, streak, expedition progress
 * - Celebrates small wins
 */
export function LittleWinsStrip({
  todayCompletedCount,
  currentStreak,
  expeditionProgress,
  habitLogs
}: LittleWinsStripProps) {
  const wins: WinPill[] = [];

  // Habit completion
  if (todayCompletedCount > 0) {
    wins.push({
      icon: Check,
      text: `${todayCompletedCount} habit${todayCompletedCount > 1 ? 's' : ''} done`,
      color: "bg-primary/20 text-primary border-primary/30"
    });
  }

  // Streak
  if (currentStreak > 0) {
    wins.push({
      icon: Flame,
      text: `${currentStreak}-day streak`,
      color: "bg-warning/20 text-warning border-warning/30"
    });
  }

  // Expedition progress milestone
  if (expeditionProgress > 0) {
    wins.push({
      icon: Mountain,
      text: `${expeditionProgress}% expedition complete`,
      color: "bg-secondary/20 text-secondary border-secondary/30"
    });
  }

  // If no wins, show encouraging message
  if (wins.length === 0) {
    return (
      <GlassCard className="p-4">
        <p className="text-center text-sm text-muted-foreground">
          Start your day - complete a habit to see your wins here!
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-foreground mr-2">
          Today's Wins:
        </span>
        {wins.map((win, index) => {
          const Icon = win.icon;
          return (
            <div
              key={index}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${win.color}`}
            >
              <Icon className="w-4 h-4" />
              <span>{win.text}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
