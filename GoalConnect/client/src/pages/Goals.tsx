import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Target, Calendar, TrendingUp, AlertCircle, Trophy, Edit, Trash2, PlusCircle, ArrowRight } from "lucide-react";
import { GoalDialog } from "@/components/GoalDialog";
import { GoalProgressDialog } from "@/components/GoalProgressDialog";
import { Badge } from "@/components/ui/badge";
import { cn, getToday } from "@/lib/utils";

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
      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-6 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Your Routes
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your progress towards your climbing goals
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-6 py-6 bg-primary hover:bg-primary/90 text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">New Route</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-5 relative">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{completedGoals}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-5 relative">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{inProgressGoals}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-5 relative">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{goals.length}</div>
                <div className="text-xs text-muted-foreground">Total Routes</div>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-2 flex gap-2 mb-6 relative">
          <Button
            variant={activeView === "all" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300 relative z-10",
              activeView === "all"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => setActiveView("all")}
          >
            <Target className="w-4 h-4 mr-2" />
            All Routes
          </Button>
          <Button
            variant={activeView === "weekly" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300 relative z-10",
              activeView === "weekly"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => setActiveView("weekly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button
            variant={activeView === "monthly" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300 relative z-10",
              activeView === "monthly"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => setActiveView("monthly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-12 text-center relative">
            <div className="relative z-10">
              <Target className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                No Routes Yet
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {activeView === "all"
                  ? "Create your first route and start tracking your progress"
                  : activeView === "weekly"
                  ? "No routes due this week"
                  : "No routes due this month"}
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                Create First Route
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
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
      className={`bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-4 relative overflow-hidden transition-all duration-500 hover:scale-101 ${
        isHighPriority ? 'ring-2 ring-red-400/50' : ''
      }`}
      style={isHighPriority ? {
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.15)',
      } : {}}
    >
      {/* Accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 ${urgencyColor} ${isHighPriority ? 'h-1.5' : 'h-1'}`}
      />

      <div className="flex items-start gap-3 relative z-10">
        {/* Left side: Main content */}
        <div className="flex-1">
          {/* Priority, Category & Points Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Priority Badge */}
            <Badge
              className={`${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border} font-bold uppercase text-xs`}
            >
              {priorityStyle.icon} {goal.priority || "medium"} priority
            </Badge>

            {goal.category && (
              <Badge
                className={`${borderColor} bg-card/50 ${textColor} border`}
              >
                {goal.category}
              </Badge>
            )}
            <Badge
              className="bg-primary/20 text-primary border border-primary/30"
            >
              🪙 {goal.difficulty === 'easy' ? 5 : goal.difficulty === 'hard' ? 15 : 10} tokens
            </Badge>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">{goal.currentValue}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg text-foreground">{goal.targetValue}</span>
              <span className="text-sm text-muted-foreground">{goal.unit}</span>
            </div>

            <div className={`px-3 py-1 rounded-full border ${borderColor} bg-card/50`}>
              <span className="text-foreground font-bold text-base">{progress}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-muted/50 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${urgencyColor}`}
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>

          {/* Quick +1 Progress Button */}
          {!isComplete && (
            <div className="mb-4">
              <button
                onClick={handleQuickPlusOne}
                disabled={isAddingProgress}
                className={cn(
                  "w-full px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-sm",
                  isAddingProgress
                    ? "bg-muted/50 border-border text-muted-foreground cursor-not-allowed"
                    : "bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:scale-102"
                )}
              >
                {isAddingProgress ? "Adding..." : `+1 ${goal.unit}`}
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">
              Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {daysUntil >= 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className={cn("font-semibold", textColor)}>
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
          {/* Status Icon */}
          {isComplete && (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border border-primary/50 bg-primary/20">
              🏆
            </div>
          )}

          {/* Mini actions */}
          {!isComplete && (
            <button
              onClick={onAddProgress}
              className="text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 flex items-center gap-1 font-semibold"
            >
              <PlusCircle className="w-3 h-3" />
              Add Progress
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
