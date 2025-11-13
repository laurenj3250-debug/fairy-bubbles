import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Mountain } from "lucide-react";
import { getClimbingRank } from "@/lib/climbingRanks";

interface ClimbingStats {
  climbingLevel: number;
  totalExperience: number;
  summitsReached: number;
}

interface AltimeterProps {
  className?: string;
  compact?: boolean;
}

// Altitude zones with atmospheric descriptions
const ALTITUDE_ZONES = [
  { min: 0, max: 1000, name: "Base Camp", elevation: "0-1,000m", atmosphere: "Sea Level", color: "text-mountain-tree-line", bgColor: "bg-mountain-tree-line/20" },
  { min: 1001, max: 2500, name: "Tree Line", elevation: "1,000-2,500m", atmosphere: "Dense Air", color: "text-mountain-alpine-meadow", bgColor: "bg-mountain-alpine-meadow/20" },
  { min: 2501, max: 4500, name: "Alpine Zone", elevation: "2,500-4,500m", atmosphere: "Thin Air", color: "text-mountain-alpenglow", bgColor: "bg-mountain-alpenglow/20" },
  { min: 4501, max: 6000, name: "High Camp", elevation: "4,500-6,000m", atmosphere: "Very Thin", color: "text-mountain-glacier-ice", bgColor: "bg-mountain-glacier-ice/20" },
  { min: 6001, max: 8000, name: "Death Zone", elevation: "6,000-8,000m", atmosphere: "Extreme Altitude", color: "text-mountain-sky-light", bgColor: "bg-mountain-sky-light/20" },
  { min: 8001, max: 10000, name: "Summit", elevation: "8,000m+", atmosphere: "Stratosphere", color: "text-mountain-moonlit-snow", bgColor: "bg-mountain-moonlit-snow/20" },
];

export function Altimeter({ className, compact = false }: AltimeterProps) {
  const { data: climbingStats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
    queryFn: async () => {
      const res = await fetch("/api/climbing/stats");
      if (!res.ok) {
        return { climbingLevel: 1, totalExperience: 0, summitsReached: 0 };
      }
      return res.json();
    },
  });

  // Calculate current altitude based on XP (roughly 10m per XP point)
  const currentAltitude = useMemo(() => {
    if (!climbingStats) return 0;
    return Math.min(climbingStats.totalExperience * 10, 9999);
  }, [climbingStats]);

  // Find current altitude zone
  const currentZone = useMemo(() => {
    return ALTITUDE_ZONES.find(zone =>
      currentAltitude >= zone.min && currentAltitude <= zone.max
    ) || ALTITUDE_ZONES[0];
  }, [currentAltitude]);

  const rank = climbingStats ? getClimbingRank(climbingStats.climbingLevel) : null;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 card-stone-cliff rounded-xl ${className}`}>
        <Mountain className="w-4 h-4 text-mountain-glacier-ice" />
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-technical font-bold text-foreground">
            {currentAltitude.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">m</span>
        </div>
        <div className="h-4 w-px bg-border/50" />
        <span className={`text-xs font-semibold ${currentZone.color}`}>
          {currentZone.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`card-ice-shelf p-4 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-mountain-glacier-ice" />
          <h3 className="text-sm font-altitude font-bold uppercase tracking-tight text-foreground">
            Altimeter
          </h3>
        </div>
        {rank && (
          <span className="text-xs font-technical font-bold text-mountain-alpenglow">
            {rank.grade}
          </span>
        )}
      </div>

      {/* Main altitude display */}
      <div className="text-center mb-4">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-technical font-bold text-foreground">
            {currentAltitude.toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground">meters</span>
        </div>
        <div className={`mt-2 px-3 py-1 rounded-full ${currentZone.bgColor} border border-current/30`}>
          <span className={`text-sm font-semibold ${currentZone.color}`}>
            {currentZone.name}
          </span>
        </div>
      </div>

      {/* Atmospheric conditions */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Atmosphere:</span>
          <span className="font-semibold text-foreground">{currentZone.atmosphere}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Elevation Band:</span>
          <span className="font-technical text-foreground">{currentZone.elevation}</span>
        </div>
        {climbingStats && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total XP:</span>
            <span className="font-technical text-mountain-glacier-ice font-bold">
              {climbingStats.totalExperience.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Altitude zones visualization */}
      <div className="mt-4 space-y-1">
        {ALTITUDE_ZONES.slice().reverse().map((zone) => {
          const isCurrentZone = zone.name === currentZone.name;
          const isPassed = currentAltitude > zone.max;

          return (
            <div
              key={zone.name}
              className={`flex items-center gap-2 p-1.5 rounded transition-all ${
                isCurrentZone
                  ? `${zone.bgColor} border border-current/30 scale-105`
                  : isPassed
                  ? "opacity-50"
                  : "opacity-30"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isCurrentZone
                  ? `${zone.color.replace("text-", "bg-")} animate-pulse`
                  : isPassed
                  ? `${zone.color.replace("text-", "bg-")}`
                  : "bg-muted"
              }`} />
              <span className={`text-xs font-semibold flex-1 ${
                isCurrentZone ? zone.color : "text-muted-foreground"
              }`}>
                {zone.name}
              </span>
              <span className="text-[10px] font-technical text-muted-foreground">
                {zone.elevation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
