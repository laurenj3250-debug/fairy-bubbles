import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mountain, Flame, Calendar, ArrowRight, Snowflake } from "lucide-react";

interface StreakRecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitTitle: string;
  brokenStreak: number;
  hasStreakFreeze?: boolean;
  onUseFreeze?: () => void;
  onStartFresh: () => void;
}

/**
 * Fresh Start Messaging Modal
 *
 * Shown when a streak breaks to:
 * 1. Reduce shame/abandonment with mountaineering framing
 * 2. Offer streak freeze if available
 * 3. Leverage Fresh Start Effect with temporal landmarks
 *
 * Psychology applied:
 * - Fresh Start Effect: Frame as "new expedition"
 * - Loss Aversion: Offer freeze as protection
 * - Temporal Landmarks: Reference Monday/new month if applicable
 */
export function StreakRecoveryModal({
  open,
  onOpenChange,
  habitTitle,
  brokenStreak,
  hasStreakFreeze = false,
  onUseFreeze,
  onStartFresh,
}: StreakRecoveryModalProps) {
  // Check for temporal landmarks
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  const isMonday = dayOfWeek === 1;
  const isSunday = dayOfWeek === 0;
  const isFirstOfMonth = dayOfMonth === 1;
  const isNewWeekSoon = dayOfWeek >= 5; // Friday or later

  // Generate fresh start message based on temporal landmarks
  const getFreshStartMessage = () => {
    if (isFirstOfMonth) {
      return "New month, new summit attempt. Perfect timing.";
    }
    if (isMonday) {
      return "It's Monday - the best day for a fresh expedition.";
    }
    if (isSunday) {
      return "New week starts tomorrow. Rest today, climb tomorrow.";
    }
    if (isNewWeekSoon) {
      return "New week is just around the corner. Perfect time to regroup.";
    }
    return "Every great mountaineer faces setbacks. Your next summit awaits.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Mountain className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Storm on the Mountain
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-center space-y-4 pt-2">
              <p className="text-foreground/70">
                Your <span className="font-medium text-foreground">{brokenStreak}-day expedition</span> on{" "}
                <span className="font-medium text-foreground">"{habitTitle}"</span> hit bad weather.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground/80 italic">
                  "{getFreshStartMessage()}"
                </p>
              </div>

              {brokenStreak >= 7 && (
                <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>You proved you can do {brokenStreak} days. You'll do it again.</span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* Streak Freeze Option */}
          {hasStreakFreeze && onUseFreeze && (
            <Button
              onClick={onUseFreeze}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Snowflake className="w-4 h-4 mr-2" />
              Use Streak Freeze (Restore {brokenStreak}-day streak)
            </Button>
          )}

          {/* Fresh Start Option */}
          <Button
            onClick={onStartFresh}
            variant={hasStreakFreeze ? "outline" : "default"}
            className="w-full"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Start New Expedition
          </Button>

          {/* Personal Best Reminder */}
          {brokenStreak > 0 && (
            <p className="text-xs text-center text-foreground/50 pt-2">
              <Calendar className="w-3 h-3 inline mr-1" />
              Your personal best: {brokenStreak} days. Can you beat it?
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StreakRecoveryModal;
