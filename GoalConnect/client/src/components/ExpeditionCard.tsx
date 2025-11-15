import { useQuery } from "@tanstack/react-query";
import { Globe, ShoppingBag, Mountain, Lock, TrendingUp, Package, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import EnergyBar from "./EnergyBar";

interface ClimbingStats {
  climbingLevel: number;
  summits: number;
  totalXp: number;
  currentStreak: number;
  currentEnergy: number;
  maxEnergy: number;
}

interface Mountain {
  id: number;
  name: string;
  elevation: number;
  difficultyTier: string;
  requiredClimbingLevel: number;
  country: string;
}

interface PlayerInventory {
  gearId: number;
  name: string;
}

export function ExpeditionCard() {
  const { data: stats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
  });

  const { data: allMountains = [] } = useQuery<Mountain[]>({
    queryKey: ["/api/mountains"],
  });

  const { data: inventory = [] } = useQuery<PlayerInventory[]>({
    queryKey: ["/api/alpine-gear/inventory"],
  });

  // Find next mountain to unlock
  const sortedMountains = allMountains
    .sort((a, b) => a.requiredClimbingLevel - b.requiredClimbingLevel);

  const unlockedMountains = sortedMountains.filter(
    m => stats && stats.climbingLevel >= m.requiredClimbingLevel
  );

  const nextMountain = sortedMountains.find(
    m => stats && stats.climbingLevel < m.requiredClimbingLevel
  );

  const tierColors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-300 border-green-500/40",
    intermediate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    advanced: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    expert: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    elite: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern relative overflow-hidden">
      {/* Background mountain silhouette */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg viewBox="0 0 1200 400" className="w-full h-full">
          <path
            d="M0,400 L200,100 L400,250 L600,50 L800,200 L1000,150 L1200,300 L1200,400 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-[hsl(var(--accent))]/30 flex items-center justify-center border border-primary/30">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Expeditions</h2>
            <p className="text-sm text-muted-foreground">Climb legendary mountains around the world</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl px-3 py-2 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Level</div>
            <div className="text-2xl font-bold text-primary">{stats?.climbingLevel || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 rounded-xl px-3 py-2 border border-[hsl(var(--accent))]/20">
            <div className="text-xs text-muted-foreground mb-1">Summits</div>
            <div className="text-2xl font-bold text-[hsl(var(--accent))]">{stats?.summits || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl px-3 py-2 border border-blue-500/20">
            <div className="text-xs text-muted-foreground mb-1">Unlocked</div>
            <div className="text-2xl font-bold text-blue-400">{unlockedMountains.length}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl px-3 py-2 border border-orange-500/20">
            <div className="text-xs text-muted-foreground mb-1">Gear</div>
            <div className="text-2xl font-bold text-orange-400">{inventory.length}</div>
          </div>
        </div>

        {/* Energy Bar */}
        <div className="mb-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl px-4 py-3 border border-yellow-500/20">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Energy</div>
          <EnergyBar
            currentEnergy={stats?.currentEnergy || 0}
            maxEnergy={stats?.maxEnergy || 100}
            showLabel={true}
          />
        </div>

        {/* Next Mountain Unlock */}
        {nextMountain && (
          <div className="bg-muted/20 rounded-xl px-4 py-3 mb-4 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Next Mountain Unlock</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-primary" />
                  {nextMountain.name}
                  <Badge className={cn("text-xs", tierColors[nextMountain.difficultyTier])} variant="outline">
                    {nextMountain.difficultyTier}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {nextMountain.country} • {nextMountain.elevation.toLocaleString()}m
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-amber-400">Level {nextMountain.requiredClimbingLevel}</div>
                <div className="text-xs text-muted-foreground">Required</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/world-map" asChild>
            <Button
              className="h-16 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/20 transition-all hover:scale-105 active:scale-95 group"
              variant="outline"
            >
              <div className="text-center">
                <Globe className="w-6 h-6 mx-auto mb-1 text-primary transition-transform group-hover:scale-110" />
                <div className="text-sm font-bold text-foreground">World Map</div>
                <div className="text-xs text-muted-foreground">{allMountains.length} mountains</div>
              </div>
            </Button>
          </Link>

          <Link href="/alpine-shop" asChild>
            <Button
              className="h-16 bg-gradient-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 border-2 border-[hsl(var(--accent))]/30 hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--accent))]/20 transition-all hover:scale-105 active:scale-95 group"
              variant="outline"
            >
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto mb-1 text-[hsl(var(--accent))] transition-transform group-hover:scale-110" />
                <div className="text-sm font-bold text-foreground">Alpine Shop</div>
                <div className="text-xs text-muted-foreground">Buy gear</div>
              </div>
            </Button>
          </Link>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Level {stats?.climbingLevel || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-muted-foreground">{unlockedMountains.length}/{allMountains.length} unlocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
