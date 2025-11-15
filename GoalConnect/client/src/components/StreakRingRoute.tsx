/**
 * StreakRingRoute Component
 *
 * Displays a circular ring visualization showing a habit's weekly completion pattern.
 * Features 7 nodes (one per day of the week) arranged in a circle, with completed days
 * lighting up progressively. When all 7 days are complete, a burst particle effect
 * celebrates the achievement.
 *
 * @example
 * ```tsx
 * <StreakRingRoute habitId={1} className="max-w-xs mx-auto" />
 * ```
 *
 * Features:
 * - Circular progress ring showing completion arc
 * - 7 day nodes positioned around the circle (Mon-Sun)
 * - Center displays current streak count
 * - Particle burst effect on full ring completion
 * - Adapts to mountain theme colors via CSS variables
 * - Smooth animations with framer-motion
 */

import { useQuery } from "@tanstack/react-query";
import type { HabitLog } from "@shared/schema";
import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useParticleSystem } from "@/utils/particles";

interface StreakRingRouteProps {
  habitId: number;
  className?: string;
}

interface DayNode {
  dayOfWeek: string;
  dayName: string;
  completed: boolean;
  x: number;
  y: number;
  angle: number;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StreakRingRoute({ habitId, className }: StreakRingRouteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);
  const prevStreakRef = useRef(0);

  // Fetch habit streak data
  const { data: streakData } = useQuery({
    queryKey: [`/api/habits/${habitId}/streak`],
    enabled: !!habitId,
  });

  // Get logs for the current week
  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs?habitId=${habitId}`],
    enabled: !!habitId,
  });

  // Calculate week nodes
  const weekNodes = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const nodes: DayNode[] = [];
    const centerX = 100;
    const centerY = 100;
    const radius = 70;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(currentDay.getDate() + i);
      const dateString = currentDay.toISOString().split("T")[0];

      // Check if this day is completed
      const isCompleted = allLogs.some(
        (log) => log.date === dateString && log.completed
      );

      // Position nodes in a circle (starting at top, going clockwise)
      const angle = (i * (360 / 7)) - 90; // Start at top (-90 degrees)
      const angleRad = (angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);

      nodes.push({
        dayOfWeek: dateString,
        dayName: DAY_NAMES[i],
        completed: isCompleted,
        x,
        y,
        angle,
      });
    }

    return nodes;
  }, [allLogs]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    return streakData?.currentStreak || 0;
  }, [streakData]);

  // Check if full ring is complete
  const isFullRing = useMemo(() => {
    return weekNodes.every((node) => node.completed);
  }, [weekNodes]);

  // Emit burst particles when full ring completes
  useEffect(() => {
    if (isFullRing && particleSystem && canvasRef.current && prevStreakRef.current < 7) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const particleType = document.documentElement.getAttribute('data-particle-type') || 'chalk';

      particleSystem.burst({
        type: particleType as 'chalk' | 'dust' | 'snow',
        x: centerX,
        y: centerY,
      });
    }
    prevStreakRef.current = weekNodes.filter((n) => n.completed).length;
  }, [isFullRing, particleSystem, weekNodes]);

  return (
    <div className={cn("relative", className)}>
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      />

      {/* SVG Ring */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        style={{ maxWidth: '240px', margin: '0 auto' }}
      >
        {/* Ring path (background circle) */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.2)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Completed arc */}
        {weekNodes.filter((n) => n.completed).length > 0 && (
          <motion.circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="hsl(var(--hold-glow))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(weekNodes.filter((n) => n.completed).length / 7) * 440} 440`}
            initial={{ strokeDashoffset: 440 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              filter: isFullRing
                ? "drop-shadow(0 0 10px hsl(var(--hold-glow)))"
                : "none",
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        )}

        {/* Day nodes */}
        {weekNodes.map((node, index) => (
          <g key={node.dayOfWeek}>
            {/* Node circle */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="12"
              className={cn(
                "ring-node transition-all duration-300",
                node.completed && "completed active"
              )}
              fill={
                node.completed
                  ? "hsl(var(--hold-glow))"
                  : "hsl(var(--muted-foreground) / 0.2)"
              }
              stroke={
                node.completed
                  ? "hsl(var(--hold-glow))"
                  : "hsl(var(--muted-foreground) / 0.4)"
              }
              strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
            />

            {/* Day label */}
            <text
              x={node.x}
              y={node.y + 28}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-current"
              style={{
                fill: node.completed
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {node.dayName}
            </text>
          </g>
        ))}

        {/* Center text - Streak count */}
        <g>
          <motion.text
            x="100"
            y="95"
            textAnchor="middle"
            className="text-4xl font-bold fill-current"
            style={{
              fill: isFullRing
                ? "hsl(var(--hold-glow))"
                : "hsl(var(--foreground))",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {currentStreak}
          </motion.text>
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="text-xs font-medium fill-current"
            style={{ fill: "hsl(var(--muted-foreground))" }}
          >
            {currentStreak === 1 ? "day" : "days"}
          </text>
        </g>

        {/* Full ring celebration icon */}
        {isFullRing && (
          <motion.text
            x="100"
            y="125"
            textAnchor="middle"
            className="text-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          >
            🔥
          </motion.text>
        )}
      </svg>

      {/* Status text below ring */}
      <div className="text-center mt-4">
        {isFullRing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-foreground"
          >
            Perfect Week! 🎉
          </motion.div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {weekNodes.filter((n) => n.completed).length}/{weekNodes.length} days complete
          </div>
        )}
      </div>
    </div>
  );
}
