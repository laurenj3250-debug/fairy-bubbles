/**
 * THEME SYSTEM - Single Source of Truth
 *
 * Edit this file to customize the entire app's appearance.
 * All colors and spacing are defined here.
 */

// ============================================================================
// THEME SYSTEM
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
 * EL CAPITAN SUNRISE THEME
 * Bright travel-poster style with warm golden-hour colors
 */
export const elCapitanSunriseTheme: Theme = {
  name: 'El Capitan Sunrise',
  colors: {
    background: '45 100% 96%',            // Warm creamy white (sky)
    foreground: '30 15% 20%',             // Darker warm gray (WCAG AA compliant)
    card: '0 0% 100%',                    // Pure white glass cards
    cardForeground: '30 15% 20%',
    primary: '28 85% 48%',                // Darker orange/gold (4.5:1+ contrast)
    primaryForeground: '0 0% 100%',
    secondary: '210 40% 45%',             // Darker blue/gray (4.5:1+ contrast)
    secondaryForeground: '0 0% 100%',
    accent: '160 50% 40%',                // Darker muted green (4.5:1+ contrast)
    accentForeground: '0 0% 100%',
    success: '142 71% 45%',               // Darker fresh green
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',                // Darker amber
    warningForeground: '0 0% 100%',
    destructive: '0 84% 50%',             // Darker red
    destructiveForeground: '0 0% 100%',
    border: '30 10% 80%',                 // Darker border for contrast
    input: '30 10% 80%',
    ring: '28 85% 48%',
    muted: '30 8% 90%',
    mutedForeground: '30 10% 40%'         // Darker gray (4.5:1+ contrast)
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '1rem'
  },
  effects: {
    cardShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    hoverScale: 1.02,
    transitionSpeed: '200ms'
  }
};

/**
 * GRANITE MONOLITH THEME (El Capitan - Dark version)
 * Warm granite grays with golden accents - inspired by Yosemite's iconic wall
 */
export const graniteMonolithTheme: Theme = {
  name: 'Granite Monolith',
  colors: {
    background: '30 8% 22%',              // Warm dark granite gray
    foreground: '40 30% 95%',             // Warm light cream
    card: '30 10% 28%',                   // Lighter granite
    cardForeground: '40 30% 95%',
    primary: '40 85% 55%',                // Warm golden yellow (sun on granite)
    primaryForeground: '30 8% 15%',
    secondary: '30 8% 35%',               // Medium granite
    secondaryForeground: '40 30% 95%',
    accent: '25 90% 60%',                 // Warm sunset orange
    accentForeground: '30 8% 15%',
    success: '142 71% 55%',
    successForeground: '30 8% 15%',
    warning: '40 92% 60%',
    warningForeground: '30 8% 15%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '30 10% 38%',                 // Granite edge
    input: '30 10% 38%',
    ring: '40 85% 55%',
    muted: '30 8% 32%',
    mutedForeground: '40 20% 70%'
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

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes = {
  elCapitanSunrise: elCapitanSunriseTheme,
  graniteMonolith: graniteMonolithTheme,
};

export type ThemeKey = keyof typeof themes;

// Default theme is now El Capitan Sunrise
export const defaultTheme: ThemeKey = 'elCapitanSunrise';

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
