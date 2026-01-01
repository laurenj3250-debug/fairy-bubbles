import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playCriticalSound, triggerHaptic } from '@/lib/sounds';
import confetti from 'canvas-confetti';

interface CriticalHitProps {
  show: boolean;
  multiplier: number;
  onComplete: () => void;
}

export function CriticalHit({ show, multiplier, onComplete }: CriticalHitProps) {
  useEffect(() => {
    if (show) {
      playCriticalSound();
      triggerHaptic('heavy');

      // Extra dramatic confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#FF1493'],
        startVelocity: 45,
      });

      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -2, 2, 0],
            }}
            transition={{ duration: 0.3, repeat: 2 }}
            className="text-center"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_0_30px_rgba(255,200,0,0.8)]"
              style={{
                textShadow: '0 0 40px rgba(255,200,0,0.6), 0 0 80px rgba(255,100,0,0.4)',
              }}
            >
              CRITICAL!
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-4xl font-bold text-yellow-300 mt-2"
            >
              {multiplier}x BONUS
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Random chance for critical hit (10%)
export function rollCritical(): { isCritical: boolean; multiplier: number } {
  const roll = Math.random();
  if (roll < 0.03) {
    return { isCritical: true, multiplier: 5 }; // 3% chance for 5x
  } else if (roll < 0.10) {
    return { isCritical: true, multiplier: 3 }; // 7% chance for 3x
  } else if (roll < 0.25) {
    return { isCritical: true, multiplier: 2 }; // 15% chance for 2x
  }
  return { isCritical: false, multiplier: 1 };
}
