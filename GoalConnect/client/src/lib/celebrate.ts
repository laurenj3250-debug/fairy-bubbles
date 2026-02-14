/**
 * Unified feedback utility for XP-earning actions.
 * One function call = sound + haptic + toast + points refresh.
 */

import { toast } from "@/hooks/use-toast";
import { playCompleteSound, triggerHaptic } from "@/lib/sounds";
import { queryClient } from "@/lib/queryClient";

/**
 * Celebrate an XP-earning action with sound + haptic + toast.
 * Invalidates points queries so header XP counter stays fresh.
 */
export function celebrateXpEarned(
  amount: number,
  description: string,
) {
  playCompleteSound();
  triggerHaptic("light");

  toast({
    title: `+${amount} XP`,
    description,
  });

  // Refresh points display in header
  queryClient.invalidateQueries({ queryKey: ["/api/points"] });
}
