import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/lib/confetti";
import { playCompleteSound, triggerHaptic } from "@/lib/sounds";
import type { CustomReward } from "@shared/schema";

interface PointsSummary {
  available: number;
  totalEarned: number;
  totalSpent: number;
  targetRewardId: number | null;
}

export function SundownReward() {
  const { toast } = useToast();

  const { data: rewards } = useQuery<CustomReward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: points } = useQuery<PointsSummary>({
    queryKey: ["/api/points"],
  });

  const unredeemed = rewards?.filter((r) => !r.redeemed) ?? [];
  const available = points?.available ?? 0;
  const targetRewardId = points?.targetRewardId ?? null;

  const pinnedReward = targetRewardId
    ? unredeemed.find((r) => r.id === targetRewardId)
    : null;

  const nextReward = pinnedReward
    ?? (unredeemed.length
      ? unredeemed.reduce((best, r) => (r.cost < best.cost ? r : best))
      : null);

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
    <div>
      {nextReward ? (
        <>
          {/* Reward title */}
          <p style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--sd-text-primary)',
            marginBottom: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {nextReward.title}
          </p>

          {/* Progress bar — same style as countdown */}
          <div style={{
            height: 6,
            borderRadius: 3,
            background: 'rgba(15,10,8,0.5)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            marginBottom: 6,
          }}>
            <div style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, var(--sd-accent-dark), var(--sd-accent))',
              boxShadow: '0 0 6px rgba(218,165,32,0.3)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* XP count and redeem button */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: 'var(--sd-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {available}/{nextReward.cost} XP
            </span>
            {canRedeem && (
              <button
                onClick={() => redeemMutation.mutate(nextReward.id)}
                disabled={redeemMutation.isPending}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--sd-text-primary)',
                  background: 'linear-gradient(135deg, var(--sd-accent-dark), var(--sd-accent))',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(196,122,32,0.3)',
                  minHeight: 44,
                  opacity: redeemMutation.isPending ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {redeemMutation.isPending ? "..." : "Redeem"}
              </button>
            )}
          </div>
        </>
      ) : (
        <Link href="/rewards">
          <p style={{
            fontSize: 14,
            color: 'var(--sd-text-muted)',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}>
            Set a reward to work toward!
          </p>
        </Link>
      )}
    </div>
  );
}
