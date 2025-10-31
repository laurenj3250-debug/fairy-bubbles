import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "./ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface GoalCardProps {
  title: string;
  progress: number;
  deadline: string;
  className?: string;
  onClick?: () => void;
}

export function GoalCard({ title, progress, deadline, className, onClick }: GoalCardProps) {
  const daysUntil = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 7;

  return (
    <Card
      className={cn(
        "hover-elevate cursor-pointer transition-all rounded-3xl",
        className
      )}
      onClick={onClick}
      data-testid={`goal-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-medium line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
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
