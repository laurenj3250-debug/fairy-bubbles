import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, ArrowRight, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { SummitCelebration } from "@/components/SummitCelebration";
import { MissionBriefingModal } from "@/components/MissionBriefingModal";

interface Mission {
  id: number;
  mountainId: number;
  status: string;
  totalDays: number;
  currentDay: number;
  daysCompleted: number;
  perfectDays: number;
  requiredCompletionPercent: number;
  startDate: string;
  mountain: {
    id: number;
    name: string;
    elevation: number;
    country: string;
    mountainRange: string;
    difficultyTier: string;
    description: string;
    requiredClimbingLevel: number;
  };
}

interface NextMountain {
  mountain: {
    id: number;
    name: string;
    elevation: number;
    country: string;
    mountainRange: string;
    difficultyTier: string;
    description: string;
    requiredClimbingLevel: number;
  };
  missionParams: {
    totalDays: number;
    requiredCompletionPercent: number;
  };
  meetsLevelRequirement: boolean;
  userLevel: number;
  requiredLevel: number;
}

export default function ExpeditionMissions() {
  const [celebrationRewards, setCelebrationRewards] = useState<any>(null);

  const { data: currentMission } = useQuery<Mission | null>({
    queryKey: ["/api/expedition-missions/current"],
  });

  const { data: nextMountain } = useQuery<NextMountain>({
    queryKey: ["/api/expedition-missions/next"],
    enabled: !currentMission,
  });

  // Check for celebration data in sessionStorage (set by mission completion)
  useEffect(() => {
    const celebrationData = sessionStorage.getItem('summit-celebration');
    if (celebrationData) {
      try {
        const rewards = JSON.parse(celebrationData);
        setCelebrationRewards(rewards);
        sessionStorage.removeItem('summit-celebration');
      } catch (e) {
        console.error('Failed to parse celebration data:', e);
      }
    }
  }, []);

  return (
    <>
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
              }}
            />
          </div>

          {/* Header Content */}
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Mountain className="w-8 h-8" />
              Expedition Missions
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              Unlock mountains through time-based habit challenges
            </p>
          </div>
        </div>

        {/* Active Mission or Next Mountain */}
        {currentMission ? (
          <ActiveMissionCard mission={currentMission} />
        ) : (
          nextMountain && <NextMountainCard nextMountain={nextMountain} />
        )}
      </div>
    </div>

    {/* Summit Celebration Modal */}
    {celebrationRewards && (
      <SummitCelebration
        isOpen={!!celebrationRewards}
        onClose={() => setCelebrationRewards(null)}
        rewards={celebrationRewards}
      />
    )}
    </>
  );
}

function ActiveMissionCard({ mission }: { mission: Mission }) {
  const progress = (mission.daysCompleted / mission.totalDays) * 100;
  const daysRemaining = mission.totalDays - mission.currentDay + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-8 relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {mission.mountain.name}
            </h2>
            <p className="text-foreground/70">
              {mission.mountain.elevation.toLocaleString()}m • {mission.mountain.country} •{" "}
              {mission.mountain.mountainRange}
            </p>
            <p className="text-sm text-foreground/60 mt-2 max-w-2xl">
              {mission.mountain.description}
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-medium shadow-md"
            style={{
              backgroundColor: 'hsl(var(--secondary) / 0.15)',
              border: '2px solid hsl(var(--secondary) / 0.5)',
              color: 'hsl(var(--secondary))'
            }}
          >
            {mission.mountain.difficultyTier}
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Day {mission.currentDay} of {mission.totalDays}
              </span>
              <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: 'hsl(var(--foreground) / 0.08)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl shadow-md">
              <div className="text-2xl font-bold text-foreground">{mission.daysCompleted}</div>
              <div className="text-xs text-foreground/60">Days Completed</div>
            </div>
            <div className="p-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl shadow-md">
              <div className="text-2xl font-bold text-foreground">{mission.perfectDays}</div>
              <div className="text-xs text-foreground/60">Perfect Days</div>
            </div>
            <div className="p-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl shadow-md">
              <div className="text-2xl font-bold text-foreground">{daysRemaining}</div>
              <div className="text-xs text-foreground/60">Days Remaining</div>
            </div>
          </div>

          {/* Goal Reminder */}
          <div
            className="p-4 rounded-2xl shadow-md border-2"
            style={{
              backgroundColor: 'hsl(var(--secondary) / 0.1)',
              borderColor: 'hsl(var(--secondary) / 0.3)'
            }}
          >
            <p className="text-sm text-foreground">
              <span className="font-semibold">Mission Goal:</span> Complete{" "}
              {mission.requiredCompletionPercent}% of your habits each day to reach the summit
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Started {new Date(mission.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NextMountainCard({ nextMountain }: { nextMountain: NextMountain }) {
  const { mountain, missionParams, meetsLevelRequirement, userLevel, requiredLevel } =
    nextMountain;
  const [showBriefing, setShowBriefing] = useState(false);

  // Get habit count
  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/habits"],
  });

  const startMission = async () => {
    try {
      const response = await fetch("/api/expedition-missions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mountainId: mountain.id }),
      });

      if (response.ok) {
        setShowBriefing(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to start mission:", error);
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-8 relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{mountain.name}</h2>
            <p className="text-foreground/70">
              {mountain.elevation.toLocaleString()}m • {mountain.country}
            </p>
            <p className="text-sm text-foreground/60 mt-2 max-w-2xl">
              {mountain.description}
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-medium shadow-md"
            style={{
              backgroundColor: 'hsl(var(--secondary) / 0.15)',
              border: '2px solid hsl(var(--secondary) / 0.5)',
              color: 'hsl(var(--secondary))'
            }}
          >
            {mountain.difficultyTier}
          </div>
        </div>

        {/* Mission Briefing */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground">Mission Briefing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl shadow-md">
              <div className="text-sm text-foreground/60 mb-1">Duration</div>
              <div className="text-xl font-bold text-foreground">{missionParams.totalDays} days</div>
            </div>
            <div className="p-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl shadow-md">
              <div className="text-sm text-foreground/60 mb-1">Daily Goal</div>
              <div className="text-xl font-bold text-foreground">
                {missionParams.requiredCompletionPercent}% of habits
              </div>
            </div>
          </div>
        </div>

        {/* Level Requirement */}
        {!meetsLevelRequirement && (
          <div
            className="p-4 rounded-2xl mb-6 flex items-center gap-3 border-2 shadow-md"
            style={{
              backgroundColor: 'hsl(25 100% 50% / 0.1)',
              borderColor: 'hsl(25 100% 50% / 0.3)'
            }}
          >
            <Lock className="w-5 h-5" style={{ color: 'hsl(25 100% 50%)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'hsl(25 100% 50%)' }}>Level Requirement Not Met</p>
              <p className="text-xs text-foreground/60">
                Required Level: {requiredLevel} • Your Level: {userLevel}
              </p>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={() => setShowBriefing(true)}
          disabled={!meetsLevelRequirement}
          className={`
            w-full px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2
            transition-all shadow-lg hover:shadow-xl text-white
            ${
              meetsLevelRequirement
                ? ""
                : "opacity-40 cursor-not-allowed"
            }
          `}
          style={
            meetsLevelRequirement
              ? {
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                }
              : {
                  background: 'hsl(var(--foreground) / 0.1)',
                  color: 'hsl(var(--foreground) / 0.4)'
                }
          }
        >
          <Mountain className="w-5 h-5" />
          Start Expedition
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>

    {/* Mission Briefing Modal */}
    <MissionBriefingModal
      isOpen={showBriefing}
      onClose={() => setShowBriefing(false)}
      onConfirm={startMission}
      mountain={mountain}
      missionParams={missionParams}
      meetsLevelRequirement={meetsLevelRequirement}
      userLevel={userLevel}
      habitCount={habits.length}
    />
    </>
  );
}
