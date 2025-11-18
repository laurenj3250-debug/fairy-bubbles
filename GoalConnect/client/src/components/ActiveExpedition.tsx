import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mountain, ArrowUp, Flag, AlertCircle, Unlock, Trophy, Palette } from "lucide-react";
import { useState } from "react";
import EnergyBar from "./EnergyBar";
import { useToast } from "@/hooks/use-toast";

interface Expedition {
  id: number;
  currentDay: number;
  currentProgress: number;
  currentAltitude: number;
  energySpent: number;
  status: string;
}

interface ExpeditionDetails {
  expedition: Expedition;
  mountain: {
    id: number;
    name: string;
    elevation: number;
    tier: string;
  };
  route: {
    id: number;
    name: string;
    estimatedDays: number;
    elevationGain: number;
  };
}

interface ClimbingStats {
  currentEnergy: number;
  maxEnergy: number;
}

export default function ActiveExpedition() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Get active expedition
  const { data: expeditions = [] } = useQuery<any[]>({
    queryKey: ["/api/expeditions"],
  });

  const activeExpedition = expeditions.find((exp: any) => exp.status === "in_progress");

  // Get climbing stats for energy
  const { data: stats } = useQuery<ClimbingStats>({
    queryKey: ["/api/climbing/stats"],
  });

  // Advance mutation
  const advanceMutation = useMutation({
    mutationFn: async (expeditionId: number) => {
      const response = await fetch(`/api/expeditions/${expeditionId}/advance`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to advance expedition");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Refetch expeditions and stats
      queryClient.invalidateQueries({ queryKey: ["/api/expeditions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/climbing/stats"] });

      // Check if summit reached (this would have redirected to complete endpoint)
      if (data.success && data.expedition?.status === "completed") {
        // Summit reached!
        toast({
          title: "🏔️ SUMMIT REACHED!",
          description: `${data.mountain.name} - ${data.mountain.elevation.toLocaleString()}m`,
        });

        // Show mountain unlocks if any
        if (data.unlockedMountains && data.unlockedMountains.length > 0) {
          data.unlockedMountains.forEach((mountain: any, index: number) => {
            setTimeout(() => {
              toast({
                title: "🔓 Mountain Unlocked!",
                description: `${mountain.name} - ${mountain.elevation.toLocaleString()}m • ${mountain.tier}`,
                duration: 6000,
              });
            }, 1500 + (index * 500));
          });
        }

        // Show achievements if any
        if (data.newAchievements && data.newAchievements.length > 0) {
          data.newAchievements.forEach((achievement: any, index: number) => {
            setTimeout(() => {
              toast({
                title: "🏆 Achievement Unlocked!",
                description: `${achievement.name}: ${achievement.description}`,
                duration: 6000,
              });
            }, 2000 + (data.unlockedMountains?.length || 0) * 500 + (index * 500));
          });
        }

        // Show mountain background unlock (most important - last toast)
        if (data.mountainBackground) {
          const baseDelay = 2000 + (data.unlockedMountains?.length || 0) * 500 + (data.newAchievements?.length || 0) * 500;
          setTimeout(() => {
            toast({
              title: "🎨 Mountain Theme Unlocked!",
              description: `${data.mountainBackground.name} Theme - New background and color scheme available in Settings`,
              duration: 8000,
            });
          }, baseDelay + 500);
        }
      } else {
        // Normal day advancement
        toast({
          title: "Day " + data.expedition.currentDay,
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Cannot Advance",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsAdvancing(false);
    },
  });

  // Retreat mutation
  const retreatMutation = useMutation({
    mutationFn: async (expeditionId: number) => {
      const response = await fetch(`/api/expeditions/${expeditionId}/retreat`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to retreat");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expeditions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/climbing/stats"] });

      toast({
        title: "Expedition Ended",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!activeExpedition) {
    return null;
  }

  const handleAdvance = () => {
    setIsAdvancing(true);
    advanceMutation.mutate(activeExpedition.id);
  };

  const handleRetreat = () => {
    if (confirm("Are you sure you want to retreat? You'll receive 50% energy refund and partial XP.")) {
      retreatMutation.mutate(activeExpedition.id);
    }
  };

  // Calculate camp
  const progress = activeExpedition.current_progress || 0;
  const camp = Math.floor(progress / 25);
  const campNames = ["Basecamp", "Camp 1", "Camp 2", "Camp 3", "Summit Push"];

  return (
    <div className="bg-background/40 backdrop-blur-xl border-2 border-foreground/10 rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
              }}
            >
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Active Expedition</h3>
              <p className="text-sm text-foreground/70">
                {activeExpedition.mountain_name} • {activeExpedition.route_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-foreground/60">Day</div>
            <div className="text-2xl font-bold text-foreground">{activeExpedition.current_day || 0}</div>
          </div>
        </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{campNames[camp]}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0m</span>
          <span>{activeExpedition.current_altitude || 0}m</span>
          <span>{activeExpedition.elevation}m</span>
        </div>
      </div>

        {/* Energy Display */}
        <div className="mb-4 bg-background/60 backdrop-blur-md border border-foreground/10 rounded-2xl p-3 shadow-md">
          <EnergyBar
            currentEnergy={stats?.currentEnergy || 0}
            maxEnergy={stats?.maxEnergy || 100}
            showLabel={true}
          />
          {stats && stats.currentEnergy < 5 && (
            <div
              className="flex items-center gap-2 mt-2 text-xs"
              style={{ color: 'hsl(25 100% 50%)' }}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Low energy! Complete habits or retreat.</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAdvance}
            disabled={isAdvancing || advanceMutation.isPending || (stats?.currentEnergy || 0) < 5}
            className={`
              flex-1 px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2
              transition-all shadow-lg hover:shadow-xl text-white
              ${(isAdvancing || advanceMutation.isPending || (stats?.currentEnergy || 0) < 5) ? "opacity-40 cursor-not-allowed" : ""}
            `}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
            }}
          >
            {isAdvancing || advanceMutation.isPending ? (
              "Advancing..."
            ) : (
              <>
                <ArrowUp className="w-4 h-4" />
                Continue Expedition (-5 energy)
              </>
            )}
          </button>
          <button
            onClick={handleRetreat}
            disabled={retreatMutation.isPending}
            className="px-4 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-background/60 backdrop-blur-md border border-foreground/10 text-foreground hover:bg-background/80 transition-all shadow-md"
          >
            <Flag className="w-4 h-4" />
            Retreat
          </button>
        </div>
      </div>
    </div>
  );
}
