import { motion, AnimatePresence } from "framer-motion";
import { X, Mountain, Award, TrendingUp, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  newGrade: string;
  mountainsUnlocked: string[];
  gearUnlocked: string[];
  tokensEarned: number;
}

interface LevelUpModalProps {
  data: LevelUpData | null;
  onClose: () => void;
}

export function LevelUpModal({ data, onClose }: LevelUpModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [showUnlocks, setShowUnlocks] = useState(false);

  useEffect(() => {
    if (data) {
      // Delay content reveal for dramatic effect
      setTimeout(() => setShowContent(true), 500);
      setTimeout(() => setShowUnlocks(true), 1200);
    }
  }, [data]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop with animated gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black/90 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Summit background image (optional) */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,600 L200,200 L400,350 L600,100 L800,280 L1000,200 L1200,400 L1200,600 Z' fill='url(%23gradient)' /%3E%3Cdefs%3E%3ClinearGradient id='gradient' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2346B3A9;stop-opacity:0.3' /%3E%3Cstop offset='100%25' style='stop-color:%230F2540;stop-opacity:0.1' /%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4 bg-card/95 backdrop-blur-md border-2 border-primary/50 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Particle effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/40 rounded-full"
                initial={{
                  x: "50%",
                  y: "50%",
                  opacity: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Level Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: showContent ? 1 : 0, rotate: 0 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-[hsl(var(--accent))] to-orange-400 flex items-center justify-center shadow-xl">
                  <div className="w-28 h-28 rounded-full bg-card flex items-center justify-center">
                    <Mountain className="w-16 h-16 text-primary" />
                  </div>
                </div>
                {/* Glow effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-primary/30 blur-2xl -z-10"
                />
              </div>
            </motion.div>

            {/* Level Up Text */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 mb-6"
                >
                  <h2 className="text-4xl font-bold text-foreground tracking-tight">
                    Level Up!
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-muted-foreground">
                    <span className="text-3xl font-bold opacity-50">
                      {data.oldLevel}
                    </span>
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <span className="text-5xl font-bold text-primary">
                      {data.newLevel}
                    </span>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    New climbing grade:{" "}
                    <span className="font-bold text-primary">{data.newGrade}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rewards Section */}
            <AnimatePresence>
              {showUnlocks && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-border/50" />
                    <Award className="w-5 h-5 text-primary" />
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  {/* Unlocks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Token Reward */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.4 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
                    >
                      <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">
                        +{data.tokensEarned}
                      </div>
                      <div className="text-xs text-muted-foreground">Tokens</div>
                    </motion.div>

                    {/* Mountains Unlocked */}
                    {data.mountainsUnlocked.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.5 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 border border-[hsl(var(--accent))]/30"
                      >
                        <Mountain className="w-8 h-8 text-[hsl(var(--accent))] mx-auto mb-2" />
                        <div className="text-2xl font-bold text-[hsl(var(--accent))]">
                          {data.mountainsUnlocked.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.mountainsUnlocked.length === 1 ? "Mountain" : "Mountains"}
                        </div>
                      </motion.div>
                    )}

                    {/* Gear Unlocked */}
                    {data.gearUnlocked.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.6 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30"
                      >
                        <div className="text-2xl mx-auto mb-2">⛏️</div>
                        <div className="text-2xl font-bold text-orange-400">
                          {data.gearUnlocked.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Gear Items</div>
                      </motion.div>
                    )}
                  </div>

                  {/* Mountain Names */}
                  {data.mountainsUnlocked.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/10 rounded-lg">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        New Mountains Available:
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {data.mountainsUnlocked.map((mountain, i) => (
                          <motion.span
                            key={mountain}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            className="px-3 py-1 bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] text-xs font-semibold rounded-full border border-[hsl(var(--accent))]/30"
                          >
                            {mountain}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Call to Action */}
                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={() => window.location.href = "/world-map"}
                      className="flex-1 h-12 bg-gradient-to-r from-primary to-[hsl(var(--accent))] hover:from-primary/90 hover:to-[hsl(var(--accent))]/90 text-primary-foreground font-semibold"
                    >
                      <Mountain className="w-5 h-5 mr-2" />
                      Explore Mountains
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1 h-12 border-2 border-card-border hover:bg-muted/10"
                    >
                      Continue Climbing
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
