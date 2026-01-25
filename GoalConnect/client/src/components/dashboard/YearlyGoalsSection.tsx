/**
 * YearlyGoalsSection
 * Interactive yearly goals display with full functionality
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

  if (goals.length === 0) return null;

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
