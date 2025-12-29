import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Target, Calendar, TrendingUp, AlertCircle, Trophy, Edit, Trash2, PlusCircle, ArrowRight, Bike, Dumbbell, Mountain, AlertTriangle, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalDialog } from "@/components/GoalDialog";
import { GoalProgressDialog } from "@/components/GoalProgressDialog";
import { Badge } from "@/components/ui/badge";
import { cn, getToday } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useLiftingStats } from "@/hooks/useLiftingStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";

type ViewType = "all" | "weekly" | "monthly" | "archived";

export default function Goals() {
  const isMobile = useIsMobile();
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

  // Get today's date for archived filter
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter goals by view
  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    if (activeView === "archived") {
      // Show goals marked as archived OR past deadline incomplete
      filtered = goals.filter(goal =>
        goal.archived || (goal.deadline < today && goal.currentValue < goal.targetValue)
      );
    } else if (activeView === "weekly") {
      filtered = goals.filter(goal =>
        !goal.archived && goal.deadline >= weekDates.start && goal.deadline <= weekDates.end
      );
    } else if (activeView === "monthly") {
      filtered = goals.filter(goal =>
        !goal.archived && goal.deadline >= monthDates.start && goal.deadline <= monthDates.end
      );
    } else {
      // "all" view - exclude archived goals
      filtered = goals.filter(goal =>
        !goal.archived && (goal.deadline >= today || goal.currentValue >= goal.targetValue)
      );
    }

    // Sort by priority first (high > medium > low), then by deadline
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority || "medium"] - priorityOrder[b.priority || "medium"];
      if (priorityDiff !== 0) return priorityDiff;
      return a.deadline.localeCompare(b.deadline);
    });
  }, [goals, activeView, weekDates, monthDates, today]);

  // Count of archived goals for badge
  const archivedCount = useMemo(() => {
    return goals.filter(goal =>
      goal.archived || (goal.deadline < today && goal.currentValue < goal.targetValue)
    ).length;
  }, [goals, today]);

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

  // Sidebar navigation component - Hidden on mobile
  const SidebarNav = () => (
    <nav className="hidden md:flex fixed left-0 top-0 h-full w-[160px] z-20 flex-col justify-center pl-6">
      <div className="space-y-4">
        <Link href="/">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            dashboard
          </span>
        </Link>
        <Link href="/habits">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            habits
          </span>
        </Link>
        <Link href="/goals">
          <span className="block text-peach-400 text-sm font-heading cursor-pointer">
            goals
          </span>
        </Link>
        <Link href="/todos">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            todos
          </span>
        </Link>
        <Link href="/study">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            study
          </span>
        </Link>
        <Link href="/journey">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            journey
          </span>
        </Link>
        <Link href="/settings">
          <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
            settings
          </span>
        </Link>
      </div>
    </nav>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <ForestBackground />
        <SidebarNav />
        <div className="relative z-10 px-4 md:px-8 pb-24 pt-6 md:pt-8">
          <div className="max-w-[900px] mx-auto md:ml-[188px] md:mr-0 space-y-4 md:space-y-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card frost-accent h-40 animate-pulse"></div>
            ))}
          </div>
        </div>
        {isMobile && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ForestBackground />
      <SidebarNav />

      <div className="relative z-10 px-4 md:px-8 pb-20 md:pb-24 pt-6 md:pt-8">
        <div className="max-w-[900px] mx-auto md:ml-[188px] md:mr-0 space-y-4 md:space-y-5">

          {/* Header */}
          <header className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h1 className="logo-text tracking-wider text-xl md:text-2xl">GOALS</h1>
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
                Track your journey to each peak
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-3 md:px-5 py-2 bg-peach-400 hover:bg-peach-500 text-white transition-all hover:scale-105 text-sm"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">New Goal</span>
            </Button>
          </header>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="glass-card frost-accent p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-peach-400">{completedGoals}</div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">Completed</div>
            </div>
            <div className="glass-card frost-accent p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{inProgressGoals}</div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">In Progress</div>
            </div>
            <div className="glass-card frost-accent p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{goals.length}</div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">Total</div>
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

        {/* View Tabs */}
          <div className="glass-card frost-accent p-2 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All", icon: Target },
              { key: "weekly", label: "Week", icon: Calendar },
              { key: "monthly", label: "Month", icon: Calendar },
              { key: "archived", label: "Archived", icon: AlertTriangle, count: archivedCount },
            ].map(tab => (
              <Button
                key={tab.key}
                variant="ghost"
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeView === tab.key
                    ? "bg-peach-400 text-white"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveView(tab.key as ViewType)}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                    {tab.count}
                  </span>
                )}
              </Button>
            ))}
            {/* Yearly Goals Link */}
            <Link href="/yearly-goals">
              <Button
                variant="ghost"
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all text-[var(--text-muted)] hover:text-white hover:bg-white/10"
              >
                <Star className="w-4 h-4 mr-2" />
                Yearly
              </Button>
            </Link>
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="glass-card frost-accent p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-peach-400/60" />
              <h2 className="text-2xl font-bold text-white mb-2">No Goals Yet</h2>
              <p className="text-[var(--text-muted)] mb-6">
                {activeView === "all"
                  ? "Start by creating your first goal"
                  : activeView === "weekly"
                  ? "No goals for this week"
                  : activeView === "monthly"
                  ? "No goals for this month"
                  : "No archived goals"}
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-6 py-3 bg-peach-400 hover:bg-peach-500 text-white"
              >
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
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

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav />}
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
      className="glass-card frost-accent p-5 transition-all duration-300 hover:scale-[1.01] group"
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
    <div className="glass-card frost-accent p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="card-title">Fitness Progress</span>
        <Link href="/journey">
          <span className="text-sm font-medium flex items-center gap-1 text-peach-400 hover:underline cursor-pointer">
            Edit on Journey <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
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
