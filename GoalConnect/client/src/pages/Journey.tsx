import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { useStravaClimbingActivities } from "@/hooks/useStravaClimbingActivities";
import { useClimbingLog } from "@/hooks/useClimbingLog";
import { CyclingTab, LiftingTab, ClimbingTab } from "@/components/journey";
import { ForestBackground } from "@/components/ForestBackground";

type ActivityTab = "cycling" | "lifting" | "climbing";

export default function Journey() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("cycling");
  const { targets, updateGoal, isUpdating, isLoading: isLoadingGoals } = useJourneyGoals();
  const { stats: stravaStats, isLoading: isLoadingStrava } = useStravaStats();
  const { stats: kilterStats, isLoading: isLoadingKilter } = useClimbingStats();
  const { stats: stravaClimbingStats, isLoading: isLoadingStravaClimbing } = useStravaClimbingActivities();
  const { ticks: climbingLogTicks, stats: climbingLogStats, isLoading: isLoadingClimbingLog, createTick, updateTick, deleteTick, isCreating } = useClimbingLog();

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: "lifting", label: "Lifting" },
    { id: "climbing", label: "Climbing" },
    { id: "cycling", label: "Cycling" },
  ];

  // Helper to update goal by key
  const handleUpdateGoal = async (goalKey: string, value: number) => {
    await updateGoal({ goalKey, targetValue: value });
  };

  return (
    <div className="min-h-screen relative">
      {/* Forest background */}
      <ForestBackground />

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-5">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="logo-text tracking-wider text-2xl">JOURNEY</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Track your athletic progress
              </p>
            </div>
            {/* Tab Selector */}
            <div className="glass-card frost-accent p-1 inline-flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-peach-400 text-white"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          {/* Tab Content */}
          <div className="space-y-5">
        {activeTab === "cycling" && (
          <CyclingTab
            yearlyGoal={targets?.cyclingMiles || 2000}
            stravaStats={stravaStats}
            onUpdateGoal={handleUpdateGoal}
            isUpdating={isUpdating}
          />
        )}

        {activeTab === "lifting" && (
          <LiftingTab
            yearlyWorkoutsGoal={targets?.liftingWorkouts || 150}
            totalLiftGoal={targets?.liftingTotal || 500000}
            stravaStats={stravaStats}
            onUpdateGoal={handleUpdateGoal}
            isUpdating={isUpdating}
          />
        )}

        {activeTab === "climbing" && (
          <ClimbingTab
            yearlyClimbsGoal={targets?.climbingTicks || 200}
            onUpdateGoal={handleUpdateGoal}
            isUpdating={isUpdating}
            kilterStats={kilterStats}
            isLoadingKilter={isLoadingKilter}
            stravaClimbingStats={stravaClimbingStats}
            isLoadingStravaClimbing={isLoadingStravaClimbing}
            climbingLogTicks={climbingLogTicks}
            climbingLogStats={climbingLogStats}
            isLoadingClimbingLog={isLoadingClimbingLog}
            onCreateTick={createTick}
            onUpdateTick={updateTick}
            onDeleteTick={deleteTick}
            isCreatingTick={isCreating}
          />
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
