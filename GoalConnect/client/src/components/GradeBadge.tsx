import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GradeBadge({ grade, className, size = "md" }: GradeBadgeProps) {
  // Parse grade to determine difficulty color
  const gradeNumber = parseFloat(grade.replace("5.", ""));

  let colorClass = "text-green-400 border-green-400/30 bg-green-500/10";
  if (gradeNumber >= 11) {
    colorClass = "text-red-400 border-red-400/30 bg-red-500/10";
  } else if (gradeNumber >= 10) {
    colorClass = "text-orange-400 border-orange-400/30 bg-orange-500/10";
  } else if (gradeNumber >= 9) {
    colorClass = "text-yellow-400 border-yellow-400/30 bg-yellow-500/10";
  }

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1 text-sm";

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full border-2 font-bold transition-all",
      colorClass,
      sizeClass,
      className
    )}>
      <span>{grade}</span>
    </div>
  );
}
