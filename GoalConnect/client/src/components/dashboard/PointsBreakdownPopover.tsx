import { useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { startOfISOWeek, format, subDays, startOfDay, parseISO } from "date-fns";

interface PointTransaction {
  id: number;
  userId: number;
  amount: number;
  type:
    | "habit_complete"
    | "goal_progress"
    | "goal_complete"
    | "reward_redeem"
    | "daily_login"
    | "todo_complete"
    | "adventure_log"
    | "media_complete"
    | "streak_milestone";
  relatedId: number | null;
  description: string;
  createdAt: string;
}

interface PointsSummary {
  totalEarned: number;
  totalSpent: number;
  available: number;
}

interface CustomReward {
  id: number;
  title: string;
  cost: number;
  redeemed: boolean;
  [key: string]: unknown;
}

interface PointsBreakdownPopoverProps {
  children: React.ReactNode;
}

interface TransactionGroup {
  label: string;
  total: number;
  count: number;
}

const TYPE_LABELS: Record<PointTransaction["type"], string> = {
  habit_complete: "Habits",
  todo_complete: "Todos",
  goal_progress: "Goals",
  goal_complete: "Goal Bonus",
  adventure_log: "Adventures",
  media_complete: "Media",
  streak_milestone: "Streaks",
  daily_login: "Daily",
  reward_redeem: "Redeemed",
};

const TYPE_ORDER: PointTransaction["type"][] = [
  "habit_complete",
  "todo_complete",
  "goal_progress",
  "goal_complete",
  "adventure_log",
  "media_complete",
  "streak_milestone",
  "daily_login",
];

function calculateStreak(transactions: PointTransaction[]): number {
  if (transactions.length === 0) return 0;

  const today = startOfDay(new Date());
  const daysWithActivity = new Set<string>();

  for (const tx of transactions) {
    if (tx.amount > 0) {
      daysWithActivity.add(format(parseISO(tx.createdAt), "yyyy-MM-dd"));
    }
  }

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const day = format(subDays(today, i), "yyyy-MM-dd");
    if (daysWithActivity.has(day)) {
      streak++;
    } else {
      // Allow skipping today if it hasn't happened yet
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

export function PointsBreakdownPopover({
  children,
}: PointsBreakdownPopoverProps) {
  const weekStart = useMemo(
    () => format(startOfISOWeek(new Date()), "yyyy-MM-dd"),
    [],
  );

  // Fetch 60-day lookback for streak calculation
  const streakLookback = useMemo(
    () => format(subDays(new Date(), 60), "yyyy-MM-dd"),
    [],
  );

  const { data: weekTransactions, isLoading: isLoadingWeek } = useQuery<
    PointTransaction[]
  >({
    queryKey: ["/api/points/transactions", { since: weekStart }],
    queryFn: async () => {
      const res = await fetch(`/api/points/transactions?since=${encodeURIComponent(weekStart)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: streakTransactions } = useQuery<PointTransaction[]>({
    queryKey: ["/api/points/transactions", { since: streakLookback }],
    queryFn: async () => {
      const res = await fetch(`/api/points/transactions?since=${encodeURIComponent(streakLookback)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: pointsSummary } = useQuery<PointsSummary>({
    queryKey: ["/api/points"],
  });

  const { data: rewards } = useQuery<CustomReward[]>({
    queryKey: ["/api/rewards"],
  });

  const grouped = useMemo((): TransactionGroup[] => {
    if (!weekTransactions) return [];

    const map = new Map<
      PointTransaction["type"],
      { total: number; count: number }
    >();

    for (const tx of weekTransactions) {
      if (tx.amount <= 0) continue;
      const existing = map.get(tx.type) || { total: 0, count: 0 };
      existing.total += tx.amount;
      existing.count += 1;
      map.set(tx.type, existing);
    }

    return TYPE_ORDER.map((type) => ({
      label: TYPE_LABELS[type],
      total: map.get(type)?.total ?? 0,
      count: map.get(type)?.count ?? 0,
    }));
  }, [weekTransactions]);

  const weekTotal = useMemo(
    () => grouped.reduce((sum, g) => sum + g.total, 0),
    [grouped],
  );

  const streak = useMemo(
    () => calculateStreak(streakTransactions ?? []),
    [streakTransactions],
  );

  const nextReward = useMemo(() => {
    if (!rewards || !pointsSummary) return null;
    const unredeemed = rewards.filter((r) => !r.redeemed);
    const sorted = [...unredeemed].sort((a, b) => a.cost - b.cost);
    const cheapest = sorted.find((r) => r.cost > 0);
    if (!cheapest) return null;
    return {
      title: cheapest.title,
      cost: cheapest.cost,
      current: pointsSummary.available,
    };
  }, [rewards, pointsSummary]);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 bg-[#1a1a2e]/95 border-white/10 backdrop-blur-xl p-4"
        sideOffset={8}
      >
        {isLoadingWeek ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--peach-400)] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Weekly total header */}
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                This Week:{" "}
                <span className="tabular-nums text-[var(--peach-400,#f0a67a)]">
                  +{weekTotal} coins
                </span>
              </div>
              {pointsSummary && (
                <span className="text-xs tabular-nums text-[var(--text-muted)]">
                  {pointsSummary.available} total
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Breakdown rows */}
            <div className="space-y-1.5">
              {grouped.filter(g => g.total > 0).map((group) => (
                <div
                  key={group.label}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span className="text-[var(--text-muted)]">
                    {group.label}
                  </span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="tabular-nums text-[var(--text-primary)]">
                      {group.total}
                    </span>
                    {group.count > 0 && (
                      <span className="tabular-nums text-xs text-[var(--text-muted)]">
                        ({group.count})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Activity streak */}
            <div className="text-sm text-[var(--text-primary)]">
              Activity Streak:{" "}
              <span className="tabular-nums font-medium">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
              {streak >= 7 && " \ud83d\udd25"}
            </div>

            {/* Next reward preview */}
            {nextReward && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Next:</span>
                  <span className="text-[var(--text-primary)] truncate ml-2">
                    {nextReward.title}
                  </span>
                  <span className="tabular-nums text-xs text-[var(--text-muted)] ml-auto pl-2 shrink-0">
                    {Math.min(nextReward.current, nextReward.cost)}/
                    {nextReward.cost}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--peach-400,#f0a67a)] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (nextReward.current / nextReward.cost) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Footer links */}
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <Link href="/rewards" className="text-xs text-peach-400 hover:underline">
                View Rewards
              </Link>
              {nextReward && nextReward.current >= nextReward.cost && (
                <Link href="/rewards" className="text-xs font-medium text-emerald-400 hover:underline">
                  Redeem now
                </Link>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
