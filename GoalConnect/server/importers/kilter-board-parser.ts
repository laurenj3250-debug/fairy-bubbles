/**
 * Kilter Board Data Parser
 *
 * Parses Kilter Board API sync data and groups climbs into sessions.
 * Handles grade conversion, statistics calculation, and database formatting.
 */

import { createHash } from "crypto";

// Kilter Board API data types
export interface KilterClimb {
  uuid: string;
  layout_id: number;
  setter_id: number;
  setter_username: string;
  name: string;
  description: string;
  frames: string;
  angle: number;
  quality_average: number;
  difficulty_average: number;
  benchmark_difficulty: string | null;
  is_draft: boolean;
  created_at: string;
}

export interface KilterAscent {
  uuid: string;
  climb_uuid: string;
  user_id: number;
  angle: number;
  is_mirror: boolean;
  attempt_id: string | null;
  bid_count: number;
  quality: number;
  difficulty: number;
  is_benchmark: boolean;
  comment: string;
  climbed_at: string;
  created_at: string;
}

export interface KilterAttempt {
  uuid: string;
  climb_uuid: string;
  user_id: number;
  angle: number;
  is_mirror: boolean;
  bid_count: number;
  created_at: string;
}

// Parsed session types
export interface ClimbDetail {
  climbId: string;
  name: string;
  grade: string;
  angle: number;
  attempts: number;
  sent: boolean;
  sentAt?: Date;
  quality?: number;
}

export interface ParsedClimbingSession {
  userId: number;
  sourceType: "kilter_board";
  sessionDate: string; // YYYY-MM-DD
  sessionStartTime?: Date;
  durationMinutes?: number;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade?: string;
  maxGrade?: string;
  boardAngle?: number;
  climbs: ClimbDetail[];
}

// Grade conversion map: Kilter difficulty (1-18) to V-scale
const DIFFICULTY_TO_GRADE: Record<number, string> = {
  1: "V0",
  2: "V0",
  3: "V1",
  4: "V2",
  5: "V3",
  6: "V3",
  7: "V4",
  8: "V4",
  9: "V5",
  10: "V5",
  11: "V6",
  12: "V6",
  13: "V7",
  14: "V8",
  15: "V9",
  16: "V10",
  17: "V11",
  18: "V12+",
};

// Reverse map for grade comparison
const GRADE_TO_NUMERIC: Record<string, number> = {
  "V0": 1,
  "V1": 3,
  "V2": 4,
  "V3": 5,
  "V4": 7,
  "V5": 9,
  "V6": 11,
  "V7": 13,
  "V8": 14,
  "V9": 15,
  "V10": 16,
  "V11": 17,
  "V12+": 18,
};

/**
 * Convert Kilter difficulty (1-18) to V-scale grade
 */
export function difficultyToGrade(difficulty: number): string {
  if (difficulty <= 0) return "V0";
  if (difficulty > 18) return "V12+";
  return DIFFICULTY_TO_GRADE[difficulty] || "V0";
}

/**
 * Convert V-scale grade to numeric for comparison
 */
function gradeToNumeric(grade: string): number {
  return GRADE_TO_NUMERIC[grade] || 0;
}

/**
 * Generate a unique external ID for a climbing session
 */
export function generateSessionExternalId(session: {
  userId: number;
  sessionDate: string;
  sourceType: string;
}): string {
  const data = `${session.userId}-${session.sessionDate}-${session.sourceType}`;
  return createHash("sha256").update(data).digest("hex").substring(0, 32);
}

/**
 * Extract date string (YYYY-MM-DD) from timestamp
 * Handles both ISO format (2025-11-08T13:43:11) and Kilter format (2025-11-08 13:43:11)
 */
function getDateString(timestamp: string): string {
  // Split on either T (ISO) or space (Kilter format)
  return timestamp.split(/[T ]/)[0];
}

/**
 * Group ascents and attempts into climbing sessions by date
 */
export function groupIntoSessions(
  ascents: KilterAscent[],
  attempts: KilterAttempt[],
  climbs: KilterClimb[],
  userId: number
): ParsedClimbingSession[] {
  // Filter to only this user's data
  const userAscents = ascents.filter((a) => a.user_id === userId);
  const userAttempts = attempts.filter((a) => a.user_id === userId);

  // Create climb lookup map
  const climbMap = new Map<string, KilterClimb>();
  for (const climb of climbs) {
    climbMap.set(climb.uuid, climb);
  }

  // Group activities by date
  const sessionsByDate = new Map<string, {
    ascents: KilterAscent[];
    attempts: KilterAttempt[];
  }>();

  for (const ascent of userAscents) {
    const date = getDateString(ascent.climbed_at);
    if (!sessionsByDate.has(date)) {
      sessionsByDate.set(date, { ascents: [], attempts: [] });
    }
    sessionsByDate.get(date)!.ascents.push(ascent);
  }

  for (const attempt of userAttempts) {
    const date = getDateString(attempt.created_at);
    if (!sessionsByDate.has(date)) {
      sessionsByDate.set(date, { ascents: [], attempts: [] });
    }
    sessionsByDate.get(date)!.attempts.push(attempt);
  }

  // Convert to sessions
  const sessions: ParsedClimbingSession[] = [];

  Array.from(sessionsByDate.entries()).forEach(([date, data]) => {
    const session = buildSession(date, data.ascents, data.attempts, climbMap, userId);
    sessions.push(session);
  });

  return sessions;
}

/**
 * Build a single session from ascents and attempts
 */
function buildSession(
  date: string,
  ascents: KilterAscent[],
  attempts: KilterAttempt[],
  climbMap: Map<string, KilterClimb>,
  userId: number
): ParsedClimbingSession {
  const climbs: ClimbDetail[] = [];
  const allAngles: number[] = [];
  const allTimestamps: Date[] = [];

  // Track unique climbs attempted (by climb_uuid)
  const climbsAttempted = new Set<string>();

  // Process ascents (sends)
  for (const ascent of ascents) {
    const climb = climbMap.get(ascent.climb_uuid);
    const climbedAt = new Date(ascent.climbed_at);
    allTimestamps.push(climbedAt);
    allAngles.push(ascent.angle);
    climbsAttempted.add(ascent.climb_uuid);

    climbs.push({
      climbId: ascent.climb_uuid,
      name: climb?.name || "Unknown Climb",
      grade: difficultyToGrade(ascent.difficulty),
      angle: ascent.angle,
      attempts: ascent.bid_count || 1,
      sent: true,
      sentAt: climbedAt,
      quality: ascent.quality,
    });
  }

  // Process attempts (not sent yet - only if not already counted as a send)
  for (const attempt of attempts) {
    if (!climbsAttempted.has(attempt.climb_uuid)) {
      const climb = climbMap.get(attempt.climb_uuid);
      allTimestamps.push(new Date(attempt.created_at));
      allAngles.push(attempt.angle);
      climbsAttempted.add(attempt.climb_uuid);

      climbs.push({
        climbId: attempt.climb_uuid,
        name: climb?.name || "Unknown Climb",
        grade: climb ? difficultyToGrade(climb.difficulty_average) : "V?",
        angle: attempt.angle,
        attempts: attempt.bid_count || 1,
        sent: false,
      });
    }
  }

  // Calculate session timing
  let sessionStartTime: Date | undefined;
  let durationMinutes: number | undefined;

  if (allTimestamps.length > 0) {
    allTimestamps.sort((a, b) => a.getTime() - b.getTime());
    sessionStartTime = allTimestamps[0];

    if (allTimestamps.length > 1) {
      const endTime = allTimestamps[allTimestamps.length - 1];
      durationMinutes = Math.round(
        (endTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
      );
    }
  }

  // Calculate most common angle
  const boardAngle = getMostCommonValue(allAngles);

  // Calculate stats
  const stats = calculateSessionStats(climbs);

  return {
    userId,
    sourceType: "kilter_board",
    sessionDate: date,
    sessionStartTime,
    durationMinutes,
    problemsAttempted: climbsAttempted.size,
    problemsSent: ascents.length,
    averageGrade: stats.averageGrade,
    maxGrade: stats.maxGrade,
    boardAngle,
    climbs,
  };
}

/**
 * Get the most common value from an array
 */
function getMostCommonValue(values: number[]): number | undefined {
  if (values.length === 0) return undefined;

  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommon: number | undefined;
  Array.from(counts.entries()).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  });

  return mostCommon;
}

/**
 * Calculate session statistics from climbs
 */
export function calculateSessionStats(climbs: ClimbDetail[]): {
  averageGrade?: string;
  maxGrade?: string;
} {
  const sentClimbs = climbs.filter((c) => c.sent);

  if (sentClimbs.length === 0) {
    return {};
  }

  // Calculate average grade
  const grades = sentClimbs.map((c) => gradeToNumeric(c.grade)).filter((g) => g > 0);
  let averageGrade: string | undefined;

  if (grades.length > 0) {
    const avgNumeric = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
    averageGrade = difficultyToGrade(avgNumeric);
  }

  // Find max grade from sent climbs only
  let maxGrade: string | undefined;
  let maxNumeric = 0;

  for (const climb of sentClimbs) {
    const numeric = gradeToNumeric(climb.grade);
    if (numeric > maxNumeric) {
      maxNumeric = numeric;
      maxGrade = climb.grade;
    }
  }

  return { averageGrade, maxGrade };
}

/**
 * Convert parsed session to database insert format
 */
export function toClimbingSessionInsert(
  session: ParsedClimbingSession,
  dbUserId: number
): {
  userId: number;
  sourceType: "kilter_board";
  externalId: string;
  sessionDate: string;
  sessionStartTime?: Date;
  durationMinutes?: number;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade?: string;
  maxGrade?: string;
  boardAngle?: number;
  climbs: ClimbDetail[];
} {
  return {
    userId: dbUserId,
    sourceType: "kilter_board",
    externalId: generateSessionExternalId({
      userId: session.userId,
      sessionDate: session.sessionDate,
      sourceType: session.sourceType,
    }),
    sessionDate: session.sessionDate,
    sessionStartTime: session.sessionStartTime,
    durationMinutes: session.durationMinutes,
    problemsAttempted: session.problemsAttempted,
    problemsSent: session.problemsSent,
    averageGrade: session.averageGrade,
    maxGrade: session.maxGrade,
    boardAngle: session.boardAngle,
    climbs: session.climbs,
  };
}
