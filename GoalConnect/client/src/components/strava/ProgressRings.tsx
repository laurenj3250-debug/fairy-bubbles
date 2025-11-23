import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface Ring {
  id: string;
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: "red" | "green" | "blue" | "orange";
}

interface ProgressRingsProps {
  rings: Ring[];
  showLegend?: boolean;
  size?: "sm" | "md" | "lg";
  onComplete?: () => void;
}

const colorMap = {
  red: {
    stroke: "#ef4444",
    glow: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))",
    text: "text-red-500",
    bg: "bg-red-500",
  },
  green: {
    stroke: "#22c55e",
    glow: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))",
    text: "text-green-500",
    bg: "bg-green-500",
  },
  blue: {
    stroke: "#3b82f6",
    glow: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))",
    text: "text-blue-500",
    bg: "bg-blue-500",
  },
  orange: {
    stroke: "#f97316",
    glow: "drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))",
    text: "text-orange-500",
    bg: "bg-orange-500",
  },
};

const sizeMap = {
  sm: { width: 160, strokeWidth: 8, gap: 12 },
  md: { width: 220, strokeWidth: 12, gap: 16 },
  lg: { width: 280, strokeWidth: 16, gap: 20 },
};

function SingleRing({
  percentage,
  color,
  radius,
  strokeWidth,
  delay,
}: {
  percentage: number;
  color: keyof typeof colorMap;
  radius: number;
  strokeWidth: number;
  delay: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const cappedPercentage = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (cappedPercentage / 100) * circumference;
  const isComplete = percentage >= 100;

  return (
    <>
      {/* Track */}
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      {/* Progress */}
      <motion.circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={colorMap[color].stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{
          filter: isComplete ? colorMap[color].glow : "none",
          transform: "rotate(-90deg)",
          transformOrigin: "center",
        }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </>
  );
}

export function ProgressRings({
  rings,
  showLegend = true,
  size = "md",
  onComplete,
}: ProgressRingsProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const { width, strokeWidth, gap } = sizeMap[size];
  const center = width / 2;

  // Calculate if all rings are complete
  const allComplete = rings.every((ring) => ring.current >= ring.goal);

  // Fire confetti when all complete
  useEffect(() => {
    if (allComplete && !hasAnimated) {
      setHasAnimated(true);
      // Delay confetti to let ring animations complete
      const timer = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: rings.map((r) => colorMap[r.color].stroke),
        });
        onComplete?.();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [allComplete, hasAnimated, onComplete, rings]);

  // Calculate ring radii (outer to inner)
  const radii = rings.map((_, index) => {
    return center - strokeWidth / 2 - index * (strokeWidth + gap);
  });

  // Primary stat to show in center (first ring)
  const primaryRing = rings[0];
  const primaryPercentage = Math.round((primaryRing.current / primaryRing.goal) * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Rings SVG */}
      <div className="relative" style={{ width, height: width }}>
        <svg width={width} height={width} className="transform">
          {rings.map((ring, index) => {
            const percentage = (ring.current / ring.goal) * 100;
            return (
              <SingleRing
                key={ring.id}
                percentage={percentage}
                color={ring.color}
                radius={radii[index]}
                strokeWidth={strokeWidth}
                delay={index * 0.1}
              />
            );
          })}
        </svg>

        {/* Center Stats */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {primaryPercentage}%
          </motion.span>
          <span className="text-sm text-muted-foreground">{primaryRing.label}</span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4">
          {rings.map((ring) => {
            const percentage = Math.round((ring.current / ring.goal) * 100);
            const isComplete = ring.current >= ring.goal;
            return (
              <div key={ring.id} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", colorMap[ring.color].bg)} />
                <span className="text-sm">
                  <span className={cn("font-medium", isComplete && "text-green-500")}>
                    {ring.current}
                  </span>
                  <span className="text-muted-foreground">
                    /{ring.goal} {ring.unit}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
