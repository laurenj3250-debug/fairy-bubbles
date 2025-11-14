import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Plus, Target } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  description: string;
  progress: number;
  targetProgress: number;
}

/**
 * GoalsSection - Collapsible section for long-term goals
 *
 * Takes up minimal space by default (20% or less).
 * User can expand to see full goal details.
 * Uses simple horizontal progress bars (not confusing vertical routes).
 */
export function GoalsSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const activeGoals = goals.filter(g => g.progress < g.targetProgress);
  const completedToday = goals.filter(g => g.progress === g.targetProgress).length;

  if (isLoading) {
    return (
      <div className="card">
        <div className="h-20 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
      >
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

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to goals page or open create modal
              window.location.href = '/goals';
            }}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Add new goal"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>

          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      <div className={`collapsible ${isExpanded ? 'collapsible-open' : 'collapsible-closed'}`}>
        {isExpanded ? (
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
        ) : (
          // Collapsed view - show compact preview
          <div className="mt-4 space-y-2">
            {activeGoals.slice(0, 2).map((goal) => (
              <GoalCompactCard key={goal.id} goal={goal} />
            ))}
            {activeGoals.length > 2 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{activeGoals.length - 2} more {activeGoals.length - 2 === 1 ? 'route' : 'routes'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  const progressPercentage = goal.targetProgress > 0
    ? Math.round((goal.progress / goal.targetProgress) * 100)
    : 0;

  return (
    <div className="bg-secondary/30 rounded-lg p-4 space-y-3 hover:bg-secondary/50 transition-colors">
      <div>
        <h3 className="font-semibold text-foreground">{goal.title}</h3>
        {goal.description && (
          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {goal.progress} / {goal.targetProgress}
          </span>
          <span className="font-medium text-foreground">
            {progressPercentage}%
          </span>
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${progressPercentage === 100 ? 'progress-fill-success' : ''}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => {
          // TODO: Open progress log modal
          console.log('Log progress for goal:', goal.id);
        }}
        className="btn btn-secondary w-full text-sm"
      >
        Send Pitch
      </button>
    </div>
  );
}

function GoalCompactCard({ goal }: GoalCardProps) {
  const progressPercentage = goal.targetProgress > 0
    ? Math.round((goal.progress / goal.targetProgress) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
        <div className="progress-bar mt-1 h-1.5">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      <div className="flex-shrink-0 text-sm font-medium text-muted-foreground">
        {progressPercentage}%
      </div>
    </div>
  );
}
