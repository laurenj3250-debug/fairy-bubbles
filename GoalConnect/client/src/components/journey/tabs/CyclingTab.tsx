import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { EditableGoal } from "../shared";

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
  // Use only real Strava data - zeros if not connected
  const isConnected = stravaStats?.isConnected ?? false;
  const actualMiles = stravaStats?.ytdMiles ?? 0;
  const elevation = stravaStats?.ytdElevationFt ?? 0;
  const ytdRides = stravaStats?.ytdRides ?? 0;
  const ytdHours = stravaStats?.ytdHours ?? 0;
  const recentMiles = stravaStats?.recentMiles ?? 0;
  const recentRides = stravaStats?.recentRides ?? 0;
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
          <Activity className="w-12 h-12 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Connect Strava</h3>
          <p className="text-muted-foreground max-w-sm">
            Connect your Strava account to see your cycling stats, track progress toward your goals, and auto-complete habits.
          </p>
        </div>
        <a
          href="/import"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          Connect Strava
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_auto] gap-3 min-h-0">
      {/* ═══════════ ROW 1: Hero Stats ═══════════ */}

      {/* HERO - Yearly Miles (Strava) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Strava • Yearly Miles
            </div>
            <div className="text-5xl font-bold mt-1 text-cyan-500">{actualMiles.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-sm font-semibold", aheadOfPace >= 0 ? "text-emerald-400" : "text-red-400")}>{aheadOfPace >= 0 ? "+" : ""}{aheadOfPace} mi {aheadOfPace >= 0 ? "ahead" : "behind"}</span>
              <span className="text-xs text-muted-foreground">of pace</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">{(elevation / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Elev (ft)</div>
          </div>
        </div>
      </div>

      {/* GOAL PROGRESS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Annual Goal Progress
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
            <div className={cn("text-xs mt-1", aheadOfPace >= 0 ? "text-emerald-400" : "text-red-400")}>{aheadOfPace >= 0 ? "+" : ""}{aheadOfPace} mi {aheadOfPace >= 0 ? "ahead" : "behind"} of pace</div>
            <div className="text-xs text-muted-foreground">Need {milesPerWeek} mi/week</div>
          </div>
        </div>
      </div>

      {/* THIS WEEK / RECENT SUMMARY */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Recent (4 weeks)
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{recentMiles}</div>
            <div className="text-xs text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{recentRides}</div>
            <div className="text-xs text-muted-foreground">Rides</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: Stats ═══════════ */}

      {/* YTD SUMMARY */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Year to Date
        </div>
        <div className="flex-1 flex items-center justify-around">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{actualMiles.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{ytdRides}</div>
            <div className="text-xs text-muted-foreground">Rides</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{ytdHours}h</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{(elevation / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Elev (ft)</div>
          </div>
        </div>
      </div>

      {/* AVERAGES */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Averages</div>
        <div className="flex-1 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{avgMilesPerRide}</div>
            <div className="text-xs text-muted-foreground">Mi/Ride</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{ytdRides > 0 ? (ytdHours / ytdRides).toFixed(1) : 0}h</div>
            <div className="text-xs text-muted-foreground">Time/Ride</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{ytdRides > 0 ? Math.round(elevation / ytdRides).toLocaleString() : 0}</div>
            <div className="text-xs text-muted-foreground">Elev/Ride</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 3: Bottom Stats ═══════════ */}

      {/* ALL-TIME STATS */}
      <div className="col-span-6 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "YTD Rides", value: ytdRides.toString(), color: "#06b6d4" },
          { label: "YTD Hours", value: `${ytdHours}h`, color: "#f97316" },
          { label: "Avg/Ride", value: `${avgMilesPerRide}mi`, color: "#a855f7" },
          { label: "Goal Progress", value: `${progressPercent}%`, color: "#10b981" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
