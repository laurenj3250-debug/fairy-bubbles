/**
 * Summit Journal - Your Climbing Chronicle
 * Where real-world Kilter Board achievements meet the mountain game world
 */

import { Link } from "wouter";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ArrowLeft, Mountain, Zap, Trophy, TrendingUp, Timer, RefreshCw, Flame, Target, Gauge, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClimbingStats, ClimbingStats } from "@/hooks/useClimbingStats";
import { findBestMountainComparison, getMountainComparisons, getClimbingMilestoneMessage } from "@/lib/mountainComparisons";

// Personality type visual config
const PERSONALITY_CONFIG = {
  VOLUME_WARRIOR: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  PROJECT_CRUSHER: { icon: Target, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  FLASH_MASTER: { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  ANGLE_DEMON: { icon: TrendingUp, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  CONSISTENCY_KING: { icon: Gauge, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
} as const;

// Animated counter component
function CountUp({ value, duration = 1.5, suffix = "", decimals = 0 }: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) return latest.toFixed(decimals);
    if (value >= 100) return Math.round(latest).toLocaleString();
    return Math.round(latest).toString();
  });

  useEffect(() => {
    const controls = animate(count, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [count, value, duration]);

  return (
    <span className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// Hero Section with Mountain Comparison
function HeroSection({ stats }: { stats: ClimbingStats }) {
  const comparison = findBestMountainComparison(stats.totalProblemsSent);
  const milestone = getClimbingMilestoneMessage(stats.totalProblemsSent);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-accent/20 p-6 md:p-8 mb-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mountain silhouette background */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
          <path
            d="M0 200 L50 120 L100 160 L150 80 L200 140 L250 60 L300 100 L350 40 L400 120 L400 200 Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Your vertical conquest
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl md:text-6xl font-bold text-primary">
            <CountUp value={comparison.timesClimbed} decimals={1} />x
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground">
            {comparison.mountain.name}
          </span>
          <span className="text-3xl">{comparison.mountain.emoji}</span>
        </div>

        <p className="text-muted-foreground mb-4">
          {milestone}
        </p>

        {/* Quick stats row */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-success" />
            <span className="text-sm"><strong>{stats.totalProblemsSent}</strong> sends</span>
          </div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-primary" />
            <span className="text-sm"><strong>{stats.totalSessions}</strong> sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm"><strong>{Math.round(stats.totalMinutesClimbing / 60)}</strong>h climbing</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Mountain-shaped Grade Pyramid
function MountainPyramid({ stats }: { stats: ClimbingStats }) {
  const grades = Object.entries(stats.gradeDistribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const numA = parseInt(a.grade.replace("V", "").replace("+", ""));
      const numB = parseInt(b.grade.replace("V", "").replace("+", ""));
      return numA - numB;
    });

  if (grades.length === 0) return null;

  const maxCount = Math.max(...grades.map((g) => g.count));
  const sweetSpot = grades.reduce((max, g) => (g.count > max.count ? g : max), grades[0]);

  // Create SVG path for mountain shape
  const width = 100;
  const height = 100;
  const barWidth = width / (grades.length + 1);

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Grade Mountain</div>
        <div className="text-xs text-muted-foreground">
          Peak: <span className="text-success font-medium">{stats.maxGrade}</span>
        </div>
      </div>

      {/* Mountain visualization */}
      <div className="relative h-40">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMax meet">
          {/* Mountain fill */}
          <defs>
            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Create mountain path from grade data */}
          <motion.path
            d={`M 0 ${height} ${grades.map((g, i) => {
              const x = (i + 0.5) * barWidth + barWidth / 2;
              const barHeight = (g.count / maxCount) * (height - 20);
              const y = height - barHeight;
              return `L ${x} ${y}`;
            }).join(' ')} L ${width} ${height} Z`}
            fill="url(#mountainGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Summit flag at highest point */}
          {grades.map((g, i) => {
            if (g.grade !== sweetSpot.grade) return null;
            const x = (i + 0.5) * barWidth + barWidth / 2;
            const barHeight = (g.count / maxCount) * (height - 20);
            const y = height - barHeight;
            return (
              <motion.g key="flag" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>
                <line x1={x} y1={y} x2={x} y2={y - 12} stroke="hsl(var(--accent))" strokeWidth="1.5" />
                <polygon points={`${x},${y - 12} ${x + 8},${y - 9} ${x},${y - 6}`} fill="hsl(var(--accent))" />
              </motion.g>
            );
          })}
        </svg>

        {/* Grade labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-2">
          {grades.map((g) => (
            <div
              key={g.grade}
              className={`text-[10px] ${g.grade === sweetSpot.grade ? "text-primary font-bold" : "text-muted-foreground"}`}
            >
              {g.grade.replace("V", "")}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-2">
        Sweet spot: <span className="text-primary font-medium">{sweetSpot.grade}</span> ({sweetSpot.count} sends)
      </div>
    </motion.div>
  );
}

// Visual Personality Card
function PersonalityCard({ stats }: { stats: ClimbingStats }) {
  if (!stats.personality) {
    return (
      <motion.div
        className="glass-card p-4 flex flex-col items-center justify-center text-center h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Mountain className="w-10 h-10 text-muted-foreground mb-3" />
        <div className="text-sm text-muted-foreground">
          Complete <strong>{5 - stats.totalSessions}</strong> more sessions to unlock your climbing personality
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-3">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(stats.totalSessions / 5) * 100}%` }}
          />
        </div>
      </motion.div>
    );
  }

  const { personality } = stats;
  const config = PERSONALITY_CONFIG[personality.primary];
  const Icon = config.icon;

  const types = [
    { key: "VOLUME_WARRIOR", label: "Volume Warrior", description: "Crushes lots of problems" },
    { key: "PROJECT_CRUSHER", label: "Project Crusher", description: "Works hard on single routes" },
    { key: "FLASH_MASTER", label: "Flash Master", description: "First-try sends" },
    { key: "ANGLE_DEMON", label: "Angle Demon", description: "Loves steep walls" },
    { key: "CONSISTENCY_KING", label: "Consistency King", description: "Steady climber" },
  ] as const;

  return (
    <motion.div
      className={`glass-card p-4 ${config.bg} ${config.border} border`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Climbing Style</div>
          <div className={`text-lg font-bold ${config.color}`}>
            {types.find(t => t.key === personality.primary)?.label || personality.primary.replace("_", " ")}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic mb-4">"{personality.tagline}"</p>

      {/* Radar-style bars */}
      <div className="space-y-2">
        {types.map(({ key, label }) => {
          const score = personality.scores[key];
          const isPrimary = key === personality.primary;
          const typeConfig = PERSONALITY_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] w-24 text-muted-foreground truncate">{label}</span>
              <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isPrimary ? typeConfig.color.replace("text-", "bg-") : "bg-muted-foreground/30"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
              </div>
              <span className={`text-[10px] w-8 text-right ${isPrimary ? config.color : "text-muted-foreground"}`}>
                {score}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Mountain Comparisons (replaces generic fun facts)
function MountainComparisons({ stats }: { stats: ClimbingStats }) {
  const comparisons = getMountainComparisons(stats.totalProblemsSent).slice(0, 4);

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Summit Equivalents
      </div>
      <div className="grid grid-cols-2 gap-2">
        {comparisons.map((c) => (
          <div key={c.mountain.name} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <span className="text-xl">{c.mountain.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">
                {c.timesClimbed >= 1
                  ? `${c.timesClimbed.toFixed(1)}x`
                  : `${Math.round(c.percentOfMountain)}%`}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{c.mountain.name}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Highlights Card
function HighlightsCard({ stats }: { stats: ClimbingStats }) {
  const { longestSession, maxGrade, flashRate, sendRate } = stats;

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Personal Records
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-2 bg-success/10 rounded-lg border border-success/20">
          <TrendingUp className="w-5 h-5 text-success shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">Max Grade</div>
            <div className="text-xs text-muted-foreground">Reached {maxGrade}</div>
          </div>
          <div className="text-lg font-bold text-success">{maxGrade}</div>
        </div>

        <div className="flex items-center gap-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <Gauge className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">Send Rate</div>
            <div className="text-xs text-muted-foreground">Success percentage</div>
          </div>
          <div className="text-lg font-bold text-primary">{sendRate.toFixed(0)}%</div>
        </div>

        {flashRate > 0 && (
          <div className="flex items-center gap-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">Flash Rate</div>
              <div className="text-xs text-muted-foreground">First try sends</div>
            </div>
            <div className="text-lg font-bold text-yellow-500">{flashRate.toFixed(0)}%</div>
          </div>
        )}

        {longestSession && (
          <div className="flex items-center gap-3 p-2 bg-accent/10 rounded-lg border border-accent/20">
            <Timer className="w-5 h-5 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">Longest Session</div>
              <div className="text-xs text-muted-foreground">{new Date(longestSession.date).toLocaleDateString()}</div>
            </div>
            <div className="text-lg font-bold text-accent">
              {Math.floor(longestSession.minutes / 60)}h{longestSession.minutes % 60}m
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Dashboard Layout
function SummitDashboard({ stats }: { stats: ClimbingStats }) {
  return (
    <div className="space-y-4">
      {/* Hero with mountain comparison */}
      <HeroSection stats={stats} />

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <MountainPyramid stats={stats} />
          <MountainComparisons stats={stats} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <PersonalityCard stats={stats} />
          <HighlightsCard stats={stats} />
        </div>
      </div>
    </div>
  );
}

// Not Connected State
function NotConnectedState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-6">
        <Mountain className="w-20 h-20 text-muted-foreground" />
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4 text-primary" />
        </motion.div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Connect Your Kilter Board</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Link your Kilter Board account to see your climbing stats visualized as mountain conquests.
      </p>
      <Link href="/settings/import">
        <Button className="gap-2">
          <Mountain className="w-4 h-4" />
          Connect Kilter Board
        </Button>
      </Link>
    </div>
  );
}

// Empty State
function EmptyState({ sessionCount }: { sessionCount: number }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Mountain className="w-16 h-16 text-muted-foreground mb-6" />
      <h2 className="text-2xl font-bold mb-2">
        {sessionCount === 0 ? "No Sessions Yet" : "Keep Climbing!"}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {sessionCount === 0
          ? "Go crush some problems on your Kilter Board, then come back to see your mountain conquests!"
          : `You have ${sessionCount} session${sessionCount !== 1 ? "s" : ""}. Complete at least 5 for full insights.`}
      </p>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <Mountain className="w-16 h-16 text-primary/30" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full" />
        </motion.div>
      </div>
      <p className="mt-6 text-muted-foreground">Loading your summit journal...</p>
    </div>
  );
}

// Error State
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">⛰️</div>
      <h2 className="text-2xl font-bold mb-2">Lost in the clouds</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "Failed to load climbing stats. Please try again."}
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

// Main Page Component
export default function SummitJournal() {
  const { stats, isLoading, error, refetch } = useClimbingStats();

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="pt-6 mb-4">
          <Link href="/settings/import">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Import Settings
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Summit Journal
            </span>
          </h1>
          <p className="text-muted-foreground">Your climbing chronicle</p>
        </div>

        {/* Content based on state */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error as Error} onRetry={refetch} />
        ) : !stats?.isConnected ? (
          <NotConnectedState />
        ) : stats.totalSessions === 0 ? (
          <EmptyState sessionCount={0} />
        ) : (
          <SummitDashboard stats={stats} />
        )}
      </div>
    </div>
  );
}
