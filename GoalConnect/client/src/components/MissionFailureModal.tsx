import { motion, AnimatePresence } from "framer-motion";
import { X, CloudRain, RotateCcw, BarChart3 } from "lucide-react";

interface MissionFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  mission: {
    mountain: string;
    currentDay: number;
    totalDays: number;
    daysCompleted: number;
    perfectDays: number;
    requiredCompletionPercent: number;
  };
}

export function MissionFailureModal({ isOpen, onClose, onRetry, mission }: MissionFailureModalProps) {
  if (!isOpen) return null;

  const completionRate = mission.totalDays > 0
    ? Math.round((mission.daysCompleted / mission.totalDays) * 100)
    : 0;

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
            className="relative max-w-lg w-full bg-background/95 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Stormy weather icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <CloudRain className="w-12 h-12 text-red-500" />
              </motion.div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-red-500 mb-2">⛈️ Mission Failed</h2>
              <h3 className="text-xl font-semibold text-foreground">{mission.mountain}</h3>
              <p className="text-muted-foreground mt-2">
                Expedition abandoned on Day {mission.currentDay}
              </p>
            </div>

            {/* Message */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
              <p className="text-foreground/90 text-center">
                The weather turned harsh. The mountain will be here when you're ready to try again.
              </p>
            </div>

            {/* Stats */}
            <div className="bg-foreground/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Expedition Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Attempted:</span>
                  <span className="font-medium">{mission.currentDay} of {mission.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Completed:</span>
                  <span className="font-medium">{mission.daysCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perfect Days:</span>
                  <span className="font-medium">{mission.perfectDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Completion:</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
              </div>
            </div>

            {/* Encouragement */}
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
              <p className="text-sm text-foreground/80 text-center italic">
                "Every mountaineer faces setbacks. The summit awaits your return when you're ready."
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 transition-colors font-medium"
              >
                View Stats
              </button>
              <button
                onClick={onRetry}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Expedition
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
