import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Inline the muscle display since shared import might not work in client
const MUSCLE_DISPLAY: Record<string, { emoji: string; color: string; label: string }> = {
  glutes: { emoji: '🍑', color: '#f97316', label: 'Glutes' },
  quads: { emoji: '🦵', color: '#a855f7', label: 'Quads' },
  hamstrings: { emoji: '🦿', color: '#ec4899', label: 'Hamstrings' },
  back: { emoji: '🦴', color: '#3b82f6', label: 'Back' },
  chest: { emoji: '💪', color: '#ef4444', label: 'Chest' },
  shoulders: { emoji: '🏋️', color: '#14b8a6', label: 'Shoulders' },
  biceps: { emoji: '💪', color: '#8b5cf6', label: 'Biceps' },
  triceps: { emoji: '💪', color: '#6366f1', label: 'Triceps' },
  core: { emoji: '🔥', color: '#eab308', label: 'Core' },
  calves: { emoji: '🦶', color: '#64748b', label: 'Calves' },
  other: { emoji: '🎯', color: '#71717a', label: 'Other' },
};

interface MuscleVolume {
  muscle: string;
  volume: number;
  percentage: number;
}

interface MuscleDistributionProps {
  muscleVolumes: MuscleVolume[];
  className?: string;
}

export function MuscleDistribution({ muscleVolumes, className }: MuscleDistributionProps) {
  // Sort by volume descending, take top 6
  const topMuscles = [...muscleVolumes]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  const maxPercentage = Math.max(...topMuscles.map(m => m.percentage), 1);

  if (topMuscles.length === 0) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-3">
          Muscle Focus
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          Log workouts to see muscle distribution
        </div>
      </div>
    );
  }

  // Check if glutes are in top 3 for Lauren-awareness
  const gluteRank = topMuscles.findIndex(m => m.muscle === 'glutes');
  const isGluteForward = gluteRank !== -1 && gluteRank < 3;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-3 flex items-center gap-2">
        Muscle Focus
        {isGluteForward && (
          <span className="text-orange-400 normal-case tracking-normal">🍑 Big Booty Mode</span>
        )}
      </div>

      <div className="space-y-2">
        {topMuscles.map((m, i) => {
          const display = MUSCLE_DISPLAY[m.muscle] || MUSCLE_DISPLAY.other;
          const barWidth = (m.percentage / maxPercentage) * 100;
          const isGlute = m.muscle === 'glutes';

          return (
            <motion.div
              key={m.muscle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm w-5">{display.emoji}</span>
              <span className={cn(
                "text-xs w-20 truncate",
                isGlute ? "text-orange-400 font-medium" : "text-white/70"
              )}>
                {display.label}
              </span>
              <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded",
                    isGlute ? "bg-gradient-to-r from-orange-500 to-orange-400" : ""
                  )}
                  style={{
                    backgroundColor: isGlute ? undefined : display.color,
                    opacity: isGlute ? 1 : 0.7
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              </div>
              <span className={cn(
                "text-xs font-bold w-10 text-right tabular-nums",
                isGlute ? "text-orange-400" : "text-purple-400"
              )}>
                {m.percentage}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
