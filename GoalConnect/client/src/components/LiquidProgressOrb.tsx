import { motion } from "framer-motion";
import { useMemo } from "react";

interface LiquidProgressOrbProps {
  progress: number; // 0-100
  label: string;
  size?: number;
}

export function LiquidProgressOrb({ progress, label, size = 100 }: LiquidProgressOrbProps) {
  // Clamp progress
  const p = Math.min(100, Math.max(0, progress));

  // Generate random bubbles
  const bubbles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // 20-80% across
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 4,
    }));
  }, []);

  // Color based on progress - cool to warm
  const getColor = (progress: number) => {
    if (progress >= 90) return { primary: "#FFD700", secondary: "#FFA500", glow: "#FFD70080" }; // Gold
    if (progress >= 70) return { primary: "#FF8C00", secondary: "#FF6B35", glow: "#FF8C0060" }; // Orange
    if (progress >= 50) return { primary: "#00CED1", secondary: "#20B2AA", glow: "#00CED150" }; // Teal
    return { primary: "#4169E1", secondary: "#6495ED", glow: "#4169E140" }; // Blue
  };

  const colors = getColor(p);
  const fillHeight = 100 - p; // SVG y-coordinate (inverted)
  const isComplete = p >= 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={isComplete ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={isComplete ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        {/* Glow layer */}
        <motion.div
          className="absolute inset-[-20%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            filter: "blur(10px)",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="relative z-10"
        >
          <defs>
            {/* Clip path for the circle */}
            <clipPath id={`circle-clip-${label}`}>
              <circle cx="50" cy="50" r="45" />
            </clipPath>

            {/* Liquid gradient */}
            <linearGradient id={`liquid-gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
            </linearGradient>

            {/* Glass effect gradient */}
            <linearGradient id={`glass-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background circle (empty state) */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />

          {/* Liquid container */}
          <g clipPath={`url(#circle-clip-${label})`}>
            {/* Main liquid body */}
            <motion.rect
              x="0"
              width="100"
              height="100"
              fill={`url(#liquid-gradient-${label})`}
              initial={{ y: 100 }}
              animate={{ y: fillHeight }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Wave 1 - front wave */}
            <motion.path
              d="M0,0 Q25,-8 50,0 T100,0 V10 H0 Z"
              fill={colors.primary}
              opacity="0.8"
              initial={{ y: 100 }}
              animate={{
                y: fillHeight - 5,
                d: [
                  "M0,0 Q25,-8 50,0 T100,0 V10 H0 Z",
                  "M0,0 Q25,8 50,0 T100,0 V10 H0 Z",
                  "M0,0 Q25,-8 50,0 T100,0 V10 H0 Z",
                ]
              }}
              transition={{
                y: { duration: 1, ease: "easeOut" },
                d: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Wave 2 - back wave (offset) */}
            <motion.path
              d="M0,0 Q25,6 50,0 T100,0 V10 H0 Z"
              fill={colors.secondary}
              opacity="0.5"
              initial={{ y: 100 }}
              animate={{
                y: fillHeight - 3,
                d: [
                  "M0,0 Q25,6 50,0 T100,0 V10 H0 Z",
                  "M0,0 Q25,-6 50,0 T100,0 V10 H0 Z",
                  "M0,0 Q25,6 50,0 T100,0 V10 H0 Z",
                ]
              }}
              transition={{
                y: { duration: 1, ease: "easeOut" },
                d: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
            />

            {/* Bubbles */}
            {bubbles.map((bubble) => (
              <motion.circle
                key={bubble.id}
                cx={bubble.x}
                r={bubble.size}
                fill="rgba(255,255,255,0.6)"
                initial={{ cy: 100, opacity: 0 }}
                animate={{
                  cy: [100, fillHeight - 10],
                  opacity: [0, 0.8, 0.8, 0],
                }}
                transition={{
                  duration: bubble.duration,
                  repeat: Infinity,
                  delay: bubble.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </g>

          {/* Glass reflection overlay */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill={`url(#glass-gradient-${label})`}
            pointerEvents="none"
          />

          {/* Highlight arc */}
          <path
            d="M30,25 Q50,15 70,25"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Percentage text */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="20"
            fontWeight="bold"
            fill="white"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            {Math.round(p)}%
          </text>
        </svg>
      </motion.div>

      {/* Label */}
      <span
        className="text-sm font-medium"
        style={{
          color: colors.primary,
          textShadow: `0 0 10px ${colors.glow}`
        }}
      >
        {label}
      </span>
    </div>
  );
}
