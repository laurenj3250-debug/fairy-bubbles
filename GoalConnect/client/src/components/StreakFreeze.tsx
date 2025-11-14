import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Snowflake, Coins } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface StreakFreezeData {
  freezeCount: number;
  canEarn: boolean;
}

export function StreakFreeze() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: freezeData } = useQuery<StreakFreezeData>({
    queryKey: ["/api/streak-freezes"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/streak-freezes/purchase", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to purchase freeze");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Streak Freeze Purchased!",
        description: "You bought a streak freeze for 100 tokens",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streak-freezes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const freezeCount = freezeData?.freezeCount ?? 0;
  const maxFreezes = 3;

  return (
    <div className="card-ice-shelf p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-foreground">Streak Freezes</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {freezeCount}/{maxFreezes}
        </div>
      </div>

      <div className="space-y-3">
        {/* Freeze inventory */}
        <div className="flex gap-2">
          {Array.from({ length: maxFreezes }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex-1 h-16 rounded-xl border-2 flex items-center justify-center ${
                i < freezeCount
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-muted/30 border-muted-foreground/20"
              }`}
            >
              <Snowflake
                className={`w-8 h-8 ${
                  i < freezeCount ? "text-cyan-400" : "text-muted-foreground/30"
                }`}
              />
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Streak freezes auto-save your streak if you miss a day. Earn 1 per 7-day
          streak or purchase with tokens.
        </p>

        {/* Purchase button */}
        {freezeCount < maxFreezes && (
          <Button
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            size="sm"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Coins className="w-4 h-4 mr-2" />
            {purchaseMutation.isPending ? "Purchasing..." : "Buy Freeze (100 tokens)"}
          </Button>
        )}
      </div>
    </div>
  );
}
