import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LiftingAbsurdComparisons } from '@/lib/liftingAbsurdComparisons';

interface LiftingFactsTickerProps {
  absurd: LiftingAbsurdComparisons;
  className?: string;
}

const FACT_CONFIG = [
  { key: 'corollas' as const, emoji: '🚗', prefix: "You've lifted", suffix: "worth of weight" },
  { key: 'moonLift' as const, emoji: '🌙', prefix: "You could lift", suffix: "up there" },
  { key: 'goldenRetrievers' as const, emoji: '🐕', prefix: "That's", suffix: "of volume" },
  { key: 'catLaunches' as const, emoji: '🐱', prefix: "Your best lift could yeet", suffix: "" },
];

export function LiftingFactsTicker({ absurd, className }: LiftingFactsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FACT_CONFIG.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = FACT_CONFIG[currentIndex];
  const factData = absurd[current.key];

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 flex items-center justify-center bg-card/80 backdrop-blur-xl overflow-hidden relative",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-orange-500/5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-3 text-center relative z-10"
        >
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {current.emoji}
          </motion.span>
          <div className="flex items-baseline gap-2 flex-wrap justify-center">
            {current.prefix && (
              <span className="text-sm text-muted-foreground">{current.prefix}</span>
            )}
            <span className="text-xl font-bold text-white tracking-tight">
              {factData.formatted}
            </span>
            {current.suffix && (
              <span className="text-sm text-muted-foreground">{current.suffix}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {FACT_CONFIG.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentIndex ? "bg-purple-400 w-4" : "bg-white/20 w-1.5"
            )}
          />
        ))}
      </div>

      <motion.div
        key={`progress-${currentIndex}`}
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-orange-500"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </div>
  );
}
