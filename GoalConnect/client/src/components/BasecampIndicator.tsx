import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BasecampIndicatorProps {
  progressPercentage: number; // 0-100
  className?: string;
}

export function BasecampIndicator({ progressPercentage, className }: BasecampIndicatorProps) {
  // Glow intensity based on progress
  const glowIntensity = useMemo(() => {
    return Math.min(progressPercentage / 100, 1);
  }, [progressPercentage]);

  const flameColor = useMemo(() => {
    if (progressPercentage >= 80) return "#F2C94C"; // summit gold
    if (progressPercentage >= 50) return "#46B3A9"; // alpine teal
    return "#E6EEF2"; // fog/ivory
  }, [progressPercentage]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Campfire glow */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${flameColor}40 0%, transparent 70%)`,
            transform: `scale(${1 + glowIntensity * 0.5})`,
            opacity: glowIntensity,
          }}
        />

        {/* Animated campfire */}
        <div className="relative text-lg animate-pulse-subtle">
          {progressPercentage >= 80 ? "🔥" : progressPercentage >= 30 ? "🪵" : "⛺"}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Basecamp
        </div>
        <div className="text-xs font-bold" style={{ color: flameColor }}>
          {progressPercentage >= 80 ? "Burning Bright" : progressPercentage >= 30 ? "Warming Up" : "Just Started"}
        </div>
      </div>
    </div>
  );
}
