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

// Magical Canvas Component (matching Dashboard)
function MagicalCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('goalsCanvas');
    if (!canvas) return;

    // Create fairy lights
    const colors = ['#a7f3d0', '#fbbf24', '#a78bfa', '#fca5a5', '#93c5fd'];
    for (let i = 0; i < 30; i++) {
      const light = document.createElement('div');
      light.className = 'absolute rounded-full float-fairy blur-sm';
      light.style.background = colors[Math.floor(Math.random() * colors.length)];
      light.style.width = Math.random() * 4 + 2 + 'px';
      light.style.height = light.style.width;
      light.style.left = Math.random() * 100 + '%';
      light.style.top = Math.random() * 100 + '%';
      light.style.animationDelay = Math.random() * 8 + 's';
      light.style.animationDuration = (Math.random() * 4 + 6) + 's';
      canvas.appendChild(light);
    }

    // Create twinkling stars
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute w-0.5 h-0.5 bg-white rounded-full twinkle';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.boxShadow = '0 0 3px white, 0 0 6px white';
      canvas.appendChild(star);
    }

    return () => {
      if (canvas) {
        canvas.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      id="goalsCanvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}

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
      <div className="min-h-screen enchanted-bg">
        <MagicalCanvas />
        <div className="relative z-10 max-w-5xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-3xl h-40 magical-glow animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen enchanted-bg pb-24">
      <MagicalCanvas />

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Enchanted Header */}
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow shimmer-effect relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1
                className="text-4xl font-bold text-white mb-2"
                style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 20px rgba(167, 139, 250, 0.8)' }}
              >
                Your Goals
              </h1>
              <p className="text-sm text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Track your progress towards your dreams
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-6 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-2 border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">New Goal</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card-green rounded-2xl p-5 magical-glow" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-400/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{completedGoals}</div>
                <div className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Completed</div>
              </div>
            </div>
          </div>

          <div className="glass-card-blue rounded-2xl p-5 magical-glow" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{inProgressGoals}</div>
                <div className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>In Progress</div>
              </div>
            </div>
          </div>

          <div className="glass-card-pink rounded-2xl p-5 magical-glow" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-400/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{goals.length}</div>
                <div className="text-xs text-white/70" style={{ fontFamily: "'Quicksand', sans-serif" }}>Total Goals</div>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="glass-card rounded-3xl p-2 flex gap-2 mb-6">
          <Button
            variant={activeView === "all" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "all"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30 shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={() => setActiveView("all")}
          >
            <Target className="w-4 h-4 mr-2" />
            All Goals
          </Button>
          <Button
            variant={activeView === "weekly" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "weekly"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30 shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={() => setActiveView("weekly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button
            variant={activeView === "monthly" ? "default" : "ghost"}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-base font-semibold transition-all duration-300",
              activeView === "monthly"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30 shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            onClick={() => setActiveView("monthly")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="glass-card-pink rounded-3xl p-12 text-center magical-glow">
            <Target className="w-16 h-16 mx-auto mb-6 text-purple-300" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))' }} />
            <h2
              className="text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}
            >
              No Goals Yet
            </h2>
            <p className="text-white/80 mb-8 text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              {activeView === "all"
                ? "Create your first goal and start tracking your progress"
                : activeView === "weekly"
                ? "No goals due this week"
                : "No goals due this month"}
            </p>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-2 border-white/30 shadow-lg"
            >
              Create First Goal
            </Button>
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
        onOpenChange={handleCloseDialog}
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
  let urgencyColor = "from-blue-500 to-purple-500";
  let textColor = "text-blue-200";
  let borderColor = "border-blue-400/30";

  if (isComplete) {
    urgencyColor = "from-green-500 to-emerald-500";
    textColor = "text-green-200";
    borderColor = "border-green-400/30";
  } else if (daysUntil <= 1) {
    urgencyColor = "from-red-500 to-orange-500";
    textColor = "text-red-200";
    borderColor = "border-red-400/30";
  } else if (daysUntil <= 7) {
    urgencyColor = "from-orange-500 to-yellow-500";
    textColor = "text-orange-200";
    borderColor = "border-orange-400/30";
  }

  // Priority styling
  const isHighPriority = goal.priority === "high";
  const priorityColors = {
    high: { bg: "bg-red-500/20", border: "border-red-400/40", text: "text-red-200", icon: "🔥" },
    medium: { bg: "bg-blue-500/20", border: "border-blue-400/40", text: "text-blue-200", icon: "⭐" },
    low: { bg: "bg-gray-500/20", border: "border-gray-400/40", text: "text-gray-300", icon: "📌" },
  };
  const priorityStyle = priorityColors[goal.priority || "medium"];

  return (
    <div
      className={`glass-card rounded-3xl p-4 relative overflow-hidden transition-all duration-500 hover:scale-101 ${
        isComplete ? 'magical-glow' : isHighPriority ? 'magical-glow ring-2 ring-red-400/50' : ''
      }`}
      style={isHighPriority ? {
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.15)',
      } : {}}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isHighPriority ? '6px' : '4px',
          background: `linear-gradient(to right, ${urgencyColor})`,
          boxShadow: `0 2px 10px rgba(139, 92, 246, 0.5)`,
        }}
      />

      <div className="flex items-start gap-3 relative z-10">
        {/* Left side: Main content */}
        <div className="flex-1">
          {/* Priority, Category & Points Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Priority Badge */}
            <Badge
              className={`${priorityStyle.bg} backdrop-blur-xl ${priorityStyle.text} border-2 ${priorityStyle.border} font-bold uppercase text-xs`}
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              {priorityStyle.icon} {goal.priority || "medium"} priority
            </Badge>

            {goal.category && (
              <Badge
                className={`${borderColor} bg-white/10 backdrop-blur-xl ${textColor} border-2`}
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                {goal.category}
              </Badge>
            )}
            <Badge
              className="bg-yellow-400/20 backdrop-blur-xl text-yellow-200 border-2 border-yellow-400/30"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              🪙 {goal.difficulty === 'easy' ? 5 : goal.difficulty === 'hard' ? 15 : 10} coins
            </Badge>
          </div>

          {/* Goal Title */}
          <h3
            className="text-xl font-bold text-white mb-1.5"
            style={{
              fontFamily: "'Comfortaa', cursive",
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              lineHeight: '1.2',
            }}
          >
            {goal.title}
          </h3>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-white/70 mb-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              {goal.description}
            </p>
          )}

          {/* Progress Info */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">{goal.currentValue}</span>
              <span className="text-white/60">/</span>
              <span className="text-lg text-white/80">{goal.targetValue}</span>
              <span className="text-sm text-white/60">{goal.unit}</span>
            </div>

            <div className={`px-3 py-1 rounded-full border-2 ${borderColor}`}
              style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}
            >
              <span className="text-white font-bold text-base">{progress}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500`}
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(to right, ${urgencyColor})`,
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
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
                  "w-full px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 text-sm",
                  isAddingProgress
                    ? "bg-white/5 border-white/20 text-white/40 cursor-not-allowed"
                    : "bg-green-500/30 border-green-400/50 text-green-200 hover:bg-green-500/40 hover:scale-102"
                )}
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                {isAddingProgress ? "Adding..." : `+1 ${goal.unit}`}
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {daysUntil >= 0 && (
              <>
                <span className="text-white/40">•</span>
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
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-green-400/50"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
              }}
            >
              🏆
            </div>
          )}

          {/* Mini actions */}
          {!isComplete && (
            <button
              onClick={onAddProgress}
              className="text-xs text-green-400 hover:text-green-300 transition-colors px-2 py-1 flex items-center gap-1 font-semibold"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              <PlusCircle className="w-3 h-3" />
              Add Progress
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-xs text-white/60 hover:text-white/90 transition-colors px-2 py-1 flex items-center gap-1"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 flex items-center gap-1"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
