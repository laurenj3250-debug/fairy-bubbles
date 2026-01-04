/**
 * YearlyGoalsSection
 * Collapsible yearly goals grouped by category
 */

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { CompactGoalGrid } from '@/components/yearly-goals';
import { useToast } from '@/hooks/use-toast';
import { triggerConfetti } from '@/lib/confetti';
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
  goalsByCategory,
  categories,
  categoryLabels,
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
  const { toast } = useToast();
  const [goalsHidden, setGoalsHidden] = useState(defaultHidden);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryCollapse = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedCategories(new Set(categories));
  }, [categories]);

  const expandAll = useCallback(() => {
    setCollapsedCategories(new Set());
  }, []);

  if (goals.length === 0) return null;

  return (
    <div className="glass-card frost-accent">
      <div className={cn("flex items-center justify-between", !goalsHidden && "mb-4")}>
        <button
          onClick={() => setGoalsHidden(!goalsHidden)}
          className="flex items-center gap-2 group"
        >
          {goalsHidden ? (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
          )}
          <span className="card-title group-hover:text-peach-400 transition-colors">{year} Goals</span>
        </button>
        <div className="flex items-center gap-3">
          {!goalsHidden && (
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="text-[10px] text-[var(--text-muted)] hover:text-peach-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
              >
                expand
              </button>
              <span className="text-[var(--text-muted)]">·</span>
              <button
                onClick={collapseAll}
                className="text-[10px] text-[var(--text-muted)] hover:text-peach-400 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
              >
                collapse
              </button>
            </div>
          )}
          <Link href="/goals">
            <span className="text-xs text-peach-400 hover:underline cursor-pointer">
              {stats.completedGoals}/{stats.totalGoals} complete
            </span>
          </Link>
        </div>
      </div>

      {!goalsHidden && (
        <div className="space-y-3">
          {categories.map((category) => {
            const isCollapsed = collapsedCategories.has(category);
            const categoryGoals = goalsByCategory[category];
            const completedInCategory = categoryGoals.filter(g => g.isCompleted).length;

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategoryCollapse(category)}
                  className="w-full flex items-center gap-2 py-1.5 text-left group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
                  )}
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">
                    {categoryLabels[category] || category}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    {completedInCategory}/{categoryGoals.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-2">
                    <CompactGoalGrid
                      goals={categoryGoals}
                      onToggle={async (goalId) => {
                        try {
                          await toggleGoal(goalId);
                          triggerConfetti('goal_completed');
                        } catch (err) {
                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle goal", variant: "destructive" });
                        }
                      }}
                      onIncrement={async (goalId, amount) => {
                        try {
                          await incrementGoal({ id: goalId, amount });
                        } catch (err) {
                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update progress", variant: "destructive" });
                        }
                      }}
                      onLogClimb={onLogClimb}
                      onAddBook={onAddBook}
                      onToggleSubItem={async (goalId, subItemId) => {
                        try {
                          const result = await toggleSubItem({ goalId, subItemId });
                          if (result.isGoalCompleted) {
                            triggerConfetti('goal_completed');
                            toast({ title: "Goal completed!", description: "All sub-items are done!" });
                          }
                        } catch (err) {
                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle sub-item", variant: "destructive" });
                        }
                      }}
                      onClaimReward={async (goalId) => {
                        try {
                          const result = await claimReward(goalId);
                          triggerConfetti('reward_claimed');
                          toast({ title: "Reward claimed!", description: `+${result.pointsAwarded} XP earned` });
                        } catch (err) {
                          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to claim reward", variant: "destructive" });
                        }
                      }}
                      isToggling={isToggling}
                      isIncrementing={isIncrementing}
                      isClaimingReward={isClaimingReward}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
