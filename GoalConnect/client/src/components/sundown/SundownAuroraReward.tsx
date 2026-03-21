import { useQuery } from '@tanstack/react-query';
import type { CustomReward } from '@shared/schema';

interface PointsSummary {
  available: number;
  totalEarned: number;
  totalSpent: number;
  targetRewardId: number | null;
}

// Simple level calculation: each level requires more XP
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1100, 1500, 2000, 2600, 3300];

function getLevel(totalXp: number): { level: number; currentXp: number; nextThreshold: number; xpToNext: number } {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 500;
  const xpInLevel = totalXp - currentThreshold;
  const xpToNext = nextThreshold - totalXp;
  return { level, currentXp: xpInLevel, nextThreshold: nextThreshold - currentThreshold, xpToNext };
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

  const totalXp = points?.totalEarned ?? 0;
  const available = points?.available ?? 0;
  const { level, xpToNext, nextThreshold } = getLevel(totalXp);

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

  // Days to next level — rough estimate based on recent earning rate
  const daysToNext = Math.max(1, Math.ceil(xpToNext / Math.max(1, totalXp > 0 ? totalXp / 30 : 1)));

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
