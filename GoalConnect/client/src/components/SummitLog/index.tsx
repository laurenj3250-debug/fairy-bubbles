import { Mountain, Clock, Target, Check, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSummitLogData } from "./useSummitLogData";

/**
 * Summit Log - Monthly Accomplishments Trophy Case
 *
 * Shows:
 * - Conquered items (goals 100%, habits 80%+, hard tasks)
 * - ONE focus area (weakest link)
 * - Month-over-month comparison
 * - Days remaining countdown with urgency coloring
 */
export function SummitLog() {
  const {
    monthName,
    daysRemaining,
    conquered,
    focusArea,
    comparison,
    isLoading,
  } = useSummitLogData();

  // Countdown urgency colors
  const getCountdownStyle = () => {
    if (daysRemaining <= 1) return "text-red-500 animate-pulse";
    if (daysRemaining <= 3) return "text-orange-500";
    if (daysRemaining <= 7) return "text-amber-500";
    if (daysRemaining <= 14) return "text-foreground/70";
    return "text-foreground/50";
  };

  // Badge styles by type
  const getBadgeStyle = (type: "goal" | "habit" | "task") => {
    switch (type) {
      case "goal":
        return "bg-primary/20 text-primary";
      case "habit":
        return "bg-accent/20 text-accent";
      case "task":
        return "bg-amber-500/20 text-amber-600";
    }
  };

  // Icon by type
  const getIcon = (type: "goal" | "habit" | "task") => {
    switch (type) {
      case "goal":
        return <Mountain className="w-4 h-4 text-primary" />;
      case "habit":
        return <Target className="w-4 h-4 text-accent" />;
      case "task":
        return <Check className="w-4 h-4 text-amber-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-foreground/10 rounded w-48" />
          <div className="space-y-2">
            <div className="h-8 bg-foreground/10 rounded" />
            <div className="h-8 bg-foreground/10 rounded" />
            <div className="h-8 bg-foreground/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-xl p-5 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: "radial-gradient(circle at top right, hsl(var(--primary)), transparent 60%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {monthName} Summit Log
            </h3>
          </div>
          <div className={cn("flex items-center gap-1.5 text-sm font-medium", getCountdownStyle())}>
            <Clock className="w-4 h-4" />
            <span>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left</span>
          </div>
        </div>

        {/* Conquered Section */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">
            Conquered This Month
          </h4>

          {conquered.length === 0 ? (
            <p className="text-sm text-foreground/60 italic py-2">
              Nothing conquered yet. You've got {daysRemaining} days!
            </p>
          ) : (
            <div className="space-y-2">
              {conquered.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  {getIcon(item.type)}
                  <span className="text-sm text-foreground/80 flex-1 truncate">
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                      getBadgeStyle(item.badgeType)
                    )}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus Area */}
        {focusArea ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-semibold text-amber-600 uppercase">
                Focus Area
              </h4>
            </div>
            <p className="text-sm text-foreground/80">{focusArea.message}</p>
          </div>
        ) : conquered.length > 0 ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
            <p className="text-sm text-green-600 text-center">
              No weak spots! Keep crushing it.
            </p>
          </div>
        ) : null}

        {/* Comparison Footer */}
        {comparison && (
          <div className="border-t border-foreground/10 pt-3 flex items-center gap-2 text-xs text-foreground/60">
            <span className="font-medium">VS {comparison.vsMonth.toUpperCase()}:</span>
            <span className="flex items-center gap-1">
              {comparison.overall >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={comparison.overall >= 0 ? "text-green-500" : "text-red-500"}>
                {comparison.overall >= 0 ? "+" : ""}{comparison.overall}% overall
              </span>
            </span>
            <span className="text-foreground/30">•</span>
            <span className={comparison.habits >= 0 ? "text-green-500" : "text-red-500"}>
              Habits {comparison.habits >= 0 ? "+" : ""}{comparison.habits}%
            </span>
            {comparison.goalsCompleted !== 0 && (
              <>
                <span className="text-foreground/30">•</span>
                <span className={comparison.goalsCompleted >= 0 ? "text-green-500" : "text-red-500"}>
                  Goals {comparison.goalsCompleted >= 0 ? "+" : ""}{comparison.goalsCompleted}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SummitLog;
