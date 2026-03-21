import { useQuery } from '@tanstack/react-query';
import type { CustomReward } from '@shared/schema';

interface PointsSummary {
  available: number;
  totalEarned: number;
  totalSpent: number;
  targetRewardId: number | null;
}

// Level based on streak days: Level 1 at 7 days, Level 2 at 14, etc.
const STREAK_LEVEL_DAYS = [0, 7, 14, 21, 28, 42, 56, 84, 120, 180, 365];

function getStreakLevel(streakDays: number): { level: number; daysToNext: number; nextLevelDays: number } {
  let level = 0;
  for (let i = 0; i < STREAK_LEVEL_DAYS.length; i++) {
    if (streakDays >= STREAK_LEVEL_DAYS[i]) {
      level = i;
    } else {
      break;
    }
  }
  const nextLevelDays = STREAK_LEVEL_DAYS[level + 1] || STREAK_LEVEL_DAYS[level] + 30;
  const daysToNext = Math.max(0, nextLevelDays - streakDays);
  return { level, daysToNext, nextLevelDays };
}

interface SundownAuroraRewardProps {
  streak?: number;
}

export function SundownAuroraReward({ streak = 0 }: SundownAuroraRewardProps) {
  const { data: points } = useQuery<PointsSummary>({
    queryKey: ['/api/points'],
  });

  const { data: rewards } = useQuery<CustomReward[]>({
    queryKey: ['/api/rewards'],
  });

  const available = points?.available ?? 0;
  const { level, daysToNext } = getStreakLevel(streak);

  // Find next reward
  const unredeemed = rewards?.filter((r) => !r.redeemed) ?? [];
  const targetRewardId = points?.targetRewardId ?? null;
  const pinnedReward = targetRewardId
    ? unredeemed.find((r) => r.id === targetRewardId)
    : null;
  const nextReward = pinnedReward
    ?? (unredeemed.length
      ? unredeemed.reduce((best, r) => (r.cost < best.cost ? r : best))
      : null);

  return (
    <div className="sd-shell sd-aurora-card" style={{ animationDelay: '1s' }}>
      <div className="sd-face">
        <div className="sd-aurora-zone">
          <div className="sd-aurora-bg" />
          <div className="sd-aurora-cool">
            <div className="sd-aurora-cool-text">
              {daysToNext} Days to Level {level + 1}
            </div>
          </div>
          <div className="sd-aurora-warm">
            <div className="sd-aurora-level-label">Level</div>
            <div className="sd-aurora-level-num">{level}</div>
            <div className="sd-aurora-streak">{streak} Day Streak</div>
            <div className="sd-aurora-divider" />
            <div className="sd-aurora-reward">
              {nextReward ? nextReward.title : 'Set a Reward'}
            </div>
            <div className="sd-aurora-xp">
              {nextReward
                ? `${available} of ${nextReward.cost} XP`
                : `${totalXp} XP Total`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
