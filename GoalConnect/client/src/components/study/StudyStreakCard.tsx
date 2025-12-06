import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyStreakCardProps {
  currentStreak: number;
  longestStreak: number;
  missedYesterday?: boolean;
}

export function StudyStreakCard({
  currentStreak,
  longestStreak,
  missedYesterday,
}: StudyStreakCardProps) {
  const isOnFire = currentStreak >= 3;
  const isRecord = currentStreak > 0 && currentStreak === longestStreak;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading text-sm text-forest-cream">RemNote Streak</span>
        {missedYesterday && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            Don't miss twice!
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Current Streak */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isOnFire
                ? "bg-gradient-to-br from-orange-500/30 to-red-500/30"
                : "bg-white/5"
            )}
          >
            <Flame
              className={cn(
                "w-6 h-6",
                isOnFire ? "text-orange-400" : "text-[var(--text-muted)]"
              )}
            />
          </div>
          <div>
            <div
              className={cn(
                "text-2xl font-bold",
                isOnFire ? "text-orange-400" : "text-forest-cream"
              )}
            >
              {currentStreak}
            </div>
            <div className="text-xs text-[var(--text-muted)]">day streak</div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isRecord ? "bg-amber-500/20" : "bg-white/5"
            )}
          >
            <Trophy
              className={cn(
                "w-5 h-5",
                isRecord ? "text-amber-400" : "text-[var(--text-muted)]"
              )}
            />
          </div>
          <div>
            <div
              className={cn(
                "text-lg font-semibold",
                isRecord ? "text-amber-400" : "text-forest-cream"
              )}
            >
              {longestStreak}
            </div>
            <div className="text-xs text-[var(--text-muted)]">best</div>
          </div>
        </div>
      </div>

      {/* Streak milestones */}
      {currentStreak > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex gap-1">
            {[7, 14, 30, 60, 100].map((milestone) => (
              <div
                key={milestone}
                className={cn(
                  "flex-1 h-1.5 rounded-full",
                  currentStreak >= milestone
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-white/10"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-[var(--text-muted)]">
            <span>7</span>
            <span>14</span>
            <span>30</span>
            <span>60</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  );
}
