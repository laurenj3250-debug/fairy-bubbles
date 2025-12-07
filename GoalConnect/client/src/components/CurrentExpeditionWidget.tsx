import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain } from "lucide-react";
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

  // When no active expedition, show nothing - user can access via nav
  if (!mission) {
    return null;
  }

  const progress = (mission.daysCompleted / mission.totalDays) * 100;

  return (
    <Link href="/expedition-missions">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card frost-accent p-4 cursor-pointer hover:border-peach-400/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-6">
          {/* Left: Mountain info */}
          <div className="flex items-center gap-3">
            <Mountain className="w-4 h-4 text-peach-400" />
            <div>
              <span className="font-heading text-sm">{mission.mountain.name}</span>
              <span className="text-[var(--text-muted)] text-xs ml-2">
                Day {mission.currentDay}/{mission.totalDays}
              </span>
            </div>
          </div>

          {/* Right: Progress bar */}
          <div className="flex items-center gap-3 flex-1 max-w-[200px]">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-peach-400 to-peach-300"
              />
            </div>
            <span className="text-xs text-peach-400 font-heading w-8">{Math.round(progress)}%</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
