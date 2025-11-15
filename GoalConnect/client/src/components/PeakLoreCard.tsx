import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { getTodaysInspiration } from "@/lib/climbingInspiration";

/**
 * PeakLoreCard - Daily mountain fact/inspiration
 *
 * Features:
 * - Rotates daily climbing inspiration
 * - Mountain locations, facts, techniques, quotes
 * - Pulls from existing climbing inspiration system
 */
export function PeakLoreCard() {
  const inspiration = getTodaysInspiration();

  // Style based on type (using theme colors)
  const typeStyles = {
    location: "bg-primary/10 border-primary/30",
    fact: "bg-secondary/10 border-secondary/30",
    technique: "bg-accent/10 border-accent/30",
    quote: "bg-warning/10 border-warning/30",
  };

  const typeLabels = {
    location: "Peak of the Day",
    fact: "Climbing Lore",
    technique: "Technique Tip",
    quote: "Climbing Wisdom",
  };

  return (
    <GlassCard className="h-full">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle>{typeLabels[inspiration.type]}</GlassCardTitle>
          <span className="text-2xl">{inspiration.emoji}</span>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-3">
        {/* Title */}
        <h4 className="font-bold text-foreground text-base">
          {inspiration.title}
        </h4>

        {/* Content */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {inspiration.content}
        </p>

        {/* Type Badge */}
        <div className="pt-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${typeStyles[inspiration.type]}`}>
            {inspiration.type.charAt(0).toUpperCase() + inspiration.type.slice(1)}
          </span>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
