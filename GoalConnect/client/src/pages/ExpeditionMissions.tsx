import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, ArrowRight, Lock } from "lucide-react";

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
  const { data: currentMission } = useQuery<Mission | null>({
    queryKey: ["/api/expedition-missions/current"],
  });

  const { data: nextMountain } = useQuery<NextMountain>({
    queryKey: ["/api/expedition-missions/next"],
    enabled: !currentMission,
  });

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mountain className="w-8 h-8" />
            Expedition Missions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock mountains through time-based habit challenges
          </p>
        </div>

        {/* Active Mission or Next Mountain */}
        {currentMission ? (
          <ActiveMissionCard mission={currentMission} />
        ) : (
          nextMountain && <NextMountainCard nextMountain={nextMountain} />
        )}
      </div>
    </div>
  );
}

function ActiveMissionCard({ mission }: { mission: Mission }) {
  const progress = (mission.daysCompleted / mission.totalDays) * 100;
  const daysRemaining = mission.totalDays - mission.currentDay + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card interactive-glow p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {mission.mountain.name}
          </h2>
          <p className="text-muted-foreground">
            {mission.mountain.elevation.toLocaleString()}m • {mission.mountain.country} •{" "}
            {mission.mountain.mountainRange}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {mission.mountain.description}
          </p>
        </div>
        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
          {mission.mountain.difficultyTier}
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Day {mission.currentDay} of {mission.totalDays}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-muted/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{mission.daysCompleted}</div>
            <div className="text-xs text-muted-foreground">Days Completed</div>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{mission.perfectDays}</div>
            <div className="text-xs text-muted-foreground">Perfect Days</div>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{daysRemaining}</div>
            <div className="text-xs text-muted-foreground">Days Remaining</div>
          </div>
        </div>

        {/* Goal Reminder */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">Mission Goal:</span> Complete{" "}
            {mission.requiredCompletionPercent}% of your habits each day to reach the summit
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Started {new Date(mission.startDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function NextMountainCard({ nextMountain }: { nextMountain: NextMountain }) {
  const { mountain, missionParams, meetsLevelRequirement, userLevel, requiredLevel } =
    nextMountain;

  const startMission = async () => {
    try {
      const response = await fetch("/api/expedition-missions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mountainId: mountain.id }),
      });

      if (response.ok) {
        window.location.reload(); // Simple reload for Phase 1
      }
    } catch (error) {
      console.error("Failed to start mission:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card interactive-glow p-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{mountain.name}</h2>
          <p className="text-muted-foreground">
            {mountain.elevation.toLocaleString()}m • {mountain.country}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {mountain.description}
          </p>
        </div>
        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
          {mountain.difficultyTier}
        </div>
      </div>

      {/* Mission Briefing */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">Mission Briefing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Duration</div>
            <div className="text-xl font-bold">{missionParams.totalDays} days</div>
          </div>
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Daily Goal</div>
            <div className="text-xl font-bold">
              {missionParams.requiredCompletionPercent}% of habits
            </div>
          </div>
        </div>
      </div>

      {/* Level Requirement */}
      {!meetsLevelRequirement && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-6 flex items-center gap-3">
          <Lock className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-sm font-medium text-orange-400">Level Requirement Not Met</p>
            <p className="text-xs text-muted-foreground">
              Required Level: {requiredLevel} • Your Level: {userLevel}
            </p>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={startMission}
        disabled={!meetsLevelRequirement}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2
          transition-all
          ${
            meetsLevelRequirement
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted/20 text-muted-foreground cursor-not-allowed"
          }
        `}
      >
        <Mountain className="w-5 h-5" />
        Start Expedition
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
