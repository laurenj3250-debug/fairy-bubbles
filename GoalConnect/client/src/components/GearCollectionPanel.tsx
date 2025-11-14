import { useQuery } from "@tanstack/react-query";
import { Lock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface GearItem {
  id: number;
  name: string;
  category: string;
  tier: string;
  unlockLevel: number;
  cost: number;
  imageUrl?: string;
  owned: boolean;
}

interface GearStats {
  totalGear: number;
  ownedGear: number;
  basicTier: number;
  intermediateTier: number;
  advancedTier: number;
  eliteTier: number;
}

const tierInfo = {
  basic: {
    label: "Basic",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    icon: "⚒️"
  },
  intermediate: {
    label: "Intermediate",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: "🔧"
  },
  advanced: {
    label: "Advanced",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    icon: "⚡"
  },
  elite: {
    label: "Elite",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: "⭐"
  },
};

const categoryIcons: Record<string, string> = {
  boots: "🥾",
  crampons: "⛏️",
  rope: "🪢",
  tent: "⛺",
  clothing: "🧥",
  safety: "🪢",
  oxygen: "🫁",
  ice_axe: "⛏️",
  harness: "🪢",
  backpack: "🎒",
  sleeping_bag: "💤",
  stove: "🔥",
  miscellaneous: "📦",
};

export function GearCollectionPanel() {
  const { data: stats } = useQuery<GearStats>({
    queryKey: ["/api/gear/stats"],
  });

  const { data: gear = [] } = useQuery<GearItem[]>({
    queryKey: ["/api/gear/collection"],
  });

  if (!stats) {
    return (
      <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 topo-pattern">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/20 rounded w-1/2" />
          <div className="h-32 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  const completionPercentage = stats.totalGear > 0
    ? Math.round((stats.ownedGear / stats.totalGear) * 100)
    : 0;

  // Group gear by tier
  const gearByTier = {
    basic: gear.filter(g => g.tier === "basic"),
    intermediate: gear.filter(g => g.tier === "intermediate"),
    advanced: gear.filter(g => g.tier === "advanced"),
    elite: gear.filter(g => g.tier === "elite"),
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-[hsl(var(--accent))]/30 flex items-center justify-center border border-primary/30">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gear Collection</h2>
            <p className="text-sm text-muted-foreground">
              {stats.ownedGear}/{stats.totalGear} items collected
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Collection Progress</span>
            <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-[hsl(var(--accent))] to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Tier Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(tierInfo).map(([tier, info]) => {
            const tierGear = gearByTier[tier as keyof typeof gearByTier];
            const owned = tierGear.filter(g => g.owned).length;
            const total = tierGear.length;

            return (
              <div
                key={tier}
                className={cn(
                  "p-3 rounded-xl border transition-all hover:scale-105",
                  info.color
                )}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="text-lg font-bold">{owned}/{total}</div>
                <div className="text-xs opacity-80">{info.label}</div>
              </div>
            );
          })}
        </div>

        {/* Gear Grid */}
        <div className="space-y-4">
          {Object.entries(tierInfo).map(([tier, info]) => {
            const tierGear = gearByTier[tier as keyof typeof gearByTier];
            if (tierGear.length === 0) return null;

            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{info.icon}</span>
                  <h3 className="text-sm font-bold text-foreground">{info.label} Gear</h3>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {tierGear.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 transition-all",
                        item.owned
                          ? "border-primary/50 bg-primary/10 hover:border-primary hover:scale-105"
                          : "border-border/30 bg-muted/10 opacity-50"
                      )}
                    >
                      {/* Lock overlay for unowned gear */}
                      {!item.owned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                          <Lock className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Gear icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">
                          {categoryIcons[item.category] || "📦"}
                        </span>
                      </div>

                      {/* Item name tooltip */}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                        <p className="text-xs font-semibold text-white text-center truncate">
                          {item.name}
                        </p>
                      </div>

                      {/* Level requirement badge */}
                      {!item.owned && (
                        <Badge
                          variant="outline"
                          className="absolute top-1 right-1 text-xs px-1.5 py-0.5 bg-black/60 border-primary/30"
                        >
                          L{item.unlockLevel}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {gear.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Complete habits to unlock gear
            </p>
          </div>
        )}

        {/* Call to action */}
        {stats.ownedGear < stats.totalGear && (
          <div className="mt-6 p-3 bg-muted/10 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              💡 Level up to unlock more gear. Visit the{" "}
              <a href="/alpine-shop" className="text-primary font-semibold hover:underline">
                Alpine Shop
              </a>{" "}
              to purchase unlocked items.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
