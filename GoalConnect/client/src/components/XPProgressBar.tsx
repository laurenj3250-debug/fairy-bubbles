import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelProgress {
  level: number;
  grade: string;
  totalXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

export function XPProgressBar() {
  const { data: progress } = useQuery<LevelProgress>({
    queryKey: ["/api/user/level-progress"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (!progress) {
    return (
      <div className="bg-card/60 backdrop-blur-sm border border-card-border rounded-xl p-3 animate-pulse">
        <div className="h-4 bg-muted/20 rounded w-32 mb-2" />
        <div className="h-2 bg-muted/20 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-card-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Level and Grade */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-[hsl(var(--accent))]/30 flex items-center justify-center border border-primary/30">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Level {progress.level}</div>
            <div className="text-sm font-bold text-foreground">{progress.grade}</div>
          </div>
        </div>

        {/* XP Numbers */}
        <div className="text-right">
          <div className="text-xs font-semibold text-primary">
            {progress.xpInCurrentLevel} / {progress.xpNeededForNextLevel} XP
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.progressPercent}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-primary via-[hsl(var(--accent))] to-orange-400 rounded-full transition-all duration-500",
            progress.progressPercent > 0 && "animate-in slide-in-from-left"
          )}
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>

      {/* Next Level Hint */}
      {progress.progressPercent >= 80 && (
        <div className="mt-2 text-xs text-center text-primary/80 animate-pulse">
          Almost there! Next grade incoming...
        </div>
      )}
    </div>
  );
}
