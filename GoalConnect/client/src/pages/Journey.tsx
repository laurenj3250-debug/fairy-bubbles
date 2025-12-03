import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { useStravaClimbingActivities } from "@/hooks/useStravaClimbingActivities";
import { useClimbingLog } from "@/hooks/useClimbingLog";
import { CyclingTab, LiftingTab, ClimbingTab } from "@/components/journey";

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
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/30">
        <h1 className="text-xl font-semibold tracking-tight">Journey</h1>
        {/* Tab Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/30 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 p-4 overflow-auto">
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
  );
}
