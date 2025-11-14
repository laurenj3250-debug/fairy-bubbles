import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";

interface DailyQuest {
  id: number;
  questId: number;
  title: string;
  description: string;
  targetValue: number;
  rewardTokens: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export function DailyQuests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quests = [] } = useQuery<DailyQuest[]>({
    queryKey: ["/api/daily-quests"],
  });

  const claimMutation = useMutation({
    mutationFn: async (questId: number) => {
      const res = await fetch(`/api/daily-quests/${questId}/claim`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to claim quest");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `+${data.tokensEarned} tokens!`,
        description: "Quest reward claimed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  const handleClaim = (questId: number) => {
    claimMutation.mutate(questId);
  };

  if (quests.length === 0) return null;

  return (
    <div className="card-ice-shelf p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Daily Quests</h3>
        <div className="text-xs text-muted-foreground">
          {quests.filter((q) => q.completed).length}/{quests.length} Complete
        </div>
      </div>

      <div className="space-y-3">
        {quests.map((quest, index) => {
          const progressPercent = Math.min(
            (quest.progress / quest.targetValue) * 100,
            100
          );
          const isComplete = quest.completed;
          const isClaimed = quest.claimed;

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-background rounded-xl p-3 border-2 transition-all ${
                isComplete
                  ? isClaimed
                    ? "border-muted-foreground/30"
                    : "border-emerald-500/50 shadow-emerald-500/20 shadow-lg"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox/Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isComplete
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isComplete && <Check className="w-5 h-5 text-white" />}
                </div>

                {/* Quest details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div
                        className={`font-semibold text-sm ${
                          isClaimed ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {quest.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {quest.description}
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold text-sm">
                        +{quest.rewardTokens}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {quest.progress}/{quest.targetValue}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Claim button */}
                  {isComplete && !isClaimed && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      <Button
                        onClick={() => handleClaim(quest.id)}
                        size="sm"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={claimMutation.isPending}
                      >
                        {claimMutation.isPending ? "Claiming..." : "Claim Reward"}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
