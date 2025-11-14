import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mountain, Package, Lock, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AlpineGear {
  id: number;
  name: string;
  category: string;
  description: string;
  weightGrams: number;
  tier: string;
  unlockLevel: number;
  unlockHabitCount: number;
  cost: number;
}

interface PlayerInventory {
  gearId: number;
  name: string;
}

export default function AlpineShop() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allGear = [], isLoading: gearLoading } = useQuery<AlpineGear[]>({
    queryKey: ["/api/alpine-gear"],
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<PlayerInventory[]>({
    queryKey: ["/api/alpine-gear/inventory"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/climbing/stats"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (gearId: number) => {
      const response = await fetch("/api/alpine-gear/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gearId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to purchase gear");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alpine-gear/inventory"] });
      toast({
        title: "Gear Purchased!",
        description: "New equipment added to your inventory",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isOwned = (gearId: number) => {
    return inventory.some((item) => item.gearId === gearId);
  };

  const canUnlock = (gear: AlpineGear) => {
    if (!stats) return false;
    return stats.climbingLevel >= gear.unlockLevel;
  };

  const tierColors: Record<string, string> = {
    basic: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    advanced: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    professional: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    elite: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };

  const categoryIcons: Record<string, string> = {
    boots: "👢",
    crampons: "⛏️",
    rope: "🪢",
    tent: "⛺",
    clothing: "🧥",
    safety: "🛡️",
    oxygen: "💨",
    ice_axe: "⚒️",
    harness: "🔗",
    backpack: "🎒",
    sleeping_bag: "🛏️",
    stove: "🔥",
    miscellaneous: "📦",
  };

  const categories = Array.from(new Set(allGear.map((g) => g.category)));

  if (gearLoading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-pulse text-lg">Loading Alpine Shop...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mountain className="w-8 h-8" />
              Alpine Shop
            </h1>
            <p className="text-muted-foreground">
              Equip yourself for the mountains ahead
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Climbing Level</div>
              <div className="text-2xl font-bold">{stats.climbingLevel}</div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <Card className="bg-card/40 backdrop-blur-sm border border-card-border shadow-lg topo-pattern">
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{inventory.length}</div>
                <div className="text-sm text-muted-foreground">Gear Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats?.summits || 0}</div>
                <div className="text-sm text-muted-foreground">Summits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--accent))]">{stats?.currentStreak || 0}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats?.totalXp || 0}</div>
                <div className="text-sm text-muted-foreground">Total XP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gear Categories */}
        {categories.map((category) => {
          const categoryGear = allGear.filter((g) => g.category === category);
          return (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 capitalize">
                <span className="text-3xl">{categoryIcons[category] || <Package />}</span>
                {category.replace(/_/g, " ")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryGear.map((gear) => {
                  const owned = isOwned(gear.id);
                  const unlocked = canUnlock(gear);

                  return (
                    <Card
                      key={gear.id}
                      className={`bg-card/40 backdrop-blur-sm border border-card-border shadow-lg topo-pattern transition-all ${
                        owned ? "ring-2 ring-green-500/50" : ""
                      } ${!unlocked && !owned ? "opacity-60" : ""}`}
                    >
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {gear.name}
                            {owned && <Check className="w-5 h-5 text-green-400" />}
                            {!owned && !unlocked && <Lock className="w-5 h-5 text-amber-400" />}
                          </CardTitle>
                          <Badge className={tierColors[gear.tier]} variant="outline">
                            {gear.tier}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {gear.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Weight:</span>
                          <span className="font-medium">{(gear.weightGrams / 1000).toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unlock Level:</span>
                          <span className={unlocked ? "text-green-400" : "text-amber-400"}>
                            Level {gear.unlockLevel}
                          </span>
                        </div>
                        {gear.unlockHabitCount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Habit Requirement:</span>
                            <span>{gear.unlockHabitCount} completed</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-bold text-amber-400">{gear.cost} tokens</span>
                        </div>

                        {owned ? (
                          <Button disabled className="w-full" variant="outline">
                            <Check className="w-4 h-4 mr-2" />
                            Owned
                          </Button>
                        ) : unlocked ? (
                          <Button
                            onClick={() => purchaseMutation.mutate(gear.id)}
                            disabled={purchaseMutation.isPending}
                            className="w-full bg-primary hover:bg-primary/90"
                          >
                            {purchaseMutation.isPending ? "Purchasing..." : `Buy for ${gear.cost} tokens`}
                          </Button>
                        ) : (
                          <Button disabled className="w-full" variant="outline">
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
