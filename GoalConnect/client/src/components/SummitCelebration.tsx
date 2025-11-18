import { motion, AnimatePresence } from "framer-motion";
import { Mountain, Award, TrendingUp, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface SummitCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: {
    mountain: string;
    mountainId: number;
    elevation: number;
    xp: number;
    points: number;
    baseXP: number;
    basePoints: number;
    bonuses: string[];
    multiplier: number;
    backgroundUnlocked: boolean;
    themeUnlocked: boolean;
    daysCompleted: number;
    perfectDays: number;
    totalDays: number;
  };
}

export function SummitCelebration({ isOpen, onClose, rewards }: SummitCelebrationProps) {
  const [step, setStep] = useState<'summit' | 'rewards' | 'done'>('summit');

  useEffect(() => {
    if (isOpen) {
      // Reset to summit step
      setStep('summit');

      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Auto-advance to rewards after 3 seconds
      const timer = setTimeout(() => {
        setStep('rewards');
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getBonusLabel = (bonus: string) => {
    switch (bonus) {
      case 'speed': return 'First Attempt';
      case 'perfection': return 'Perfect Completion';
      case 'streak': return 'Streak Maintained';
      default: return bonus;
    }
  };

  const getBonusEmoji = (bonus: string) => {
    switch (bonus) {
      case 'speed': return '⚡';
      case 'perfection': return '💎';
      case 'streak': return '🔥';
      default: return '⭐';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={step === 'done' ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Summit Animation Step */}
            {step === 'summit' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  className="inline-block mb-6"
                >
                  <Mountain className="w-24 h-24 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-bold text-white mb-4"
                >
                  ✨ SUMMIT! ✨
                </motion.h1>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-3xl font-bold text-white/90 mb-2"
                >
                  {rewards.mountain}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl text-white/80"
                >
                  {rewards.elevation.toLocaleString()}m CONQUERED!
                </motion.p>
              </motion.div>
            )}

            {/* Rewards Reveal Step */}
            {step === 'rewards' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-3xl p-8 shadow-2xl"
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Summit Rewards</h2>
                  <p className="text-muted-foreground">
                    After {rewards.daysCompleted} days of dedication, you've reached the summit of {rewards.mountain}!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rewards.perfectDays} perfect days • Summited: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Rewards Grid */}
                <div className="space-y-4">
                  {/* XP and Points */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-2xl"
                  >
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <div className="font-bold text-lg">+{rewards.xp} XP</div>
                      <div className="text-sm text-muted-foreground">Climbing Experience Earned</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 p-4 bg-accent/10 border border-accent/30 rounded-2xl"
                  >
                    <Sparkles className="w-8 h-8 text-accent" />
                    <div className="flex-1">
                      <div className="font-bold text-lg">+{rewards.points} Points</div>
                      <div className="text-sm text-muted-foreground">Alpine Shop Currency</div>
                    </div>
                  </motion.div>

                  {/* Background Unlocked */}
                  {rewards.backgroundUnlocked && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-4 p-4 bg-secondary/10 border border-secondary/30 rounded-2xl"
                    >
                      <Mountain className="w-8 h-8 text-secondary" />
                      <div className="flex-1">
                        <div className="font-bold text-lg">{rewards.mountain} Background Unlocked!</div>
                        <div className="text-sm text-muted-foreground">Available in Settings → Backgrounds</div>
                      </div>
                    </motion.div>
                  )}

                  {/* Bonuses */}
                  {rewards.bonuses.length > 0 && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-6 h-6 text-amber-500" />
                        <div className="font-bold text-lg">Bonus Achievements!</div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {rewards.bonuses.map((bonus, idx) => (
                          <motion.div
                            key={bonus}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-xl">{getBonusEmoji(bonus)}</span>
                            <span className="font-medium">{getBonusLabel(bonus)}</span>
                            <span className="text-amber-500 ml-auto">+25% rewards</span>
                          </motion.div>
                        ))}
                      </div>
                      {rewards.bonuses.length === 3 && (
                        <div className="mt-3 pt-3 border-t border-amber-500/30 text-center">
                          <span className="text-amber-500 font-bold text-lg">🏆 LEGENDARY SUMMIT! 2x Total Rewards!</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Continue Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="w-full mt-6 px-6 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-white hover:shadow-xl transition-all"
                >
                  Continue Climbing
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
