import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, Zap, Trophy } from "lucide-react";

interface RetreatModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    expedition: {
      progress: number;
    };
    rewards: {
      xp: number;
      energyRefund: number;
    };
    message: string;
  };
}

export default function RetreatModal({ open, onClose, data }: RetreatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Flag className="w-6 h-6 text-orange-500" />
            Expedition Retreat
          </DialogTitle>
          <DialogDescription>{data.message}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress Made */}
          <div className="bg-muted/20 rounded-lg p-4 mb-4 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Progress Made</div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(data.expedition.progress || 0)}%
            </div>
          </div>

          {/* Rewards */}
          <div className="space-y-2 mb-6">
            {data.rewards.xp > 0 && (
              <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-2 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Experience</span>
                </div>
                <span className="text-lg font-bold text-primary">+{data.rewards.xp} XP</span>
              </div>
            )}

            <div className="flex items-center justify-between bg-yellow-500/10 rounded-lg px-4 py-2 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span className="text-sm font-medium">Energy Refund</span>
              </div>
              <span className="text-lg font-bold text-yellow-500">+{data.rewards.energyRefund}</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-center text-muted-foreground italic">
            "The mountain will be here when you're ready to return."
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Return to Basecamp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
