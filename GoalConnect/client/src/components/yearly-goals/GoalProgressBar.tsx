import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function GoalProgressBar({ value, max, className, showLabel = false }: GoalProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  // Color based on progress
  const getColorClass = () => {
    if (percent >= 100) return "bg-emerald-500";
    if (percent >= 75) return "bg-lime-500";
    if (percent >= 50) return "bg-yellow-500";
    if (percent >= 25) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 ease-out rounded-full", getColorClass())}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>{value} / {max}</span>
          <span>{percent}%</span>
        </div>
      )}
    </div>
  );
}
