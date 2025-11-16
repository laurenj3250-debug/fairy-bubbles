import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Target, Check } from "lucide-react";
import { BoltLadder } from "./BoltLadder";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getToday } from "@/lib/utils";

interface Goal {
  id: number;
  userId: number;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

/**
 * GoalsSection - Collapsible section for long-term goals
 *
 * Takes up minimal space by default (20% or less).
 * User can expand to see full goal details.
 * Uses simple horizontal progress bars (not confusing vertical routes).
 */
export function GoalsSection() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const activeGoals = goals.filter(g => g.currentValue < g.targetValue);
  const completedToday = goals.filter(g => g.currentValue >= g.targetValue).length;

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="h-20 bg-muted/20 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass-card interactive-glow p-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">Active Routes</h2>
            <p className="text-sm text-accent/70">
              {activeGoals.length} {activeGoals.length === 1 ? 'route' : 'routes'} in progress
              {completedToday > 0 && ` • ${completedToday} summited`}
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/goals'}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Add new goal"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Goals list - always visible */}
      <div className="mt-6 space-y-4">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active routes yet.</p>
            <button
              onClick={() => window.location.href = '/goals'}
              className="btn btn-primary mt-4"
            >
              Chart Your First Route
            </button>
          </div>
        ) : (
          activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        )}
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  const progressPercentage = goal.targetValue > 0
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : 0;

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      const today = getToday();
      return apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
    onError: () => {
      alert("Failed to add progress");
    },
  });

  const handleAddProgress = () => {
    if (!addProgressMutation.isPending) {
      addProgressMutation.mutate();
    }
  };

  return (
    <div className="glass-card interactive-glow p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">{goal.title}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
            )}
          </div>

          {/* Bolt Ladder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </span>
              <span className="font-medium text-foreground">
                {progressPercentage}%
              </span>
            </div>

            <BoltLadder
              completed={goal.currentValue}
              target={goal.targetValue}
              color={progressPercentage >= 80 ? "#10b981" : progressPercentage >= 50 ? "#fb923c" : "#64748b"}
            />
          </div>
        </div>

        {/* Action button - small circle with check */}
        <button
          onClick={handleAddProgress}
          disabled={addProgressMutation.isPending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label="Add +1 progress"
        >
          <Check className="w-5 h-5 text-white stroke-[3]" />
        </button>
      </div>
    </div>
  );
}

function GoalCompactCard({ goal }: GoalCardProps) {
  const progressPercentage = goal.targetValue > 0
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : 0;

  return (
    <div className="p-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
        <div className="flex-shrink-0 text-sm font-medium text-muted-foreground ml-2">
          {progressPercentage}%
        </div>
      </div>
      <BoltLadder
        completed={goal.currentValue}
        target={goal.targetValue}
        color={progressPercentage >= 80 ? "#10b981" : progressPercentage >= 50 ? "#fb923c" : "#64748b"}
      />
    </div>
  );
}
