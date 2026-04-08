import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { useStravaClimbingActivities } from "@/hooks/useStravaClimbingActivities";
import { useClimbingLog } from "@/hooks/useClimbingLog";
import { CyclingTab, LiftingTab, ClimbingTab } from "@/components/journey";
import { SundownPageWrapper } from "@/components/sundown/SundownPageWrapper";

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
    <SundownPageWrapper title="Journey" subtitle="Track your athletic progress">
      <div className="px-5 md:px-8 pb-24">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Tab Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div className="sd-shell" style={{ padding: 3, display: 'inline-flex', gap: 2 }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "text-[var(--sd-bg-deep)]"
                      : "text-[var(--sd-text-muted)] hover:text-[var(--sd-text-primary)]"
                  )}
                  style={activeTab === tab.id ? {
                    background: 'linear-gradient(145deg, rgba(225,164,92,0.9), rgba(200,131,73,0.8))',
                  } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

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
    </SundownPageWrapper>
  );
}
