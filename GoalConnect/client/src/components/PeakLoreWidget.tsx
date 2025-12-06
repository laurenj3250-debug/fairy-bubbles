import { getTodaysInspiration } from "@/lib/climbingInspiration";
import { Mountain, Lightbulb, Quote, MapPin } from "lucide-react";

/**
 * PeakLoreWidget - Compact daily mountain fact for widget slot
 * Stripped down version of PeakLoreCard for dashboard grid
 */
export function PeakLoreWidget() {
  const inspiration = getTodaysInspiration();

  const typeIcons = {
    location: MapPin,
    fact: Mountain,
    technique: Lightbulb,
    quote: Quote,
  };

  const typeColors = {
    location: { icon: "#4ECDC4", bg: "rgba(78, 205, 196, 0.15)", border: "rgba(78, 205, 196, 0.3)" },
    fact: { icon: "#A855F7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" },
    technique: { icon: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.3)" },
    quote: { icon: "#60A5FA", bg: "rgba(96, 165, 250, 0.15)", border: "rgba(96, 165, 250, 0.3)" },
  };

  const typeLabels = {
    location: "Place to Explore",
    fact: "Fun Fact",
    technique: "Pro Tip",
    quote: "Daily Inspiration",
  };

  const Icon = typeIcons[inspiration.type];
  const colors = typeColors[inspiration.type];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: colors.icon }} />
          <h3 className="text-sm font-semibold">{typeLabels[inspiration.type]}</h3>
        </div>
        <span className="text-base">{inspiration.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2">
        <h4
          className="text-sm font-bold"
          style={{ color: colors.icon }}
        >
          {inspiration.title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {inspiration.content}
        </p>
      </div>

      {/* Type Badge */}
      <div className="mt-2">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.icon,
          }}
        >
          {inspiration.type.charAt(0).toUpperCase() + inspiration.type.slice(1)}
        </span>
      </div>
    </div>
  );
}
