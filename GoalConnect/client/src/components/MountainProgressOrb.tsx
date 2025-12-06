import { motion } from "framer-motion";
import { useMemo } from "react";

interface MountainProgressOrbProps {
  progress: number; // 0-100
  label: string;
  size?: number;
}

export function MountainProgressOrb({ progress, label, size = 100 }: MountainProgressOrbProps) {
  // Clamp progress
  const p = Math.min(100, Math.max(0, progress));

  // Generate snow particles
  const snowflakes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 2,
      size: 1 + Math.random() * 2,
    }));
  }, []);

  // Color based on progress - altitude colors
  const getColor = (progress: number) => {
    if (progress >= 90) return { primary: "#FFD700", secondary: "#FFA500", glow: "#FFD70080", snow: "#FFFFFF" }; // Summit gold
    if (progress >= 70) return { primary: "#FF6B35", secondary: "#FF8C00", glow: "#FF6B3560", snow: "#FFF5E6" }; // Alpine glow
    if (progress >= 50) return { primary: "#4ECDC4", secondary: "#26A69A", glow: "#4ECDC450", snow: "#E0F7FA" }; // Mid-altitude teal
    return { primary: "#5C6BC0", secondary: "#3F51B5", glow: "#5C6BC040", snow: "#E8EAF6" }; // Base camp blue
  };

  const colors = getColor(p);
  const fillHeight = 100 - p; // SVG y-coordinate (inverted)
  const isSummit = p >= 100;

  // Mountain path points - creates a peak shape
  const mountainPath = "M50,10 L85,90 L15,90 Z"; // Simple triangle peak
  const mountainClipId = `mountain-clip-${label.replace(/\s/g, '-')}`;
  const gradientId = `mountain-gradient-${label.replace(/\s/g, '-')}`;
  const snowGradientId = `snow-gradient-${label.replace(/\s/g, '-')}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={isSummit ? {
          scale: [1, 1.08, 1],
        } : {}}
        transition={isSummit ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        {/* Glow layer */}
        <motion.div
          className="absolute inset-[-15%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            filter: "blur(12px)",
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [0.95, 1.1, 0.95],
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
            {/* Clip path for mountain shape */}
            <clipPath id={mountainClipId}>
              <path d={mountainPath} />
            </clipPath>

            {/* Gradient for filled area */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.95" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
            </linearGradient>

            {/* Snow cap gradient */}
            <linearGradient id={snowGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor={colors.snow} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Mountain outline (empty state) */}
          <path
            d={mountainPath}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Filled progress area */}
          <g clipPath={`url(#${mountainClipId})`}>
            {/* Main fill */}
            <motion.rect
              x="0"
              width="100"
              height="100"
              fill={`url(#${gradientId})`}
              initial={{ y: 100 }}
              animate={{ y: fillHeight }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Wave effect at fill line */}
            <motion.path
              d="M0,0 Q25,-6 50,0 T100,0 V8 H0 Z"
              fill={colors.primary}
              opacity="0.7"
              initial={{ y: 100 }}
              animate={{
                y: fillHeight - 4,
                d: [
                  "M0,0 Q25,-6 50,0 T100,0 V8 H0 Z",
                  "M0,0 Q25,6 50,0 T100,0 V8 H0 Z",
                  "M0,0 Q25,-6 50,0 T100,0 V8 H0 Z",
                ]
              }}
              transition={{
                y: { duration: 1.2, ease: "easeOut" },
                d: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Rising particles (like mist/snow) */}
            {snowflakes.map((flake) => (
              <motion.circle
                key={flake.id}
                cx={flake.x}
                r={flake.size}
                fill="rgba(255,255,255,0.7)"
                initial={{ cy: 95, opacity: 0 }}
                animate={{
                  cy: [95, fillHeight - 5],
                  opacity: [0, 0.8, 0.6, 0],
                }}
                transition={{
                  duration: flake.duration,
                  repeat: Infinity,
                  delay: flake.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </g>

          {/* Snow cap at peak (always visible, glows when progress high) */}
          <motion.path
            d="M50,10 L62,35 L38,35 Z"
            fill={`url(#${snowGradientId})`}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: p >= 80 ? [0.8, 1, 0.8] : 0.4,
              filter: p >= 90 ? "drop-shadow(0 0 8px white)" : "none"
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Ridge lines for mountain texture */}
          <path
            d="M50,10 L50,90"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M35,50 L50,10 L65,50"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            fill="none"
          />

          {/* Summit flag when complete */}
          {isSummit && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {/* Flag pole */}
              <line x1="50" y1="10" x2="50" y2="0" stroke="white" strokeWidth="1.5" />
              {/* Flag */}
              <motion.path
                d="M50,0 L62,4 L50,8 Z"
                fill="#FFD700"
                animate={{
                  d: [
                    "M50,0 L62,4 L50,8 Z",
                    "M50,0 L60,5 L50,8 Z",
                    "M50,0 L62,4 L50,8 Z",
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          )}

          {/* Percentage text */}
          <text
            x="50"
            y="65"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="white"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
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
