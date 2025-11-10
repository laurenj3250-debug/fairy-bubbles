import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface ComboStats {
  currentCombo: number;
  dailyHighScore: number;
  multiplier: number;
  expiresIn: number; // seconds until combo expires
}

export function ComboTracker() {
  const [showComboAlert, setShowComboAlert] = useState(false);
  const [previousCombo, setPreviousCombo] = useState(0);

  const { data: comboStats } = useQuery<ComboStats>({
    queryKey: ["/api/combo/stats"],
    refetchInterval: 1000, // Update every second for countdown
  });

  const currentCombo = comboStats?.currentCombo ?? 0;
  const multiplier = comboStats?.multiplier ?? 1.0;
  const expiresIn = comboStats?.expiresIn ?? 0;
  const dailyHigh = comboStats?.dailyHighScore ?? 0;

  // Detect combo increase and show alert
  useEffect(() => {
    if (currentCombo > previousCombo && currentCombo >= 2) {
      setShowComboAlert(true);
      setTimeout(() => setShowComboAlert(false), 2000);

      // Screen shake effect
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([50, 50, 50]);
      }
    }
    setPreviousCombo(currentCombo);
  }, [currentCombo, previousCombo]);

  // Don't show if no active combo
  if (currentCombo === 0) return null;

  const isExpiringSoon = expiresIn < 60; // Last minute

  return (
    <>
      {/* Combo widget */}
      <motion.div
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 50 }}
        className="fixed bottom-20 right-4 z-40"
      >
        <motion.div
          animate={
            isExpiringSoon
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(239, 68, 68, 0)",
                    "0 0 0 8px rgba(239, 68, 68, 0.4)",
                    "0 0 0 0 rgba(239, 68, 68, 0)",
                  ],
                }
              : {}
          }
          transition={
            isExpiringSoon
              ? { duration: 1, repeat: Infinity }
              : {}
          }
          className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl px-4 py-3 shadow-xl border-2 border-orange-300"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 animate-pulse" />
            <div>
              <div className="text-xs font-medium opacity-90">COMBO</div>
              <div className="text-2xl font-bold">{currentCombo}x</div>
              {multiplier > 1.0 && (
                <div className="text-xs opacity-90">
                  {multiplier.toFixed(1)}x tokens
                </div>
              )}
            </div>
          </div>

          {/* Timer bar */}
          {expiresIn > 0 && (
            <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: expiresIn, ease: "linear" }}
              />
            </div>
          )}

          {/* High score indicator */}
          {currentCombo >= dailyHigh && dailyHigh > 0 && (
            <div className="mt-1 text-xs text-center text-yellow-200 font-semibold">
              NEW RECORD!
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Combo alert (full screen) */}
      <AnimatePresence>
        {showComboAlert && (
          <motion.div
            key="combo-alert"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white px-8 py-6 rounded-3xl shadow-2xl border-4 border-yellow-300 text-center">
              <div className="text-4xl font-black mb-2 animate-pulse">
                {currentCombo}x COMBO!
              </div>
              <div className="text-xl font-bold">
                {multiplier.toFixed(1)}x Token Multiplier
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
