/**
 * useClimbingStats Hook
 * Fetches and aggregates Kilter Board climbing data
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  gradeToNumeric,
  getMaxGrade,
  aggregateGradeDistribution,
  calculateSendRate,
  calculateFlashRate,
  calculateAverageGrade,
} from "@/lib/climbingStatsHelpers";
import { calculatePersonality, PersonalityResult } from "@/lib/climbingPersonality";
import { calculateAllAbsurdComparisons, AbsurdComparisons } from "@/lib/absurdComparisons";

// Types matching the API/schema
interface ClimbDetail {
  climbId: string;
  name: string;
  grade: string;
  angle: number;
  attempts: number;
  sent: boolean;
  sentAt?: string;
  quality?: number;
}

interface ClimbingSession {
  id: number;
  sessionDate: string;
  sessionStartTime?: string;
  durationMinutes?: number;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade?: string;
  maxGrade?: string;
  boardAngle?: number;
  climbs: ClimbDetail[];
}

interface KilterBoardStatus {
  connected: boolean;
  username?: string;
  lastSyncAt?: string;
}

interface SessionsResponse {
  sessions: ClimbingSession[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ClimbingStats {
  // Connection status
  isConnected: boolean;
  username?: string;
  lastSyncAt?: string;

  // Basic counts (all-time)
  totalSessions: number;
  totalProblemsAttempted: number;
  totalProblemsSent: number;
  sendRate: number;

  // YTD stats (for Goals page consistency)
  ytdSessions: number;
  ytdProblemsSent: number;

  // Grades
  maxGrade: string;
  avgGrade: string;
  gradeDistribution: Record<string, number>;

  // Time stats
  totalMinutesClimbing: number;
  longestSession: { date: string; minutes: number } | null;
  avgSessionLength: number;

  // For personality
  avgAttemptsPerSend: number;
  preferredAngle: number;
  flashRate: number;
  problemsPerSession: number;

  // Personality result
  personality: PersonalityResult | null;

  // Absurd comparisons
  absurd: AbsurdComparisons;

  // Raw data for components
  sessions: ClimbingSession[];
}

const DEFAULT_BODY_WEIGHT = 150;

// YTD stats response type
interface YtdStatsResponse {
  totalSessions: number;
  totalProblemsSent: number;
  totalProblemsAttempted: number;
}

export function useClimbingStats() {
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;

  // Fetch connection status
  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<KilterBoardStatus>({
    queryKey: ["/api/import/kilter-board/status"],
  });

  // Fetch sessions (only if connected)
  const {
    data: sessionsResponse,
    isLoading: isLoadingSessions,
    error: sessionsError,
    refetch,
  } = useQuery<SessionsResponse>({
    queryKey: ["/api/import/kilter-board/sessions"],
    enabled: status?.connected === true,
  });

  // Fetch YTD stats using server-side filtering (efficient!)
  const {
    data: ytdStats,
    isLoading: isLoadingYtd,
  } = useQuery<YtdStatsResponse>({
    queryKey: ["/api/import/kilter-board/sessions", { startDate, countOnly: true }],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, countOnly: "true" });
      const res = await fetch(`/api/import/kilter-board/sessions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch YTD climbing stats");
      return res.json();
    },
    enabled: status?.connected === true,
  });

  // Extract sessions array from response
  const sessions = sessionsResponse?.sessions ?? [];

  // Aggregate all stats
  const stats = useMemo<ClimbingStats | null>(() => {
    if (!status) return null;

    // If not connected, return minimal stats
    if (!status.connected) {
      return {
        isConnected: false,
        totalSessions: 0,
        totalProblemsAttempted: 0,
        totalProblemsSent: 0,
        sendRate: 0,
        ytdSessions: 0,
        ytdProblemsSent: 0,
        maxGrade: "V0",
        avgGrade: "V0",
        gradeDistribution: {},
        totalMinutesClimbing: 0,
        longestSession: null,
        avgSessionLength: 0,
        avgAttemptsPerSend: 0,
        preferredAngle: 0,
        flashRate: 0,
        problemsPerSession: 0,
        personality: null,
        absurd: {
          elephantsLifted: { value: 0, formatted: "0 elephants" },
          eiffelTowers: { value: 0, formatted: "0 Eiffel Towers" },
          officeEpisodes: { value: 0, formatted: "0 episodes" },
          bananasOfEnergy: { value: 0, formatted: "0 bananas" },
        },
        sessions: [],
      };
    }

    // Aggregate from sessions
    const totalSessions = sessions.length;
    const totalProblemsAttempted = sessions.reduce((sum, s) => sum + s.problemsAttempted, 0);
    const totalProblemsSent = sessions.reduce((sum, s) => sum + s.problemsSent, 0);
    const sendRate = calculateSendRate(totalProblemsSent, totalProblemsAttempted);

    // Grades
    const maxGrade = getMaxGrade(sessions);
    const avgGrade = calculateAverageGrade(sessions);

    // Get all climbs for detailed analysis
    const allClimbs = sessions.flatMap((s) => s.climbs || []);
    const gradeDistribution = aggregateGradeDistribution(sessions);

    // Time stats
    const sessionsWithDuration = sessions.filter((s) => s.durationMinutes != null);
    const totalMinutesClimbing = sessionsWithDuration.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0
    );

    let longestSession: { date: string; minutes: number } | null = null;
    if (sessionsWithDuration.length > 0) {
      const longest = sessionsWithDuration.reduce((max, s) =>
        (s.durationMinutes || 0) > (max.durationMinutes || 0) ? s : max
      );
      longestSession = {
        date: longest.sessionDate,
        minutes: longest.durationMinutes || 0,
      };
    }

    const avgSessionLength =
      sessionsWithDuration.length > 0
        ? totalMinutesClimbing / sessionsWithDuration.length
        : 0;

    // Flash rate and attempts per send
    const flashRate = calculateFlashRate(allClimbs);
    const sentClimbs = allClimbs.filter((c) => c.sent);
    const avgAttemptsPerSend =
      sentClimbs.length > 0
        ? sentClimbs.reduce((sum, c) => sum + c.attempts, 0) / sentClimbs.length
        : 0;

    // Preferred angle
    const anglesWithSessions = sessions.filter((s) => s.boardAngle != null);
    const preferredAngle =
      anglesWithSessions.length > 0
        ? anglesWithSessions.reduce((sum, s) => sum + (s.boardAngle || 0), 0) /
          anglesWithSessions.length
        : 0;

    const problemsPerSession = totalSessions > 0 ? totalProblemsAttempted / totalSessions : 0;

    // Calculate personality (need at least 5 sessions for meaningful result)
    let personality: PersonalityResult | null = null;
    if (totalSessions >= 5) {
      personality = calculatePersonality({
        sendRate,
        flashRate,
        avgAttemptsPerSend,
        maxGradeNumeric: gradeToNumeric(maxGrade),
        avgGradeNumeric: gradeToNumeric(avgGrade),
        preferredAngle,
        problemsPerSession,
        sessionCount: totalSessions,
        gradeDistribution,
      });
    }

    // Absurd comparisons
    const absurd = calculateAllAbsurdComparisons(
      totalProblemsAttempted,
      totalProblemsSent,
      totalMinutesClimbing,
      DEFAULT_BODY_WEIGHT
    );

    return {
      isConnected: true,
      username: status.username,
      lastSyncAt: status.lastSyncAt,
      totalSessions,
      totalProblemsAttempted,
      totalProblemsSent,
      sendRate,
      ytdSessions: ytdStats?.totalSessions ?? 0,
      ytdProblemsSent: ytdStats?.totalProblemsSent ?? 0,
      maxGrade,
      avgGrade,
      gradeDistribution,
      totalMinutesClimbing,
      longestSession,
      avgSessionLength,
      avgAttemptsPerSend,
      preferredAngle,
      flashRate,
      problemsPerSession,
      personality,
      absurd,
      sessions,
    };
  }, [status, sessionsResponse, ytdStats]);

  return {
    stats,
    isLoading: isLoadingStatus || isLoadingSessions || isLoadingYtd,
    error: statusError || sessionsError,
    refetch,
  };
}
