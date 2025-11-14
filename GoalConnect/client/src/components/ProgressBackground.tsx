import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentBackground, getNextBackground, applyTheme, type BackgroundConfig, type ThemeKey } from '@/themes/config';

interface ProgressBackgroundProps {
  children: React.ReactNode;
}

interface MountainUnlock {
  id: number;
  mountainName: string;
  unlockedAt: string;
}

/**
 * ProgressBackground Component
 *
 * Automatically changes the background AND theme based on mountains you've unlocked
 * in your expedition/world map!
 *
 * When you unlock a new mountain, you get:
 * - New beautiful background photo
 * - Matching color theme that auto-applies
 * - Celebration notification
 *
 * Usage:
 * <ProgressBackground>
 *   <YourContent />
 * </ProgressBackground>
 */
export function ProgressBackground({ children }: ProgressBackgroundProps) {
  // Initialize with default El Capitan background immediately
  const [currentBackground, setCurrentBackground] = useState<BackgroundConfig | null>(() => {
    try {
      return getCurrentBackground([]);
    } catch (e) {
      console.error('Error initializing background:', e);
      return null;
    }
  });
  const [nextBackground, setNextBackground] = useState<BackgroundConfig | null>(null);

  // Fetch user's unlocked mountains
  const { data: unlockedMountains = [] } = useQuery<MountainUnlock[]>({
    queryKey: ['/api/mountains/unlocked'],
  });

  // Apply default theme on mount
  useEffect(() => {
    if (currentBackground?.themeId) {
      try {
        applyTheme(currentBackground.themeId as ThemeKey);
      } catch (e) {
        console.error('Error applying theme:', e);
      }
    }
  }, [currentBackground?.themeId]);

  useEffect(() => {
    const mountainNames = unlockedMountains.map(m => m.mountainName);
    const current = getCurrentBackground(mountainNames);
    const next = getNextBackground(mountainNames);

    setCurrentBackground(current);
    setNextBackground(next);

    // Auto-apply the theme linked to this background!
    if (current?.themeId) {
      try {
        applyTheme(current.themeId as ThemeKey);
      } catch (e) {
        console.error('Error applying theme:', e);
      }
    }
  }, [unlockedMountains]);

  // Fallback if no background is loaded
  if (!currentBackground) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Background image with atmospheric overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${currentBackground.image})`,
          opacity: 0.65  // Much more visible background
        }}
      />

      {/* Gradient overlay for readability - keeps content clear */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background/80" />

      {/* Subtle topographic texture overlay for climbing essence */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 11px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.03) 10px,
            rgba(255, 255, 255, 0.03) 11px
          )`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Next unlock preview (show available mountains in expedition page) */}
      {nextBackground && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2">
          <NextMountainPreview nextBackground={nextBackground} />
        </div>
      )}
    </div>
  );
}

interface NextMountainPreviewProps {
  nextBackground: BackgroundConfig;
}

function NextMountainPreview({ nextBackground }: NextMountainPreviewProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Next Mountain
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock <span className="font-medium text-foreground">{nextBackground.mountainName}</span> to reveal this view
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {nextBackground.description}
          </p>
          <button
            onClick={() => window.location.href = '/world-map'}
            className="text-xs text-primary hover:text-primary/80 mt-2 font-medium"
          >
            View World Map →
          </button>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * BackgroundGallery Component
 *
 * Shows all backgrounds and their unlock requirements.
 * Can be used in a settings page or achievements section.
 */
export function BackgroundGallery({ currentStreak }: { currentStreak: number }) {
  const currentBg = getBackgroundForStreak(currentStreak);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mountain Backgrounds</h3>
      <p className="text-sm text-muted-foreground">
        Build your streak to unlock new scenic views!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {getBackgroundForStreak(0) && (
          <BackgroundCard
            background={getBackgroundForStreak(0)}
            isUnlocked={true}
            isCurrent={currentBg.id === getBackgroundForStreak(0).id}
            currentStreak={currentStreak}
          />
        )}
      </div>
    </div>
  );
}

interface BackgroundCardProps {
  background: BackgroundConfig;
  isUnlocked: boolean;
  isCurrent: boolean;
  currentStreak: number;
}

function BackgroundCard({ background, isUnlocked, isCurrent, currentStreak }: BackgroundCardProps) {
  const daysRemaining = background.unlockStreak - currentStreak;

  return (
    <div className={`
      relative rounded-lg overflow-hidden border-2 transition-all
      ${isCurrent ? 'border-primary shadow-lg' : 'border-border'}
      ${!isUnlocked && 'opacity-60'}
    `}>
      {/* Background preview */}
      <div className="aspect-video bg-muted relative">
        {isUnlocked ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${background.image})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}

        {isCurrent && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
            Current
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-medium text-foreground">{background.name}</h4>
        <p className="text-sm text-muted-foreground mt-1">{background.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm">
            {isUnlocked ? (
              <span className="text-success font-medium">Unlocked</span>
            ) : (
              <span className="text-muted-foreground">
                {daysRemaining} days to unlock
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {background.unlockStreak} day streak
          </div>
        </div>
      </div>
    </div>
  );
}
