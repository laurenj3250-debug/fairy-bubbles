import { motion } from "framer-motion";
import { useMemo } from "react";

interface AlpenglowOrbProps {
  progress: number; // 0-100
  label: string;
  size?: number;
  icon?: "mountain" | "iceaxe" | "carabiner" | "hold";
}

export function AlpenglowOrb({ progress, label, size = 100, icon }: AlpenglowOrbProps) {
  const p = Math.min(100, Math.max(0, progress));

  // Mist particles drifting upward
  const mist = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  // TRUE Alpenglow - vivid warm light on peaks
  const getColors = (progress: number) => {
    if (progress >= 90) return {
      primary: "#FFD700",    // Pure gold summit
      secondary: "#FFA500",
      glow: "rgba(255, 200, 0, 0.7)",
      accent: "#FFFACD",
      bg: "rgba(255, 215, 0, 0.25)"
    };
    if (progress >= 70) return {
      primary: "#FF6B35",    // Vivid orange alpenglow
      secondary: "#FF8C42",
      glow: "rgba(255, 107, 53, 0.6)",
      accent: "#FFE0D0",
      bg: "rgba(255, 107, 53, 0.2)"
    };
    if (progress >= 50) return {
      primary: "#FF4D6D",    // Hot pink alpenglow
      secondary: "#FF758F",
      glow: "rgba(255, 77, 109, 0.5)",
      accent: "#FFD6DE",
      bg: "rgba(255, 77, 109, 0.15)"
    };
    if (progress >= 25) return {
      primary: "#C77DFF",    // Magenta pre-glow
      secondary: "#E0AAFF",
      glow: "rgba(199, 125, 255, 0.45)",
      accent: "#F3E8FF",
      bg: "rgba(199, 125, 255, 0.12)"
    };
    return {
      primary: "#7B68EE",    // Deep violet dawn
      secondary: "#9683EC",
      glow: "rgba(123, 104, 238, 0.4)",
      accent: "#E8E4F8",
      bg: "rgba(123, 104, 238, 0.1)"
    };
  };

  const colors = getColors(p);
  const fillHeight = 100 - p;
  const isSummit = p >= 100;

  const clipId = `alpenglow-clip-${label.replace(/\s/g, '-')}`;
  const gradientId = `alpenglow-gradient-${label.replace(/\s/g, '-')}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={isSummit ? { scale: [1, 1.04, 1] } : {}}
        transition={isSummit ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
      >
        {/* Outer glow - INTENSE alpenglow */}
        <motion.div
          className="absolute inset-[-35%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, ${colors.glow.replace(')', ', 0.3)')} 40%, transparent 70%)`,
            filter: "blur(20px)",
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [0.9, 1.15, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary inner glow */}
        <motion.div
          className="absolute inset-[-15%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.primary}90 0%, transparent 60%)`,
            filter: "blur(12px)",
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Summit burst - golden rays at 100% */}
        {isSummit && (
          <motion.div
            className="absolute inset-[-30%] pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.3, 0.8],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: `conic-gradient(from 0deg, transparent, ${colors.glow}, transparent, ${colors.glow}, transparent)`,
              filter: "blur(8px)",
              borderRadius: "50%",
            }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="relative z-10"
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx="50" cy="50" r="44" />
            </clipPath>

            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={colors.secondary} stopOpacity="1" />
              <stop offset="50%" stopColor={colors.primary} stopOpacity="0.95" />
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.9" />
            </linearGradient>

            {/* Subtle noise texture */}
            <filter id={`noise-${label}`}>
              <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" in2="noise" mode="soft-light" />
            </filter>
          </defs>

          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />


          {/* Fill container */}
          <g clipPath={`url(#${clipId})`}>
            {/* Main liquid fill */}
            <motion.rect
              x="0"
              width="100"
              height="100"
              fill={`url(#${gradientId})`}
              initial={{ y: 100 }}
              animate={{ y: fillHeight }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Soft wave at surface */}
            <motion.ellipse
              cx="50"
              rx="55"
              ry="4"
              fill={colors.accent}
              opacity="0.5"
              initial={{ cy: 100 }}
              animate={{
                cy: fillHeight,
                rx: [55, 50, 55],
                ry: [4, 6, 4],
              }}
              transition={{
                cy: { duration: 1.5, ease: "easeOut" },
                rx: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                ry: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            />

            {/* Rising mist particles */}
            {mist.map((particle) => (
              <motion.circle
                key={particle.id}
                cx={particle.x}
                r={particle.size}
                fill={colors.accent}
                initial={{ cy: 100, opacity: 0 }}
                animate={{
                  cy: [100, fillHeight - 20, fillHeight - 40],
                  opacity: [0, particle.opacity, 0],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </g>

          {/* Climbing icon overlay - ON TOP of fill */}
          {icon && (
            <g opacity="0.4">
              {icon === "mountain" && (
                <path
                  d="M50 28 L68 68 L32 68 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
              {icon === "iceaxe" && (
                <>
                  <line x1="50" y1="25" x2="50" y2="70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M42 30 L50 22 L58 30" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M44 70 L50 76 L56 70" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {icon === "carabiner" && (
                <path
                  d="M42 32 Q32 32 32 45 L32 58 Q32 70 45 70 L55 70 Q68 70 68 58 L68 45 Q68 32 55 32 L52 32 M52 32 L52 42 M60 32 L60 38"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {icon === "hold" && (
                <ellipse cx="50" cy="50" rx="18" ry="14" fill="none" stroke="white" strokeWidth="2" transform="rotate(-15 50 50)" />
              )}
            </g>
          )}

          {/* Inner highlight - glass effect */}
          <ellipse
            cx="38"
            cy="32"
            rx="12"
            ry="8"
            fill="rgba(255,255,255,0.2)"
            transform="rotate(-20 38 32)"
          />

          {/* Subtle rim light */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Percentage */}
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="16"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            fill="white"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
          >
            {Math.round(p)}%
          </text>
        </svg>
      </motion.div>

      {/* Label */}
      <span
        className="text-xs font-semibold"
        style={{
          color: colors.primary,
          textShadow: `0 0 10px ${colors.glow}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
