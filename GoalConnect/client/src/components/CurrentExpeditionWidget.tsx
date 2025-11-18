import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, Award, Calendar } from "lucide-react";
import { Link } from "wouter";

interface Mission {
  id: number;
  mountainId: number;
  status: string;
  totalDays: number;
  currentDay: number;
  daysCompleted: number;
  perfectDays: number;
  requiredCompletionPercent: number;
  mountain: {
    name: string;
    elevation: number;
    country: string;
    difficultyTier: string;
  };
}

export default function CurrentExpeditionWidget() {
  const { data: mission, isLoading } = useQuery<Mission | null>({
    queryKey: ["/api/expedition-missions/current"],
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-8 bg-muted/20 rounded mb-4"></div>
        <div className="h-32 bg-muted/20 rounded"></div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mountain className="w-5 h-5" />
          Expedition Missions
        </h3>
        <p className="text-muted-foreground mb-4">
          No active expedition. Ready to start your journey?
        </p>
        <Link href="/expedition-missions">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            View Available Expeditions
          </button>
        </Link>
      </div>
    );
  }

  const progress = (mission.daysCompleted / mission.totalDays) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card interactive-glow p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Mountain className="w-5 h-5" />
        Current Expedition
      </h3>

      <div className="space-y-4">
        {/* Mountain Name */}
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            {mission.mountain.name}
          </h4>
          <p className="text-sm text-muted-foreground">
            {mission.mountain.elevation.toLocaleString()}m • {mission.mountain.country}
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Day {mission.currentDay} of {mission.totalDays}
            </span>
            <span className="text-foreground font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{mission.daysCompleted} days</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>{mission.perfectDays} perfect</span>
          </div>
        </div>

        {/* Goal Reminder */}
        <div className="p-3 bg-muted/10 rounded-lg border border-card-border/50">
          <p className="text-xs text-muted-foreground">
            Complete {mission.requiredCompletionPercent}% of habits each day to summit!
          </p>
        </div>

        {/* View Details */}
        <Link href="/expedition-missions">
          <button className="w-full px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">
            View Full Expedition Details →
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
