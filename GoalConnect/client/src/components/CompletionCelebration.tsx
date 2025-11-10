import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  angle: number;
  velocity: number;
  color: string;
}

interface CompletionCelebrationProps {
  show: boolean;
  tokensEarned: number;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

export function CompletionCelebration({
  show,
  tokensEarned,
  position,
  onComplete,
}: CompletionCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate particles
      const newParticles: Particle[] = [];
      const particleCount = 12;
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          angle: (360 / particleCount) * i,
          velocity: 50 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      setParticles(newParticles);

      // Trigger haptic feedback if available
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }

      // Call onComplete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      style={
        position
          ? {
              top: position.y,
              left: position.x,
              transform: "translate(-50%, -50%)",
            }
          : undefined
      }
    >
      <AnimatePresence>
        {/* Large checkmark animation */}
        <motion.div
          key="checkmark"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.3, 1], rotate: [0, 360] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl">
            <Check className="w-12 h-12 text-white stroke-[3]" />
          </div>
        </motion.div>

        {/* Particle burst */}
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const x = Math.cos(radians) * particle.velocity;
          const y = Math.sin(radians) * particle.velocity;

          return (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x,
                y,
                opacity: 0,
                scale: [1, 1.5, 0],
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          );
        })}

        {/* Tokens earned toast */}
        <motion.div
          key="toast"
          initial={{ y: 20, opacity: 0, scale: 0.8 }}
          animate={{ y: -60, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 300,
          }}
          className="absolute top-full mt-4"
        >
          <div className="bg-amber-500 text-white px-6 py-3 rounded-full shadow-xl font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span>+{tokensEarned} tokens!</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
