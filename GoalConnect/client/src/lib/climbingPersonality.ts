/**
 * Climbing Personality Algorithm
 * Determines climbing style based on stats with spectrum scoring (0-100)
 */

export type PersonalityType =
  | 'VOLUME_WARRIOR'    // High volume, lower grades
  | 'PROJECT_CRUSHER'   // Low sends, high max grade, patient
  | 'FLASH_MASTER'      // High first-try success rate
  | 'ANGLE_DEMON'       // Prefers steep angles (40°+)
  | 'CONSISTENCY_KING'; // Regular sessions, balanced pyramid

export interface PersonalityInput {
  sendRate: number;           // 0-100
  flashRate: number;          // 0-100
  avgAttemptsPerSend: number;
  maxGradeNumeric: number;    // V7 = 7
  avgGradeNumeric: number;
  preferredAngle: number;     // degrees
  problemsPerSession: number;
  sessionCount: number;
  gradeDistribution: Record<string, number>;
}

export interface PersonalityResult {
  primary: PersonalityType;
  scores: Record<PersonalityType, number>;
  description: string;
  traits: string[];
  tagline: string;
}

const PERSONALITY_DATA: Record<PersonalityType, {
  description: string;
  tagline: string;
  traits: string[];
}> = {
  VOLUME_WARRIOR: {
    description: "You climb like you're paid by the problem. Quantity has a quality all its own.",
    tagline: "More problems, more gains",
    traits: ['High volume', 'Endurance focused', 'Consistency over difficulty'],
  },
  PROJECT_CRUSHER: {
    description: "Low sends, high standards. You don't do easy—you do impossible, eventually.",
    tagline: "Patient perfectionist",
    traits: ['Project-focused', 'High attempts per send', 'Grade chaser'],
  },
  FLASH_MASTER: {
    description: "First try or die trying. Your warm-up is other people's project.",
    tagline: "Natural talent",
    traits: ['High flash rate', 'Quick learner', 'Reads routes fast'],
  },
  ANGLE_DEMON: {
    description: "Gravity is just a suggestion when you're this steep.",
    tagline: "Steep specialist",
    traits: ['Loves overhangs', 'Strong pulling power', 'Core of steel'],
  },
  CONSISTENCY_KING: {
    description: "The tortoise wins the race. Your pyramid is textbook.",
    tagline: "Steady climber",
    traits: ['Regular sessions', 'Balanced pyramid', 'Long-term progress'],
  },
};

/**
 * Display mapping for personality types - emoji-forward design
 */
export const PERSONALITY_DISPLAY: Record<PersonalityType, {
  displayName: string;
  emoji: string;
  color: string;
  bgGradient: string;
}> = {
  FLASH_MASTER: {
    displayName: 'The Flasher',
    emoji: '⚡',
    color: '#10b981',
    bgGradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
  },
  PROJECT_CRUSHER: {
    displayName: 'The Projector',
    emoji: '🎯',
    color: '#a855f7',
    bgGradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
  },
  VOLUME_WARRIOR: {
    displayName: 'The Crusher',
    emoji: '💪',
    color: '#f97316',
    bgGradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
  },
  CONSISTENCY_KING: {
    displayName: 'The Consistent',
    emoji: '🎸',
    color: '#06b6d4',
    bgGradient: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
  },
  ANGLE_DEMON: {
    displayName: 'The Explorer',
    emoji: '🧭',
    color: '#f59e0b',
    bgGradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
  },
};

/**
 * Clamp value between 0 and 100
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Calculate all personality scores (0-100 each)
 */
function calculateScores(input: PersonalityInput): Record<PersonalityType, number> {
  const {
    sendRate,
    flashRate,
    avgAttemptsPerSend,
    maxGradeNumeric,
    avgGradeNumeric,
    preferredAngle,
    problemsPerSession,
    sessionCount,
  } = input;

  // VOLUME_WARRIOR: High send rate + high problems/session + small grade gap
  const gradeGap = maxGradeNumeric - avgGradeNumeric;
  const volumeScore = clamp(
    (sendRate * 0.4) +
    (Math.min(problemsPerSession / 30, 1) * 100 * 0.4) +
    (Math.max(0, 3 - gradeGap) / 3 * 100 * 0.2)
  );

  // PROJECT_CRUSHER: Low send rate + high grade gap + many attempts per send
  const projectScore = clamp(
    ((100 - sendRate) * 0.3) +
    (Math.min(gradeGap / 4, 1) * 100 * 0.35) +
    (Math.min(avgAttemptsPerSend / 8, 1) * 100 * 0.35)
  );

  // FLASH_MASTER: High flash rate + low attempts per send
  const flashScore = clamp(
    (flashRate * 0.7) +
    (Math.max(0, 3 - avgAttemptsPerSend) / 3 * 100 * 0.3)
  );

  // ANGLE_DEMON: Prefers steep angles (scaled: 0° = 0, 45°+ = 100)
  const angleScore = clamp(
    (Math.min(preferredAngle / 45, 1) * 100)
  );

  // CONSISTENCY_KING: Regular sessions + balanced stats
  const balanceScore = 100 - Math.abs(sendRate - 60); // 60% is "balanced"
  const consistencyScore = clamp(
    (Math.min(sessionCount / 30, 1) * 100 * 0.4) +
    (balanceScore * 0.3) +
    ((100 - Math.abs(flashRate - 40)) * 0.3)
  );

  return {
    VOLUME_WARRIOR: Math.round(volumeScore),
    PROJECT_CRUSHER: Math.round(projectScore),
    FLASH_MASTER: Math.round(flashScore),
    ANGLE_DEMON: Math.round(angleScore),
    CONSISTENCY_KING: Math.round(consistencyScore),
  };
}

/**
 * Calculate climbing personality from stats
 */
export function calculatePersonality(input: PersonalityInput): PersonalityResult {
  const scores = calculateScores(input);

  // Find the highest scoring type
  let primary: PersonalityType = 'CONSISTENCY_KING';
  let maxScore = 0;

  (Object.entries(scores) as [PersonalityType, number][]).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primary = type;
    }
  });

  const data = PERSONALITY_DATA[primary];

  return {
    primary,
    scores,
    description: data.description,
    traits: data.traits,
    tagline: data.tagline,
  };
}
