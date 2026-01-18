/**
 * YearlyGoalsSection
 * Expandable yearly goals display with sub-item toggling support
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { CompactGoalGrid } from '@/components/yearly-goals';
import { useToast } from '@/hooks/use-toast';
import type { YearlyGoalWithProgress } from '@/hooks/useYearlyGoals';

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
  onLogClimb: () => void;
  onAddBook: () => void;
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
  onLogClimb,
  onAddBook,
  defaultHidden = true,
}: YearlyGoalsSectionProps) {
  const [goalsHidden, setGoalsHidden] = useState(defaultHidden);
  const { toast } = useToast();

  if (goals.length === 0) return null;

  // Sort: incomplete first, then by progress %
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.progressPercent - a.progressPercent;
  });

  // Handlers for goal actions
  const handleToggle = async (goalId: number) => {
    try {
      await toggleGoal(goalId);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle goal", variant: "destructive" });
    }
  };

  const handleIncrement = async (goalId: number, amount: number) => {
    try {
      await incrementGoal({ id: goalId, amount });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update progress", variant: "destructive" });
    }
  };

  const handleToggleSubItem = async (goalId: number, subItemId: string) => {
    try {
      const result = await toggleSubItem({ goalId, subItemId });
      if (result.isGoalCompleted) {
        toast({ title: "Goal completed!", description: "All sub-items are done. Don't forget to claim your reward!" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle sub-item", variant: "destructive" });
    }
  };

  const handleClaimReward = async (goalId: number) => {
    try {
      const result = await claimReward(goalId);
      const bonus = (result as any).categoryBonus > 0 ? ` +${(result as any).categoryBonus} category bonus!` : "";
      toast({ title: "Reward claimed!", description: `+${result.pointsAwarded} XP earned${bonus}` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to claim reward", variant: "destructive" });
    }
  };

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

      {/* Goal cards with expandable sub-items */}
      {!goalsHidden && (
        <CompactGoalGrid
          goals={sortedGoals}
          onToggle={handleToggle}
          onIncrement={handleIncrement}
          onToggleSubItem={handleToggleSubItem}
          onClaimReward={handleClaimReward}
          isToggling={isToggling}
          isIncrementing={isIncrementing}
          isClaimingReward={isClaimingReward}
          onLogClimb={onLogClimb}
          onAddBook={onAddBook}
        />
      )}
    </div>
  );
}
