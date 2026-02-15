/**
 * WeeklyMonthlyGoalsWidget
 * Dashboard widget showing weekly and monthly goals with quick increment actions.
 * Matches the glass-card frost-accent design language of other dashboard widgets.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Target, Plus, Calendar, CalendarDays, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { celebrateXpEarned } from "@/lib/celebrate";
import { triggerConfetti } from "@/lib/confetti";
import { playCompleteSound, triggerHaptic } from "@/lib/sounds";
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

interface CompactGoalCardProps {
  goal: Goal;
  onIncrement: (goal: Goal) => void;
  isIncrementing: boolean;
}

function CompactGoalCard({ goal, onIncrement, isIncrementing }: CompactGoalCardProps) {
  const progressPct =
    goal.targetValue > 0
      ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
      : 0;
  const isComplete = goal.currentValue >= goal.targetValue;

  // Shorten title for display
  const shortTitle = goal.title
    .replace(/\s*\([^)]*\)/g, "") // Remove parentheticals like "(1/week)"
    .replace(/^\d+\s*/, "") // Remove leading numbers like "200 "
    .trim();

  return (
    <div
      className={cn(
        "relative px-3 py-2 rounded-lg transition-all",
        "bg-white/[0.03] border border-white/10",
        "hover:bg-white/[0.05] hover:border-white/15",
        isComplete && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Compact progress indicator */}
        <div className="relative w-7 h-7 flex-shrink-0">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/10" />
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${progressPct} 100`}
              className={cn("transition-all duration-500", isComplete ? "text-emerald-400" : "text-peach-400")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-[8px] font-bold tabular-nums", isComplete ? "text-emerald-400" : "text-peach-400")}>
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Goal info - inline */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-medium truncate leading-tight",
            isComplete ? "text-emerald-300" : "text-[var(--text-primary)]"
          )}>
            {shortTitle}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] tabular-nums leading-tight">
            {goal.currentValue}/{goal.targetValue} {goal.unit}
          </p>
        </div>

        {/* +1 button - compact */}
        {!isComplete && (
          <button
            onClick={() => onIncrement(goal)}
            disabled={isIncrementing}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center transition-all flex-shrink-0",
              "bg-peach-400/10 hover:bg-peach-400/20 border border-peach-400/20",
              "text-peach-400 hover:text-peach-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={`Increment ${goal.title}`}
          >
            <span className="text-[10px] font-bold">+1</span>
          </button>
        )}
      </div>
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
        await Promise.all([
          apiRequest("/api/goals/generate-monthly", "POST", { month: currentMonth }),
          apiRequest("/api/goals/generate-weekly", "POST", { week: currentWeek }),
        ]);
        await Promise.all([
          apiRequest("/api/goals/sync-monthly-progress", "PATCH", { month: currentMonth }),
          apiRequest("/api/goals/sync-weekly-progress", "PATCH", { week: currentWeek }),
        ]);
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      } catch {
        // Silent failure — dashboard still works with whatever goals exist
      }
    };
    sync();
  }, [currentMonth, currentWeek]);

  // Increment mutation — fetches latest value to avoid stale-read race on rapid clicks
  const incrementMutation = useMutation({
    mutationFn: async (goal: Goal) => {
      const fresh = await apiRequest(`/api/goals/${goal.id}`, "GET") as Goal;
      return apiRequest(`/api/goals/${goal.id}`, "PATCH", {
        currentValue: fresh.currentValue + 1,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goal-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      // Goal just completed — full celebration
      if (data?.currentValue >= data?.targetValue) {
        triggerConfetti("goal_completed");
        if (data?.pointsEarned > 0) {
          celebrateXpEarned(data.pointsEarned, "Goal completed!");
        } else {
          playCompleteSound();
          triggerHaptic("medium");
        }
      } else if (data?.pointsEarned > 0) {
        // Regular increment with XP — subtle feedback
        triggerHaptic("light");
      } else {
        // Increment with no XP — just haptic
        triggerHaptic("light");
      }
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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card frost-accent p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Calendar className="w-4 h-4 text-peach-400" />
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              This Week
            </span>
          </div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <div className="glass-card frost-accent p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <CalendarDays className="w-4 h-4 text-peach-400" />
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              This Month
            </span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="glass-card frost-accent p-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-red-400" />
          <span className="text-xs text-[var(--text-muted)]">
            Unable to load goals
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* This Week Card */}
        <div className="glass-card frost-accent p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-peach-400" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                This Week
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekDialogOpen(true)}
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center transition-all",
                  "bg-white/5 hover:bg-peach-400/20",
                  "text-[var(--text-muted)] hover:text-peach-400"
                )}
                aria-label="Add weekly goal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={navigateToGoals}
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center transition-all",
                  "text-[var(--text-muted)] hover:text-peach-400"
                )}
                aria-label="View all goals"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekly goals list */}
          {weeklyGoals.length > 0 ? (
            <div className="space-y-2">
              {weeklyGoals.map((goal) => (
                <CompactGoalCard
                  key={goal.id}
                  goal={goal}
                  onIncrement={(g) => incrementMutation.mutate(g)}
                  isIncrementing={incrementMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={() => setWeekDialogOpen(true)}
              className="w-full py-6 rounded-xl border border-dashed border-white/10 hover:border-peach-400/30 hover:bg-white/[0.02] transition-all text-center"
            >
              <span className="text-xs text-[var(--text-muted)]">
                No weekly goals yet
              </span>
              <span className="block text-xs text-peach-400 mt-1">
                + Add a goal
              </span>
            </button>
          )}
        </div>

        {/* This Month Card */}
        <div className="glass-card frost-accent p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-peach-400" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                This Month
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthDialogOpen(true)}
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center transition-all",
                  "bg-white/5 hover:bg-peach-400/20",
                  "text-[var(--text-muted)] hover:text-peach-400"
                )}
                aria-label="Add monthly goal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={navigateToGoals}
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center transition-all",
                  "text-[var(--text-muted)] hover:text-peach-400"
                )}
                aria-label="View all goals"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly goals list */}
          {monthlyGoals.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {monthlyGoals.map((goal) => (
                <CompactGoalCard
                  key={goal.id}
                  goal={goal}
                  onIncrement={(g) => incrementMutation.mutate(g)}
                  isIncrementing={incrementMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={() => setMonthDialogOpen(true)}
              className="w-full py-6 rounded-xl border border-dashed border-white/10 hover:border-peach-400/30 hover:bg-white/[0.02] transition-all text-center"
            >
              <span className="text-xs text-[var(--text-muted)]">
                No monthly goals yet
              </span>
              <span className="block text-xs text-peach-400 mt-1">
                + Add a goal
              </span>
            </button>
          )}
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
