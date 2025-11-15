import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mountain, Trophy, Coins, TrendingUp } from "lucide-react";

interface SummitSuccessModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    mountain: {
      name: string;
      elevation: number;
    };
    rewards: {
      xp: number;
      tokens: number;
      levelUp: boolean;
    };
    stats: {
      totalSummits: number;
      climbingLevel: number;
      totalXp: number;
    };
  };
}

export default function SummitSuccessModal({ open, onClose, data }: SummitSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-6">
          {/* Mountain Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center animate-bounce">
              <Mountain className="w-14 h-14 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-foreground mb-2">🏔️ SUMMIT!</h2>
          <p className="text-xl text-muted-foreground mb-6">
            {data.mountain.name}
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            {data.mountain.elevation.toLocaleString()}m
          </p>

          {/* Rewards */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-medium">Experience</span>
              </div>
              <span className="text-xl font-bold text-primary">+{data.rewards.xp} XP</span>
            </div>

            <div className="flex items-center justify-between bg-yellow-500/10 rounded-lg px-4 py-3 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Tokens</span>
              </div>
              <span className="text-xl font-bold text-yellow-500">+{data.rewards.tokens}</span>
            </div>

            {data.rewards.levelUp && (
              <div className="flex items-center justify-between bg-green-500/10 rounded-lg px-4 py-3 border border-green-500/20 animate-pulse">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Level Up!</span>
                </div>
                <span className="text-xl font-bold text-green-500">Level {data.stats.climbingLevel}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border">
            <div className="text-sm text-muted-foreground mb-2">Total Summits</div>
            <div className="text-3xl font-bold text-foreground">{data.stats.totalSummits}</div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
