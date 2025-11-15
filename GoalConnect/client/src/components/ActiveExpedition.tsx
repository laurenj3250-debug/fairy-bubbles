import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mountain, ArrowUp, Flag, AlertCircle } from "lucide-react";
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

      toast({
        title: "Day " + data.expedition.currentDay,
        description: data.message,
      });

      // Check if summit reached (this would redirect to complete endpoint)
      if (data.expedition.status === "completed") {
        toast({
          title: "🏔️ SUMMIT REACHED!",
          description: "You've reached the peak!",
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
    <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 border-2 border-primary/30 rounded-2xl p-6 shadow-lg mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
            <Mountain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Active Expedition</h3>
            <p className="text-sm text-muted-foreground">
              {activeExpedition.mountain_name} • {activeExpedition.route_name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Day</div>
          <div className="text-2xl font-bold text-primary">{activeExpedition.current_day || 0}</div>
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
      <div className="mb-4 bg-background/50 rounded-lg p-3">
        <EnergyBar
          currentEnergy={stats?.currentEnergy || 0}
          maxEnergy={stats?.maxEnergy || 100}
          showLabel={true}
        />
        {stats && stats.currentEnergy < 5 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span>Low energy! Complete habits or retreat.</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleAdvance}
          disabled={isAdvancing || advanceMutation.isPending || (stats?.currentEnergy || 0) < 5}
          className="flex-1"
        >
          {isAdvancing || advanceMutation.isPending ? (
            "Advancing..."
          ) : (
            <>
              <ArrowUp className="w-4 h-4 mr-2" />
              Continue Expedition (-5 energy)
            </>
          )}
        </Button>
        <Button
          onClick={handleRetreat}
          variant="outline"
          disabled={retreatMutation.isPending}
        >
          <Flag className="w-4 h-4 mr-2" />
          Retreat
        </Button>
      </div>
    </div>
  );
}
