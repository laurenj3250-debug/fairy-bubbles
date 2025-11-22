import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain } from "lucide-react";
import { Link } from "wouter";

interface Goal {
  id: number;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

// Match the habits orbs color palette - ULTRA GLOW
const ROUTE_COLORS = [
  { trail: "#4ECDC4", bright: "#7FFFEF", glow: "#4ECDC4", bg: "rgba(78, 205, 196, 0.2)" },
  { trail: "#FF6B6B", bright: "#FF9999", glow: "#FF6B6B", bg: "rgba(255, 107, 107, 0.2)" },
  { trail: "#A855F7", bright: "#D08FFF", glow: "#A855F7", bg: "rgba(168, 85, 247, 0.2)" },
  { trail: "#FBBF24", bright: "#FFD966", glow: "#FBBF24", bg: "rgba(251, 191, 36, 0.2)" },
];

// Cubic bezier interpolation
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
}

// Get point along the elevation curve at a given progress (0-1)
function getPointOnCurve(index: number, progress: number, width: number, height: number) {
  const baseY = height * 0.85;
  const peakY = height * 0.12;

  // Define control points for each curve profile
  const profiles = [
    // Profile 0: Steep initial, gradual summit
    [
      { x: 0, y: baseY },
      { x: width * 0.2, y: baseY },
      { x: width * 0.3, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.3 },
      { x: width * 0.7, y: height * 0.18 },
      { x: width * 0.85, y: peakY },
      { x: width, y: peakY },
    ],
    // Profile 1: Gradual with false summit
    [
      { x: 0, y: baseY },
      { x: width * 0.25, y: height * 0.65 },
      { x: width * 0.4, y: height * 0.4 },
      { x: width * 0.55, y: height * 0.45 },
      { x: width * 0.7, y: height * 0.35 },
      { x: width * 0.85, y: peakY + 5 },
      { x: width, y: peakY },
    ],
    // Profile 2: Steady climb
    [
      { x: 0, y: baseY },
      { x: width * 0.3, y: height * 0.6 },
      { x: width * 0.5, y: height * 0.4 },
      { x: width * 0.7, y: height * 0.25 },
      { x: width * 0.85, y: height * 0.15 },
      { x: width * 0.95, y: peakY },
      { x: width, y: peakY },
    ],
    // Profile 3: Technical with steep sections
    [
      { x: 0, y: baseY },
      { x: width * 0.15, y: height * 0.7 },
      { x: width * 0.25, y: height * 0.5 },
      { x: width * 0.4, y: height * 0.45 },
      { x: width * 0.55, y: height * 0.35 },
      { x: width * 0.75, y: height * 0.2 },
      { x: width, y: peakY },
    ],
  ];

  const points = profiles[index % profiles.length];

  // Simple linear interpolation through control points
  const totalPoints = points.length - 1;
  const segment = progress * totalPoints;
  const segmentIndex = Math.min(Math.floor(segment), totalPoints - 1);
  const segmentProgress = segment - segmentIndex;

  const p0 = points[segmentIndex];
  const p1 = points[Math.min(segmentIndex + 1, points.length - 1)];

  return {
    x: p0.x + (p1.x - p0.x) * segmentProgress,
    y: p0.y + (p1.y - p0.y) * segmentProgress,
  };
}

// Generate elevation curve path
function generateElevationPath(index: number, width: number, height: number) {
  const baseY = height * 0.85;
  const peakY = height * 0.12;

  const profiles = [
    `M 0 ${baseY} C ${width * 0.2} ${baseY} ${width * 0.3} ${height * 0.5} ${width * 0.5} ${height * 0.3} C ${width * 0.7} ${height * 0.18} ${width * 0.85} ${peakY} ${width} ${peakY}`,
    `M 0 ${baseY} C ${width * 0.25} ${height * 0.65} ${width * 0.4} ${height * 0.4} ${width * 0.55} ${height * 0.45} C ${width * 0.7} ${height * 0.35} ${width * 0.85} ${peakY + 5} ${width} ${peakY}`,
    `M 0 ${baseY} C ${width * 0.3} ${height * 0.6} ${width * 0.5} ${height * 0.4} ${width * 0.7} ${height * 0.25} C ${width * 0.85} ${height * 0.15} ${width * 0.95} ${peakY} ${width} ${peakY}`,
    `M 0 ${baseY} C ${width * 0.15} ${height * 0.7} ${width * 0.25} ${height * 0.5} ${width * 0.4} ${height * 0.45} C ${width * 0.55} ${height * 0.35} ${width * 0.75} ${height * 0.2} ${width} ${peakY}`,
  ];

  return profiles[index % profiles.length];
}

export function MountainRangeGoals() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const activeGoals = goals.filter(g => g.currentValue < g.targetValue).slice(0, 4);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading routes...</div>
      </div>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Mountain className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">No routes planned</p>
        <a href="/goals" className="text-primary text-sm mt-2 hover:underline">+ Plan a route</a>
      </div>
    );
  }

  const chartWidth = 140;
  const chartHeight = 55;
  const leftPadding = 24; // Space for elevation markers

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Mountain className="w-5 h-5" />
        Routes
      </h2>

      <div className="flex-1 rounded-xl overflow-hidden relative bg-background/60">
        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="routeGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#routeGrid)" className="text-foreground" />
        </svg>

        <div className="relative z-10 p-3 h-full">
          <div className="grid grid-cols-2 gap-3 h-full">
            {activeGoals.map((goal, index) => {
              const colors = ROUTE_COLORS[index % ROUTE_COLORS.length];
              const progress = Math.min(goal.currentValue / goal.targetValue, 1);
              const pct = Math.round(progress * 100);
              const elevationPath = generateElevationPath(index, chartWidth, chartHeight);
              const currentPos = getPointOnCurve(index, progress, chartWidth, chartHeight);
              const markerX = progress * chartWidth;

              // Elevation markers (altitude levels)
              const elevationLevels = [
                { pct: 0, label: "Base" },
                { pct: 0.5, label: "Mid" },
                { pct: 1, label: "Peak" },
              ];

              return (
                <Link key={goal.id} href="/goals">
                <div
                  className="flex flex-col rounded-lg p-3 relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}50, transparent)`,
                    border: `1px solid ${colors.trail}40`,
                    boxShadow: `0 0 30px ${colors.trail}30, 0 0 60px ${colors.trail}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  {/* Corner glow - MEGA */}
                  <div
                    className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-40"
                    style={{ background: `radial-gradient(circle, ${colors.bright} 0%, ${colors.trail} 50%, transparent 70%)` }}
                  />
                  {/* Bottom glow */}
                  <div
                    className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full blur-xl opacity-25"
                    style={{ background: colors.trail }}
                  />

                  {/* Subtle floating particles - reduced */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full pointer-events-none"
                      style={{
                        background: colors.trail,
                        boxShadow: `0 0 4px ${colors.trail}60`,
                        left: `${20 + i * 25}%`,
                        top: `${30 + (i % 2) * 25}%`,
                      }}
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                      }}
                    />
                  ))}

                  {/* Route label */}
                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <span className="text-xs font-medium truncate" style={{ color: colors.trail }}>
                      {goal.title}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: colors.bg,
                        color: colors.trail,
                        boxShadow: `0 0 8px ${colors.trail}40`,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Elevation profile with Y-axis markers */}
                  <div className="flex-1 relative min-h-[55px]">
                    <svg
                      viewBox={`-${leftPadding} 0 ${chartWidth + leftPadding} ${chartHeight}`}
                      className="w-full h-full"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        {/* MEGA Glow filter */}
                        <filter id={`routeGlow-${index}`} x="-100%" y="-100%" width="300%" height="300%">
                          {/* Outer bloom */}
                          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
                          <feFlood floodColor={colors.bright} floodOpacity="0.4" />
                          <feComposite in2="blur1" operator="in" result="glow1" />
                          {/* Mid glow */}
                          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
                          <feFlood floodColor={colors.glow} floodOpacity="0.8" />
                          <feComposite in2="blur2" operator="in" result="glow2" />
                          {/* Inner sharp */}
                          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur3" />
                          <feFlood floodColor={colors.bright} floodOpacity="1" />
                          <feComposite in2="blur3" operator="in" result="glow3" />
                          <feMerge>
                            <feMergeNode in="glow1" />
                            <feMergeNode in="glow2" />
                            <feMergeNode in="glow3" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        {/* Gradient for terrain fill */}
                        <linearGradient id={`areaFill-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={colors.trail} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={colors.trail} stopOpacity="0.05" />
                        </linearGradient>

                        {/* Clip for progress (both line and fill) */}
                        <clipPath id={`progressClip-${index}`}>
                          <rect x="0" y="0" width={markerX} height={chartHeight} />
                        </clipPath>
                      </defs>

                      {/* Topographic contour lines */}
                      <g opacity="0.15">
                        {/* Contour lines that follow terrain - closer together near summit */}
                        {[0.15, 0.30, 0.45, 0.58, 0.70, 0.82, 0.92].map((heightFactor, i) => {
                          const baseY = chartHeight * 0.85;
                          const peakY = chartHeight * 0.12;
                          const range = baseY - peakY;
                          const contourY = peakY + range * heightFactor;

                          // Contour follows a scaled version of the elevation profile
                          // Higher contours are shorter (closer to summit)
                          const startX = chartWidth * (heightFactor * 0.3);
                          const endX = chartWidth * (1 - heightFactor * 0.15);

                          // Create organic topo contour
                          const wave1 = Math.sin(i * 1.2) * 2;
                          const wave2 = Math.cos(i * 0.8) * 1.5;

                          const contourPath = `M ${startX} ${contourY + wave1}
                            Q ${startX + (endX - startX) * 0.25} ${contourY - 2 + wave2}
                              ${startX + (endX - startX) * 0.4} ${contourY + 1.5 - wave1}
                            Q ${startX + (endX - startX) * 0.6} ${contourY - 1 + wave2}
                              ${startX + (endX - startX) * 0.75} ${contourY + wave1}
                            Q ${startX + (endX - startX) * 0.9} ${contourY - 1.5 - wave2}
                              ${endX} ${contourY + wave2}`;

                          return (
                            <path
                              key={i}
                              d={contourPath}
                              fill="none"
                              stroke={colors.trail}
                              strokeWidth={i % 3 === 0 ? "0.7" : "0.4"}
                              opacity={i % 3 === 0 ? 1 : 0.6}
                            />
                          );
                        })}

                        {/* Summit contour ring - closed oval near peak */}
                        <ellipse
                          cx={chartWidth * 0.92}
                          cy={chartHeight * 0.18}
                          rx="8"
                          ry="4"
                          fill="none"
                          stroke={colors.trail}
                          strokeWidth="0.5"
                          opacity="0.8"
                        />
                        <ellipse
                          cx={chartWidth * 0.9}
                          cy={chartHeight * 0.22}
                          rx="14"
                          ry="6"
                          fill="none"
                          stroke={colors.trail}
                          strokeWidth="0.4"
                          opacity="0.5"
                        />
                      </g>

                      {/* Elevation markers (Y-axis) */}
                      <g className="text-muted-foreground" opacity="0.4">
                        {/* Peak marker */}
                        <line x1="-4" y1={chartHeight * 0.12} x2="0" y2={chartHeight * 0.12} stroke="currentColor" strokeWidth="1" />
                        <text x="-6" y={chartHeight * 0.12 + 3} fontSize="6" fill="currentColor" textAnchor="end">Peak</text>

                        {/* Mid marker */}
                        <line x1="-4" y1={chartHeight * 0.48} x2="0" y2={chartHeight * 0.48} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />

                        {/* Base marker */}
                        <line x1="-4" y1={chartHeight * 0.85} x2="0" y2={chartHeight * 0.85} stroke="currentColor" strokeWidth="1" />
                        <text x="-6" y={chartHeight * 0.85 + 3} fontSize="6" fill="currentColor" textAnchor="end">Base</text>

                        {/* Y-axis line */}
                        <line x1="0" y1={chartHeight * 0.12} x2="0" y2={chartHeight * 0.85} stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                      </g>

                      {/* Full terrain fill (faded) */}
                      <path
                        d={`${elevationPath} L ${chartWidth} ${chartHeight * 0.85} L 0 ${chartHeight * 0.85} Z`}
                        fill={colors.trail}
                        opacity="0.05"
                      />

                      {/* Progress terrain fill (animated) */}
                      <g clipPath={`url(#progressClip-${index})`}>
                        <motion.path
                          d={`${elevationPath} L ${chartWidth} ${chartHeight * 0.85} L 0 ${chartHeight * 0.85} Z`}
                          fill={`url(#areaFill-${index})`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </g>

                      {/* Full route line (faded dashed) */}
                      <path
                        d={elevationPath}
                        fill="none"
                        stroke={colors.trail}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.2"
                      />

                      {/* Progress trail (MEGA glowing solid) */}
                      <g clipPath={`url(#progressClip-${index})`}>
                        {/* Extra glow layer behind */}
                        <motion.path
                          d={elevationPath}
                          fill="none"
                          stroke={colors.trail}
                          strokeWidth="6"
                          strokeLinecap="round"
                          opacity="0.3"
                          filter={`url(#routeGlow-${index})`}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                        {/* Main bright trail */}
                        <motion.path
                          d={elevationPath}
                          fill="none"
                          stroke={colors.bright}
                          strokeWidth="3"
                          strokeLinecap="round"
                          filter={`url(#routeGlow-${index})`}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </g>

                      {/* Small checkpoint dots ON the curve */}
                      {[0.33, 0.66].map((pos) => {
                        const dotPos = getPointOnCurve(index, pos, chartWidth, chartHeight);
                        const isReached = progress >= pos;
                        return (
                          <circle
                            key={pos}
                            cx={dotPos.x}
                            cy={dotPos.y}
                            r="1.5"
                            fill={isReached ? colors.trail : "transparent"}
                            stroke={colors.trail}
                            strokeWidth="1"
                            opacity={isReached ? 0.8 : 0.2}
                          />
                        );
                      })}

                      {/* Trail sparkle behind current position - Simplified */}
                      {progress > 0.08 && (
                        <circle
                          cx={getPointOnCurve(index, Math.max(0, progress - 0.05), chartWidth, chartHeight).x}
                          cy={getPointOnCurve(index, Math.max(0, progress - 0.05), chartWidth, chartHeight).y}
                          r="2"
                          fill={colors.trail}
                          opacity="0.5"
                        />
                      )}

                      {/* Current position marker (on the curve) - Simplified */}
                      {progress > 0.02 && progress < 0.98 && (
                        <g>
                          {/* Subtle glow */}
                          <circle
                            cx={currentPos.x}
                            cy={currentPos.y}
                            r="4"
                            fill={colors.trail}
                            opacity="0.3"
                          />
                          {/* Main dot */}
                          <circle
                            cx={currentPos.x}
                            cy={currentPos.y}
                            r="3"
                            fill={colors.bright}
                          />
                          {/* Inner bright core */}
                          <circle
                            cx={currentPos.x}
                            cy={currentPos.y}
                            r="1.5"
                            fill="white"
                          />
                        </g>
                      )}

                      {/* Summit flag */}
                      <g transform={`translate(${chartWidth - 5}, ${chartHeight * 0.12 - 8})`}>
                        <motion.g
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: progress >= 1 ? 1 : 0.5,
                            opacity: progress >= 1 ? 1 : 0.25,
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <line
                            x1="2" y1="0" x2="2" y2="10"
                            stroke={progress >= 1 ? colors.trail : "currentColor"}
                            strokeWidth="1.5"
                            className="text-muted-foreground"
                          />
                          <path
                            d="M 2 0 L 8 2.5 L 2 5 Z"
                            fill={progress >= 1 ? colors.trail : "currentColor"}
                            className="text-muted-foreground"
                          />
                          {progress >= 1 && (
                            <motion.circle
                              cx="2" cy="2.5" r="6"
                              fill="none"
                              stroke={colors.trail}
                              strokeWidth="1"
                              initial={{ scale: 0.5, opacity: 1 }}
                              animate={{ scale: 2, opacity: 0 }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.g>
                      </g>
                    </svg>
                  </div>

                  {/* Progress bar - Clean */}
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${colors.trail}, ${colors.bright})`,
                      }}
                    />
                  </div>

                  {/* Target value */}
                  <div className="mt-1 text-right text-[9px] text-muted-foreground">
                    {goal.currentValue} / {goal.targetValue}{goal.unit ? ` ${goal.unit}` : ''}
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
