import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AbsurdComparisons } from '@/lib/absurdComparisons';

interface AbsurdFactsTickerProps {
  absurd: AbsurdComparisons;
  className?: string;
}

const FACT_CONFIG = [
  { key: 'elephantsLifted' as const, emoji: '🐘', label: 'worth of bodyweight lifted' },
  { key: 'eiffelTowers' as const, emoji: '🗼', label: 'of vertical climbed' },
  { key: 'officeEpisodes' as const, emoji: '📺', label: 'of The Office in climbing time' },
  { key: 'bananasOfEnergy' as const, emoji: '🍌', label: 'of energy burned' },
];

export function AbsurdFactsTicker({ absurd, className }: AbsurdFactsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FACT_CONFIG.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = FACT_CONFIG[currentIndex];
  const factData = absurd[current.key];

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 flex items-center justify-center bg-card/80 backdrop-blur-xl overflow-hidden relative",
      className
    )}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="flex items-center gap-4 text-center relative z-10"
        >
          <motion.span
            className="text-4xl"
            animate={{
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 0.6,
              delay: 0.2
            }}
          >
            {current.emoji}
          </motion.span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {factData.formatted}
            </span>
            <span className="text-sm text-muted-foreground">
              {current.label}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Fun facts navigation">
        {FACT_CONFIG.map((fact, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Show ${fact.label} fact`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentIndex
                ? "bg-purple-400 w-4"
                : "bg-white/20 w-1.5 hover:bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        key={`progress-${currentIndex}`}
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 4, ease: "linear" }}
      />
    </div>
  );
}
