import { motion, AnimatePresence } from "framer-motion";
import { Mountain, X, TrendingUp, Calendar, Target, Lock, AlertTriangle } from "lucide-react";

interface MissionBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mountain: {
    id: number;
    name: string;
    elevation: number;
    country: string;
    mountainRange: string;
    description: string;
    difficultyTier: string;
    requiredClimbingLevel: number;
  };
  missionParams: {
    totalDays: number;
    requiredCompletionPercent: number;
  };
  meetsLevelRequirement: boolean;
  userLevel: number;
  habitCount: number;
}

export function MissionBriefingModal({
  isOpen,
  onClose,
  onConfirm,
  mountain,
  missionParams,
  meetsLevelRequirement,
  userLevel,
  habitCount,
}: MissionBriefingModalProps) {
  if (!isOpen) return null;

  const requiredHabits = Math.ceil((habitCount * missionParams.requiredCompletionPercent) / 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-2xl w-full bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative p-8 pb-6 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Mountain icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Mountain className="w-12 h-12 text-primary" />
                </motion.div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Begin Expedition</h2>
                <h3 className="text-2xl font-semibold text-primary">{mountain.name}</h3>
                <p className="text-muted-foreground mt-1">
                  {mountain.elevation.toLocaleString()}m • {mountain.country}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 pt-6 space-y-6">
              {/* Description */}
              <div className="bg-foreground/5 rounded-2xl p-4">
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {mountain.description}
                </p>
              </div>

              {/* Mission Briefing */}
              <div>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Mission Briefing
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Duration</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{missionParams.totalDays} days</div>
                  </div>

                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-xs text-muted-foreground">Daily Goal</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {missionParams.requiredCompletionPercent}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-secondary/10 border border-secondary/30 rounded-xl p-4">
                  <p className="text-sm text-foreground/90">
                    <span className="font-semibold">Your Challenge:</span> Complete at least{" "}
                    <span className="font-bold text-primary">{requiredHabits} of your {habitCount} habits</span>{" "}
                    each day for {missionParams.totalDays} consecutive days to reach the summit.
                  </p>
                </div>
              </div>

              {/* Rewards Preview */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span>🏆</span>
                  <span>Summit Rewards</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span className="text-muted-foreground">Mountain Background</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span className="text-muted-foreground">Theme Colors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span className="text-muted-foreground">Climbing XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span className="text-muted-foreground">Alpine Points</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  💎 Bonus rewards for first attempt, perfect days, and streak maintenance!
                </p>
              </div>

              {/* Warning */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">
                    Commitment Required
                  </p>
                  <p className="text-foreground/80">
                    Missing your daily goal will end the expedition. You can retry anytime, but your progress will reset.
                  </p>
                </div>
              </div>

              {/* Level check */}
              {!meetsLevelRequirement && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-500 mb-1">Level Requirement Not Met</p>
                    <p className="text-foreground/80">
                      Required Level: {mountain.requiredClimbingLevel} • Your Level: {userLevel}
                    </p>
                    <p className="text-foreground/60 mt-1 text-xs">
                      Keep completing habits to gain experience and level up!
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors font-semibold"
                >
                  Not Ready
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!meetsLevelRequirement}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                    meetsLevelRequirement
                      ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl'
                      : 'bg-foreground/10 text-foreground/40 cursor-not-allowed'
                  }`}
                >
                  🏔️ Start Expedition
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
