/**
 * YearlyGoalsSection
 * Interactive yearly goals display with full functionality
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { CompactGoalGrid } from '@/components/yearly-goals';
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
  defaultHidden = false,
}: YearlyGoalsSectionProps) {
  const [goalsHidden, setGoalsHidden] = useState(defaultHidden);

  if (goals.length === 0) return null;

  // Sort: incomplete first, then by progress %
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.progressPercent - a.progressPercent;
  });

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
          goals={sortedGoals}
          onToggle={(goalId) => toggleGoal(goalId)}
          onIncrement={(goalId, amount) => incrementGoal({ id: goalId, amount })}
          onToggleSubItem={(goalId, subItemId) => toggleSubItem({ goalId, subItemId })}
          onClaimReward={(goalId) => claimReward(goalId)}
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
