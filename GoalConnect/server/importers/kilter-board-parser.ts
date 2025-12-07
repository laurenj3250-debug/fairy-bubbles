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

// Kilter Board difficulty to V-scale grade mapping
// Source: difficulty_grades table from official Kilter Board database
// The boulder_name column contains grades like "6a/V3" - we extract the V-grade
const DIFFICULTY_TO_GRADE: Record<number, string> = {
  // Font 1a-4c = V0 (difficulty 1-12)
  1: "V0", 2: "V0", 3: "V0", 4: "V0", 5: "V0", 6: "V0",
  7: "V0", 8: "V0", 9: "V0", 10: "V0", 11: "V0", 12: "V0",
  // Font 5a-5b = V1 (difficulty 13-14)
  13: "V1", 14: "V1",
  // Font 5c = V2 (difficulty 15)
  15: "V2",
  // Font 6a-6a+ = V3 (difficulty 16-17)
  16: "V3", 17: "V3",
  // Font 6b-6b+ = V4 (difficulty 18-19)
  18: "V4", 19: "V4",
  // Font 6c-6c+ = V5 (difficulty 20-21)
  20: "V5", 21: "V5",
  // Font 7a = V6 (difficulty 22)
  22: "V6",
  // Font 7a+ = V7 (difficulty 23)
  23: "V7",
  // Font 7b-7b+ = V8 (difficulty 24-25)
  24: "V8", 25: "V8",
  // Font 7c = V9 (difficulty 26)
  26: "V9",
  // Font 7c+ = V10 (difficulty 27)
  27: "V10",
  // Font 8a = V11 (difficulty 28)
  28: "V11",
  // Font 8a+ = V12 (difficulty 29)
  29: "V12",
  // Font 8b+ = V14, etc.
  30: "V13", 31: "V14", 32: "V15", 33: "V16",
};

// Reverse map for grade comparison (use middle difficulty value for each grade)
const GRADE_TO_NUMERIC: Record<string, number> = {
  "V0": 10,   // difficulty 1-12
  "V1": 13,   // difficulty 13-14
  "V2": 15,   // difficulty 15
  "V3": 16,   // difficulty 16-17
  "V4": 18,   // difficulty 18-19
  "V5": 20,   // difficulty 20-21
  "V6": 22,   // difficulty 22
  "V7": 23,   // difficulty 23
  "V8": 24,   // difficulty 24-25
  "V9": 26,   // difficulty 26
  "V10": 27,  // difficulty 27
  "V11": 28,  // difficulty 28
  "V12": 29,  // difficulty 29
  "V13": 30,  // difficulty 30
  "V14": 31,  // difficulty 31
  "V15": 32,  // difficulty 32
  "V16": 33,  // difficulty 33
};

/**
 * Convert Kilter difficulty (1-33+) to V-scale grade
 */
export function difficultyToGrade(difficulty: number): string {
  if (difficulty <= 0) return "V0";
  if (difficulty > 33) return "V16+";
  // Round to nearest integer for decimal difficulty values
  const rounded = Math.round(difficulty);
  return DIFFICULTY_TO_GRADE[rounded] || "V0";
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
