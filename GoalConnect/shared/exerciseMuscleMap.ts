/**
 * Exercise-to-Muscle Mapping
 * Maps exercise names (lowercase, partial match) to primary muscle groups
 */

export type MuscleGroup =
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves';

// Keywords that map to muscle groups (order matters - more specific first)
const MUSCLE_KEYWORDS: Array<[RegExp, MuscleGroup]> = [
  // GLUTES - glute-forward for Lauren
  [/hip\s*thrust|glute\s*(bridge|kickback|drive)|romanian|rdl|good\s*morning/i, 'glutes'],
  [/glute|butt|booty/i, 'glutes'],

  // LEGS
  [/squat|leg\s*press|lunge|split\s*squat|goblet|front\s*squat|hack/i, 'quads'],
  [/hamstring|leg\s*curl|nordic|stiff\s*leg/i, 'hamstrings'],
  [/calf|raise|standing\s*calf|seated\s*calf/i, 'calves'],

  // BACK
  [/deadlift(?!.*romanian|.*rdl)|pull[-\s]?up|chin[-\s]?up|lat|row|pulldown|pull\s*down/i, 'back'],
  [/back|rear\s*delt|face\s*pull/i, 'back'],

  // CHEST
  [/bench|chest|push[-\s]?up|fly|flye|pec\s*deck|incline\s*press|decline\s*press/i, 'chest'],

  // SHOULDERS
  [/shoulder|ohp|overhead\s*press|military|lateral\s*raise|front\s*raise|arnold/i, 'shoulders'],
  [/delt/i, 'shoulders'],

  // ARMS
  [/bicep|curl(?!.*leg)|preacher|hammer/i, 'biceps'],
  [/tricep|pushdown|push\s*down|skull\s*crusher|dip|extension(?!.*leg)/i, 'triceps'],

  // CORE
  [/ab|crunch|plank|sit[-\s]?up|core|oblique|hollow|leg\s*raise/i, 'core'],
];

/**
 * Infer muscle group from exercise name
 */
export function inferMuscleGroup(exerciseName: string): MuscleGroup | null {
  const name = exerciseName.toLowerCase().trim();

  for (const [pattern, muscle] of MUSCLE_KEYWORDS) {
    if (pattern.test(name)) {
      return muscle;
    }
  }

  return null;
}

/**
 * Get display info for muscle groups
 */
export const MUSCLE_DISPLAY: Record<MuscleGroup, { emoji: string; color: string; label: string }> = {
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
};
