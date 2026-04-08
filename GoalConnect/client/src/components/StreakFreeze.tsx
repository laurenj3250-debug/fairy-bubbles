import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Coins } from "lucide-react";
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
        credentials: "include",
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
        description: "250 XP spent. Your streak is protected for 1 missed day.",
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
  const maxFreezes = 2;

  return (
    <div className="sd-shell" style={{ animationDelay: '0.7s' }}>
      <div className="sd-face" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 18, height: 18, color: 'var(--sd-text-accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sd-text-primary)', fontFamily: "'Cormorant Garamond', serif", textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              Streak Freeze
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--sd-text-muted)' }}>
            {freezeCount}/{maxFreezes}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {Array.from({ length: maxFreezes }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 'var(--sd-radius-md, 14px)',
                border: `1.5px solid ${i < freezeCount ? 'rgba(225,164,92,0.4)' : 'rgba(255,200,140,0.08)'}`,
                background: i < freezeCount
                  ? 'linear-gradient(145deg, rgba(225,164,92,0.2), rgba(200,131,73,0.1))'
                  : 'rgba(15,10,8,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: i < freezeCount ? '0 0 12px rgba(225,164,92,0.15)' : 'none',
              }}
            >
              <Shield
                style={{
                  width: 22,
                  height: 22,
                  color: i < freezeCount ? 'var(--sd-text-accent)' : 'rgba(169,130,106,0.25)',
                }}
              />
            </motion.div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--sd-text-muted)', lineHeight: 1.4, marginBottom: 10 }}>
          Protects your streak if you miss a day. Earn 1 per 7-day streak or buy with XP.
        </p>

        {freezeCount < maxFreezes && (
          <button
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 'var(--sd-radius-md, 14px)',
              border: '1px solid rgba(225,164,92,0.25)',
              background: 'linear-gradient(145deg, rgba(225,164,92,0.2), rgba(200,131,73,0.15))',
              color: 'var(--sd-text-accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: purchaseMutation.isPending ? 0.6 : 1,
            }}
          >
            <Coins style={{ width: 14, height: 14 }} />
            {purchaseMutation.isPending ? "Purchasing..." : "Buy Freeze (250 XP)"}
          </button>
        )}
      </div>
    </div>
  );
}
