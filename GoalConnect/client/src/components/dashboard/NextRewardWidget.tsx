import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gift } from "lucide-react";
import type { CustomReward } from "@shared/schema";

interface PointsSummary {
  available: number;
  totalEarned: number;
  totalSpent: number;
}

export default function NextRewardWidget() {
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

  return (
    <Link to="/rewards">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 cursor-pointer hover:bg-white/[0.06] transition-colors">
        <div className="flex items-center gap-1.5 mb-2">
          <Gift className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Next Reward
          </span>
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
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {available}/{nextReward.cost} XP
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Set a reward to work toward!
          </p>
        )}
      </div>
    </Link>
  );
}
