import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { useStravaClimbingActivities } from "@/hooks/useStravaClimbingActivities";
import { useClimbingLog } from "@/hooks/useClimbingLog";
import { CyclingTab, LiftingTab, ClimbingTab } from "@/components/journey";
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";

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

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex flex-col justify-center pl-6">
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
            <span className="block text-peach-400 text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/adventures">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              adventures
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
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-[188px] space-y-5">
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
