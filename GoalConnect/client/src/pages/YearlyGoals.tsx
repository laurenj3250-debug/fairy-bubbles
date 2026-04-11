import { useState } from "react";
import { useYearlyGoals, type YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { SundownPageWrapper } from "@/components/sundown/SundownPageWrapper";
import { Loader2, Sparkles } from "lucide-react";
import {
  YearlyGoalsHeader,
  YearlyCategory,
} from "@/components/yearly-goals";
import { useToast } from "@/hooks/use-toast";
import { YearlyGoalDialog } from "@/components/YearlyGoalDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

export default function YearlyGoals() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<YearlyGoalWithProgress | undefined>();
  const [deletingGoal, setDeletingGoal] = useState<YearlyGoalWithProgress | null>(null);

  const {
    goals,
    goalsByCategory,
    categories,
    stats,
    isLoading,
    error,
    categoryLabels,
    toggleGoal,
    incrementGoal,
    toggleSubItem,
    claimReward,
    deleteGoal,
    isToggling,
    isIncrementing,
    isTogglingSubItem,
    isClaimingReward,
  } = useYearlyGoals(year);

  const handleAddGoal = () => {
    setEditingGoal(undefined);
    setDialogOpen(true);
  };

  const handleEditGoal = (goal: YearlyGoalWithProgress) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoal(deletingGoal.id);
      toast({ title: "Goal deleted" });
      setDeletingGoal(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (goalId: number) => {
    try {
      await toggleGoal(goalId);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle goal",
        variant: "destructive",
      });
    }
  };

  const handleIncrement = async (goalId: number, amount: number) => {
    try {
      await incrementGoal({ id: goalId, amount });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const handleToggleSubItem = async (goalId: number, subItemId: string) => {
    try {
      const result = await toggleSubItem({ goalId, subItemId });
      if (result.isGoalCompleted) {
        toast({
          title: "Goal completed!",
          description: "All sub-items are done. Don't forget to claim your reward!",
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

  const handleClaimReward = async (goalId: number) => {
    try {
      const result = await claimReward(goalId);
      const bonus = result.categoryBonus > 0 ? ` +${result.categoryBonus} category bonus!` : "";
      toast({
        title: "Reward claimed!",
        description: `+${result.pointsAwarded} XP earned${bonus}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  return (
    <SundownPageWrapper title="Yearly Goals" subtitle="Your aspirations for the year">
      <div className="px-5 md:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <YearlyGoalsHeader
            year={year}
            onYearChange={setYear}
            onAddGoal={handleAddGoal}
            stats={stats}
          />

          {/* Loading state */}
          {isLoading && (
            <div className="sd-shell flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--sd-text-accent)]" />
                <span className="text-sm text-[var(--text-muted)] font-body">Loading your goals...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="sd-shell !border-red-500/30 p-8 text-center">
              <p className="text-red-400 font-body">Failed to load yearly goals</p>
              <p className="text-sm text-[var(--text-muted)] mt-2 font-body">Please try refreshing the page</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && goals.length === 0 && (
            <div className="sd-shell p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(225,164,92,0.8)]/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[var(--sd-text-accent)]" />
              </div>
              <h3 className="text-xl font-heading font-medium text-[var(--text-primary)] mb-2">
                No goals for {year}
              </h3>
              <p className="text-[var(--text-muted)] font-body max-w-md mx-auto mb-6">
                Set some ambitious goals to track your progress throughout the year.
                Goals can be linked to habits and journey activities for automatic tracking.
              </p>
              <button
                onClick={handleAddGoal}
                className="px-5 py-2.5 rounded-lg border border-[rgba(225,164,92,0.4)] text-[var(--sd-text-accent)] font-medium"
                style={{
                  background: "linear-gradient(145deg, rgba(255,210,140,0.15), rgba(200,131,73,0.2))",
                }}
              >
                + Add your first goal
              </button>
            </div>
          )}

          {/* Categories list */}
          {!isLoading && !error && goals.length > 0 && (
            <div className="space-y-4">
              {categories.map((category) => (
                <YearlyCategory
                  key={category}
                  category={category}
                  categoryLabel={categoryLabels[category] || category}
                  goals={goalsByCategory[category]}
                  onToggle={handleToggle}
                  onIncrement={handleIncrement}
                  onToggleSubItem={handleToggleSubItem}
                  onClaimReward={handleClaimReward}
                  onEdit={handleEditGoal}
                  onDelete={(g) => setDeletingGoal(g)}
                  isToggling={isToggling}
                  isIncrementing={isIncrementing}
                  isClaimingReward={isClaimingReward}
                />
              ))}
            </div>
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
        defaultYear={year}
      />
      <DeleteConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(o) => { if (!o) setDeletingGoal(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Yearly Goal"
        itemName={deletingGoal?.title ?? ''}
        itemType="goal"
      />
    </SundownPageWrapper>
  );
}
