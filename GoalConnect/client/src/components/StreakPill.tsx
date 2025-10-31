import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakPillProps {
  streak: number;
  label?: string;
  className?: string;
  animate?: boolean;
}

export function StreakPill({ streak, label, className, animate = false }: StreakPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 h-8 rounded-full bg-primary/10 border border-primary/20",
        animate && streak % 7 === 0 && streak > 0 && "animate-pulse",
        className
      )}
      data-testid="streak-pill"
    >
      <Flame className="w-4 h-4 text-primary" />
      <span className="text-sm font-bold tabular-nums text-primary" data-testid="streak-number">
        {streak}
      </span>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
