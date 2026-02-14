import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gift, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/lib/confetti";
import { playCompleteSound, triggerHaptic } from "@/lib/sounds";
import type { CustomReward } from "@shared/schema";

interface PointsSummary {
  available: number;
  totalEarned: number;
  totalSpent: number;
}

export default function NextRewardWidget() {
  const { toast } = useToast();

  const { data: rewards } = useQuery<CustomReward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: points } = useQuery<PointsSummary>({
    queryKey: ["/api/points"],
  });

  const unredeemed = rewards?.filter((r) => !r.redeemed) ?? [];
  const available = points?.available ?? 0;

  // Pick the cheapest unredeemed reward (closest to being affordable)
  const nextReward = unredeemed.length
    ? unredeemed.reduce((best, r) => (r.cost < best.cost ? r : best))
    : null;

  const progress = nextReward
    ? Math.min(available / nextReward.cost, 1)
    : 0;

  const canRedeem = nextReward && available >= nextReward.cost;

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return await apiRequest(`/api/rewards/${rewardId}/redeem`, "POST");
    },
    onSuccess: (data: { reward: CustomReward; pointsRemaining: number }) => {
      triggerConfetti('reward_claimed');
      playCompleteSound();
      triggerHaptic('medium');
      toast({
        title: "Reward redeemed!",
        description: `You earned "${data.reward.title}". ${data.pointsRemaining} XP remaining.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Gift className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Next Reward
        </span>
        <Link href="/rewards" className="ml-auto text-xs text-peach-400 hover:underline">
          All
        </Link>
      </div>

      {nextReward ? (
        <>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2 truncate">
            {nextReward.title}
          </p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-peach-400 rounded-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {available}/{nextReward.cost} XP
            </p>
            {canRedeem && (
              <button
                onClick={() => redeemMutation.mutate(nextReward.id)}
                disabled={redeemMutation.isPending}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1 min-h-[44px] px-2"
              >
                <Check className="w-3 h-3" />
                {redeemMutation.isPending ? "..." : "Redeem"}
              </button>
            )}
          </div>
        </>
      ) : (
        <Link href="/rewards">
          <p className="text-sm text-[var(--text-muted)] hover:text-peach-400 cursor-pointer transition-colors">
            Set a reward to work toward!
          </p>
        </Link>
      )}
    </div>
  );
}
