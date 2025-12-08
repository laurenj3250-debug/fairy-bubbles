import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Zap, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ClimbingLogDialog } from "@/components/ClimbingLogDialog";
import type { ClimbingStats } from "@/hooks/useClimbingStats";
import type { StravaClimbingStats } from "@/hooks/useStravaClimbingActivities";
import type { ClimbingTick, ClimbingTickInput, ClimbingLogStats } from "@/hooks/useClimbingLog";
import { PERSONALITY_DISPLAY } from "@/lib/climbingPersonality";
import { SessionCalendar } from "../SessionCalendar";
import { AbsurdFactsTicker } from "../AbsurdFactsTicker";

interface ClimbingTabProps {
  yearlyClimbsGoal: number;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
  kilterStats: ClimbingStats | null;
  isLoadingKilter: boolean;
  stravaClimbingStats: StravaClimbingStats | null;
  isLoadingStravaClimbing: boolean;
  climbingLogTicks: ClimbingTick[];
  climbingLogStats: ClimbingLogStats | undefined;
  isLoadingClimbingLog: boolean;
  onCreateTick: (tick: ClimbingTickInput) => Promise<unknown>;
  onUpdateTick: (tick: Partial<ClimbingTickInput> & { id: number }) => Promise<unknown>;
  onDeleteTick: (id: number) => Promise<unknown>;
  isCreatingTick: boolean;
}

export function ClimbingTab({
  kilterStats,
  isLoadingKilter,
  onCreateTick,
  isCreatingTick,
}: ClimbingTabProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);

  const isConnected = kilterStats?.isConnected ?? false;
  const personality = kilterStats?.personality;
  const displayInfo = personality ? PERSONALITY_DISPLAY[personality.primary] : null;

  // Grade distribution for pyramid
  const gradeDistribution = kilterStats?.gradeDistribution ?? {};
  const gradePyramid = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const aNum = parseInt(a.grade.replace('V', '')) || 0;
      const bNum = parseInt(b.grade.replace('V', '')) || 0;
      return aNum - bNum;
    })
    .slice(-5);
  const maxPyramidCount = Math.max(...gradePyramid.map(g => g.count), 1);

  // Recent sends from sessions
  const recentSends = kilterStats?.sessions?.slice(0, 4).flatMap(session =>
    (session.climbs || [])
      .filter(c => c.sent)
      .slice(0, 2)
      .map(climb => ({
        name: climb.name,
        grade: climb.grade,
        angle: session.boardAngle || 40,
        attempts: climb.attempts,
        date: new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
  ).slice(0, 5) ?? [];

  // Angle performance - group sends by angle brackets
  const anglePerformance = kilterStats?.sessions?.reduce((acc, session) => {
    const angle = session.boardAngle || 40;
    const bracket = angle < 25 ? 'Slab' : angle < 40 ? 'Vert' : angle < 50 ? 'Steep' : 'Cave';
    acc[bracket] = (acc[bracket] || 0) + session.problemsSent;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const angleLabels = [
    { key: 'Slab', icon: '📐', range: '<25°' },
    { key: 'Vert', icon: '📏', range: '25-40°' },
    { key: 'Steep', icon: '📈', range: '40-50°' },
    { key: 'Cave', icon: '🦇', range: '50°+' },
  ];

  // Milestones
  const maxGradeNum = parseInt(kilterStats?.maxGrade?.replace('V', '') || '0');
  const milestones = [
    { label: 'First V3', achieved: maxGradeNum >= 3, emoji: '🌱' },
    { label: 'Crack V5', achieved: maxGradeNum >= 5, emoji: '🔥' },
    { label: 'Send V7', achieved: maxGradeNum >= 7, emoji: '💎' },
    { label: '100 Sends', achieved: (kilterStats?.totalProblemsSent ?? 0) >= 100, emoji: '💯' },
    { label: '50% Flash', achieved: (kilterStats?.flashRate ?? 0) >= 50, emoji: '⚡' },
    { label: '20 Sessions', achieved: (kilterStats?.totalSessions ?? 0) >= 20, emoji: '🏆' },
  ];

  if (isLoadingKilter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          🧗
        </motion.div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🧗
        </motion.div>
        <div className="text-xl font-semibold text-white">Connect Kilter Board</div>
        <div className="text-sm text-muted-foreground text-center max-w-sm">
          Link your Kilter Board account to unlock personality insights, session history, and fun stats
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_1fr_auto] gap-3 min-h-0">
      {/* ═══════════ ROW 1: Personality Hero + Max Grade ═══════════ */}

      {/* Personality Hero - 4 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "col-span-4 glass-card rounded-xl p-5 flex items-center gap-5 relative overflow-hidden bg-card/80 backdrop-blur-xl",
          displayInfo && `bg-gradient-to-br ${displayInfo.bgGradient}`
        )}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      >
        {displayInfo ? (
          <>
            {/* Giant emoji with glow */}
            <motion.div
              className="text-7xl flex-shrink-0 relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {displayInfo.emoji}
              <div
                className="absolute inset-0 blur-xl opacity-30"
                style={{ backgroundColor: displayInfo.color }}
              />
            </motion.div>

            {/* Personality info */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-1">
                Your Climbing Personality
              </div>
              <div
                className="text-3xl font-bold truncate tracking-tight"
                style={{ color: displayInfo.color }}
              >
                {displayInfo.displayName}
              </div>
              <div className="text-sm text-white/70 mt-1 line-clamp-1">
                {personality?.tagline}
              </div>

              {/* Trait pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {personality?.traits.slice(0, 3).map((trait, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/80 border border-white/5"
                  >
                    {trait}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Score badge */}
            <div className="absolute top-3 right-3 text-right">
              <motion.div
                className="text-2xl font-bold tabular-nums"
                style={{ color: displayInfo.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {personality?.scores[personality.primary]}%
              </motion.div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">match</div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-center py-4">
            <div className="text-5xl mb-3">🔮</div>
            <div className="text-white/80 font-medium">
              Unlock your personality
            </div>
            <div className="text-sm text-muted-foreground/70 mt-1">
              Complete 5 sessions ({kilterStats?.totalSessions ?? 0}/5)
            </div>
            <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((kilterStats?.totalSessions ?? 0) / 5) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Max Grade Card - 2 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-2 glass-card rounded-xl p-4 flex flex-col justify-center bg-card/80 backdrop-blur-xl relative overflow-hidden"
      >
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full" />

        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          Highest Send
        </div>
        <div className="text-5xl font-black text-purple-400 mt-1 tracking-tight">
          {kilterStats?.maxGrade ?? 'V0'}
        </div>
        <div className="flex items-center gap-3 mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">{kilterStats?.totalProblemsSent ?? 0}</span>
            <span className="text-muted-foreground/60 text-xs">sends</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-medium">{kilterStats?.totalSessions ?? 0}</span>
            <span className="text-muted-foreground/60 text-xs">sessions</span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ ROW 2: Milestones + Pyramid + Angle ═══════════ */}

      {/* Milestones - 2 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-3">
          Milestones
        </div>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all",
                m.achieved
                  ? "bg-white/10"
                  : "bg-white/5 opacity-40"
              )}
            >
              <span className={cn("text-lg", !m.achieved && "grayscale")}>
                {m.emoji}
              </span>
              <span className={cn(
                "text-[11px] font-medium",
                m.achieved ? "text-white" : "text-muted-foreground"
              )}>
                {m.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Grade Pyramid - 2 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">
          Grade Pyramid
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          {gradePyramid.length > 0 ? gradePyramid.map(({ grade, count }, i) => (
            <div key={grade} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-6 text-right font-mono">{grade}</span>
              <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
                <motion.div
                  className="h-full rounded bg-gradient-to-r from-purple-600 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxPyramidCount) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                />
              </div>
              <span className="text-[11px] font-bold text-purple-400 w-5 tabular-nums">{count}</span>
            </div>
          )) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              No sends yet
            </div>
          )}
        </div>
      </motion.div>

      {/* Angle Performance - 2 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="col-span-2 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">
          Angle Performance
        </div>
        <div className="grid grid-cols-2 gap-2">
          {angleLabels.map(({ key, icon, range }) => (
            <div key={key} className="text-center py-2 rounded-lg bg-white/5">
              <div className="text-lg mb-0.5">{icon}</div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">
                {anglePerformance[key] ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground">{key}</div>
              <div className="text-[9px] text-muted-foreground/50">{range}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════ ROW 3: Recent Sends + Session Calendar ═══════════ */}

      {/* Recent Sends - 3 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Recent Sends
          </span>
          <button
            onClick={() => setShowLogDialog(true)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Log
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {recentSends.length > 0 ? recentSends.map((climb, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                climb.attempts === 1
                  ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20"
                  : "bg-white/[0.02] border-white/5"
              )}
            >
              <div className="text-center flex-shrink-0 w-10">
                <div className="text-sm font-bold text-purple-400">{climb.grade}</div>
                <div className="text-[9px] text-muted-foreground">{climb.angle}°</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-white/90">{climb.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {climb.attempts === 1 ? (
                    <span className="text-emerald-400">⚡ Flash</span>
                  ) : (
                    <span>↻ {climb.attempts} tries</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground/60">{climb.date}</span>
            </motion.div>
          )) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No recent sends
            </div>
          )}
        </div>
      </motion.div>

      {/* Session Calendar - 3 cols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="col-span-3 glass-card rounded-xl p-4 bg-card/80 backdrop-blur-xl"
      >
        <SessionCalendar
          sessions={kilterStats?.sessions ?? []}
        />
      </motion.div>

      {/* ═══════════ ROW 4: Absurd Facts Ticker ═══════════ */}

      {kilterStats?.absurd && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-6"
        >
          <AbsurdFactsTicker absurd={kilterStats.absurd} />
        </motion.div>
      )}

      {/* Climbing Log Dialog */}
      <ClimbingLogDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        onSubmit={async (tick) => {
          await onCreateTick(tick);
        }}
        isSubmitting={isCreatingTick}
      />
    </div>
  );
}
