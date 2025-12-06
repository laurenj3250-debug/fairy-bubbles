import { motion } from "framer-motion";
import { useMemo } from "react";

interface SummitPillProps {
  progress: number;
  label: string;
  width?: number;
}

export function SummitPill({ progress, label, width = 100 }: SummitPillProps) {
  const p = Math.min(100, Math.max(0, progress));
  const height = 24; // Fixed skinny height

  // Snowflakes drifting down
  const snowflakes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 2,
      size: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 20,
    }));
  }, []);

  // Altitude-based colors
  const getColors = (progress: number) => {
    if (progress >= 90) return {
      fill: "#FFD700",
      glow: "rgba(255, 215, 0, 0.6)",
      text: "#FFD700",
      snow: "rgba(255,255,255,0.9)"
    };
    if (progress >= 70) return {
      fill: "#FF7F50",
      glow: "rgba(255, 127, 80, 0.5)",
      text: "#FF7F50",
      snow: "rgba(255,255,255,0.8)"
    };
    if (progress >= 50) return {
      fill: "#20B2AA",
      glow: "rgba(32, 178, 170, 0.4)",
      text: "#20B2AA",
      snow: "rgba(255,255,255,0.7)"
    };
    return {
      fill: "#6495ED",
      glow: "rgba(100, 149, 237, 0.35)",
      text: "#6495ED",
      snow: "rgba(255,255,255,0.6)"
    };
  };

  const colors = getColors(p);
  const fillWidth = (p / 100) * 100; // percentage of width to fill
  const isSummit = p >= 100;

  const uniqueId = label ? label.replace(/\s/g, '-') : Math.random().toString(36).slice(2, 8);
  const clipId = `pill-clip-${uniqueId}`;
  const gradientId = `pill-gradient-${uniqueId}`;

  return (
    <div className={`flex flex-col items-center ${label ? 'gap-1.5' : ''}`}>
      <motion.div
        className="relative"
        style={{ width, height }}
        animate={isSummit ? { scale: [1, 1.02, 1] } : {}}
        transition={isSummit ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
      >
        {/* Glow */}
        <motion.div
          className="absolute inset-[-20%] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${colors.glow} 0%, transparent 70%)`,
            filter: "blur(12px)",
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <svg
          width={width}
          height={height}
          viewBox="0 0 100 45"
          className="relative z-10"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="2" y="2" width="96" height="41" rx="20" ry="20" />
            </clipPath>

            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.fill} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colors.fill} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Pill outline */}
          <rect
            x="2"
            y="2"
            width="96"
            height="41"
            rx="20"
            ry="20"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />

          {/* Fill container */}
          <g clipPath={`url(#${clipId})`}>
            {/* Liquid fill from left */}
            <motion.rect
              x="0"
              y="0"
              height="50"
              fill={`url(#${gradientId})`}
              initial={{ width: 0 }}
              animate={{ width: fillWidth }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Wave edge on the fill */}
            <motion.ellipse
              cy="22.5"
              rx="4"
              ry="22"
              fill={colors.fill}
              opacity="0.6"
              initial={{ cx: 0 }}
              animate={{
                cx: fillWidth,
                ry: [22, 18, 22]
              }}
              transition={{
                cx: { duration: 1.2, ease: "easeOut" },
                ry: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Falling snowflakes */}
            {snowflakes.map((flake) => (
              <motion.circle
                key={flake.id}
                r={flake.size}
                fill={colors.snow}
                initial={{ cx: flake.x, cy: -5, opacity: 0 }}
                animate={{
                  cy: [-5, 50],
                  cx: [flake.x, flake.x + flake.drift],
                  opacity: [0, 0.8, 0.8, 0],
                }}
                transition={{
                  duration: flake.duration,
                  repeat: Infinity,
                  delay: flake.delay,
                  ease: "linear",
                }}
              />
            ))}

            {/* Tiny mountain silhouette at bottom */}
            <path
              d="M0,45 L15,30 L25,38 L40,25 L55,35 L70,28 L85,38 L100,32 L100,45 Z"
              fill="rgba(255,255,255,0.1)"
            />
          </g>

          {/* Highlight */}
          <ellipse
            cx="30"
            cy="12"
            rx="20"
            ry="5"
            fill="rgba(255,255,255,0.15)"
          />

          {/* Percentage text */}
          <text
            x="50"
            y="27"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            fill="white"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
          >
            {Math.round(p)}%
          </text>
        </svg>
      </motion.div>

      {/* Label - only show if provided */}
      {label && (
        <span
          className="text-xs font-semibold"
          style={{ color: colors.text }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
