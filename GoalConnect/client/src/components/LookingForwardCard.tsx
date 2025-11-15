import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Mountain, Heart, Coffee, Plane, Star, Plus } from "lucide-react";
import { useState } from "react";
import type { DreamScrollItem } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LookingForwardCardProps {
  dreamScrollItems: DreamScrollItem[];
  selectedCategories?: string[]; // Which Dream Scroll categories to show
  onAddItem?: () => void;
}

// Icon mapping for different categories
const categoryIcons: Record<string, typeof Mountain> = {
  do: Mountain,
  visit: Plane,
  see: Star,
  experience: Heart,
  learn: Coffee,
  buy: Star,
  music: Heart,
};

/**
 * LookingForwardCard - Shows things you're excited about from Dream Scroll
 *
 * Features:
 * - Pulls from Dream Scroll journal system
 * - Widget-style: select which categories to display
 * - Icons + short text
 * - No checkboxes (joy list, not task list)
 */
export function LookingForwardCard({
  dreamScrollItems,
  selectedCategories = ["do", "visit", "experience"],
  onAddItem
}: LookingForwardCardProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Filter to selected categories and uncompleted items
  const displayItems = dreamScrollItems
    .filter(item =>
      !item.completed &&
      selectedCategories.includes(item.category)
    )
    .sort((a, b) => {
      // Sort by priority (high first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5); // Limit to 5 items

  return (
    <GlassCard className="h-full">
      <GlassCardHeader>
        <GlassCardTitle>Looking Forward To</GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent className="space-y-2">
        {displayItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nothing added yet</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const Icon = categoryIcons[item.category] || Star;
            const isHighPriority = item.priority === "high";

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  "hover:bg-white/50 hover:shadow-sm",
                  isHighPriority && "bg-primary/5"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                  isHighPriority ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isHighPriority && "text-primary"
                  )}>
                    {item.title}
                  </p>
                  {item.description && hoveredId === item.id && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Priority indicator */}
                {isHighPriority && (
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })
        )}

        {/* Add Button */}
        {onAddItem && (
          <button
            onClick={onAddItem}
            className="w-full mt-4 p-2 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-white/50 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Something to Look Forward To</span>
          </button>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
