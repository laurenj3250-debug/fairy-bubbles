import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Trash2, Activity } from "lucide-react";
import { ClimbingLogDialog } from "@/components/ClimbingLogDialog";
import { EditableGoal } from "../shared";
import type { ClimbingStats } from "@/hooks/useClimbingStats";
import type { StravaClimbingStats } from "@/hooks/useStravaClimbingActivities";
import type { ClimbingTick, ClimbingTickInput, ClimbingLogStats } from "@/hooks/useClimbingLog";

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

export function ClimbingTab({ yearlyClimbsGoal, onUpdateGoal, isUpdating, kilterStats, isLoadingKilter, stravaClimbingStats, isLoadingStravaClimbing, climbingLogTicks, climbingLogStats, isLoadingClimbingLog, onCreateTick, onUpdateTick, onDeleteTick, isCreatingTick }: ClimbingTabProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [editingTick, setEditingTick] = useState<ClimbingTick | undefined>();

  // Check if we have real data (stats loaded successfully, even if 0 ticks)
  const isConnected = climbingLogStats !== undefined;
  const hasData = climbingLogStats && climbingLogStats.totalTicks > 0;

  // Use real data only - NO demo fallback (show empty state instead)
  const totalTicks = climbingLogStats?.totalTicks ?? 0;
  const outdoorDays = climbingLogStats?.outdoorDays ?? 0;

  // Use server-computed highest grades (no demo fallback)
  const highestRedpoint = climbingLogStats?.highestRouteGrade ?? "—";
  const highestBoulder = climbingLogStats?.highestBoulderGrade ?? "—";

  // Recent ticks - use real data only (no demo fallback)
  const recentTicksRaw = hasData ? climbingLogStats.recentTicks : [];
  const recentTicks = hasData
    ? climbingLogStats.recentTicks.map(tick => ({
        id: tick.id,
        name: tick.routeName,
        grade: tick.grade,
        routeType: tick.routeType.charAt(0).toUpperCase() + tick.routeType.slice(1),
        date: new Date(tick.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        style: tick.ascentStyle.charAt(0).toUpperCase() + tick.ascentStyle.slice(1),
        pitches: tick.pitches,
        stars: tick.stars || 3,
        location: tick.location || "Unknown",
      }))
    : [];

  // Grade parsing utility for sorting
  const parseYdsGrade = (g: string): number => {
    const match = g.match(/5\.(\d+)([a-d])?/);
    if (!match) return 0;
    return parseInt(match[1]) * 10 + (match[2] ? "abcd".indexOf(match[2]) : 0);
  };

  // Grade pyramid from real data (no demo fallback)
  const gradePyramid = hasData
    ? Object.entries(climbingLogStats.gradeDistribution)
        .filter(([g]) => g.startsWith("5."))
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => parseYdsGrade(a.grade) - parseYdsGrade(b.grade))
        .slice(-6)
    : [];

  // Style breakdown - calculate PERCENTAGES from counts (no demo fallback)
  const routeTypeCounts = hasData ? climbingLogStats.routeTypeDistribution : {};
  const totalRouteTypes = Object.values(routeTypeCounts).reduce((a, b) => a + b, 0) || 1;
  const styleBreakdown = {
    sport: Math.round(((routeTypeCounts.sport || 0) / totalRouteTypes) * 100),
    boulder: Math.round(((routeTypeCounts.boulder || 0) / totalRouteTypes) * 100),
    trad: Math.round(((routeTypeCounts.trad || 0) / totalRouteTypes) * 100),
  };

  const progressPercent = Math.round((totalTicks / yearlyClimbsGoal) * 100);
  const ticksRemaining = yearlyClimbsGoal - totalTicks;
  const monthsLeft = 12 - new Date().getMonth();
  const ticksPerMonth = Math.ceil(Math.max(0, ticksRemaining) / monthsLeft);

  // Grade pyramid colors
  const pyramidColors = ["#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c"];
  const maxPyramidCount = Math.max(...gradePyramid.map(g => g.count), 1);

  // Kilter data - use real data only, zeros if not connected
  const kilterConnected = kilterStats?.isConnected ?? false;
  const kilterHighestGrade = kilterStats?.maxGrade ?? "—";
  const kilterTotalClimbs = kilterStats?.totalProblemsSent ?? 0;
  const kilterTotalSessions = kilterStats?.totalSessions ?? 0;
  const kilterAvgAngle = kilterStats?.preferredAngle ? Math.round(kilterStats.preferredAngle) : 0;
  const kilterFlashRate = kilterStats?.flashRate ? Math.round(kilterStats.flashRate) : 0;
  const kilterSendRate = kilterStats?.sendRate ? Math.round(kilterStats.sendRate) : 0;
  const kilterAvgTries = kilterStats?.avgAttemptsPerSend ? Math.round(kilterStats.avgAttemptsPerSend * 10) / 10 : 0;

  // Convert grade distribution to array format for display - empty if not connected
  const kilterGradeBreakdown = kilterStats?.gradeDistribution
    ? Object.entries(kilterStats.gradeDistribution)
        .map(([grade, count]) => ({ grade, count, ascents: count }))
        .sort((a, b) => {
          // Sort by V-grade numerically
          const aNum = parseInt(a.grade.replace('V', '')) || 0;
          const bNum = parseInt(b.grade.replace('V', '')) || 0;
          return aNum - bNum;
        })
        .slice(-5) // Take top 5 grades
    : [];

  const maxKilterCount = Math.max(...kilterGradeBreakdown.map(g => g.count), 1);

  // Recent Kilter sessions - empty if not connected
  const recentKilterClimbs = kilterStats?.sessions?.slice(0, 4).flatMap(session =>
    (session.climbs || []).slice(0, 2).map(climb => ({
      climb_name: climb.name,
      angle: session.boardAngle || 40,
      logged_grade: climb.grade,
      displayed_grade: climb.grade,
      is_benchmark: false,
      tries: climb.attempts,
      sessions_count: 1,
      is_ascent: climb.sent,
      date: new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))
  ).slice(0, 4) ?? [];

  // Strava climbing data - use real data only (no demo fallback)
  const stravaConnected = stravaClimbingStats?.isConnected ?? false;
  const stravaHasClimbingActivities = stravaClimbingStats && stravaClimbingStats.totalActivities > 0;
  // Normalize to common format - empty state instead of demo
  const stravaThisWeek = stravaClimbingStats?.thisWeek ?? {
    activities: 0,
    timeHours: 0,
    calories: 0,
    elevationFt: 0,
  };
  const stravaThisMonth = stravaClimbingStats?.thisMonth ?? {
    activities: 0,
    timeHours: 0,
    calories: 0,
    elevationFt: 0,
  };
  const stravaRecentActivities = stravaClimbingStats?.recentActivities?.map(a => ({
    name: a.name,
    type: a.type,
    moving_time: a.durationMinutes,
    elapsed_time: a.durationMinutes,
    total_elevation_gain: a.elevationGain,
    start_date: a.date,
    location: a.location,
    calories: a.calories,
    average_heartrate: a.heartRate || 0,
  })) ?? [];

  const getRouteTypeIcon = (type: string) => {
    if (type === "Boulder") return "🪨";
    if (type === "Trad") return "⛰️";
    return "🧗";
  };

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_1fr_auto] gap-3 min-h-0">
      {/* ═══════════ ROW 1: Hero Stats ═══════════ */}

      {/* OUTDOOR HERO - Highest Redpoint (Climbing Log) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-orange-500" : "bg-gray-500")} />
              Outdoor Log
            </div>
            {isLoadingClimbingLog ? (
              <div className="text-5xl font-bold mt-1 text-orange-500/50">...</div>
            ) : hasData ? (
              <div className="text-5xl font-bold mt-1 text-orange-500">{highestRedpoint}</div>
            ) : (
              <div className="text-3xl font-bold mt-1 text-orange-500/50">No ticks yet</div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-emerald-400 font-semibold">{totalTicks} ticks</span>
              <span className="text-xs text-muted-foreground">logged</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-400">{hasData ? highestBoulder : "—"}</div>
            <div className="text-xs text-muted-foreground">Boulder</div>
          </div>
        </div>
        {/* Mini sparkline - only show when has data */}
        {hasData ? (
          <div className="mt-auto pt-3 relative z-10">
            <div className="flex items-end gap-1 h-6">
              {[4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 12].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 2}px`, background: i === 11 ? "#f97316" : "rgba(249, 115, 22, 0.3)" }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Jan</span><span>Nov</span></div>
          </div>
        ) : (
          <div className="mt-auto pt-3 relative z-10 text-center">
            <button
              onClick={() => setShowLogDialog(true)}
              className="text-sm px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
            >
              Log your first climb
            </button>
          </div>
        )}
      </div>

      {/* KILTER HERO - Highest Grade (BoardLib) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", kilterConnected ? "bg-purple-500" : "bg-gray-500")} />
              Kilter Board {!kilterConnected && <span className="text-yellow-500 text-[10px]">(Demo)</span>}
            </div>
            <div className="text-5xl font-bold mt-1 text-purple-500">{isLoadingKilter ? "..." : kilterHighestGrade}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-emerald-400 font-semibold">{kilterTotalClimbs} climbs</span>
              <span className="text-xs text-muted-foreground">{kilterTotalSessions} sessions</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-400">{kilterAvgAngle}°</div>
            <div className="text-xs text-muted-foreground">Avg Angle</div>
          </div>
        </div>
        {/* Angle distribution mini bars - only show if Kilter connected */}
        {kilterConnected && kilterTotalSessions > 0 && (
          <div className="mt-auto pt-3 relative z-10">
            <div className="text-xs text-muted-foreground mb-1">Preferred angle: {kilterAvgAngle}°</div>
          </div>
        )}
      </div>

      {/* REDPOINT/STRAVA - Activity Summary */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className={cn("w-2 h-2 rounded-full", stravaConnected ? "bg-cyan-500" : "bg-gray-500")} />
          Climbing via Strava {!stravaConnected && <span className="text-yellow-500 text-[10px]">(Not connected)</span>}
        </div>
        {stravaConnected && !stravaHasClimbingActivities ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <Activity className="w-8 h-8 text-cyan-500/40 mb-2" />
            <div className="text-sm text-muted-foreground">No climbing activities found</div>
            <div className="text-xs text-muted-foreground/70 mt-1">Log activities in Strava as "RockClimbing"</div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stravaThisWeek.timeHours}h</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{(stravaThisWeek.elevationFt / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">Elev (ft)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-400">{stravaThisWeek.activities}</div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">{stravaThisWeek.calories}</div>
              <div className="text-xs text-muted-foreground">Calories</div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ ROW 2: Recent Activity Columns ═══════════ */}

      {/* OUTDOOR TICKS (Climbing Log) */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-orange-500" : "bg-gray-500")} />
            Recent Ticks
          </div>
          <button
            onClick={() => setShowLogDialog(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Log
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {isLoadingClimbingLog ? (
            <div className="flex-1 flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-start gap-2 p-2 rounded-lg bg-muted/20">
                  <div className="w-6 h-6 rounded bg-muted/40" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted/40 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTicks.length > 0 ? recentTicks.map((tick) => (
            <div key={tick.id} className={cn("group flex items-start gap-2 p-2 rounded-lg border relative", tick.style === "Onsight" || tick.style === "Flash" ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30" : "bg-white/[0.02] border-border/20")}>
              <span className="text-base">{getRouteTypeIcon(tick.routeType)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{tick.name}</div>
                <div className="text-xs text-muted-foreground">{tick.grade} • {tick.style}</div>
                <div className="text-xs text-muted-foreground/70">{tick.location} • {"★".repeat(tick.stars)}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{tick.date}</span>
                {/* Edit/Delete buttons - only show for real data */}
                {hasData && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1 transition-opacity">
                    <button
                      onClick={() => {
                        const rawTick = recentTicksRaw.find(t => t.id === tick.id);
                        if (rawTick) {
                          setEditingTick(rawTick);
                          setShowLogDialog(true);
                        }
                      }}
                      className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${tick.name}"?`)) {
                          onDeleteTick(tick.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-4xl mb-2">🧗</div>
              <div className="text-sm text-muted-foreground">No ticks yet</div>
              <button
                onClick={() => setShowLogDialog(true)}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                Log Your First Climb
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KILTER RECENT (BoardLib) */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", kilterConnected ? "bg-purple-500" : "bg-gray-500")} />
          Kilter Sends
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {recentKilterClimbs.length > 0 ? recentKilterClimbs.map((climb, i) => (
            <div key={i} className={cn("flex items-start gap-2 p-2 rounded-lg border", climb.tries === 1 ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30" : "bg-white/[0.02] border-border/20")}>
              <div className="text-center flex-shrink-0">
                <div className="text-lg font-bold text-purple-400">{climb.logged_grade}</div>
                <div className="text-xs text-muted-foreground">{climb.angle}°</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{climb.climb_name}</div>
                <div className="text-xs text-muted-foreground">
                  {climb.tries === 1 ? "⚡ Flash" : `↻ ${climb.tries} tries`}
                  {climb.is_benchmark && <span className="ml-1 text-amber-400">★ BM</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{climb.date}</span>
            </div>
          )) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {kilterConnected ? "No recent climbs" : "Connect Kilter Board to see climbs"}
            </div>
          )}
        </div>
        {/* Kilter Stats Summary */}
        {kilterConnected && kilterTotalSessions > 0 && (
          <div className="border-t border-border/20 pt-2 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sessions</span>
              <span className="font-medium text-purple-400">{kilterTotalSessions}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Send Rate</span>
              <span className="font-medium text-emerald-400">{kilterSendRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* PROGRESS + STATS (Combined) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex gap-4 bg-card/80 backdrop-blur-xl">
        <div className="w-16 h-16 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progressPercent * 2.51} 251`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-orange-400">{progressPercent}%</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Outdoor Goal</div>
          <div className="text-sm flex items-center gap-1"><span className="font-semibold">{totalTicks}</span> / <EditableGoal value={yearlyClimbsGoal} unit="" goalKey="yearly_climbs" onUpdate={onUpdateGoal} isUpdating={isUpdating} /> ticks</div>
          <div className="text-xs text-emerald-400">Need {ticksPerMonth}/month</div>
          <div className="text-xs text-muted-foreground">{outdoorDays} outdoor days</div>
        </div>
      </div>

      {/* REDPOINT ACTIVITIES (Strava) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Recent Activities</div>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {stravaRecentActivities.length > 0 ? stravaRecentActivities.slice(0, 3).map((act, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-border/20">
              <div className="text-center flex-shrink-0 w-12">
                <div className="text-sm font-semibold text-cyan-400">{Math.round(act.moving_time)}m</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{act.name}</div>
                <div className="text-xs text-muted-foreground">{act.location}</div>
              </div>
              <div className="text-right">
                {act.total_elevation_gain > 0 && <div className="text-xs text-emerald-400">↑{Math.round(act.total_elevation_gain * 3.28084)}ft</div>}
                <div className="text-xs text-muted-foreground">{act.calories} cal</div>
              </div>
            </div>
          )) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {stravaConnected ? "No recent climbing activities" : "Connect Strava to see activities"}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ ROW 3: Pyramids & Breakdowns ═══════════ */}

      {/* OUTDOOR PYRAMID (Climbing Log) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-orange-500" : "bg-gray-500")} />
          Route Pyramid
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          {gradePyramid.map(({ grade, count }, i) => (
            <div key={grade} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right font-medium">{grade}</span>
              <div className="flex-1 h-3.5 bg-muted/30 rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${(count / maxPyramidCount) * 100}%`, background: pyramidColors[i] }} />
              </div>
              <span className="text-xs font-semibold w-6" style={{ color: pyramidColors[i] }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KILTER PYRAMID (BoardLib) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", kilterConnected ? "bg-purple-500" : "bg-gray-500")} />
          Kilter Pyramid
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          {kilterGradeBreakdown.map(({ grade, count, ascents }) => (
            <div key={grade} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8 text-right font-medium">{grade}</span>
              <div className="flex-1 h-3.5 bg-muted/30 rounded overflow-hidden relative">
                <div className="h-full rounded absolute" style={{ width: `${(count / maxKilterCount) * 100}%`, background: "rgba(168, 85, 247, 0.3)" }} />
                <div className="h-full rounded absolute" style={{ width: `${(ascents / maxKilterCount) * 100}%`, background: "#a855f7" }} />
              </div>
              <span className="text-xs font-semibold w-10 text-purple-400">{ascents}/{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STYLE BREAKDOWN (Climbing Log) */}
      <div className="col-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Style Mix</div>
        <div className="flex-1 flex flex-col justify-center gap-2">
          {[
            { label: "Sport", value: styleBreakdown.sport, color: "#f97316" },
            { label: "Boulder", value: styleBreakdown.boulder, color: "#a855f7" },
            { label: "Trad", value: styleBreakdown.trad, color: "#06b6d4" },
          ].map((style) => (
            <div key={style.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: style.color }} />
              <span className="text-xs text-muted-foreground flex-1">{style.label}</span>
              <span className="text-sm font-medium" style={{ color: style.color }}>{style.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* KILTER STATS (BoardLib) */}
      <div className="col-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Kilter Stats</div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Flash</span>
            <span className="font-semibold text-emerald-400">{kilterFlashRate}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Send</span>
            <span className="font-semibold text-purple-400">{kilterSendRate}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Tries</span>
            <span className="font-semibold text-cyan-400">{kilterAvgTries}</span>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 4: Bottom Stats Bar ═══════════ */}

      {/* STRAVA CLIMBING STATS */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Strava Climbing Summary</div>
        {stravaConnected && stravaHasClimbingActivities ? (
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stravaClimbingStats?.totalActivities ?? 0}</div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stravaClimbingStats?.totalTimeHours?.toFixed(1) ?? 0}h</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{((stravaClimbingStats?.thisMonth.elevationFt ?? 0) / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">Monthly Elev (ft)</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {stravaConnected ? "No climbing activities in Strava" : "Connect Strava to see climbing stats"}
          </div>
        )}
      </div>

      {/* QUICK STATS */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "Outdoor Days", value: outdoorDays.toString(), color: "#06b6d4" },
          { label: "Total Ticks", value: totalTicks.toString(), color: "#10b981" },
          { label: "This Month", value: stravaThisMonth.activities.toString(), color: "#f97316" },
          { label: "This Week", value: stravaThisWeek.activities.toString(), color: "#a855f7" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Climbing Log Dialog */}
      <ClimbingLogDialog
        open={showLogDialog}
        onOpenChange={(open) => {
          setShowLogDialog(open);
          if (!open) setEditingTick(undefined); // Clear editing state when closing
        }}
        onSubmit={async (tick) => {
          if (editingTick) {
            await onUpdateTick({ id: editingTick.id, ...tick });
          } else {
            await onCreateTick(tick);
          }
          setEditingTick(undefined);
        }}
        editingTick={editingTick}
        isSubmitting={isCreatingTick}
      />
    </div>
  );
}
