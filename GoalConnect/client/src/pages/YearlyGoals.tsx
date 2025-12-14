import { useState } from "react";
import { useYearlyGoals } from "@/hooks/useYearlyGoals";
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import {
  YearlyGoalsHeader,
  YearlyCategory,
} from "@/components/yearly-goals";
import { useToast } from "@/hooks/use-toast";

export default function YearlyGoals() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();

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
    isToggling,
    isIncrementing,
    isTogglingSubItem,
    isClaimingReward,
  } = useYearlyGoals(year);

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
    <div className="min-h-screen relative">
      <ForestBackground />

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex flex-col justify-center pl-6 hidden md:flex">
        <div className="space-y-4">
          <Link href="/">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              dashboard
            </span>
          </Link>
          <Link href="/habits">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              habits
            </span>
          </Link>
          <Link href="/goals">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              goals
            </span>
          </Link>
          <Link href="/yearly-goals">
            <span className="block text-peach-400 text-sm font-heading cursor-pointer">
              yearly goals
            </span>
          </Link>
          <Link href="/todos">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              todos
            </span>
          </Link>
          <Link href="/study">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              study
            </span>
          </Link>
          <Link href="/journey">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/settings">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 md:ml-[160px] pb-24 pt-8 max-w-5xl">
        <YearlyGoalsHeader
          year={year}
          onYearChange={setYear}
          stats={stats}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load yearly goals</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && goals.length === 0 && (
          <div className="bg-stone-900/50 rounded-xl border border-stone-800 p-12 text-center">
            <p className="text-stone-400 mb-4">No goals set for {year} yet.</p>
            <p className="text-sm text-stone-500">
              Run the seed script to add your 2026 goals, or create them manually.
            </p>
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
                isToggling={isToggling}
                isIncrementing={isIncrementing}
                isClaimingReward={isClaimingReward}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
