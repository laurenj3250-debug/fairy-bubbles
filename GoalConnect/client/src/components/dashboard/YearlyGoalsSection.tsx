/**
 * YearlyGoalsSection
 * Interactive yearly goals display with full functionality
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Target, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { CompactGoalGrid } from '@/components/yearly-goals';
import { useToast } from '@/hooks/use-toast';
import type { YearlyGoalWithProgress } from '@/hooks/useYearlyGoals';
import type { OutdoorLogType } from '@/components/yearly-goals/CompactGoalCard';

interface YearlyGoalsSectionProps {
  year: string;
  goals: YearlyGoalWithProgress[];
  goalsByCategory: Record<string, YearlyGoalWithProgress[]>;
  categories: string[];
  categoryLabels: Record<string, string>;
  stats: { completedGoals: number; totalGoals: number };
  toggleGoal: (id: number) => Promise<void>;
  incrementGoal: (params: { id: number; amount: number }) => Promise<void>;
  toggleSubItem: (params: { goalId: number; subItemId: string }) => Promise<{ isGoalCompleted: boolean }>;
  claimReward: (id: number) => Promise<{ pointsAwarded: number }>;
  isToggling: boolean;
  isIncrementing: boolean;
  isClaimingReward: boolean;
  onLogOutdoorDay?: (type: OutdoorLogType) => void;
  defaultHidden?: boolean;
}

export function YearlyGoalsSection({
  year,
  goals,
  stats,
  toggleGoal,
  incrementGoal,
  toggleSubItem,
  claimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
  onLogOutdoorDay,
  defaultHidden = false,
}: YearlyGoalsSectionProps) {
  const [goalsHidden, setGoalsHidden] = useState(defaultHidden);
  const { toast } = useToast();

  // Wrap toggleSubItem with error handling and success toast
  const handleToggleSubItem = async (goalId: number, subItemId: string) => {
    try {
      const result = await toggleSubItem({ goalId, subItemId });
      if (result.isGoalCompleted) {
        toast({
          title: "Goal completed!",
          description: "All sub-items done. Claim your reward!",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle sub-item",
        variant: "destructive",
      });
    }
  };

  // Wrap claimReward with success/error toast
  const handleClaimReward = async (goalId: number) => {
    try {
      const result = await claimReward(goalId);
      toast({
        title: "Reward claimed!",
        description: `+${result?.pointsAwarded ?? 0} XP earned`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  if (goals.length === 0) {
    return (
      <div className="glass-card frost-accent py-6 px-4 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--peach-400,#f0a67a)]/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-[var(--peach-400,#f0a67a)]" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">No yearly goals yet</p>
        <Link href="/yearly-goals" className="flex items-center gap-1 text-xs text-[var(--peach-400,#f0a67a)] hover:underline">
          <Plus className="w-3 h-3" /> Set your first goal
        </Link>
      </div>
    );
  }

  // STABLE sort: only by completion status and ID (never by progress %)
  // This prevents UI jumping when progress changes during interaction
  const stableSortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      // Incomplete goals first
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      // Then by ID for stable ordering (never changes)
      return a.id - b.id;
    });
  }, [goals]);

  return (
    <div className="glass-card frost-accent py-3 px-4">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setGoalsHidden(!goalsHidden)}
          className="flex items-center gap-2 group"
        >
          {goalsHidden ? (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
          )}
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide group-hover:text-[var(--text-primary)] transition-colors">
            {year} Goals
          </span>
        </button>
        <Link href="/goals">
          <span className="text-xs text-peach-400 hover:underline cursor-pointer tabular-nums">
            {stats.completedGoals}/{stats.totalGoals}
          </span>
        </Link>
      </div>

      {/* Interactive goal cards with full functionality */}
      {!goalsHidden && (
        <CompactGoalGrid
          goals={stableSortedGoals}
          onToggle={(goalId) => toggleGoal(goalId)}
          onIncrement={(goalId, amount) => incrementGoal({ id: goalId, amount })}
          onToggleSubItem={handleToggleSubItem}
          onClaimReward={handleClaimReward}
          isToggling={isToggling}
          isIncrementing={isIncrementing}
          isClaimingReward={isClaimingReward}
          onLogOutdoorDay={onLogOutdoorDay}
        />
      )}
    </div>
  );
}
