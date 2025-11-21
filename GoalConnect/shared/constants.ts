/**
 * Application Constants
 * Centralized location for magic numbers and configuration values
 */

// === QUERY CLIENT CONFIGURATION ===
export const QUERY_CONFIG = {
  /**
   * Time in milliseconds before cached data is considered stale
   * After this time, data will be refetched on next mount/focus
   */
  STALE_TIME: 30000, // 30 seconds

  /**
   * Time in milliseconds before inactive queries are garbage collected
   */
  CACHE_TIME: 300000, // 5 minutes
} as const;

// === GAMIFICATION & XP SYSTEM ===
export const GAMIFICATION = {
  /**
   * XP required per level
   * User needs 100 XP to reach next level
   */
  XP_PER_LEVEL: 100,

  /**
   * Base XP rewards by difficulty tier
   */
  XP_REWARDS: {
    NOVICE: 75,
    INTERMEDIATE: 225,
    ADVANCED: 550,
    EXPERT: 1000,
    ELITE: 2250,
  },

  /**
   * Base points rewards by difficulty tier
   */
  POINTS_REWARDS: {
    NOVICE: 100,
    INTERMEDIATE: 300,
    ADVANCED: 650,
    EXPERT: 1200,
    ELITE: 3000,
  },

  /**
   * Default XP fallback value
   */
  DEFAULT_XP: 100,

  /**
   * Default points fallback value
   */
  DEFAULT_POINTS: 150,
} as const;

// === MOUNTAINEERING / CLIMBING SYSTEM ===
export const CLIMBING = {
  /**
   * Number of pitches (sections) per climbing route
   * A pitch is a climbing segment between two belay points
   */
  PITCHES_PER_ROUTE: 12,

  /**
   * Mission duration calculations based on elevation (in meters)
   */
  MISSION_DURATIONS: {
    /** Mountains under 4000m - single-day climbs */
    SINGLE_DAY_THRESHOLD: 4000,
    SINGLE_DAY_DURATION: 3,

    /** Mountains 4000-5500m - week-long expeditions */
    WEEK_LONG_THRESHOLD: 5500,
    WEEK_LONG_DURATION: 7,

    /** Mountains 5500-7000m - multi-week climbs */
    MULTI_WEEK_THRESHOLD: 7000,
    MULTI_WEEK_DURATION: 14,

    /** Mountains 7000-8000m - major expeditions */
    MAJOR_EXPEDITION_THRESHOLD: 8000,
    MAJOR_EXPEDITION_DURATION: 21,

    /** Mountains 8000m+ - extended expeditions (8000m peaks) */
    EIGHT_THOUSANDER_DURATION: 30,
  },

  /**
   * Difficulty tier multipliers for mission duration
   */
  DIFFICULTY_MULTIPLIERS: {
    novice: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
    expert: 1.4,
    elite: 1.5,
  },

  /**
   * Completion requirements based on fatality rate
   */
  COMPLETION_REQUIREMENTS: {
    /** Fatality rate < 1% - Easy mountains */
    EASY_THRESHOLD: 0.01,
    EASY_COMPLETION: 75,

    /** Fatality rate 1-3% - Moderate difficulty */
    MODERATE_THRESHOLD: 0.03,
    MODERATE_COMPLETION: 80,

    /** Fatality rate 3-5% - Challenging */
    CHALLENGING_THRESHOLD: 0.05,
    CHALLENGING_COMPLETION: 90,

    /** Fatality rate > 5% - Dangerous (perfection required) */
    DANGEROUS_COMPLETION: 100,
  },
} as const;

// === HABIT TRACKING ===
export const HABITS = {
  /**
   * Maximum streak allowed before reset
   */
  MAX_STREAK: 999,

  /**
   * Days to show in habit history
   */
  HISTORY_DAYS: 30,

  /**
   * Minimum habits for "dedicated" badge
   */
  DEDICATED_BADGE_THRESHOLD: 7,
} as const;

// === TIME & SCHEDULING ===
export const TIME = {
  /**
   * Milliseconds in common time units
   */
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,

  /**
   * Default timezone
   */
  DEFAULT_TIMEZONE: 'UTC',
} as const;

// === UI / UX CONSTANTS ===
export const UI = {
  /**
   * Animation durations (in milliseconds)
   */
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  /**
   * Debounce delays (in milliseconds)
   */
  DEBOUNCE: {
    SEARCH: 300,
    RESIZE: 150,
    SCROLL: 100,
  },

  /**
   * Toast notification durations (in milliseconds)
   */
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
  },

  /**
   * Pagination defaults
   */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// === API & NETWORK ===
export const API = {
  /**
   * Request timeout (in milliseconds)
   */
  TIMEOUT: 30000, // 30 seconds

  /**
   * Retry configuration
   */
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // Initial delay in ms
    BACKOFF_MULTIPLIER: 2,
  },

  /**
   * Rate limiting
   */
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
  },
} as const;

// === VALIDATION ===
export const VALIDATION = {
  /**
   * Password requirements
   */
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },

  /**
   * Username requirements
   */
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },

  /**
   * Task title requirements
   */
  TASK_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },

  /**
   * Task description requirements
   */
  TASK_DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
} as const;

// === FILE UPLOAD ===
export const UPLOAD = {
  /**
   * Maximum file size (in bytes)
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  /**
   * Allowed image types
   */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  /**
   * Allowed document types
   */
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
} as const;

// === LOGGING ===
export const LOGGING = {
  /**
   * Log levels
   */
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },

  /**
   * Maximum log file size (in bytes)
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  /**
   * Maximum number of log files to keep
   */
  MAX_FILES: 5,
} as const;

// === FEATURE FLAGS ===
export const FEATURES = {
  /**
   * Enable/disable features
   */
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'production',
} as const;

// Type exports for better TypeScript support
export type DifficultyTier = keyof typeof GAMIFICATION.XP_REWARDS;
export type LogLevel = typeof LOGGING.LEVELS[keyof typeof LOGGING.LEVELS];
