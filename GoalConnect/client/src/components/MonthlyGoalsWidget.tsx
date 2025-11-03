import { CalendarDays, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Goal } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function MonthlyGoalsWidget() {
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Get current month start and end
  const monthDates = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
      monthName: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, []);

  // Filter goals due this month
  const monthlyGoals = useMemo(() => {
    return goals
      .filter(goal => {
        const deadline = goal.deadline;
        return deadline >= monthDates.start && deadline <= monthDates.end;
      })
      .sort((a, b) => {
        const progressA = (a.currentValue / a.targetValue) * 100;
        const progressB = (b.currentValue / b.targetValue) * 100;
        return progressB - progressA; // Sort by progress descending
      });
  }, [goals, monthDates]);

  const completedGoals = monthlyGoals.filter(g => (g.currentValue / g.targetValue) >= 1).length;

  return (
    <div className="glass-card-purple rounded-3xl p-5 magical-glow" style={{ animationDelay: '1.5s' }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-bold text-white flex items-center gap-2"
          style={{ fontFamily: "'Comfortaa', cursive" }}
        >
          <CalendarDays className="w-4 h-4 text-purple-400" />
          {monthDates.monthName.split(' ')[0]}
        </h3>
        <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs">
          {monthlyGoals.length} goals
        </Badge>
      </div>

      {monthlyGoals.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-white/60">No goals this month</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20">
              <div className="text-lg font-bold text-white">{completedGoals}</div>
              <div className="text-xs text-white/70">Completed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20">
              <div className="text-lg font-bold text-white">{monthlyGoals.length - completedGoals}</div>
              <div className="text-xs text-white/70">In Progress</div>
            </div>
          </div>

          {/* Goal List */}
          <div className="space-y-2">
            {monthlyGoals.slice(0, 3).map(goal => {
              const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
              const isComplete = progress >= 100;

              return (
                <div
                  key={goal.id}
                  className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      "text-xs font-medium truncate flex-1 mr-2",
                      isComplete ? "text-green-300" : "text-white/90"
                    )}>
                      {goal.title}
                    </span>
                    <span className="text-xs font-bold text-white flex-shrink-0">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isComplete ? "bg-green-400" : "bg-purple-400"
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {monthlyGoals.length > 3 && (
              <p className="text-xs text-white/60 text-center pt-1">
                +{monthlyGoals.length - 3} more goals
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
