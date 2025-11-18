import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Mountain, Flag, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getToday } from "@/lib/utils";

interface Goal {
  id: number;
  userId: number;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

/**
 * GoalsSection - Visual mountain summits to climb
 */
export function GoalsSection() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const activeGoals = goals.filter(g => g.currentValue < g.targetValue);
  const completedGoals = goals.filter(g => g.currentValue >= g.targetValue);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="h-20 bg-muted/20 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 relative">
      {/* Soft gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, hsl(var(--primary) / 0.3), transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-2xl font-bold flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ⛰️ Summits to Climb
          </h2>
          <p className="text-xs text-foreground/50 mt-1">
            {activeGoals.length} active • {completedGoals.length} summited
          </p>
        </div>

        <a
          href="/goals"
          className="px-4 py-2 rounded-xl text-white transition-all text-sm font-bold shadow-lg hover:scale-105 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
          }}
        >
          Manage
        </a>
      </div>

      {/* Mountain Summits - Horizontal scroll like climbing route */}
      {activeGoals.length === 0 ? (
        <div className="relative z-10 text-center py-8">
          <Mountain className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.4)' }} />
          <p className="text-foreground/50 text-sm mb-4">No summits to climb yet.</p>
          <a
            href="/goals"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl transition text-sm font-bold shadow-lg hover:scale-105 hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            }}
          >
            <Plus className="w-4 h-4" />
            Chart Your First Summit
          </a>
        </div>
      ) : (
        <>
          {/* Horizontal layout - all visible, no scroll */}
          <div className="relative z-10 flex flex-wrap gap-4">
            {activeGoals.map((goal, index) => (
              <div key={goal.id} className="flex-1 min-w-[240px] max-w-[320px]">
                <CompactMountainCard goal={goal} index={index} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface CompactMountainCardProps {
  goal: Goal;
  index: number;
}

/**
 * CompactMountainCard - Horizontal-friendly compact goal card
 */
function CompactMountainCard({ goal, index }: CompactMountainCardProps) {
  const progressPercentage = goal.targetValue > 0
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : 0;

  const altitude = Math.round((progressPercentage / 100) * 8848);
  const isNearSummit = progressPercentage >= 80;

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      const today = getToday();
      return apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="h-full bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg hover:shadow-xl p-4 relative overflow-hidden transition-all group"
    >
      {/* Gradient */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity"
        style={{
          background: isNearSummit
            ? `radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)`
            : `radial-gradient(circle, hsl(var(--accent) / 0.3), transparent 70%)`
        }}
      />

      {/* Flag */}
      {isNearSummit && (
        <Flag className="absolute top-2 right-2 w-5 h-5 z-10" style={{ color: 'hsl(var(--primary))' }} />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <div
          className="flex-shrink-0 p-3 rounded-2xl"
          style={{
            background: isNearSummit
              ? `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))`
              : `linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))`,
            border: isNearSummit ? '2px solid hsl(var(--primary) / 0.3)' : '2px solid hsl(var(--accent) / 0.3)'
          }}
        >
          <Mountain className="w-6 h-6" style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm line-clamp-1">{goal.title}</h3>
          <span
            className="text-lg font-black"
            style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
          >
            {altitude}m
          </span>
        </div>
      </div>

      {/* Elevation bars */}
      <div className="relative z-10 h-16 mb-3 flex items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const barHeight = ((i + 1) / 10) * 100;
          const isFilled = progressPercentage >= (i + 1) * 10;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ delay: index * 0.1 + i * 0.03, duration: 0.3 }}
              className="flex-1 rounded-t-lg"
              style={{
                background: isFilled
                  ? isNearSummit
                    ? `linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8))`
                    : `linear-gradient(to top, hsl(var(--accent) / 0.5), hsl(var(--accent) / 0.7))`
                  : 'hsl(var(--foreground) / 0.08)',
                boxShadow: isFilled
                  ? isNearSummit
                    ? '0 0 8px hsl(var(--primary) / 0.3)'
                    : '0 0 6px hsl(var(--accent) / 0.2)'
                  : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Stats */}
      <div className="relative z-10 flex items-center justify-between text-xs mb-3">
        <span className="text-foreground/70 font-medium">
          {goal.currentValue}/{goal.targetValue} {goal.unit}
        </span>
        <span
          className="font-black text-base"
          style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
        >
          {progressPercentage}%
        </span>
      </div>

      {/* Button */}
      <button
        onClick={() => !addProgressMutation.isPending && addProgressMutation.mutate()}
        disabled={addProgressMutation.isPending}
        className="relative z-10 w-full py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] text-white"
        style={{
          background: isNearSummit
            ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            : `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))`
        }}
      >
        {isNearSummit && <Sparkles className="w-4 h-4" />}
        {isNearSummit ? '🚀 +1' : '⛰️ +1'}
      </button>
    </motion.div>
  );
}

interface MountainSummitWidgetProps {
  goal: Goal;
  index: number;
}

/**
 * MountainSummitWidget - Full personality mountain goal card for widget
 * Shows elevation bars, altitude, summit flags - the fun stuff with MORE SPACE
 */
function MountainSummitWidget({ goal, index }: MountainSummitWidgetProps) {
  const progressPercentage = goal.targetValue > 0
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : 0;

  const altitude = Math.round((progressPercentage / 100) * 8848); // Max out at Everest height
  const isNearSummit = progressPercentage >= 80;

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      const today = getToday();
      return apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleAddProgress = () => {
    if (!addProgressMutation.isPending) {
      addProgressMutation.mutate();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-lg hover:shadow-2xl p-8 relative overflow-hidden transition-all group"
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none"
        style={{
          background: isNearSummit
            ? `radial-gradient(circle at top right, hsl(var(--primary) / 0.5), transparent 70%)`
            : `radial-gradient(circle at top right, hsl(var(--accent) / 0.4), transparent 70%)`
        }}
      />

      {/* Summit flag - show when near completion */}
      {isNearSummit && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-4 right-4 z-10"
        >
          <Flag className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
        </motion.div>
      )}

      {/* Header with icon and title */}
      <div className="relative z-10 flex items-start gap-4 mb-6">
        {/* Mountain icon - bigger and bolder */}
        <div
          className="flex-shrink-0 p-5 rounded-3xl shadow-xl"
          style={{
            background: isNearSummit
              ? `linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.15))`
              : `linear-gradient(135deg, hsl(var(--accent) / 0.25), hsl(var(--accent) / 0.15))`,
            border: isNearSummit
              ? '2px solid hsl(var(--primary) / 0.4)'
              : '2px solid hsl(var(--accent) / 0.4)'
          }}
        >
          <Mountain className="w-10 h-10" style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
        </div>

        {/* Title and stats */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-foreground text-2xl mb-2">{goal.title}</h3>
          <div className="flex items-baseline gap-3">
            <span
              className="text-4xl font-black"
              style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
            >
              {altitude}m
            </span>
            <span className="text-sm text-foreground/60 font-medium">elevation</span>
          </div>
        </div>
      </div>

      {/* Elevation bars - BIGGER and more spaced */}
      <div className="relative z-10 h-32 mb-6 flex items-end gap-2">
        {Array.from({ length: 10 }, (_, i) => {
          const barHeight = ((i + 1) / 10) * 100;
          const isFilled = progressPercentage >= (i + 1) * 10;

          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ delay: index * 0.15 + i * 0.06, duration: 0.4 }}
              className="flex-1 rounded-t-xl transition-all"
              style={{
                background: isFilled
                  ? isNearSummit
                    ? `linear-gradient(to top, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.9))`
                    : `linear-gradient(to top, hsl(var(--accent) / 0.6), hsl(var(--accent) / 0.8))`
                  : 'hsl(var(--foreground) / 0.08)',
                border: isFilled ? 'none' : '1px solid hsl(var(--foreground) / 0.1)',
                boxShadow: isFilled
                  ? isNearSummit
                    ? '0 0 16px hsl(var(--primary) / 0.4)'
                    : '0 0 12px hsl(var(--accent) / 0.3)'
                  : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Progress stats row */}
      <div className="relative z-10 flex items-center justify-between text-base mb-6">
        <span className="text-foreground/70 font-bold">
          {goal.currentValue} / {goal.targetValue} {goal.unit}
        </span>
        <span
          className="font-black text-2xl"
          style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
        >
          {progressPercentage}%
        </span>
      </div>

      {/* Action button - BIG and inviting */}
      <button
        onClick={handleAddProgress}
        disabled={addProgressMutation.isPending}
        className="relative z-10 w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:scale-[1.03] text-white"
        style={{
          background: isNearSummit
            ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            : `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))`
        }}
      >
        {isNearSummit && <Sparkles className="w-6 h-6" />}
        {isNearSummit ? '🚀 Summit Push +1' : '⛰️ Climb +1'}
      </button>
    </motion.div>
  );
}

/**
 * MountainSummit - Detailed mountain card (kept for full Goals page)
 * @deprecated Use SimplifiedGoalCard in widget contexts
 */
interface MountainSummitProps {
  goal: Goal;
  index: number;
}

function MountainSummit({ goal, index }: MountainSummitProps) {
  const progressPercentage = goal.targetValue > 0
    ? Math.round((goal.currentValue / goal.targetValue) * 100)
    : 0;

  const addProgressMutation = useMutation({
    mutationFn: async () => {
      const today = getToday();
      return apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleAddProgress = () => {
    if (!addProgressMutation.isPending) {
      addProgressMutation.mutate();
    }
  };

  // Altitude/elevation based on progress
  const altitude = Math.round((progressPercentage / 100) * 8848); // Max out at Everest height
  const isNearSummit = progressPercentage >= 80;
  const isMidway = progressPercentage >= 40 && progressPercentage < 80;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -3 }}
      className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg hover:shadow-xl p-6 relative overflow-hidden transition-all group"
    >
      {/* Soft gradient overlay based on progress */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none"
        style={{
          background: isNearSummit
            ? `radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 70%)`
            : `radial-gradient(circle at center, hsl(var(--accent) / 0.3), transparent 70%)`
        }}
      />

      {/* Summit flag - only show when near completion */}
      {isNearSummit && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-3 right-3 z-10"
        >
          <Flag className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
        </motion.div>
      )}

      {/* Mountain icon - soft glass */}
      <div className="relative z-10 mb-4">
        <div
          className="inline-flex p-4 rounded-2xl shadow-lg"
          style={{
            background: isNearSummit
              ? `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))`
              : `linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))`,
            border: isNearSummit
              ? '1px solid hsl(var(--primary) / 0.3)'
              : '1px solid hsl(var(--accent) / 0.3)'
          }}
        >
          <Mountain className="w-7 h-7" style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
        </div>
      </div>

      {/* Goal title */}
      <h3 className="relative z-10 font-bold text-foreground text-lg mb-3">{goal.title}</h3>

      {/* Altitude display */}
      <div className="relative z-10 flex items-baseline gap-2 mb-4">
        <span
          className="text-3xl font-black"
          style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
        >
          {altitude}m
        </span>
        <span className="text-xs text-foreground/50 font-medium">elevation</span>
      </div>

      {/* Progress visualization - Soft elevation bars */}
      <div className="relative z-10 h-24 mb-4 flex items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const barHeight = ((i + 1) / 10) * 100;
          const isFilled = progressPercentage >= (i + 1) * 10;

          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ delay: index * 0.1 + i * 0.05, duration: 0.3 }}
              className="flex-1 rounded-t-lg transition-all"
              style={{
                background: isFilled
                  ? isNearSummit
                    ? `linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8))`
                    : `linear-gradient(to top, hsl(var(--accent) / 0.5), hsl(var(--accent) / 0.7))`
                  : 'hsl(var(--foreground) / 0.08)',
                border: isFilled ? 'none' : '1px solid hsl(var(--foreground) / 0.1)',
                boxShadow: isFilled
                  ? isNearSummit
                    ? '0 0 12px hsl(var(--primary) / 0.3)'
                    : '0 0 10px hsl(var(--accent) / 0.2)'
                  : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div className="relative z-10 flex items-center justify-between text-sm mb-4">
        <span className="text-foreground/70 font-medium">
          {goal.currentValue} / {goal.targetValue} {goal.unit}
        </span>
        <span
          className="font-black text-lg"
          style={{ color: isNearSummit ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
        >
          {progressPercentage}%
        </span>
      </div>

      {/* Action button - Soft gradient */}
      <button
        onClick={handleAddProgress}
        disabled={addProgressMutation.isPending}
        className="relative z-10 w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] text-white"
        style={{
          background: isNearSummit
            ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            : `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))`
        }}
      >
        {isNearSummit && <Sparkles className="w-5 h-5" />}
        {isNearSummit ? '🚀 Summit Push +1' : '⛰️ Climb +1'}
      </button>
    </motion.div>
  );
}

