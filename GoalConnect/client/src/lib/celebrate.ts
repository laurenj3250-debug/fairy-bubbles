/**
 * Unified feedback utility for XP-earning actions.
 * One function call = sound + haptic + toast. Keeps feedback consistent.
 */

import { toast } from "@/hooks/use-toast";
import { playCompleteSound, triggerHaptic } from "@/lib/sounds";
import { queryClient } from "@/lib/queryClient";

/**
 * Celebrate an XP-earning action with sound + haptic + toast.
 * Also invalidates points queries so the header counter updates.
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
