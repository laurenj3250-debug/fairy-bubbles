import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Target, Calendar, TrendingUp, AlertCircle, Trophy, Edit, Trash2, PlusCircle, ArrowRight, Bike, Dumbbell, Mountain, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalDialog } from "@/components/GoalDialog";
import { GoalProgressDialog } from "@/components/GoalProgressDialog";
import { Badge } from "@/components/ui/badge";
import { cn, getToday } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useLiftingStats } from "@/hooks/useLiftingStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";

// REMOVED: MagicalCanvas - No longer needed for mountain aesthetic

type ViewType = "all" | "weekly" | "monthly";

export default function Goals() {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("all");

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Journey goals - read-only display (Journey page is source of truth)
  const { targets: journeyTargets } = useJourneyGoals();
  const { stats: stravaStats, isLoading: stravaLoading, error: stravaError } = useStravaStats();
  const { stats: liftingStats, isLoading: liftingLoading, error: liftingError } = useLiftingStats();
  const { stats: climbingStats, isLoading: climbingLoading, error: climbingError } = useClimbingStats();

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/goals/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  // Get current week dates (Monday to Sunday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      label: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    };
  }, []);

  // Get current month dates
  const monthDates = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
      label: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }, []);

  // Filter goals by view
  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    if (activeView === "weekly") {
      filtered = goals.filter(goal =>
        goal.deadline >= weekDates.start && goal.deadline <= weekDates.end
      );
    } else if (activeView === "monthly") {
      filtered = goals.filter(goal =>
        goal.deadline >= monthDates.start && goal.deadline <= monthDates.end
      );
    }

    // Sort by priority first (high > medium > low), then by deadline
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority || "medium"] - priorityOrder[b.priority || "medium"];
      if (priorityDiff !== 0) return priorityDiff;
      return a.deadline.localeCompare(b.deadline);
    });
  }, [goals, activeView, weekDates, monthDates]);

  const handleCreateNew = () => {
    setEditingGoal(undefined);
    setGoalDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  const handleAddProgress = (goal: Goal) => {
    setProgressGoal(goal);
    setProgressDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this goal?")) {
      deleteGoalMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setGoalDialogOpen(false);
    setEditingGoal(undefined);
  };

  const completedGoals = filteredGoals.filter(g => (g.currentValue / g.targetValue) >= 1).length;
  const inProgressGoals = filteredGoals.length - completedGoals;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 max-w-5xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern h-40 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header - Glass morphism with soft shadows */}
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
          {/* Soft gradient overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left,
                hsl(var(--primary) / 0.3),
                transparent 60%)`
            }}
          />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{
                  background: `linear-gradient(135deg,
                    hsl(var(--primary)),
                    hsl(var(--accent)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Your Summits
              </h1>
              <p className="text-sm text-foreground/60">
                Track your journey to each peak
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-6 py-3 shadow-lg transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg,
                  hsl(var(--primary)),
                  hsl(var(--accent)))`,
                color: 'white'
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">New Summit</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview - Soft glass cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 70%)`
              }}
            />
            <div className="flex items-center gap-4 relative z-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))`,
                  border: '1px solid hsl(var(--primary) / 0.3)'
                }}
              >
                <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{completedGoals}</div>
                <div className="text-sm text-foreground/60">Summited</div>
              </div>
            </div>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, hsl(var(--accent) / 0.4), transparent 70%)`
              }}
            />
            <div className="flex items-center gap-4 relative z-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))`,
                  border: '1px solid hsl(var(--accent) / 0.3)'
                }}
              >
                <TrendingUp className="w-7 h-7" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{inProgressGoals}</div>
                <div className="text-sm text-foreground/60">Climbing</div>
              </div>
            </div>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, hsl(var(--secondary) / 0.4), transparent 70%)`
              }}
            />
            <div className="flex items-center gap-4 relative z-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--secondary) / 0.2), hsl(var(--secondary) / 0.1))`,
                  border: '1px solid hsl(var(--secondary) / 0.3)'
                }}
              >
                <Target className="w-7 h-7" style={{ color: 'hsl(var(--secondary))' }} />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{goals.length}</div>
                <div className="text-sm text-foreground/60">Total Peaks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Progress from Journey (read-only) */}
        <JourneyGoalsSection
          stravaStats={stravaStats}
          liftingStats={liftingStats}
          climbingStats={climbingStats}
          targets={journeyTargets}
          loadingStates={{
            cycling: stravaLoading,
            lifting: liftingLoading,
            climbing: climbingLoading,
          }}
          errorStates={{
            cycling: !!stravaError,
            lifting: !!liftingError,
            climbing: !!climbingError,
          }}
        />

        {/* View Tabs - Soft glass toggle */}
        <div className="bg-background/30 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-2 flex flex-col sm:flex-row gap-2 mb-6 md:mb-8">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "all"
                ? "text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            style={activeView === "all" ? {
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            } : {}}
            onClick={() => setActiveView("all")}
          >
            <Target className="w-4 h-4 mr-2" />
            All Peaks
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "weekly"
                ? "text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            style={activeView === "weekly" ? {
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            } : {}}
            onClick={() => setActiveView("weekly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "monthly"
                ? "text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            style={activeView === "monthly" ? {
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            } : {}}
            onClick={() => setActiveView("monthly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-16 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, hsl(var(--primary) / 0.3), transparent 70%)`
              }}
            />
            <div className="relative z-10">
              <Target
                className="w-20 h-20 mx-auto mb-6"
                style={{ color: 'hsl(var(--primary) / 0.6)' }}
              />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                No Peaks Yet
              </h2>
              <p className="text-foreground/60 mb-8 text-lg max-w-md mx-auto">
                {activeView === "all"
                  ? "Begin your journey by choosing your first summit to conquer"
                  : activeView === "weekly"
                  ? "No summits planned for this week"
                  : "No summits planned for this month"}
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-8 py-4 text-lg shadow-xl hover:scale-105 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
              >
                Choose Your First Summit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onAddProgress={() => handleAddProgress(goal)}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      <GoalDialog
        open={goalDialogOpen}
        onClose={handleCloseDialog}
        goal={editingGoal}
      />
      <GoalProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        goal={progressGoal}
      />
    </div>
  );
}

// Individual Goal Card Component
function GoalCard({ goal, onEdit, onAddProgress, onDelete }: {
  goal: Goal;
  onEdit: () => void;
  onAddProgress: () => void;
  onDelete: () => void;
}) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);

  const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
  const isComplete = progress >= 100;

  const handleQuickPlusOne = async () => {
    setIsAddingProgress(true);
    try {
      const today = getToday();
      await apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsAddingProgress(false);
    } catch (error) {
      setIsAddingProgress(false);
      alert("Failed to add progress");
    }
  };

  // Calculate days until deadline
  const daysUntil = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine urgency
  let urgencyColor = "bg-[hsl(var(--accent))]";
  let textColor = "text-[hsl(var(--accent))]";
  let borderColor = "border-[hsl(var(--accent))]/30";

  if (isComplete) {
    urgencyColor = "bg-primary";
    textColor = "text-primary";
    borderColor = "border-primary/30";
  } else if (daysUntil <= 1) {
    urgencyColor = "bg-muted";
    textColor = "text-muted-foreground";
    borderColor = "border-border";
  } else if (daysUntil <= 7) {
    urgencyColor = "bg-[hsl(var(--accent))]";
    textColor = "text-[hsl(var(--accent))]";
    borderColor = "border-[hsl(var(--accent))]/30";
  }

  // Priority styling
  const isHighPriority = goal.priority === "high";
  const priorityColors = {
    high: { bg: "bg-primary/20", border: "border-primary/30", text: "text-primary", icon: "🔥" },
    medium: { bg: "bg-[hsl(var(--accent))]/20", border: "border-[hsl(var(--accent))]/30", text: "text-[hsl(var(--accent))]", icon: "⭐" },
    low: { bg: "bg-muted/20", border: "border-border", text: "text-muted-foreground", icon: "📌" },
  };
  const priorityStyle = priorityColors[goal.priority || "medium"];

  return (
    <div
      className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group"
    >
      {/* Soft gradient overlay based on progress */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{
          background: isComplete
            ? `radial-gradient(circle at top right, hsl(var(--primary) / 0.4), transparent 70%)`
            : `radial-gradient(circle at top right, hsl(var(--accent) / 0.3), transparent 70%)`
        }}
      />

      <div className="flex items-start gap-3 relative z-10">
        {/* Left side: Main content */}
        <div className="flex-1">
          {/* Priority, Category & Points Badges - Soft glass pills */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Priority Badge */}
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase backdrop-blur-sm"
              style={{
                background: isHighPriority
                  ? 'linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))'
                  : 'hsl(var(--foreground) / 0.05)',
                border: isHighPriority
                  ? '1px solid hsl(var(--accent) / 0.4)'
                  : '1px solid hsl(var(--foreground) / 0.1)',
                color: isHighPriority ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.6)'
              }}
            >
              {priorityStyle.icon} {goal.priority || "medium"}
            </div>

            {goal.category && (
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm"
                style={{
                  background: 'hsl(var(--primary) / 0.1)',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                  color: 'hsl(var(--primary))'
                }}
              >
                {goal.category}
              </div>
            )}
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm"
              style={{
                background: 'hsl(var(--secondary) / 0.15)',
                border: '1px solid hsl(var(--secondary) / 0.3)',
                color: 'hsl(var(--secondary))'
              }}
            >
              🪙 {goal.difficulty === 'easy' ? 5 : goal.difficulty === 'hard' ? 15 : 10} tokens
            </div>
          </div>

          {/* Goal Title */}
          <h3 className="text-xl font-bold text-foreground mb-1.5 leading-tight">
            {goal.title}
          </h3>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {goal.description}
            </p>
          )}

          {/* Progress Info */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{goal.currentValue}</span>
              <span className="text-foreground/40">/</span>
              <span className="text-lg text-foreground/80">{goal.targetValue}</span>
              <span className="text-sm text-foreground/50">{goal.unit}</span>
            </div>

            <div
              className="px-4 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: isComplete
                  ? 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))'
                  : 'hsl(var(--accent) / 0.15)',
                border: isComplete
                  ? '1px solid hsl(var(--primary) / 0.3)'
                  : '1px solid hsl(var(--accent) / 0.2)',
                color: isComplete ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
              }}
            >
              <span className="font-bold text-base">{progress}%</span>
            </div>
          </div>

          {/* Progress Bar - Soft gradient */}
          <div className="w-full h-3 rounded-full overflow-hidden mb-4" style={{ background: 'hsl(var(--foreground) / 0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: isComplete
                  ? `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`
                  : `linear-gradient(90deg, hsl(var(--accent) / 0.8), hsl(var(--secondary) / 0.8))`,
                boxShadow: isComplete
                  ? '0 0 12px hsl(var(--primary) / 0.4)'
                  : '0 0 10px hsl(var(--accent) / 0.3)'
              }}
            />
          </div>

          {/* Quick +1 Progress Button - Soft gradient */}
          {!isComplete && (
            <div className="mb-4">
              <button
                onClick={handleQuickPlusOne}
                disabled={isAddingProgress}
                className="w-full px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: isAddingProgress
                    ? 'hsl(var(--foreground) / 0.1)'
                    : `linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.2))`,
                  border: '1px solid hsl(var(--accent) / 0.3)',
                  color: isAddingProgress ? 'hsl(var(--foreground) / 0.5)' : 'hsl(var(--accent))'
                }}
              >
                {isAddingProgress ? "Adding..." : `+1 ${goal.unit}`}
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Deadline - Soft colors */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--foreground) / 0.4)' }} />
            <span className="text-foreground/70">
              {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {daysUntil >= 0 && (
              <>
                <span className="text-foreground/30">•</span>
                <span
                  className="font-semibold"
                  style={{
                    color: daysUntil <= 1 ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.7)'
                  }}
                >
                  {daysUntil === 0 ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Due Today!
                    </span>
                  ) : daysUntil === 1 ? (
                    '1 day left'
                  ) : (
                    `${daysUntil} days left`
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex flex-col gap-2 items-end">
          {/* Status Icon - Soft glow */}
          {isComplete && (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2))`,
                border: '2px solid hsl(var(--primary) / 0.4)',
                boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)'
              }}
            >
              🏆
            </div>
          )}

          {/* Mini actions - Soft hover states */}
          {!isComplete && (
            <button
              onClick={onAddProgress}
              className="text-xs font-semibold px-3 py-1.5 flex items-center gap-1 transition-all rounded-lg hover:bg-foreground/5"
              style={{ color: 'hsl(var(--primary))' }}
            >
              <PlusCircle className="w-3 h-3" />
              Add Progress
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 flex items-center gap-1 transition-all rounded-lg hover:bg-foreground/5"
            style={{ color: 'hsl(var(--foreground) / 0.5)' }}
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 flex items-center gap-1 transition-all rounded-lg hover:bg-foreground/5"
            style={{ color: 'hsl(var(--foreground) / 0.5)' }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Journey Goals Section Component - Read-only display of fitness progress
// Journey page is the source of truth - edit there, display here
interface JourneyGoalsSectionProps {
  stravaStats: { ytdMiles: number; ytdRides: number } | null | undefined;
  liftingStats: { ytdWorkouts: number } | null | undefined;
  climbingStats: { ytdProblemsSent: number } | null | undefined;
  targets: {
    cyclingMiles: number;
    liftingWorkouts: number;
    liftingTotal: number;
    climbingTicks: number;
  };
  loadingStates: {
    cycling: boolean;
    lifting: boolean;
    climbing: boolean;
  };
  errorStates: {
    cycling: boolean;
    lifting: boolean;
    climbing: boolean;
  };
}

function JourneyGoalsSection({
  stravaStats,
  liftingStats,
  climbingStats,
  targets,
  loadingStates,
  errorStates,
}: JourneyGoalsSectionProps) {
  const journeyGoalConfigs = [
    {
      key: "yearly_miles",
      label: "Cycling Miles",
      icon: Bike,
      target: targets.cyclingMiles,
      current: stravaStats?.ytdMiles ?? null,
      unit: "mi",
      color: "hsl(var(--accent))",
      isLoading: loadingStates.cycling,
      hasError: errorStates.cycling,
    },
    {
      key: "yearly_workouts",
      label: "Lifting Workouts",
      icon: Dumbbell,
      target: targets.liftingWorkouts,
      current: liftingStats?.ytdWorkouts ?? null,
      unit: "sessions",
      color: "hsl(var(--primary))",
      isLoading: loadingStates.lifting,
      hasError: errorStates.lifting,
    },
    {
      key: "yearly_climbs",
      label: "Climbing Ticks",
      icon: Mountain,
      target: targets.climbingTicks,
      current: climbingStats?.ytdProblemsSent ?? null,
      unit: "climbs",
      color: "hsl(var(--secondary))",
      isLoading: loadingStates.climbing,
      hasError: errorStates.climbing,
    }
  ];

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Fitness Progress</h2>
        <a
          href="/journey"
          className="text-sm font-medium flex items-center gap-1 hover:underline"
          style={{ color: 'hsl(var(--primary))' }}
        >
          Edit on Journey <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {journeyGoalConfigs.map(config => {
          const currentValue = config.current ?? 0;
          const progress = config.target > 0 && !config.isLoading && !config.hasError
            ? Math.round((currentValue / config.target) * 100)
            : 0;

          return (
            <div
              key={config.key}
              className="bg-background/30 rounded-2xl p-4 border border-foreground/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${config.color}20`,
                    border: `1px solid ${config.color}40`
                  }}
                >
                  <config.icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{config.label}</div>
                  <div className="text-sm text-foreground/60">
                    {config.isLoading ? (
                      <Skeleton className="h-4 w-24 inline-block" />
                    ) : config.hasError ? (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Failed to load
                      </span>
                    ) : (
                      <>{currentValue.toLocaleString()} / {config.target.toLocaleString()} {config.unit}</>
                    )}
                  </div>
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: progress >= 100 ? 'hsl(var(--primary))' : config.color }}
                >
                  {config.isLoading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : config.hasError ? (
                    <span className="text-destructive">--</span>
                  ) : (
                    <>{progress}%</>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--foreground) / 0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: progress >= 100
                      ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
                      : config.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
