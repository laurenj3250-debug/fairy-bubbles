/**
 * THEME SYSTEM - Single Source of Truth
 *
 * Edit this file to customize the entire app's appearance.
 * All colors, spacing, and backgrounds are defined here.
 */

// ============================================================================
// BACKGROUND PROGRESSION SYSTEM
// ============================================================================

export interface BackgroundConfig {
  id: string;
  name: string;
  image: string;
  unlockStreak: number;
  description: string;
  timeOfDay?: 'dawn' | 'day' | 'sunset' | 'night';
}

/**
 * Backgrounds unlock as you build your streak!
 * Add new backgrounds by adding entries to this array.
 */
export const backgrounds: BackgroundConfig[] = [
  {
    id: 'starter',
    name: 'Valley View',
    image: '/backgrounds/valley.jpg',
    unlockStreak: 0,
    description: 'Starting your journey',
    timeOfDay: 'day'
  },
  {
    id: 'explorer',
    name: 'Alpine Meadow',
    image: '/backgrounds/meadow.jpg',
    unlockStreak: 7,
    description: 'One week strong!',
    timeOfDay: 'day'
  },
  {
    id: 'climber',
    name: 'Mountain Ridge',
    image: '/backgrounds/ridge.jpg',
    unlockStreak: 30,
    description: 'A full month of consistency',
    timeOfDay: 'sunset'
  },
  {
    id: 'veteran',
    name: 'High Summit',
    image: '/backgrounds/summit.jpg',
    unlockStreak: 90,
    description: '90 days - you\'re unstoppable!',
    timeOfDay: 'dawn'
  },
  {
    id: 'legend',
    name: 'The Peak',
    image: '/backgrounds/peak.jpg',
    unlockStreak: 180,
    description: 'Half a year of dedication',
    timeOfDay: 'day'
  },
  {
    id: 'master',
    name: 'Northern Lights Summit',
    image: '/backgrounds/aurora.jpg',
    unlockStreak: 365,
    description: 'One full year - legendary!',
    timeOfDay: 'night'
  }
];

// ============================================================================
// THEME PRESETS
// ============================================================================

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;

  // Semantic colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;

  // Status colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;

  // Border and muted
  border: string;
  input: string;
  ring: string;
  muted: string;
  mutedForeground: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: {
    sectionGap: string;
    cardPadding: string;
    borderRadius: string;
  };
  effects: {
    cardShadow: string;
    hoverScale: number;
    transitionSpeed: string;
  };
}

/**
 * LIGHT MOUNTAIN THEME (Default)
 * Clean, bright, motivating - easy on the eyes
 */
export const lightMountainTheme: Theme = {
  name: 'Light Mountain',
  colors: {
    // Soft, warm whites and creams
    background: '0 0% 100%',           // Pure white
    foreground: '222 47% 11%',         // Deep charcoal text
    card: '0 0% 98%',                  // Off-white cards
    cardForeground: '222 47% 11%',

    // Sky blue primary (mountain sky)
    primary: '199 89% 48%',            // Clear sky blue
    primaryForeground: '0 0% 100%',
    secondary: '210 40% 96%',          // Light blue-gray
    secondaryForeground: '222 47% 11%',

    // Warm orange accent (sunrise)
    accent: '25 95% 53%',              // Warm orange
    accentForeground: '0 0% 100%',

    // Status colors
    success: '142 71% 45%',            // Fresh green (completed)
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',             // Amber (in progress)
    warningForeground: '0 0% 100%',
    destructive: '0 84% 60%',          // Red (urgent)
    destructiveForeground: '0 0% 100%',

    // Borders and subtle elements
    border: '214 32% 91%',             // Light gray-blue
    input: '214 32% 91%',
    ring: '199 89% 48%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * SUNSET PEAK THEME
 * Warm, golden tones for late afternoon vibes
 */
export const sunsetPeakTheme: Theme = {
  name: 'Sunset Peak',
  colors: {
    background: '39 100% 97%',         // Warm cream
    foreground: '25 25% 20%',
    card: '33 100% 96%',
    cardForeground: '25 25% 20%',

    primary: '14 90% 53%',             // Sunset orange
    primaryForeground: '0 0% 100%',
    secondary: '39 77% 91%',
    secondaryForeground: '25 25% 20%',

    accent: '340 82% 52%',             // Pink-coral
    accentForeground: '0 0% 100%',

    success: '142 71% 45%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',

    border: '33 44% 88%',
    input: '33 44% 88%',
    ring: '14 90% 53%',
    muted: '39 77% 91%',
    mutedForeground: '25 25% 45%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * ALPINE CLEAN THEME
 * Crisp, minimal, blue-white like snow and ice
 */
export const alpineCleanTheme: Theme = {
  name: 'Alpine Clean',
  colors: {
    background: '210 20% 98%',         // Cool white
    foreground: '222 47% 11%',
    card: '0 0% 100%',                 // Pure white cards
    cardForeground: '222 47% 11%',

    primary: '200 98% 39%',            // Deep ice blue
    primaryForeground: '0 0% 100%',
    secondary: '210 40% 96%',
    secondaryForeground: '222 47% 11%',

    accent: '186 100% 42%',            // Glacier cyan
    accentForeground: '0 0% 100%',

    success: '142 71% 45%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',

    border: '214 32% 91%',
    input: '214 32% 91%',
    ring: '200 98% 39%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%'
  },
  spacing: {
    sectionGap: '2rem',
    cardPadding: '2rem',
    borderRadius: '1rem'
  },
  effects: {
    cardShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    hoverScale: 1.01,
    transitionSpeed: '100ms'
  }
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes = {
  lightMountain: lightMountainTheme,
  sunsetPeak: sunsetPeakTheme,
  alpineClean: alpineCleanTheme
};

export type ThemeKey = keyof typeof themes;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the appropriate background based on current streak
 */
export function getBackgroundForStreak(streakDays: number): BackgroundConfig {
  // Find the highest unlocked background
  const unlocked = backgrounds
    .filter(bg => bg.unlockStreak <= streakDays)
    .sort((a, b) => b.unlockStreak - a.unlockStreak);

  return unlocked[0] || backgrounds[0];
}

/**
 * Get the next background to unlock
 */
export function getNextBackground(streakDays: number): BackgroundConfig | null {
  const locked = backgrounds
    .filter(bg => bg.unlockStreak > streakDays)
    .sort((a, b) => a.unlockStreak - b.unlockStreak);

  return locked[0] || null;
}

/**
 * Calculate days until next unlock
 */
export function daysUntilNextUnlock(streakDays: number): number {
  const next = getNextBackground(streakDays);
  return next ? next.unlockStreak - streakDays : 0;
}

/**
 * Apply theme to CSS variables
 */
export function applyTheme(themeKey: ThemeKey) {
  const theme = themes[themeKey];
  const root = document.documentElement;

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Apply spacing variables
  root.style.setProperty('--section-gap', theme.spacing.sectionGap);
  root.style.setProperty('--card-padding', theme.spacing.cardPadding);
  root.style.setProperty('--border-radius', theme.spacing.borderRadius);

  // Apply effect variables
  root.style.setProperty('--card-shadow', theme.effects.cardShadow);
  root.style.setProperty('--hover-scale', theme.effects.hoverScale.toString());
  root.style.setProperty('--transition-speed', theme.effects.transitionSpeed);
}
