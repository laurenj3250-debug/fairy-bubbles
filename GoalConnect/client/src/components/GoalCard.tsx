import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "./ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface GoalCardProps {
  title: string;
  progress: number;
  deadline: string;
  className?: string;
  onClick?: () => void;
}

const MILESTONES = [25, 50, 75, 100];

type HealthStatus = "healthy" | "needs-attention" | "at-risk";

function calculateGoalHealth(progress: number, daysUntil: number): {
  status: HealthStatus;
  message: string;
} {
  // Calculate expected progress based on time elapsed
  const totalDays = 30; // Assume 30-day goals for now
  const daysElapsed = totalDays - daysUntil;
  const expectedProgress = (daysElapsed / totalDays) * 100;

  const progressDelta = progress - expectedProgress;

  if (progress >= 100) {
    return { status: "healthy", message: "Goal complete! 🎉" };
  }

  if (daysUntil < 0) {
    return { status: "at-risk", message: "Overdue - Review and adjust" };
  }

  if (progressDelta >= 10) {
    return { status: "healthy", message: "Ahead of schedule!" };
  }

  if (progressDelta >= -10) {
    return { status: "healthy", message: "On track - Keep going!" };
  }

  if (daysUntil <= 7) {
    return { status: "at-risk", message: "Sprint to finish!" };
  }

  return { status: "needs-attention", message: "Pick up the pace" };
}

export function GoalCard({ title, progress, deadline, className, onClick }: GoalCardProps) {
  const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 7;
  const isOnTrack = daysUntil > 7;

  const health = calculateGoalHealth(progress, daysUntil);

  // Deadline mood aura - tint entire card based on urgency
  const moodAura = isOverdue
    ? "bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20"
    : isUrgent
    ? "bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20"
    : "bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20";

  const healthIcon =
    health.status === "healthy" ? (
      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    ) : health.status === "at-risk" ? (
      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    ) : (
      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
    );

  const healthColor =
    health.status === "healthy"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : health.status === "at-risk"
      ? "bg-red-500/10 text-red-700 border-red-500/20"
      : "bg-amber-500/10 text-amber-700 border-amber-500/20";

  return (
    <Card
      className={cn(
        "hover-elevate cursor-pointer transition-all rounded-3xl",
        moodAura,
        className
      )}
      onClick={onClick}
      data-testid={`goal-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-medium line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* Goal Health Indicator */}
        <div
          className={cn(
            "w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border",
            healthColor
          )}
        >
          {healthIcon}
          <span>{health.message}</span>
        </div>

        {/* Milestone Badges */}
        <div className="flex items-center gap-2">
          {MILESTONES.map((milestone) => {
            const achieved = progress >= milestone;
            return (
              <div
                key={milestone}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all",
                  achieved
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                    : "bg-muted text-muted-foreground"
                )}
                title={`${milestone}% milestone ${achieved ? "achieved" : "locked"}`}
              >
                {achieved ? <Award className="w-4 h-4" /> : milestone}
              </div>
            );
          })}
        </div>

        <ProgressRing progress={progress} size={80} strokeWidth={12} />

        <Badge
          variant={isOverdue ? "destructive" : isUrgent ? "default" : "secondary"}
          className="flex items-center gap-1.5 rounded-xl"
          data-testid="goal-deadline-badge"
        >
          <Calendar className="w-3 h-3" />
          {isOverdue ? "Overdue" : `${daysUntil}d left`}
        </Badge>
      </CardContent>
    </Card>
  );
}
