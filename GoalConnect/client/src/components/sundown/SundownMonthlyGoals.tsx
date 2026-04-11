import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { YearlyGoalDialog } from '@/components/YearlyGoalDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { useYearlyGoals, type YearlyGoalWithProgress } from '@/hooks/useYearlyGoals';
import { isGoalLinked } from '@/lib/yearlyGoalUtils';

interface GoalData {
  id: number;
  title: string;
  current: number;
  target: number;
  category: string;
}

interface SundownMonthlyGoalsProps {
  goals: GoalData[];
  rawGoals?: YearlyGoalWithProgress[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getGlowClass(pct: number, isComplete: boolean): string {
  if (isComplete) return 'completed';
  if (pct >= 70) return 'glow-high';
  if (pct >= 30) return 'glow-moderate';
  return 'glow-dim';
}

export function SundownMonthlyGoals({ goals, rawGoals = [] }: SundownMonthlyGoalsProps) {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const { toast } = useToast();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<YearlyGoalWithProgress | undefined>();
  const [deletingGoal, setDeletingGoal] = useState<YearlyGoalWithProgress | null>(null);

  const { deleteGoal } = useYearlyGoals();

  const incrementMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return await apiRequest(`/api/yearly-goals/${goalId}/increment`, 'POST', { amount: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/yearly-goals/with-progress'] });
      toast({ title: '+1 progress' });
    },
    onError: () => {
      toast({ title: 'Failed to update goal', variant: 'destructive' });
    },
  });

  const handleEdit = (goalId: number) => {
    const raw = rawGoals.find((g) => g.id === goalId);
    if (raw) {
      setEditingGoal(raw);
      setDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoal(deletingGoal.id);
      toast({ title: 'Goal deleted' });
      setDeletingGoal(null);
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingGoal(undefined);
    setDialogOpen(true);
  };

  const completedCount = goals.filter((g) => g.current >= g.target).length;

  const [showAll, setShowAll] = useState(false);

  // Show first 6 goals collapsed, all when expanded
  const displayGoals = useMemo(() => {
    const sorted = [...goals].sort((a, b) => {
      // Completed last, then by progress descending
      const aComplete = a.current >= a.target ? 1 : 0;
      const bComplete = b.current >= b.target ? 1 : 0;
      if (aComplete !== bComplete) return aComplete - bComplete;
      const aPct = a.target > 0 ? a.current / a.target : 0;
      const bPct = b.target > 0 ? b.current / b.target : 0;
      return bPct - aPct;
    });
    return showAll ? sorted : sorted.slice(0, 6);
  }, [goals, showAll]);

  return (
    <div className="sd-full-width">
      <div className="sd-shell" style={{ animationDelay: '2s' }}>
        <div className="sd-face">
          <div className="sd-card-hdr">
            <span className="sd-card-title">Goals</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sd-badge">
                {completedCount}/{goals.length} Complete
              </span>
              <button
                onClick={handleCreate}
                data-testid="add-yearly-goal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(225,164,92,0.35)',
                  background: 'linear-gradient(145deg, rgba(255,210,140,0.15), rgba(200,131,73,0.2))',
                  color: 'var(--sd-text-accent)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Goal
              </button>
            </div>
          </div>

          {/* Month tabs */}
          <div className="sd-month-tabs">
            {MONTHS.map((month, i) => {
              let className = 'sd-month-tab';
              if (i === selectedMonth) className += ' active';
              else if (i < currentMonth) className += ' past';
              else if (i > currentMonth) className += ' future';
              return (
                <button
                  key={month}
                  className={className}
                  onClick={() => setSelectedMonth(i)}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Goals grid */}
          <div className="sd-goals-grid">
            {displayGoals.map((goal) => {
              const pct =
                goal.target > 0
                  ? Math.round((goal.current / goal.target) * 100)
                  : 0;
              const isComplete = goal.current >= goal.target;
              const glowClass = getGlowClass(pct, isComplete);
              const rawGoal = rawGoals.find((g) => g.id === goal.id);
              const isManualCount =
                rawGoal?.goalType === 'count' && !!rawGoal && !isGoalLinked(rawGoal);

              return (
                <div
                  key={goal.id}
                  className={`sd-goal-tile ${glowClass}`}
                >
                  <div className="sd-goal-tile-inner">
                    <div className="sd-goal-tile-name">{goal.title}</div>
                    <div className="sd-goal-tile-fraction">
                      {isComplete
                        ? 'Complete'
                        : `${goal.current} / ${goal.target} (${pct}%)`}
                    </div>
                    <div className="sd-goal-tile-bar">
                      <div
                        className="sd-goal-tile-fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          opacity: isComplete ? 0.4 : 1,
                        }}
                      />
                    </div>
                    {/* Action cluster — top right */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      {!isComplete && isManualCount && (
                        <button
                          onClick={(e) => { e.stopPropagation(); incrementMutation.mutate(goal.id); }}
                          disabled={incrementMutation.isPending}
                          data-testid={`increment-goal-${goal.id}`}
                          title="Add progress"
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            border: '1px solid rgba(225,164,92,0.25)',
                            background: 'rgba(225,164,92,0.1)',
                            color: 'var(--sd-text-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0,
                          }}
                        >
                          <Plus style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(goal.id); }}
                        data-testid={`edit-goal-${goal.id}`}
                        title="Edit goal"
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          border: '1px solid rgba(225,164,92,0.2)',
                          background: 'rgba(15,10,8,0.5)',
                          color: 'var(--sd-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <Pencil style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const raw = rawGoals.find((g) => g.id === goal.id);
                          if (raw) setDeletingGoal(raw);
                        }}
                        data-testid={`delete-goal-${goal.id}`}
                        title="Delete goal"
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          border: '1px solid rgba(200,80,80,0.3)',
                          background: 'rgba(15,10,8,0.5)',
                          color: 'rgba(220,120,120,0.8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                    {isComplete && (
                      <div className="sd-completed-check">
                        <svg viewBox="0 0 24 24">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {goals.length > 6 && (
            <button
              className="sd-show-all-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${goals.length} Goals`}
            </button>
          )}
        </div>
      </div>

      <YearlyGoalDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditingGoal(undefined);
        }}
        goal={editingGoal}
      />
      <DeleteConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(o) => { if (!o) setDeletingGoal(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Yearly Goal"
        itemName={deletingGoal?.title ?? ''}
        itemType="goal"
      />
    </div>
  );
}
