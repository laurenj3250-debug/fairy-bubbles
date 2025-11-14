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
 * HOW TO ADD YOUR OWN BACKGROUNDS:
 *
 * 1. Find a beautiful mountain image:
 *    - Unsplash.com (search "mountain sunset", "alpine", "summit")
 *    - Pexels.com (free high-quality photos)
 *    - Your own photos!
 *
 * 2. Save to: /client/public/backgrounds/your-image.jpg
 *    (Create the folder if it doesn't exist)
 *
 * 3. Add entry below with optional custom theme
 *
 * 4. Optionally create a matching theme (see themes below)
 */

export interface BackgroundConfig {
  id: string;
  name: string;
  image: string;
  unlockStreak: number;
  description: string;
  timeOfDay?: 'dawn' | 'day' | 'sunset' | 'night';
  themeId?: string;  // NEW: Link to custom theme
}

export const backgrounds: BackgroundConfig[] = [
  {
    id: 'starter',
    name: 'Valley View',
    image: '/backgrounds/valley.jpg',
    unlockStreak: 0,
    description: 'Starting your journey',
    timeOfDay: 'day',
    themeId: 'mountainDusk'  // Default theme
  },
  {
    id: 'explorer',
    name: 'Alpine Meadow',
    image: '/backgrounds/meadow.jpg',
    unlockStreak: 7,
    description: 'One week strong!',
    timeOfDay: 'day',
    themeId: 'alpineMeadow'  // Fresh green theme
  },
  {
    id: 'climber',
    name: 'Mountain Ridge',
    image: '/backgrounds/ridge.jpg',
    unlockStreak: 30,
    description: 'A full month of consistency',
    timeOfDay: 'sunset',
    themeId: 'sunsetPeak'  // Warm sunset theme
  },
  {
    id: 'veteran',
    name: 'High Summit',
    image: '/backgrounds/summit.jpg',
    unlockStreak: 90,
    description: '90 days - you\'re unstoppable!',
    timeOfDay: 'dawn',
    themeId: 'alpineDawn'  // Pink/purple dawn theme
  },
  {
    id: 'legend',
    name: 'The Peak',
    image: '/backgrounds/peak.jpg',
    unlockStreak: 180,
    description: 'Half a year of dedication',
    timeOfDay: 'day',
    themeId: 'glacierBlue'  // Icy blue theme
  },
  {
    id: 'master',
    name: 'Northern Lights Summit',
    image: '/backgrounds/aurora.jpg',
    unlockStreak: 365,
    description: 'One full year - legendary!',
    timeOfDay: 'night',
    themeId: 'northernLights'  // Purple/green aurora theme
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
 * MOUNTAIN DUSK THEME (Default - Starter)
 * Deep blue-gray mountain evening atmosphere
 */
export const mountainDuskTheme: Theme = {
  name: 'Mountain Dusk',
  colors: {
    background: '215 25% 27%',
    foreground: '39 80% 95%',
    card: '215 20% 32%',
    cardForeground: '39 80% 95%',
    primary: '199 89% 58%',
    primaryForeground: '215 25% 15%',
    secondary: '215 20% 40%',
    secondaryForeground: '39 80% 95%',
    accent: '25 95% 63%',
    accentForeground: '215 25% 15%',
    success: '142 71% 55%',
    successForeground: '215 25% 15%',
    warning: '38 92% 60%',
    warningForeground: '215 25% 15%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '215 15% 42%',
    input: '215 15% 42%',
    ring: '199 89% 58%',
    muted: '215 20% 38%',
    mutedForeground: '39 50% 75%'
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
 * ALPINE MEADOW THEME (7 days)
 * Fresh green meadows and clear skies
 */
export const alpineMeadowTheme: Theme = {
  name: 'Alpine Meadow',
  colors: {
    background: '140 30% 25%',         // Deep forest green
    foreground: '60 80% 95%',          // Warm light cream
    card: '140 25% 30%',
    cardForeground: '60 80% 95%',
    primary: '142 71% 55%',            // Fresh meadow green
    primaryForeground: '140 30% 10%',
    secondary: '140 20% 38%',
    secondaryForeground: '60 80% 95%',
    accent: '45 95% 55%',              // Sunflower yellow
    accentForeground: '140 30% 10%',
    success: '120 60% 50%',
    successForeground: '140 30% 10%',
    warning: '38 92% 60%',
    warningForeground: '140 30% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '140 15% 40%',
    input: '140 15% 40%',
    ring: '142 71% 55%',
    muted: '140 20% 35%',
    mutedForeground: '60 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 2px 8px 0 rgb(0 0 0 / 0.15)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * SUNSET PEAK THEME (30 days)
 * Warm, golden sunset tones - pink and orange magic hour
 */
export const sunsetPeakTheme: Theme = {
  name: 'Sunset Peak',
  colors: {
    background: '340 35% 20%',         // Deep rose-brown
    foreground: '40 90% 95%',          // Warm golden cream
    card: '340 30% 25%',
    cardForeground: '40 90% 95%',
    primary: '340 82% 60%',            // Vibrant pink-coral
    primaryForeground: '340 35% 10%',
    secondary: '340 25% 32%',
    secondaryForeground: '40 90% 95%',
    accent: '25 95% 63%',              // Golden orange
    accentForeground: '340 35% 10%',
    success: '142 71% 55%',
    successForeground: '340 35% 10%',
    warning: '38 92% 60%',
    warningForeground: '340 35% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '340 20% 35%',
    input: '340 20% 35%',
    ring: '340 82% 60%',
    muted: '340 25% 30%',
    mutedForeground: '40 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 12px 0 rgb(0 0 0 / 0.2)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * ALPINE DAWN THEME (90 days)
 * Pink and purple sunrise on snowy peaks
 */
export const alpineDawnTheme: Theme = {
  name: 'Alpine Dawn',
  colors: {
    background: '300 30% 22%',         // Deep purple-gray
    foreground: '330 80% 95%',         // Rose-tinted cream
    card: '300 25% 27%',
    cardForeground: '330 80% 95%',
    primary: '330 70% 60%',            // Rose pink
    primaryForeground: '300 30% 10%',
    secondary: '300 20% 35%',
    secondaryForeground: '330 80% 95%',
    accent: '290 80% 65%',             // Bright purple
    accentForeground: '300 30% 10%',
    success: '142 71% 55%',
    successForeground: '300 30% 10%',
    warning: '38 92% 60%',
    warningForeground: '300 30% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '300 15% 38%',
    input: '300 15% 38%',
    ring: '330 70% 60%',
    muted: '300 20% 32%',
    mutedForeground: '330 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 12px 0 rgb(255 105 180 / 0.1)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * GLACIER BLUE THEME (180 days)
 * Icy, crystalline blues - frozen waterfall aesthetic
 */
export const glacierBlueTheme: Theme = {
  name: 'Glacier Blue',
  colors: {
    background: '195 45% 20%',         // Deep ice blue
    foreground: '190 80% 95%',         // Ice-blue tinted white
    card: '195 40% 25%',
    cardForeground: '190 80% 95%',
    primary: '186 100% 52%',           // Glacier cyan
    primaryForeground: '195 45% 10%',
    secondary: '195 35% 32%',
    secondaryForeground: '190 80% 95%',
    accent: '200 100% 60%',            // Bright sky blue
    accentForeground: '195 45% 10%',
    success: '142 71% 55%',
    successForeground: '195 45% 10%',
    warning: '38 92% 60%',
    warningForeground: '195 45% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '195 25% 35%',
    input: '195 25% 35%',
    ring: '186 100% 52%',
    muted: '195 35% 28%',
    mutedForeground: '190 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 12px 0 rgb(0 255 255 / 0.1)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

/**
 * NORTHERN LIGHTS THEME (365 days - LEGENDARY!)
 * Purple, green, and teal aurora borealis magic
 */
export const northernLightsTheme: Theme = {
  name: 'Northern Lights',
  colors: {
    background: '240 40% 15%',         // Deep midnight blue
    foreground: '180 80% 95%',         // Aurora-tinted white
    card: '240 35% 20%',
    cardForeground: '180 80% 95%',
    primary: '280 70% 60%',            // Purple aurora
    primaryForeground: '240 40% 10%',
    secondary: '240 30% 25%',
    secondaryForeground: '180 80% 95%',
    accent: '160 100% 50%',            // Bright aurora green
    accentForeground: '240 40% 10%',
    success: '140 100% 50%',           // Electric green
    successForeground: '240 40% 10%',
    warning: '280 90% 65%',            // Purple-pink
    warningForeground: '240 40% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '240 25% 30%',
    input: '240 25% 30%',
    ring: '160 100% 50%',
    muted: '240 30% 22%',
    mutedForeground: '180 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 20px 0 rgb(0 255 157 / 0.15)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes = {
  mountainDusk: mountainDuskTheme,
  alpineMeadow: alpineMeadowTheme,
  sunsetPeak: sunsetPeakTheme,
  alpineDawn: alpineDawnTheme,
  glacierBlue: glacierBlueTheme,
  northernLights: northernLightsTheme
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
