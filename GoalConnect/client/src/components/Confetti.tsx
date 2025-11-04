import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Flame, Zap, Trophy, Star, Crown, Gem, Sparkles, Target, Award } from "lucide-react";
import * as Icons from "lucide-react";

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function Confetti({ active, onComplete, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const colors = [
        "#f87171", // red
        "#fb923c", // orange
        "#fbbf24", // yellow
        "#34d399", // green
        "#60a5fa", // blue
        "#a78bfa", // purple
        "#f472b6", // pink
      ];

      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 opacity-0"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  iconName?: string;
}

export function CelebrationModal({ open, onOpenChange, title, description, iconName = "sparkles" }: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
    }
  }, [open]);

  if (!open) return null;

  // Get the icon component
  const IconComponent = (Icons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Sparkles;

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />

        {/* Modal */}
        <div className="relative z-10 enchanted-card p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center">
            <div className="mb-6 inline-block glow-gold animate-bounce">
              <IconComponent className="w-24 h-24 text-lantern-warm" style={{ filter: 'drop-shadow(0 0 20px var(--lantern-warm))' }} />
            </div>
            <h2 className="text-3xl font-bold mb-3 enchanted-title text-enchanted">{title}</h2>
            <p className="text-lg text-muted-foreground mb-6">{description}</p>
            <button
              onClick={() => onOpenChange(false)}
              className="enchanted-button"
            >
              Wonderful!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
