import { Mountain, Coins } from "lucide-react";

interface MountainHeroCardProps {
  mountainName: string;
  currentDay: number;
  totalDays: number;
  expeditionProgress: number;
  level: number;
  coins: number;
}

/**
 * MountainHeroCard - Central hero component showing current expedition
 *
 * Features:
 * - Mountain illustration background (image + CSS gradients)
 * - Expedition progress bar
 * - Level and coin badges
 * - Integrated navigation (replaces ExpeditionHeader)
 */
export function MountainHeroCard({
  mountainName,
  currentDay,
  totalDays,
  expeditionProgress,
  level,
  coins
}: MountainHeroCardProps) {
  return (
    <div className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-2xl">
      {/* Sky Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-amber-200 to-amber-100" />

      {/* Mountain Illustration Placeholder - will be replaced with actual image */}
      <div className="absolute inset-0 flex items-end justify-center">
        <svg
          viewBox="0 0 1440 360"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* El Capitan simplified silhouette */}
          <defs>
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#7c3aed', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>

          {/* Main mountain - El Capitan shape */}
          <path
            d="M 600 360 L 600 80 L 650 60 L 700 40 L 750 30 L 800 40 L 840 80 L 840 360 Z"
            fill="url(#mountainGradient)"
          />

          {/* Shadow side */}
          <path
            d="M 840 360 L 840 80 L 880 100 L 920 140 L 940 200 L 940 360 Z"
            fill="url(#shadowGradient)"
          />

          {/* Foreground trees */}
          <ellipse cx="300" cy="340" rx="80" ry="30" fill="#059669" opacity="0.4" />
          <ellipse cx="1100" cy="340" rx="100" ry="35" fill="#059669" opacity="0.4" />
        </svg>
      </div>

      {/* Stats Overlay (top) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold shadow-lg flex items-center gap-2 backdrop-blur-sm">
            <Mountain className="w-4 h-4" />
            <span>LEVEL {level}</span>
          </div>

          {/* Coins Badge */}
          <div className="px-4 py-2 rounded-full bg-white/90 text-foreground font-semibold shadow-lg flex items-center gap-2 backdrop-blur-sm">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>{coins}</span>
          </div>
        </div>
      </div>

      {/* Expedition Progress Overlay (bottom center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md z-10 px-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
          {/* Mountain Name */}
          <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
            {mountainName}
          </h1>

          {/* Subtitle */}
          <p className="text-center text-muted-foreground text-sm mb-4">
            Day {currentDay} of {totalDays} · Current Expedition
          </p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>EXPEDITION PROGRESS</span>
              <span>{expeditionProgress}%</span>
            </div>
            <div
              className="relative h-4 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={expeditionProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Expedition progress"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-amber-500 to-amber-400 shadow-lg transition-all duration-500"
                style={{ width: `${expeditionProgress}%` }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
