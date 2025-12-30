import { useState } from "react";
import { useYearlyGoals } from "@/hooks/useYearlyGoals";
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";
import { Loader2, Sparkles, BookOpen } from "lucide-react";
import {
  YearlyGoalsHeader,
  YearlyCategory,
} from "@/components/yearly-goals";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function YearlyGoals() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Seed reading schedule mutation
  const seedReadingSchedule = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seed/reading-schedule", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed reading schedule");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/yearly-goals/with-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Reading schedule created!",
        description: data.message,
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to seed",
        variant: "destructive",
      });
    },
  });

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
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex-col justify-center pl-6 hidden md:flex">
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
      <div className="relative z-10 px-5 md:px-8 md:ml-[160px] pb-24 pt-8">
        <div className="max-w-4xl mx-auto">
          <YearlyGoalsHeader
            year={year}
            onYearChange={setYear}
            stats={stats}
          />

          {/* Loading state */}
          {isLoading && (
            <div className="glass-card flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-peach-400" />
                <span className="text-sm text-[var(--text-muted)] font-body">Loading your goals...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="glass-card !border-red-500/30 p-8 text-center">
              <p className="text-red-400 font-body">Failed to load yearly goals</p>
              <p className="text-sm text-[var(--text-muted)] mt-2 font-body">Please try refreshing the page</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && goals.length === 0 && (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-peach-400/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-peach-400" />
              </div>
              <h3 className="text-xl font-heading font-medium text-[var(--text-primary)] mb-2">
                No goals for {year}
              </h3>
              <p className="text-[var(--text-muted)] font-body max-w-md mx-auto mb-4">
                Set some ambitious goals to track your progress throughout the year.
                Goals can be linked to habits and journey activities for automatic tracking.
              </p>
              {year === "2025" && (
                <button
                  onClick={() => seedReadingSchedule.mutate()}
                  disabled={seedReadingSchedule.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-peach-400/20 hover:bg-peach-400/30 text-peach-400 rounded-lg transition-colors font-body text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  {seedReadingSchedule.isPending ? "Creating..." : "Add de Lahunta Reading Schedule"}
                </button>
              )}
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

              {/* Add reading schedule button if not already present */}
              {year === "2025" && !goals.some(g => g.title === "Complete de Lahunta") && (
                <div className="glass-card p-4 text-center">
                  <button
                    onClick={() => seedReadingSchedule.mutate()}
                    disabled={seedReadingSchedule.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-peach-400/20 hover:bg-peach-400/30 text-peach-400 rounded-lg transition-colors font-body text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    {seedReadingSchedule.isPending ? "Creating..." : "Add de Lahunta Reading Schedule"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
