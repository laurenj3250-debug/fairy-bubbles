import { cn } from "@/lib/utils";
import { Activity, Bike, Flame, Mountain, Timer, TrendingUp, Trophy, Zap } from "lucide-react";
import { EditableGoal } from "../shared";
import { useStravaActivities } from "@/hooks/useStravaActivities";

interface CyclingTabProps {
  yearlyGoal: number;
  stravaStats: {
    isConnected?: boolean;
    ytdMiles?: number;
    ytdElevationFt?: number;
    ytdRides?: number;
    ytdHours?: number;
    recentMiles?: number;
    recentRides?: number;
    avgMilesPerRide?: number;
  } | null;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

export function CyclingTab({ yearlyGoal, stravaStats, onUpdateGoal, isUpdating }: CyclingTabProps) {
  const { stats: activityStats, isLoading: isLoadingActivities } = useStravaActivities();

  // Use only real Strava data - zeros if not connected
  const isConnected = stravaStats?.isConnected ?? false;
  const actualMiles = stravaStats?.ytdMiles ?? 0;
  const elevation = stravaStats?.ytdElevationFt ?? 0;
  const ytdRides = stravaStats?.ytdRides ?? 0;
  const ytdHours = stravaStats?.ytdHours ?? 0;
  const avgMilesPerRide = stravaStats?.avgMilesPerRide ?? 0;

  const progressPercent = yearlyGoal > 0 ? Math.round((actualMiles / yearlyGoal) * 100) : 0;
  const milesRemaining = yearlyGoal - actualMiles;
  const weeksLeft = Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000));
  const milesPerWeek = Math.round(Math.max(0, milesRemaining) / Math.max(1, weeksLeft));
  const aheadOfPace = Math.round(actualMiles - (yearlyGoal * (new Date().getMonth() + 1) / 12));

  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center">
          <Bike className="w-12 h-12 text-cyan-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Connect Strava</h3>
          <p className="text-muted-foreground max-w-sm">
            Connect your Strava account to see your cycling stats, track progress toward your goals, and auto-complete habits.
          </p>
        </div>
        <a
          href="/import"
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
        >
          Connect Strava
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_auto] gap-3 min-h-0">
      {/* ═══════════ ROW 1: Hero Stats ═══════════ */}

      {/* HERO - Yearly Miles */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              YTD Miles
            </div>
            <div className="text-5xl font-bold mt-1 text-cyan-500">{actualMiles.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-sm font-semibold", aheadOfPace >= 0 ? "text-emerald-400" : "text-red-400")}>
                {aheadOfPace >= 0 ? "+" : ""}{aheadOfPace} mi
              </span>
              <span className="text-xs text-muted-foreground">{aheadOfPace >= 0 ? "ahead" : "behind"}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">{(elevation / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Elev (ft)</div>
          </div>
        </div>
      </div>

      {/* GOAL PROGRESS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Goal Progress
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.min(progressPercent, 100) * 2.51} 251`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-cyan-400">{progressPercent}%</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm flex items-center gap-1">
              <span className="font-semibold">{actualMiles.toLocaleString()}</span> /
              <EditableGoal value={yearlyGoal} unit="mi" goalKey="yearly_miles" onUpdate={onUpdateGoal} isUpdating={isUpdating} />
            </div>
            <div className={cn("text-xs mt-1", aheadOfPace >= 0 ? "text-emerald-400" : "text-red-400")}>
              {aheadOfPace >= 0 ? "+" : ""}{aheadOfPace} mi {aheadOfPace >= 0 ? "ahead" : "behind"} of pace
            </div>
            <div className="text-xs text-muted-foreground">Need {milesPerWeek} mi/week</div>
          </div>
        </div>
      </div>

      {/* STREAK & THIS WEEK */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          This Week
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{activityStats?.thisWeekMiles || 0}</div>
            <div className="text-xs text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {activityStats?.activeWeeksStreak || 0}
            </div>
            <div className="text-xs text-muted-foreground">Week Streak</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: Recent Rides & Stats ═══════════ */}

      {/* RECENT RIDES */}
      <div className="col-span-4 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Recent Rides
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {isLoadingActivities ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Loading rides...
            </div>
          ) : activityStats?.recentActivities && activityStats.recentActivities.length > 0 ? (
            activityStats.recentActivities.slice(0, 5).map((ride) => (
              <div
                key={ride.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30",
                  ride.isPR
                    ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30"
                    : "bg-white/[0.02] border-border/20"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Bike className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{ride.name}</span>
                    {ride.isPR && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">PR</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{ride.dateFormatted}</span>
                    <span>•</span>
                    <span>{ride.durationFormatted}</span>
                    {ride.location && (
                      <>
                        <span>•</span>
                        <span className="truncate">{ride.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-semibold text-cyan-400">{ride.distanceMiles} mi</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3" />
                    {ride.avgSpeedMph} mph
                    {ride.elevationFt > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <Mountain className="w-3 h-3" />
                        {ride.elevationFt}ft
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Bike className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <div className="text-sm text-muted-foreground">No recent rides</div>
              <div className="text-xs text-muted-foreground/70 mt-1">Your Strava rides will appear here</div>
            </div>
          )}
        </div>
      </div>

      {/* PERSONAL BESTS */}
      <div className="col-span-2 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          Personal Bests
        </div>
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Bike className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-sm text-muted-foreground">Longest</span>
            </div>
            <span className="text-lg font-bold text-cyan-400">{activityStats?.longestRide || 0} mi</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Fastest</span>
            </div>
            <span className="text-lg font-bold text-orange-400">{activityStats?.fastestAvgSpeed || 0} mph</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mountain className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Most Climb</span>
            </div>
            <span className="text-lg font-bold text-emerald-400">{activityStats?.mostElevation?.toLocaleString() || 0} ft</span>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 3: Bottom Stats ═══════════ */}

      {/* THIS MONTH */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">This Month</div>
        <div className="flex-1 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{activityStats?.thisMonthMiles || 0}</div>
            <div className="text-xs text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{activityStats?.thisMonthRides || 0}</div>
            <div className="text-xs text-muted-foreground">Rides</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{Math.round((activityStats?.thisMonthTime || 0) / 60)}h</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{((activityStats?.thisMonthElevation || 0) / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Elev (ft)</div>
          </div>
        </div>
      </div>

      {/* YTD SUMMARY */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "YTD Rides", value: ytdRides.toString(), color: "#06b6d4", icon: Bike },
          { label: "YTD Hours", value: `${ytdHours}h`, color: "#f97316", icon: Timer },
          { label: "Avg/Ride", value: `${avgMilesPerRide}mi`, color: "#a855f7", icon: TrendingUp },
          { label: "Goal", value: `${progressPercent}%`, color: "#10b981", icon: Trophy },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xl font-bold flex items-center justify-center gap-1" style={{ color: stat.color }}>
              <stat.icon className="w-4 h-4" />
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
