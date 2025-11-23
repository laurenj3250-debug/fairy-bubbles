/**
 * Climbing Stats Helper Functions
 * Pure utility functions for grade conversion and session aggregation
 */

// Grade to numeric mapping (V0 = 0, V1 = 1, etc.)
const GRADE_MAP: Record<string, number> = {
  'V0': 0, 'V1': 1, 'V2': 2, 'V3': 3, 'V4': 4,
  'V5': 5, 'V6': 6, 'V7': 7, 'V8': 8, 'V9': 9,
  'V10': 10, 'V11': 11, 'V12': 12, 'V12+': 12,
};

interface ClimbDetail {
  grade: string;
  sent: boolean;
  attempts: number;
}

interface ClimbingSession {
  maxGrade?: string;
  climbs?: ClimbDetail[];
}

/**
 * Convert V-grade string to numeric value
 */
export function gradeToNumeric(grade: string): number {
  if (!grade) return 0;

  // Handle "V12+" special case
  if (grade === 'V12+') return 12;

  // Try exact match first
  if (GRADE_MAP[grade] !== undefined) {
    return GRADE_MAP[grade];
  }

  // Try parsing "V#" format
  const match = grade.match(/^V(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return Math.min(num, 12); // Cap at V12
  }

  return 0;
}

/**
 * Convert numeric value to V-grade string
 */
export function numericToGrade(num: number): string {
  if (num < 0) return 'V0';
  if (num >= 12) return 'V12+';
  return `V${num}`;
}

/**
 * Get the maximum grade from a list of sessions
 */
export function getMaxGrade(sessions: ClimbingSession[]): string {
  if (!sessions || sessions.length === 0) return 'V0';

  let maxNumeric = 0;

  for (const session of sessions) {
    if (session.maxGrade) {
      const numeric = gradeToNumeric(session.maxGrade);
      if (numeric > maxNumeric) {
        maxNumeric = numeric;
      }
    }
  }

  return numericToGrade(maxNumeric);
}

/**
 * Aggregate grade distribution from sessions (only counts sends)
 */
export function aggregateGradeDistribution(sessions: ClimbingSession[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  if (!sessions) return distribution;

  for (const session of sessions) {
    if (!session.climbs) continue;

    for (const climb of session.climbs) {
      if (climb.sent) {
        distribution[climb.grade] = (distribution[climb.grade] || 0) + 1;
      }
    }
  }

  return distribution;
}

/**
 * Calculate send rate as percentage
 */
export function calculateSendRate(totalSends: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  const rate = (totalSends / totalAttempts) * 100;
  return Math.min(rate, 100); // Cap at 100%
}

/**
 * Calculate flash rate (percentage of sends that were first-try)
 */
export function calculateFlashRate(climbs: ClimbDetail[]): number {
  if (!climbs || climbs.length === 0) return 0;

  const sends = climbs.filter(c => c.sent);
  if (sends.length === 0) return 0;

  const flashes = sends.filter(c => c.attempts === 1);
  const rate = (flashes.length / sends.length) * 100;

  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate average grade from sessions
 */
export function calculateAverageGrade(sessions: ClimbingSession[]): string {
  if (!sessions || sessions.length === 0) return 'V0';

  const allGrades: number[] = [];

  for (const session of sessions) {
    if (!session.climbs) continue;

    for (const climb of session.climbs) {
      if (climb.sent) {
        allGrades.push(gradeToNumeric(climb.grade));
      }
    }
  }

  if (allGrades.length === 0) return 'V0';

  const avg = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
  return numericToGrade(Math.round(avg));
}
