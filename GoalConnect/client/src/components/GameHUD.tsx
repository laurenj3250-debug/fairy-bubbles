import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Target } from 'lucide-react';
import { playComboSound, triggerHaptic } from '@/lib/sounds';

interface GameHUDProps {
  completedToday: number;
  totalHabits: number;
  streak: number;
  points: number;
  lastCompletionTime: number | null; // timestamp of last completion
}

const COMBO_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function GameHUD({ completedToday, totalHabits, streak, points, lastCompletionTime }: GameHUDProps) {
  const [combo, setCombo] = useState(0);
  const [comboTimeLeft, setComboTimeLeft] = useState(0);
  const [showComboExpired, setShowComboExpired] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(completedToday);

  // Track completions and manage combo
  useEffect(() => {
    if (completedToday > prevCompleted) {
      // New completion!
      setCombo(c => c + 1);
      if (combo > 0) {
        playComboSound();
        triggerHaptic('light');
      }
    }
    setPrevCompleted(completedToday);
  }, [completedToday, prevCompleted, combo]);

  // Combo timer countdown
  useEffect(() => {
    if (!lastCompletionTime || combo === 0) {
      setComboTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastCompletionTime;
      const remaining = Math.max(0, COMBO_TIMEOUT_MS - elapsed);
      setComboTimeLeft(remaining);

      if (remaining === 0 && combo > 0) {
        setShowComboExpired(true);
        setCombo(0);
        setTimeout(() => setShowComboExpired(false), 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lastCompletionTime, combo]);

  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const comboMinutes = Math.floor(comboTimeLeft / 60000);
  const comboSeconds = Math.floor((comboTimeLeft % 60000) / 1000);

  // Multiplier based on combo
  const multiplier = combo >= 5 ? 3 : combo >= 3 ? 2 : combo >= 1 ? 1.5 : 1;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Main HUD Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/80 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-4 border border-white/10 shadow-2xl"
      >
        {/* Daily Progress */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 15 }}
            />
          </div>
          <span className="text-xs font-bold text-white/90 min-w-[40px]">
            {completedToday}/{totalHabits}
          </span>
        </div>

        <div className="w-px h-6 bg-white/20" />

        {/* Streak */}
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-300">{streak}</span>
        </div>

        <div className="w-px h-6 bg-white/20" />

        {/* Points */}
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-300">{points.toLocaleString()}</span>
        </div>
      </motion.div>

      {/* Combo Counter - only shows when active */}
      <AnimatePresence>
        {combo > 0 && comboTimeLeft > 0 && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg shadow-purple-500/30"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-2xl font-black text-white"
            >
              {combo}x
            </motion.div>
            <div className="text-white/90 text-xs">
              <div className="font-bold">COMBO</div>
              <div className="text-white/70">
                {comboMinutes}:{comboSeconds.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-xs text-white/80 bg-white/20 rounded px-2 py-0.5">
              {multiplier}x pts
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo Expired */}
      <AnimatePresence>
        {showComboExpired && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-red-500/90 text-white text-sm font-bold px-4 py-2 rounded-xl"
          >
            COMBO EXPIRED!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Quest Nudge - shows when close to completing */}
      <AnimatePresence>
        {completedToday > 0 && completedToday < totalHabits && totalHabits - completedToday <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg"
          >
            {totalHabits - completedToday === 1
              ? "Just 1 more for a perfect day!"
              : `Only ${totalHabits - completedToday} left!`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Perfect Day Celebration */}
      <AnimatePresence>
        {completedToday === totalHabits && totalHabits > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-sm px-4 py-2 rounded-xl shadow-lg shadow-orange-500/40"
          >
            PERFECT DAY!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
