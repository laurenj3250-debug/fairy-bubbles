/**
 * WeeklyMonthlyGoalsWidget
 * Dashboard widget showing weekly and monthly goals with quick increment actions.
 * Replaces GoalsDeadlinesWidget with a cleaner two-section layout.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, getISOWeek, getYear } from "date-fns";
import { QuickGoalDialog } from "@/components/QuickGoalDialog";
import type { Goal } from "@shared/schema";

function getCurrentWeekAndMonth() {
  const now = new Date();
  const currentYear = getYear(now);
  const currentWeekNum = getISOWeek(now);
  const currentWeek = `${currentYear}-W${String(currentWeekNum).padStart(2, "0")}`;
  const currentMonth = format(now, "yyyy-MM");
  return { currentWeek, currentMonth };
}

interface GoalRowProps {
  goal: Goal;
  onIncrement: (goal: Goal) => void;
  isIncrementing: boolean;
  onNavigate: () => void;
}

function GoalRow({ goal, onIncrement, isIncrementing, onNavigate }: GoalRowProps) {
  const progressPct =
    goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;

  const isComplete = goal.currentValue >= goal.targetValue;

  return (
    <div className="flex items-center gap-3 group">
      {/* Title - clickable */}
      <button
        onClick={onNavigate}
        className={cn(
          "text-sm text-left min-w-0 flex-shrink truncate transition-colors",
          "text-[var(--text-primary)] hover:text-peach-400"
        )}
      >
        {goal.title}
      </button>

      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[60px] max-w-[120px]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isComplete ? "bg-emerald-400" : "bg-peach-400"
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Progress text */}
      <span className="text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap flex-shrink-0">
        {goal.currentValue}/{goal.targetValue} {goal.unit}
      </span>

      {/* +1 increment button */}
      {!isComplete && (
        <button
          onClick={() => onIncrement(goal)}
          disabled={isIncrementing}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0",
            "bg-white/5 hover:bg-peach-400/20",
            "text-[var(--text-muted)] hover:text-peach-400",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={`Increment ${goal.title}`}
        >
          <span className="text-[10px] font-medium">+1</span>
        </button>
      )}
    </div>
  );
}

interface GoalSectionProps {
  title: string;
  goals: Goal[];
  emptyText: string;
  onIncrement: (goal: Goal) => void;
  isIncrementing: boolean;
  onNavigate: () => void;
  onAddGoal: () => void;
}

function GoalSection({
  title,
  goals,
  emptyText,
  onIncrement,
  isIncrementing,
  onNavigate,
  onAddGoal,
}: GoalSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          {title}
        </span>
        <button
          onClick={onAddGoal}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-all",
            "bg-white/5 hover:bg-peach-400/20",
            "text-[var(--text-muted)] hover:text-peach-400"
          )}
          aria-label={`Add goal for ${title}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Goals list or empty state */}
      {goals.length > 0 ? (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onIncrement={onIncrement}
              isIncrementing={isIncrementing}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)] py-1">
          {emptyText}{" "}
          <button
            onClick={onAddGoal}
            className="text-peach-400 hover:underline"
          >
            add one?
          </button>
        </p>
      )}
    </div>
  );
}

export function WeeklyMonthlyGoalsWidget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [monthDialogOpen, setMonthDialogOpen] = useState(false);

  const { currentWeek, currentMonth } = useMemo(getCurrentWeekAndMonth, []);

  // Fetch goals
  const {
    data: goals = [],
    isLoading,
    isError,
  } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Auto-generate monthly goals from yearly goals on first mount
  const hasGeneratedRef = useRef(false);
  useEffect(() => {
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;

    const sync = async () => {
      try {
        await apiRequest("/api/goals/generate-monthly", "POST", { month: currentMonth });
        await apiRequest("/api/goals/sync-monthly-progress", "PATCH", { month: currentMonth });
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      } catch {
        // Silent failure — dashboard still works with whatever goals exist
      }
    };
    sync();
  }, [currentMonth]);

  // Increment mutation — fetches latest value to avoid stale-read race on rapid clicks
  const incrementMutation = useMutation({
    mutationFn: async (goal: Goal) => {
      // Read fresh goal from server to avoid stale currentValue on rapid clicks
      const fresh = await apiRequest(`/api/goals/${goal.id}`, "GET") as Goal;
      return apiRequest(`/api/goals/${goal.id}`, "PATCH", {
        currentValue: fresh.currentValue + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goal-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update goal", description: error.message, variant: "destructive" });
    },
  });

  // Filter goals client-side
  const weeklyGoals = useMemo(
    () => goals.filter((g) => g.week === currentWeek && !g.archived),
    [goals, currentWeek]
  );

  const monthlyGoals = useMemo(
    () => goals.filter((g) => g.month === currentMonth && !g.archived),
    [goals, currentMonth]
  );

  const navigateToGoals = () => setLocation("/goals");

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-peach-400" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Goals
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-peach-400" />
          <span className="text-xs text-[var(--text-muted)]">
            Unable to load goals
          </span>
        </div>
      </div>
    );
  }

  // Don't render if there are no goals at all and nothing to show
  // (still render if empty so user can add goals via the + buttons)

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
        {/* Widget header */}
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-peach-400" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Goals
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-4">
          {/* This Week section */}
          <GoalSection
            title="This Week"
            goals={weeklyGoals}
            emptyText="No goals this week —"
            onIncrement={(goal) => incrementMutation.mutate(goal)}
            isIncrementing={incrementMutation.isPending}
            onNavigate={navigateToGoals}
            onAddGoal={() => setWeekDialogOpen(true)}
          />

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* This Month section */}
          <GoalSection
            title="This Month"
            goals={monthlyGoals}
            emptyText="No goals this month —"
            onIncrement={(goal) => incrementMutation.mutate(goal)}
            isIncrementing={incrementMutation.isPending}
            onNavigate={navigateToGoals}
            onAddGoal={() => setMonthDialogOpen(true)}
          />
        </div>
      </div>

      {/* Quick goal dialogs */}
      <QuickGoalDialog
        open={weekDialogOpen}
        onOpenChange={setWeekDialogOpen}
        defaultType="week"
      />
      <QuickGoalDialog
        open={monthDialogOpen}
        onOpenChange={setMonthDialogOpen}
        defaultType="month"
      />
    </>
  );
}
