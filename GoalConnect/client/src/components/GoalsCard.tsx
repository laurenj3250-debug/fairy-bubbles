import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Goal } from "@shared/schema";

interface GoalsCardProps {
  goals: Goal[];
}

type VisualizationType = "segments" | "dots";

// Configure which visualization each goal uses
const goalVisualizationMap: Record<string, VisualizationType> = {
  // You can customize this per goal type/category
  // For now, we'll alternate or use a default
};

/**
 * GoalsCard - Shows goal progress with dual visualization options
 *
 * Features:
 * - Segmented horizontal bars (pitch-style)
 * - Milestone dots on line
 * - Different goals can use different visualizations
 */
export function GoalsCard({ goals }: GoalsCardProps) {
  // Filter to active goals
  const activeGoals = goals.filter(g => g.currentValue < g.targetValue);

  return (
    <GlassCard className="h-full">
      <GlassCardHeader>
        <GlassCardTitle>Goals</GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No active goals</p>
          </div>
        ) : (
          activeGoals.map((goal, index) => {
            const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
            // Alternate between visualizations
            const visualType: VisualizationType = index % 2 === 0 ? "segments" : "dots";

            return (
              <div key={goal.id} className="space-y-2">
                {/* Goal Name and Progress Text */}
                <div className="flex items-baseline justify-between">
                  <h4 className="font-semibold text-sm text-foreground">
                    {goal.title}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {goal.currentValue}/{goal.targetValue} {goal.unit} · {progress}%
                  </span>
                </div>

                {/* Visual Track */}
                {visualType === "segments" ? (
                  <SegmentedBar
                    current={goal.currentValue}
                    target={goal.targetValue}
                    segments={10}
                  />
                ) : (
                  <MilestoneDots
                    current={goal.currentValue}
                    target={goal.targetValue}
                    milestones={8}
                  />
                )}
              </div>
            );
          })
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

/**
 * SegmentedBar - Progress bar divided into segments like climbing pitches
 */
function SegmentedBar({
  current,
  target,
  segments
}: {
  current: number;
  target: number;
  segments: number;
}) {
  const progress = current / target;
  const completedSegments = Math.floor(progress * segments);

  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-3 rounded-sm transition-all duration-300",
            i < completedSegments
              ? "bg-primary shadow-sm"
              : "bg-muted border border-border/30"
          )}
        />
      ))}
    </div>
  );
}

/**
 * MilestoneDots - Progress shown as dots on a line
 */
function MilestoneDots({
  current,
  target,
  milestones
}: {
  current: number;
  target: number;
  milestones: number;
}) {
  const progress = current / target;
  const completedDots = Math.floor(progress * milestones);

  return (
    <div className="relative">
      {/* Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

      {/* Dots */}
      <div className="relative flex justify-between items-center">
        {Array.from({ length: milestones }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full border-2 transition-all duration-300 z-10",
              i < completedDots
                ? "bg-primary border-primary shadow-md scale-110"
                : "bg-white border-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
