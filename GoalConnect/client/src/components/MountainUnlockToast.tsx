import { motion, AnimatePresence } from "framer-motion";
import { Mountain, MapPin, TrendingUp, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface MountainUnlock {
  id: number;
  name: string;
  elevation: number;
  country: string;
  difficultyTier: string;
  requiredLevel: number;
  imageUrl?: string;
}

interface MountainUnlockToastProps {
  mountain: MountainUnlock | null;
  onClose: () => void;
  onViewMountain: () => void;
}

const tierColors: Record<string, string> = {
  novice: "bg-green-500/20 text-green-300 border-green-500/40",
  intermediate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  advanced: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  expert: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  elite: "bg-teal-500/20 text-teal-300 border-teal-500/40",
};

export function MountainUnlockToast({
  mountain,
  onClose,
  onViewMountain,
}: MountainUnlockToastProps) {
  if (!mountain) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-20 right-6 z-[9998] w-full max-w-md"
      >
        <div className="relative bg-card/95 backdrop-blur-md border-2 border-primary/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[hsl(var(--accent))]/10 animate-pulse" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-[hsl(var(--accent))]/30 flex items-center justify-center border-2 border-primary/40">
                  <Mountain className="w-8 h-8 text-primary" />
                </div>
              </motion.div>

              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Mountain Unlocked
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {mountain.name}
                  </h3>
                </motion.div>
              </div>
            </div>

            {/* Mountain Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 mb-4"
            >
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{mountain.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-semibold">
                    {mountain.elevation.toLocaleString()}m
                  </span>
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  className={cn("text-xs capitalize", tierColors[mountain.difficultyTier])}
                  variant="outline"
                >
                  {mountain.difficultyTier}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Level {mountain.requiredLevel}+ required
                </span>
              </div>

              {/* Atmospheric message */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                New terrain unlocked. Scout the route and prepare your gear for the ascent.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2"
            >
              <Button
                onClick={onViewMountain}
                className="flex-1 h-10 bg-gradient-to-r from-primary to-[hsl(var(--accent))] hover:from-primary/90 hover:to-[hsl(var(--accent))]/90 text-primary-foreground text-sm font-semibold"
              >
                <Mountain className="w-4 h-4 mr-2" />
                Plan Expedition
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="h-10 px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Later
              </Button>
            </motion.div>
          </div>

          {/* Decorative mountain silhouette */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,200 L200,80 L400,140 L600,40 L800,120 L1000,90 L1200,160 L1200,200 Z' fill='currentColor' /%3E%3C/svg%3E")`,
              backgroundSize: "cover",
              backgroundPosition: "bottom",
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
