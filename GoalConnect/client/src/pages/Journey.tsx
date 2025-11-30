import { useState } from "react";
import { cn } from "@/lib/utils";
import { useJourneyGoals } from "@/hooks/useJourneyGoals";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats, type ClimbingStats } from "@/hooks/useClimbingStats";
import { useStravaClimbingActivities, type StravaClimbingStats } from "@/hooks/useStravaClimbingActivities";
import { useClimbingLog, type ClimbingTick, type ClimbingTickInput, type ClimbingLogStats } from "@/hooks/useClimbingLog";
import { ClimbingLogDialog } from "@/components/ClimbingLogDialog";
import { Pencil, Check, X, Loader2, Plus, Trash2, Activity } from "lucide-react";

type ActivityTab = "cycling" | "lifting" | "climbing";

// Mock data - in production this would come from API/integrations
const cyclingData = {
  yearlyMiles: 2847,
  yearlyGoal: 4000,
  aheadOfPace: 429,
  elevation: 142000,
  centuries: 3,
  dayStreak: 12,
  monthlyMiles: [184, 156, 252, 308, 368, 400, 388, 360, 284, 224, 124, 16],
  segmentPRs: [
    { name: "Hawk Hill Climb", distance: "1.2 mi", grade: "6.8%", time: "8:42", rank: 1 },
    { name: "Paradise Sprint", distance: "0.8 mi", grade: "flat", time: "2:15", rank: 2 },
    { name: "Camino Alto", distance: "2.1 mi", grade: "5.2%", time: "12:08", rank: 3 },
  ],
  weeklySpeed: 17.8,
  speedChange: 8,
  speedTrend: "+2.1 mph",
  speedTrendPercent: 13,
  rideTypes: { road: 50, gravel: 30, mtb: 20 },
  recentStats: { today: 32, thisWeek: 148, avgPerWeek: 78 },
};

// LIFTOSAUR DATA (workout logging app)
// Available: exercises, sets, reps, weight, 1RM estimates, programs, history, PRs, volume
const liftosaurData = {
  // PRs with full context
  prs: {
    deadlift: { weight: 405, date: "Nov 15", previous: 385, percentGain: 5.2, isRecent: true },
    squat: { weight: 315, date: "Oct 28", previous: 295, percentGain: 6.8, isRecent: false },
    bench: { weight: 225, date: "Nov 8", previous: 215, percentGain: 4.7, isRecent: true },
  },
  total: 945, // Combined 1RM (405+315+225)
  totalGoal: 1000, // 1000lb club goal
  // Volume tracking
  totalVolume: 892000, // lbs this year
  monthlyVolume: [62000, 68000, 74000, 71000, 78000, 85000, 82000, 88000, 76000, 82000, 72000, 54000],
  volumeByLift: { deadlift: 312000, squat: 298000, bench: 186000, accessories: 96000 },
  avgVolumePerWorkout: 5718,
  // Workout history
  yearlyWorkouts: 156,
  yearlyGoal: 200,
  monthlyWorkouts: [12, 14, 16, 13, 15, 18, 14, 16, 12, 14, 11, 4],
  weekStreak: 8,
  bestStreak: 12,
  consistencyScore: 87, // % of planned workouts completed
  targetDaysHit: 26, // out of 30
  // Muscle group distribution (from exercise selection)
  muscleGroups: { upper: 42, lower: 35, core: 23 },
  detailedMuscles: {
    chest: 15, back: 13, shoulders: 8, arms: 6, // upper = 42
    quads: 14, hamstrings: 12, glutes: 9, // lower = 35
    abs: 15, obliques: 8, // core = 23
  },
  // Recent workouts
  recentWorkouts: [
    { name: "Push Day A", date: "Nov 20", exercises: 6, volume: 8420, duration: 72, prs: 1 },
    { name: "Pull Day A", date: "Nov 18", exercises: 5, volume: 9150, duration: 68, prs: 0 },
    { name: "Leg Day", date: "Nov 16", exercises: 7, volume: 12800, duration: 85, prs: 2 },
  ],
  // Program info
  currentProgram: "PPL 6-Day",
  programWeek: 8,
};

// STRAVA DATA (activity tracking for gym sessions)
// Available: name, type, elapsed_time, calories, average_heartrate, start_date
const stravaLiftingData = {
  totalActivities: 156,
  totalTime: 187, // hours
  avgDuration: 72, // minutes
  totalCalories: 78000,
  avgCaloriesPerWorkout: 500,
  avgHeartrate: 118,
  thisWeek: {
    workouts: 4,
    time: 4.8, // hours
    calories: 2100,
  },
  thisMonth: {
    workouts: 14,
    time: 16.8, // hours
    calories: 7200,
  },
  monthlyDuration: [14, 16, 18, 15, 17, 20, 16, 18, 14, 16, 13, 10], // hours per month
  recentActivities: [
    { name: "Morning Lift - Push", type: "Weight Training", elapsed_time: 72, calories: 520, average_heartrate: 122, start_date: "Nov 20" },
    { name: "Evening Pull Session", type: "Weight Training", elapsed_time: 68, calories: 485, average_heartrate: 115, start_date: "Nov 18" },
    { name: "Leg Day Destroyer", type: "Weight Training", elapsed_time: 85, calories: 680, average_heartrate: 128, start_date: "Nov 16" },
  ],
};

// OUTDOOR CLIMBING DATA (from Mountain Project)
// Available via MP: user ticks (name, date, type, grade, pitches, notes, style, lead_style, route_type, rating, stars)
const outdoorClimbingData = {
  highestRedpoint: "5.12a",
  highestBoulder: "V8",
  totalTicks: 234,
  yearlyGoal: 300,
  outdoorDays: 28,
  monthlyTicks: [18, 22, 24, 20, 28, 32, 24, 22, 18, 14, 8, 4],
  recentTicks: [
    { name: "The Nose (variation)", grade: "5.12a", routeType: "Sport", date: "Oct 22", style: "Redpoint", pitches: 1, stars: 4, location: "Smith Rock" },
    { name: "Crimson Chrysalis", grade: "5.11c", routeType: "Sport", date: "Nov 5", style: "Flash", pitches: 1, stars: 5, location: "Red Rocks" },
    { name: "Midnight Lightning", grade: "V8", routeType: "Boulder", date: "Nov 12", style: "Send", pitches: 1, stars: 5, location: "Yosemite" },
    { name: "Snake Dike", grade: "5.7 R", routeType: "Trad", date: "Sep 18", style: "Onsight", pitches: 8, stars: 5, location: "Half Dome" },
    { name: "Separate Reality", grade: "5.11d", routeType: "Trad", date: "Nov 18", style: "Redpoint", pitches: 1, stars: 4, location: "Yosemite" },
  ],
  // MP pyramid from ticks
  gradePyramid: [
    { grade: "5.10d", count: 52 },
    { grade: "5.11a", count: 38 },
    { grade: "5.11b", count: 24 },
    { grade: "5.11c", count: 15 },
    { grade: "5.11d", count: 8 },
    { grade: "5.12a", count: 2 },
  ],
  styleBreakdown: { sport: 45, boulder: 38, trad: 17 },
};

// KILTER BOARD DATA (from BoardLib)
// Available: board, angle, climb_name, date, logged_grade, displayed_grade, is_benchmark, tries, sessions_count, tries_total, is_ascent, comment
const kilterData = {
  board: "Kilter Board",
  totalClimbs: 847,
  totalSessions: 106,
  highestGrade: "V10",
  avgAngle: 40,
  recentClimbs: [
    { climb_name: "Crimper King", angle: 45, logged_grade: "V8", displayed_grade: "V8", is_benchmark: true, tries: 3, sessions_count: 2, is_ascent: true, date: "Nov 20" },
    { climb_name: "The Pinch", angle: 40, logged_grade: "V7", displayed_grade: "V7", is_benchmark: false, tries: 1, sessions_count: 1, is_ascent: true, date: "Nov 19" },
    { climb_name: "Moon Problem", angle: 50, logged_grade: "V9", displayed_grade: "V9", is_benchmark: true, tries: 12, sessions_count: 4, is_ascent: true, date: "Nov 18" },
    { climb_name: "Slab Master", angle: 20, logged_grade: "V6", displayed_grade: "V6", is_benchmark: false, tries: 1, sessions_count: 1, is_ascent: true, date: "Nov 17" },
  ],
  projects: [
    { climb_name: "Project X", angle: 45, displayed_grade: "V10", tries_total: 24, sessions_count: 6, is_ascent: false },
    { climb_name: "Dyno Destroyer", angle: 40, displayed_grade: "V9", tries_total: 15, sessions_count: 4, is_ascent: false },
  ],
  gradeBreakdown: [
    { grade: "V6", count: 89, ascents: 89 },
    { grade: "V7", count: 65, ascents: 58 },
    { grade: "V8", count: 42, ascents: 34 },
    { grade: "V9", count: 18, ascents: 12 },
    { grade: "V10", count: 8, ascents: 2 },
  ],
  angleStats: [
    { angle: 20, count: 120, label: "Slab" },
    { angle: 30, count: 180, label: "Vert" },
    { angle: 40, count: 320, label: "Overhang" },
    { angle: 45, count: 180, label: "45°" },
    { angle: 50, count: 47, label: "Steep" },
  ],
  flashRate: 42,
  sendRate: 78,
  avgTries: 3.2,
};

// REDPOINT DATA (syncs to Strava - climbing activity tracking)
// Available via Strava API: name, type, distance, moving_time, elapsed_time, total_elevation_gain, start_date, location_city, location_state, average_heartrate, max_heartrate, calories, description
const redpointData = {
  totalActivities: 156,
  totalTime: 312, // hours
  totalElevation: 48500, // feet
  avgSessionDuration: 120, // minutes
  monthlyActivities: [12, 14, 16, 13, 15, 18, 14, 16, 12, 14, 11, 4],
  recentActivities: [
    { name: "Smith Rock Session", type: "Rock Climbing", moving_time: 180, elapsed_time: 240, total_elevation_gain: 1200, start_date: "Nov 20", location: "Smith Rock, OR", calories: 890, average_heartrate: 128 },
    { name: "Movement Gym", type: "Indoor Climbing", moving_time: 90, elapsed_time: 120, total_elevation_gain: 0, start_date: "Nov 18", location: "Denver, CO", calories: 450, average_heartrate: 115 },
    { name: "Red Rocks Trip", type: "Rock Climbing", moving_time: 300, elapsed_time: 480, total_elevation_gain: 2400, start_date: "Nov 15", location: "Las Vegas, NV", calories: 1450, average_heartrate: 135 },
  ],
  thisWeek: {
    activities: 4,
    time: 8.5, // hours
    elevation: 3200,
    calories: 2100,
  },
  thisMonth: {
    activities: 14,
    time: 28, // hours
    elevation: 12400,
    calories: 7200,
  },
  avgHeartrate: 124,
  caloriesPerSession: 520,
};

// ============== EDITABLE GOAL COMPONENT ==============
interface EditableGoalProps {
  value: number;
  unit: string;
  goalKey: string;
  onUpdate: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

function EditableGoal({ value, unit, goalKey, onUpdate, isUpdating }: EditableGoalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = async () => {
    const newValue = parseInt(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      await onUpdate(goalKey, newValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-20 px-2 py-0.5 text-sm bg-background/50 border border-border rounded"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <button onClick={handleSave} className="p-0.5 hover:bg-emerald-500/20 rounded transition-colors">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button onClick={handleCancel} className="p-0.5 hover:bg-red-500/20 rounded transition-colors">
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-1 hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors"
    >
      <span>{value.toLocaleString()} {unit}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}

export default function Journey() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("cycling");
  const { targets, updateGoal, isUpdating, isLoading: isLoadingGoals } = useJourneyGoals();
  const { stats: stravaStats, isLoading: isLoadingStrava } = useStravaStats();
  const { stats: kilterStats, isLoading: isLoadingKilter } = useClimbingStats();
  const { stats: stravaClimbingStats, isLoading: isLoadingStravaClimbing } = useStravaClimbingActivities();
  const { ticks: climbingLogTicks, stats: climbingLogStats, isLoading: isLoadingClimbingLog, createTick, updateTick, deleteTick, isCreating } = useClimbingLog();

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: "lifting", label: "Lifting" },
    { id: "climbing", label: "Climbing" },
    { id: "cycling", label: "Cycling" },
  ];

  // Helper to update goal by key
  const handleUpdateGoal = async (goalKey: string, value: number) => {
    await updateGoal({ goalKey, targetValue: value });
  };

  return (
    <div className="h-screen flex flex-col p-5 overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <nav className="flex items-center justify-between pb-4 mb-4 border-b border-border/30 flex-shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Journey</h1>
        <div className="flex gap-1 bg-card/40 backdrop-blur-xl p-1 rounded-xl border border-border/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              style={activeTab === tab.id ? { textShadow: "0 0 10px rgba(255,255,255,0.3)" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      {activeTab === "cycling" && (
        <CyclingTab
          yearlyGoal={targets.cyclingMiles}
          stravaStats={stravaStats}
          onUpdateGoal={handleUpdateGoal}
          isUpdating={isUpdating}
        />
      )}
      {activeTab === "lifting" && (
        <LiftingTab
          yearlyWorkoutsGoal={targets.liftingWorkouts}
          totalLiftGoal={targets.liftingTotal}
          stravaStats={stravaStats}
          onUpdateGoal={handleUpdateGoal}
          isUpdating={isUpdating}
        />
      )}
      {activeTab === "climbing" && (
        <ClimbingTab
          yearlyClimbsGoal={targets.climbingTicks}
          onUpdateGoal={handleUpdateGoal}
          isUpdating={isUpdating}
          kilterStats={kilterStats}
          isLoadingKilter={isLoadingKilter}
          stravaClimbingStats={stravaClimbingStats}
          isLoadingStravaClimbing={isLoadingStravaClimbing}
          climbingLogTicks={climbingLogTicks}
          climbingLogStats={climbingLogStats}
          isLoadingClimbingLog={isLoadingClimbingLog}
          onCreateTick={createTick}
          onUpdateTick={updateTick}
          onDeleteTick={deleteTick}
          isCreatingTick={isCreating}
        />
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// ============== CYCLING TAB ==============
interface CyclingTabProps {
  yearlyGoal: number;
  stravaStats: any; // StravaStats type from hook
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

function CyclingTab({ yearlyGoal, stravaStats, onUpdateGoal, isUpdating }: CyclingTabProps) {
  // Use Strava data if available, otherwise fall back to mock data
  const actualMiles = stravaStats?.ytdMiles ?? cyclingData.yearlyMiles;
  const elevation = stravaStats?.ytdElevationFt ?? cyclingData.elevation;
  const progressPercent = Math.round((actualMiles / yearlyGoal) * 100);
  const milesRemaining = yearlyGoal - actualMiles;
  const weeksLeft = Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000));
  const milesPerWeek = Math.round(Math.max(0, milesRemaining) / weeksLeft);
  const aheadOfPace = Math.round(actualMiles - (yearlyGoal * (new Date().getMonth() + 1) / 12));
  const maxMonthlyMiles = Math.max(...cyclingData.monthlyMiles);

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_1fr_auto] gap-3 min-h-0">
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
        {/* Progression sparkline */}
        <div className="mt-auto pt-3 relative z-10">
          <div className="flex items-end gap-1 h-6">
            {cyclingData.monthlyMiles.map((m, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${(m / maxMonthlyMiles) * 24}px`, background: i === new Date().getMonth() ? "#06b6d4" : "rgba(6, 182, 212, 0.3)" }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Jan</span><span>Dec</span></div>
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
              <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progressPercent * 2.51} 251`} />
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
        {/* Ride type breakdown */}
        <div className="flex gap-3 mt-3 pt-2 border-t border-border/20">
          {[
            { type: "Road", pct: cyclingData.rideTypes.road, color: "#06b6d4" },
            { type: "Gravel", pct: cyclingData.rideTypes.gravel, color: "#f97316" },
            { type: "MTB", pct: cyclingData.rideTypes.mtb, color: "#a855f7" },
          ].map((r) => (
            <div key={r.type} className="flex-1 text-center">
              <div className="text-lg font-bold" style={{ color: r.color }}>{r.pct}%</div>
              <div className="text-xs text-muted-foreground">{r.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* THIS WEEK SUMMARY */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          This Week
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{cyclingData.recentStats.thisWeek}</div>
            <div className="text-xs text-muted-foreground">Miles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">12.4k</div>
            <div className="text-xs text-muted-foreground">Elev (ft)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-400">{cyclingData.dayStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-400">3</div>
            <div className="text-xs text-muted-foreground">Centuries</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: PRs + Recent ═══════════ */}

      {/* SEGMENT PRS (Strava) - Tall Card */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Segment PRs
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {cyclingData.segmentPRs.map((pr, i) => (
            <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg border", i === 0 ? "bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/40" : "bg-white/[0.02] border-border/20")}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: i === 0 ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "hsl(var(--muted))", color: i === 0 ? "#78350f" : "inherit" }}>
                {i === 0 ? "🥇" : pr.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{pr.name}</div>
                <div className="text-xs text-muted-foreground">{pr.distance} • {pr.grade}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400">{pr.time}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Speed stats */}
        <div className="border-t border-border/20 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Avg Speed</span>
            <span className="text-sm font-medium text-cyan-400">{cyclingData.weeklySpeed} mph</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Trend</span>
            <span className="text-sm font-semibold text-emerald-400">{cyclingData.speedTrend}</span>
          </div>
        </div>
      </div>

      {/* RECENT RIDES */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Recent Rides
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {[
            { name: "Morning Commute", distance: 32, elevation: 1200, time: "1:48", date: "Today", type: "Road" },
            { name: "Gravel Adventure", distance: 45, elevation: 2800, time: "3:15", date: "Nov 21", type: "Gravel" },
            { name: "MTB Trail Loop", distance: 18, elevation: 1600, time: "1:32", date: "Nov 20", type: "MTB" },
          ].map((ride, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-white/[0.02] border-border/20">
              <div className="text-center flex-shrink-0">
                <div className="text-lg font-bold text-cyan-400">{ride.distance}</div>
                <div className="text-xs text-muted-foreground">mi</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ride.name}</div>
                <div className="text-xs text-muted-foreground">{ride.type} • {ride.time}</div>
                <div className="text-xs text-muted-foreground">↑{ride.elevation} ft</div>
              </div>
              <span className="text-xs text-muted-foreground">{ride.date}</span>
            </div>
          ))}
        </div>
        {/* Finish projection */}
        <div className="border-t border-border/20 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Projected Finish</span>
            <span className="text-sm font-medium text-emerald-400">Dec 8 (3 weeks early!)</span>
          </div>
        </div>
      </div>

      {/* ELEVATION STATS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex gap-4 bg-card/80 backdrop-blur-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-400">142k</div>
          <div className="text-xs text-muted-foreground">Total Elev (ft)</div>
        </div>
        <div className="flex-1 border-l border-border/20 pl-4">
          <div className="text-sm text-emerald-400 font-medium">14 Everests climbed!</div>
          <div className="text-xs text-muted-foreground mt-1">Avg: 1,180 ft/ride</div>
          <div className="flex items-end gap-1 mt-2 h-5">
            {[8, 10, 12, 10, 14, 16, 14, 12, 10, 12, 8, 6].map((v, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${v * 1.5}px`, background: i === new Date().getMonth() ? "#f97316" : "rgba(249, 115, 22, 0.3)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* SPEED PERFORMANCE */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Speed Performance</div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{cyclingData.weeklySpeed}</div>
            <div className="text-xs text-muted-foreground">mph avg</div>
          </div>
          <div className="flex-1 border-l border-border/20 pl-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-400 font-semibold">{cyclingData.speedTrend}</span>
              <span className="px-1.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded">+{cyclingData.speedTrendPercent}%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs last month</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 3: Charts ═══════════ */}

      {/* MONTHLY MILES CHART */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          Monthly Miles
        </div>
        <div className="flex-1 flex items-end gap-1.5 min-h-[70px]">
          {cyclingData.monthlyMiles.map((miles, i) => {
            const height = `${(miles / maxMonthlyMiles) * 100}%`;
            const isCurrentMonth = i === new Date().getMonth();
            const avgMiles = cyclingData.monthlyMiles.reduce((a, b) => a + b, 0) / 12;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t transition-all hover:brightness-125" style={{ height, minHeight: "4px", background: isCurrentMonth ? "#06b6d4" : miles > avgMiles ? "#10b981" : "#0891b2", opacity: i > new Date().getMonth() ? 0.3 : 1 }} />
                <span className="text-xs text-muted-foreground mt-1">{"JFMAMJJASOND"[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/20">
          <span>Total: {actualMiles.toLocaleString()} mi</span>
          <span>Avg: {Math.round(cyclingData.monthlyMiles.reduce((a, b) => a + b, 0) / 12)} mi/month</span>
        </div>
      </div>

      {/* RIDE TYPE DONUT */}
      <div className="col-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Ride Types</div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {[
            { type: "Road", pct: cyclingData.rideTypes.road, color: "#06b6d4" },
            { type: "Gravel", pct: cyclingData.rideTypes.gravel, color: "#f97316" },
            { type: "MTB", pct: cyclingData.rideTypes.mtb, color: "#a855f7" },
          ].map((r) => (
            <div key={r.type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
              <span className="text-xs text-muted-foreground flex-1">{r.type}</span>
              <span className="text-xs font-medium" style={{ color: r.color }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIDE TYPE DONUT VISUAL */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex gap-3 bg-card/80 backdrop-blur-xl">
        <div className="w-20 h-20 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Road - 50% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#06b6d4" strokeWidth="14" strokeDasharray={`${50 * 2.01} 201`} strokeDashoffset="0" />
            {/* Gravel - 30% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#f97316" strokeWidth="14" strokeDasharray={`${30 * 2.01} 201`} strokeDashoffset={`${-50 * 2.01}`} />
            {/* MTB - 20% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#a855f7" strokeWidth="14" strokeDasharray={`${20 * 2.01} 201`} strokeDashoffset={`${-(50 + 30) * 2.01}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-cyan-400">{actualMiles.toLocaleString()}</div>
            <div className="text-[8px] text-muted-foreground">miles</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {[
            { type: "Road", miles: Math.round(actualMiles * 0.5), color: "#06b6d4" },
            { type: "Gravel", miles: Math.round(actualMiles * 0.3), color: "#f97316" },
            { type: "MTB", miles: Math.round(actualMiles * 0.2), color: "#a855f7" },
          ].map((r) => (
            <div key={r.type} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />
              <span className="text-muted-foreground flex-1">{r.type}</span>
              <span className="font-medium" style={{ color: r.color }}>{r.miles.toLocaleString()} mi</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ ROW 4: Bottom Stats ═══════════ */}

      {/* TODAY'S RIDE */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex items-center gap-4 bg-card/80 backdrop-blur-xl">
        <div>
          <div className="text-4xl font-bold text-cyan-400">{cyclingData.recentStats.today}</div>
          <div className="text-xs text-muted-foreground">Miles Today</div>
        </div>
        <div className="flex-1 border-l border-border/20 pl-4">
          <div className="text-sm text-emerald-400 font-medium">↑ Great ride!</div>
          <div className="flex items-end gap-1 mt-2 h-5">
            {[18, 24, 32, 28, 36, 32, 28, 32].map((v, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${v * 0.7}px`, background: i === 7 ? "#06b6d4" : "rgba(6, 182, 212, 0.3)" }} />
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Last 8 days</div>
        </div>
      </div>

      {/* WEEKLY PROGRESS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Weekly Miles</div>
        <div className="flex-1 flex items-end gap-1 min-h-[50px]">
          {[68, 72, 84, 78, 92, 86, 78, 148].map((miles, i) => {
            const maxWeekly = 148;
            const height = `${(miles / maxWeekly) * 100}%`;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t" style={{ height, minHeight: "4px", background: i === 7 ? "#06b6d4" : miles > 80 ? "#10b981" : "#0891b2" }} />
              </div>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-center">Last 8 weeks • Avg: {cyclingData.recentStats.avgPerWeek} mi/week</div>
      </div>

      {/* QUICK STATS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "Rides", value: "156", color: "#06b6d4" },
          { label: "Time", value: "187h", color: "#f97316" },
          { label: "Avg/Ride", value: "18mi", color: "#a855f7" },
          { label: "Streak", value: `${cyclingData.dayStreak}d`, color: "#10b981" },
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

// ============== LIFTING TAB ==============
interface LiftingTabProps {
  yearlyWorkoutsGoal: number;
  totalLiftGoal: number;
  stravaStats: any;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

function LiftingTab({ yearlyWorkoutsGoal, totalLiftGoal, stravaStats, onUpdateGoal, isUpdating }: LiftingTabProps) {
  // Use Strava data if available (all activities for now - filtering by type would require additional API calls)
  const actualWorkouts = stravaStats?.localActivities ?? liftosaurData.yearlyWorkouts;
  const progressPercent = Math.round((actualWorkouts / yearlyWorkoutsGoal) * 100);
  const workoutsRemaining = yearlyWorkoutsGoal - actualWorkouts;
  const weeksLeft = Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000));
  const workoutsPerWeek = (Math.max(0, workoutsRemaining) / weeksLeft).toFixed(1);

  // 1000lb club progress
  const clubProgress = Math.round((liftosaurData.total / totalLiftGoal) * 100);
  const poundsToGo = totalLiftGoal - liftosaurData.total;

  // Max volume for scaling
  const maxVolume = Math.max(...liftosaurData.monthlyVolume);

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_1fr_auto] gap-3 min-h-0">
      {/* ═══════════ ROW 1: Hero Stats ═══════════ */}

      {/* HERO - Deadlift PR (Liftosaur) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Liftosaur • Deadlift PR
            </div>
            <div className="text-5xl font-bold mt-1 text-purple-500">{liftosaurData.prs.deadlift.weight}</div>
            <div className="text-lg text-muted-foreground -mt-1">lbs</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-emerald-400 font-semibold">↑ from {liftosaurData.prs.deadlift.previous} lbs</span>
              <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded">+{liftosaurData.prs.deadlift.percentGain}%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{liftosaurData.prs.deadlift.date}</div>
            {liftosaurData.prs.deadlift.isRecent && <div className="text-xs text-amber-400 font-medium mt-1">🏆 New PR!</div>}
          </div>
        </div>
        {/* Progression sparkline */}
        <div className="mt-auto pt-3 relative z-10">
          <div className="flex items-end gap-1 h-6">
            {[65, 70, 72, 75, 78, 80, 82, 85, 88, 90, 95, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 0.24}px`, background: i === 11 ? "#a855f7" : "rgba(168, 85, 247, 0.3)" }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Jan</span><span>Nov</span></div>
        </div>
      </div>

      {/* 1000LB CLUB PROGRESS (Liftosaur) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          1000lb Club Progress
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${clubProgress * 2.51} 251`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-purple-400">{clubProgress}%</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-purple-400">{liftosaurData.total}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">/ <EditableGoal value={totalLiftGoal} unit="lbs" goalKey="total_lift" onUpdate={onUpdateGoal} isUpdating={isUpdating} /></div>
            <div className={cn("text-xs mt-1", poundsToGo > 0 ? "text-emerald-400" : "text-cyan-400")}>
              {poundsToGo > 0 ? `Need ${poundsToGo} more lbs` : "Goal reached!"}
            </div>
          </div>
        </div>
        {/* Big 3 breakdown */}
        <div className="flex gap-3 mt-3 pt-2 border-t border-border/20">
          {[
            { lift: "DL", weight: liftosaurData.prs.deadlift.weight, color: "#a855f7" },
            { lift: "SQ", weight: liftosaurData.prs.squat.weight, color: "#f97316" },
            { lift: "BP", weight: liftosaurData.prs.bench.weight, color: "#06b6d4" },
          ].map((l) => (
            <div key={l.lift} className="flex-1 text-center">
              <div className="text-lg font-bold" style={{ color: l.color }}>{l.weight}</div>
              <div className="text-xs text-muted-foreground">{l.lift}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STRAVA SUMMARY */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Strava This Week
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{stravaLiftingData.thisWeek.workouts}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{stravaLiftingData.thisWeek.time}h</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-400">{stravaLiftingData.thisWeek.calories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-400">{stravaLiftingData.avgHeartrate}</div>
            <div className="text-xs text-muted-foreground">Avg HR</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: PRs + Progress ═══════════ */}

      {/* PERSONAL RECORDS (Liftosaur) - Tall Card */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Personal Records
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {[
            { lift: "Deadlift", ...liftosaurData.prs.deadlift, color: "#a855f7", icon: "🏋️" },
            { lift: "Squat", ...liftosaurData.prs.squat, color: "#f97316", icon: "🦵" },
            { lift: "Bench", ...liftosaurData.prs.bench, color: "#06b6d4", icon: "💪" },
          ].map((pr) => (
            <div key={pr.lift} className={cn("flex items-center gap-3 p-3 rounded-lg border", pr.isRecent ? "bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/40" : "bg-white/[0.02] border-border/20")}>
              <span className="text-xl">{pr.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{pr.lift}</span>
                  {pr.isRecent && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded">NEW</span>}
                </div>
                <div className="text-xs text-muted-foreground">↑ from {pr.previous} lbs • {pr.date}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: pr.color }}>{pr.weight}</div>
                <div className="text-xs text-emerald-400">+{pr.percentGain}%</div>
              </div>
            </div>
          ))}
        </div>
        {/* Lift goals progress */}
        <div className="border-t border-border/20 pt-3 mt-3">
          <div className="text-xs text-muted-foreground mb-2">Progress to Goals</div>
          {[
            { lift: "DL", current: 405, goal: 450, color: "#a855f7" },
            { lift: "SQ", current: 315, goal: 365, color: "#f97316" },
            { lift: "BP", current: 225, goal: 275, color: "#06b6d4" },
          ].map((g) => (
            <div key={g.lift} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground w-6">{g.lift}</span>
              <div className="flex-1 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(g.current / g.goal) * 100}%`, background: g.color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: g.color }}>{g.current}/{g.goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT WORKOUTS (Liftosaur) */}
      <div className="row-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Recent Workouts
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {liftosaurData.recentWorkouts.map((workout, i) => (
            <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-lg border", workout.prs > 0 ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30" : "bg-white/[0.02] border-border/20")}>
              <div className="text-center flex-shrink-0">
                <div className="text-lg font-bold text-purple-400">{(workout.volume / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">lbs</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{workout.name}</span>
                  {workout.prs > 0 && <span className="text-xs text-amber-400">🏆 {workout.prs} PR{workout.prs > 1 ? "s" : ""}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{workout.exercises} exercises • {workout.duration}min</div>
              </div>
              <span className="text-xs text-muted-foreground">{workout.date}</span>
            </div>
          ))}
        </div>
        {/* Program info */}
        <div className="border-t border-border/20 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Program</span>
            <span className="text-sm font-medium text-purple-400">{liftosaurData.currentProgram}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Week</span>
            <span className="text-sm font-semibold">{liftosaurData.programWeek}</span>
          </div>
        </div>
      </div>

      {/* WORKOUT GOAL PROGRESS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex gap-4 bg-card/80 backdrop-blur-xl">
        <div className="w-16 h-16 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progressPercent * 2.51} 251`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-purple-400">{progressPercent}%</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Annual Workout Goal</div>
          <div className="text-sm flex items-center gap-1"><span className="font-semibold">{liftosaurData.yearlyWorkouts}</span> / <EditableGoal value={yearlyWorkoutsGoal} unit="" goalKey="yearly_workouts" onUpdate={onUpdateGoal} isUpdating={isUpdating} /> workouts</div>
          <div className="text-xs text-emerald-400">Need {workoutsPerWeek}/week to finish</div>
          <div className="text-xs text-muted-foreground">{workoutsRemaining} workouts remaining</div>
        </div>
      </div>

      {/* CONSISTENCY (Liftosaur) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Consistency (Last 30d)</div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{liftosaurData.consistencyScore}%</div>
            <div className="text-xs text-muted-foreground">Hit Rate</div>
          </div>
          <div className="flex-1 border-l border-border/20 pl-4">
            <div className="text-sm">{liftosaurData.targetDaysHit}/30 target days hit</div>
            <div className="text-xs text-muted-foreground mt-1">Current streak: {liftosaurData.weekStreak} weeks 🔥</div>
            <div className="text-xs text-muted-foreground">Best: {liftosaurData.bestStreak} weeks</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 3: Volume & Muscles ═══════════ */}

      {/* MONTHLY VOLUME CHART (Liftosaur) */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Monthly Training Volume
        </div>
        <div className="flex-1 flex items-end gap-1.5 min-h-[70px]">
          {liftosaurData.monthlyVolume.map((vol, i) => {
            const height = `${(vol / maxVolume) * 100}%`;
            const isCurrentMonth = i === new Date().getMonth();
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t transition-all hover:brightness-125" style={{ height, minHeight: "4px", background: isCurrentMonth ? "#a855f7" : vol > 75000 ? "#10b981" : "#7c3aed", opacity: i > new Date().getMonth() ? 0.3 : 1 }} />
                <span className="text-xs text-muted-foreground mt-1">{"JFMAMJJASOND"[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/20">
          <span>Total: {(liftosaurData.totalVolume / 1000).toFixed(0)}k lbs</span>
          <span>Avg: {(liftosaurData.avgVolumePerWorkout / 1000).toFixed(1)}k/workout</span>
        </div>
      </div>

      {/* VOLUME BY LIFT (Liftosaur) */}
      <div className="col-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">By Lift</div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {[
            { lift: "Deadlift", vol: liftosaurData.volumeByLift.deadlift, color: "#a855f7" },
            { lift: "Squat", vol: liftosaurData.volumeByLift.squat, color: "#f97316" },
            { lift: "Bench", vol: liftosaurData.volumeByLift.bench, color: "#06b6d4" },
            { lift: "Other", vol: liftosaurData.volumeByLift.accessories, color: "#6b7280" },
          ].map((l) => (
            <div key={l.lift} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground flex-1">{l.lift}</span>
              <span className="text-xs font-medium" style={{ color: l.color }}>{(l.vol / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      </div>

      {/* MUSCLE GROUPS DONUT (Liftosaur) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex gap-3 bg-card/80 backdrop-blur-xl">
        <div className="w-20 h-20 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Upper - 42% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#a855f7" strokeWidth="14" strokeDasharray={`${42 * 2.01} 201`} strokeDashoffset="0" />
            {/* Lower - 35% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#f97316" strokeWidth="14" strokeDasharray={`${35 * 2.01} 201`} strokeDashoffset={`${-42 * 2.01}`} />
            {/* Core - 23% */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#06b6d4" strokeWidth="14" strokeDasharray={`${23 * 2.01} 201`} strokeDashoffset={`${-(42 + 35) * 2.01}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold text-purple-400">{liftosaurData.yearlyWorkouts}</div>
            <div className="text-[8px] text-muted-foreground">workouts</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {[
            { label: "Upper", value: liftosaurData.muscleGroups.upper, count: Math.round(liftosaurData.yearlyWorkouts * 0.42), color: "#a855f7" },
            { label: "Lower", value: liftosaurData.muscleGroups.lower, count: Math.round(liftosaurData.yearlyWorkouts * 0.35), color: "#f97316" },
            { label: "Core", value: liftosaurData.muscleGroups.core, count: Math.round(liftosaurData.yearlyWorkouts * 0.23), color: "#06b6d4" },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: m.color }} />
              <span className="text-muted-foreground flex-1">{m.label}</span>
              <span className="font-medium" style={{ color: m.color }}>{m.value}%</span>
              <span className="text-muted-foreground">({m.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ ROW 4: Bottom Stats ═══════════ */}

      {/* THIS WEEK COMPARISON */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex items-center gap-4 bg-card/80 backdrop-blur-xl">
        <div>
          <div className="text-4xl font-bold text-purple-400">{stravaLiftingData.thisWeek.workouts}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </div>
        <div className="flex-1 border-l border-border/20 pl-4">
          <div className="text-sm text-emerald-400 font-medium">↑ On track vs avg</div>
          <div className="flex items-end gap-1 mt-2 h-5">
            {[3, 4, 3, 5, 4, 3, 4, 4].map((v, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${v * 5}px`, background: i === 7 ? "#a855f7" : "rgba(168, 85, 247, 0.3)" }} />
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Last 8 weeks</div>
        </div>
      </div>

      {/* MONTHLY WORKOUTS (Liftosaur) */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Monthly Workouts</div>
        <div className="flex-1 flex items-end gap-1 min-h-[50px]">
          {liftosaurData.monthlyWorkouts.map((val, i) => {
            const maxVal = Math.max(...liftosaurData.monthlyWorkouts);
            const height = `${(val / maxVal) * 100}%`;
            const isCurrentMonth = i === new Date().getMonth();
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t" style={{ height, minHeight: "4px", background: isCurrentMonth ? "#a855f7" : val > 14 ? "#10b981" : "#7c3aed", opacity: i > new Date().getMonth() ? 0.3 : 1 }} />
                <span className="text-xs text-muted-foreground mt-1">{"JFMAMJJASOND"[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "Total Hours", value: stravaLiftingData.totalTime.toString(), color: "#f97316" },
          { label: "Avg Duration", value: `${stravaLiftingData.avgDuration}m`, color: "#a855f7" },
          { label: "Total Cal", value: `${(stravaLiftingData.totalCalories / 1000).toFixed(0)}k`, color: "#10b981" },
          { label: "Streak", value: `${liftosaurData.weekStreak}w`, color: "#06b6d4" },
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

// ============== CLIMBING TAB ==============
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

function ClimbingTab({ yearlyClimbsGoal, onUpdateGoal, isUpdating, kilterStats, isLoadingKilter, stravaClimbingStats, isLoadingStravaClimbing, climbingLogTicks, climbingLogStats, isLoadingClimbingLog, onCreateTick, onUpdateTick, onDeleteTick, isCreatingTick }: ClimbingTabProps) {
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

  // Kilter data - use real data if available, otherwise use mock data
  const kilterConnected = kilterStats?.isConnected ?? false;
  const kilterHighestGrade = kilterStats?.maxGrade ?? kilterData.highestGrade;
  const kilterTotalClimbs = kilterStats?.totalProblemsSent ?? kilterData.totalClimbs;
  const kilterTotalSessions = kilterStats?.totalSessions ?? kilterData.totalSessions;
  const kilterAvgAngle = kilterStats?.preferredAngle ? Math.round(kilterStats.preferredAngle) : kilterData.avgAngle;
  const kilterFlashRate = kilterStats?.flashRate ? Math.round(kilterStats.flashRate) : kilterData.flashRate;
  const kilterSendRate = kilterStats?.sendRate ? Math.round(kilterStats.sendRate) : kilterData.sendRate;
  const kilterAvgTries = kilterStats?.avgAttemptsPerSend ? Math.round(kilterStats.avgAttemptsPerSend * 10) / 10 : kilterData.avgTries;

  // Convert grade distribution to array format for display
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
    : kilterData.gradeBreakdown;

  const maxKilterCount = Math.max(...kilterGradeBreakdown.map(g => g.count), 1);

  // Recent Kilter sessions
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
  ).slice(0, 4) ?? kilterData.recentClimbs;

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
        {/* Angle distribution mini bars */}
        <div className="mt-auto pt-3 relative z-10">
          <div className="flex items-end gap-1 h-6">
            {kilterData.angleStats.map((a, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t" style={{ height: `${(a.count / 320) * 24}px`, background: a.angle === kilterAvgAngle ? "#a855f7" : "rgba(168, 85, 247, 0.3)" }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>20°</span><span>50°</span></div>
        </div>
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
        {/* Kilter Projects */}
        <div className="border-t border-border/20 pt-2 mt-2">
          <div className="text-xs text-muted-foreground mb-1.5">Projects</div>
          {kilterData.projects.map((proj, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-purple-500/10 mb-1">
              <span className="text-sm font-bold text-purple-400">{proj.displayed_grade}</span>
              <span className="text-xs truncate flex-1">{proj.climb_name}</span>
              <span className="text-xs text-muted-foreground">{proj.tries_total} tries</span>
            </div>
          ))}
        </div>
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

      {/* MONTHLY CHART (Redpoint/Strava) */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Monthly Activities</div>
        <div className="flex-1 flex items-end gap-1 min-h-[50px]">
          {redpointData.monthlyActivities.map((val, i) => {
            const maxVal = Math.max(...redpointData.monthlyActivities);
            const height = `${(val / maxVal) * 100}%`;
            const isCurrentMonth = i === new Date().getMonth();
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t" style={{ height, minHeight: "4px", background: isCurrentMonth ? "#06b6d4" : val > 14 ? "#10b981" : "#0891b2", opacity: i > new Date().getMonth() ? 0.3 : 1 }} />
                <span className="text-xs text-muted-foreground mt-1">{"JFMAMJJASOND"[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "Total Hours", value: redpointData.totalTime.toString(), color: "#06b6d4" },
          { label: "Elevation", value: `${(redpointData.totalElevation / 1000).toFixed(0)}k`, color: "#10b981" },
          { label: "Avg HR", value: redpointData.avgHeartrate.toString(), color: "#f97316" },
          { label: "Cal/Session", value: redpointData.caloriesPerSession.toString(), color: "#a855f7" },
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

// ============== SHARED COMPONENTS ==============

function HeroCell({ value, label, sub, color }: { value: string; label: string; sub: string; color: "cyan" | "purple" | "orange" }) {
  const colors = {
    cyan: { gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)", glow: "rgba(6, 182, 212, 0.5)", shadow: "rgba(6, 182, 212, 0.4)" },
    purple: { gradient: "linear-gradient(135deg, #a855f7, #c084fc)", glow: "rgba(168, 85, 247, 0.5)", shadow: "rgba(168, 85, 247, 0.4)" },
    orange: { gradient: "linear-gradient(135deg, #f97316, #fb923c)", glow: "rgba(249, 115, 22, 0.5)", shadow: "rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="col-span-2 row-span-2 glass-card rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-card/70 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 30%, ${c.glow}, transparent 60%)` }} />
      <div className="absolute -inset-1/2" style={{ background: `radial-gradient(circle at 50% 50%, ${c.shadow.replace("0.4", "0.15")}, transparent 50%)`, animation: "pulse-glow 3s ease-in-out infinite" }} />
      <div className="text-5xl font-semibold relative z-10" style={{ background: c.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 20px ${c.shadow}) drop-shadow(0 0 40px ${c.shadow.replace("0.4", "0.3")})`, letterSpacing: "-0.03em" }}>
        {value}
      </div>
      <div className="text-sm text-foreground mt-2 relative z-10" style={{ letterSpacing: "-0.01em" }}>{label}</div>
      <div className="text-xs text-emerald-400 font-medium mt-1 relative z-10" style={{ textShadow: "0 0 12px rgba(16, 185, 129, 0.5)" }}>{sub}</div>
    </div>
  );
}

function StatCell({ value, label, sub, color }: { value: string; label: string; sub: string; color: "orange" | "purple" | "yellow" | "cyan" }) {
  const colors = {
    orange: { text: "text-orange-500", shadow: "0 0 20px rgba(249, 115, 22, 0.4)" },
    purple: { text: "text-purple-400", shadow: "0 0 20px rgba(168, 85, 247, 0.4)" },
    yellow: { text: "text-yellow-400", shadow: "0 0 20px rgba(234, 179, 8, 0.4)" },
    cyan: { text: "text-cyan-400", shadow: "0 0 20px rgba(6, 182, 212, 0.4)" },
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center bg-card/70 backdrop-blur-xl">
      <div className={cn("text-2xl font-semibold", colors[color].text)} style={{ textShadow: colors[color].shadow, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
      <div className={cn("text-[9px] mt-0.5 opacity-65", colors[color].text)}>{sub}</div>
    </div>
  );
}

function MonthlyBars({ data, avg, color = "cyan" }: { data: number[]; avg: number; color?: "cyan" | "purple" | "orange" }) {
  const maxVal = Math.max(...data);
  const colors = {
    cyan: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-cyan-600 to-cyan-400", belowShadow: "0 0 8px rgba(6, 182, 212, 0.4)" },
    purple: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-purple-600 to-purple-400", belowShadow: "0 0 8px rgba(168, 85, 247, 0.4)" },
    orange: { above: "from-emerald-600 to-emerald-400", aboveShadow: "0 0 8px rgba(16, 185, 129, 0.4)", below: "from-orange-600 to-orange-400", belowShadow: "0 0 8px rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="flex-1 flex items-end justify-between gap-1 pt-2">
      {data.map((val, i) => {
        const height = `${(val / maxVal) * 100}%`;
        const isAboveAvg = val > avg;
        const month = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i];
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={cn("w-full max-w-6 rounded-t transition-all hover:brightness-125 hover:scale-x-110 bg-gradient-to-t", isAboveAvg ? c.above : c.below)}
              style={{ height, minHeight: "4px", boxShadow: isAboveAvg ? c.aboveShadow : c.belowShadow, opacity: i === 11 ? 0.3 : 1 }}
            />
            <span className="text-[8px] text-muted-foreground mt-1">{month}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRing({ percent, goal, current, ahead, unit = "mi", color = "cyan" }: { percent: number; goal: number; current: number; ahead: number; unit?: string; color?: "cyan" | "purple" | "orange" }) {
  const colors = {
    cyan: { stroke: "#06b6d4", text: "text-cyan-400", shadow: "rgba(6, 182, 212, 0.4)" },
    purple: { stroke: "#a855f7", text: "text-purple-400", shadow: "rgba(168, 85, 247, 0.4)" },
    orange: { stroke: "#f97316", text: "text-orange-400", shadow: "rgba(249, 115, 22, 0.4)" },
  };
  const c = colors[color];

  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex gap-4 bg-card/70 backdrop-blur-xl">
      <div className="w-[90px] h-[90px] relative flex-shrink-0" style={{ filter: `drop-shadow(0 0 12px ${c.shadow})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={c.stroke} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${percent * 2.51} 251`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-xl font-semibold", c.text)} style={{ textShadow: `0 0 15px ${c.shadow}` }}>{percent}%</div>
          <div className="text-[8px] text-muted-foreground">of {goal >= 1000 ? `${(goal / 1000).toFixed(0)}k` : goal} {unit}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Current</span><span className="font-medium">{current.toLocaleString()}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Goal</span><span className="font-medium">{goal.toLocaleString()}</span></div>
        {ahead > 0 && <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Ahead</span><span className="font-medium text-emerald-400">+{ahead}</span></div>}
      </div>
    </div>
  );
}

function PRItem({ rank, name, meta, value, isGold }: { rank: number; name: string; meta: string; value: string; isGold?: boolean }) {
  return (
    <div
      className={cn("flex items-center gap-2 p-2 rounded-lg border transition-all hover:translate-x-0.5", isGold || rank === 1 ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-amber-500/40 border-2" : "bg-white/[0.02] border-border/30 hover:border-purple-500")}
      style={isGold || rank === 1 ? { boxShadow: "0 0 20px rgba(251, 191, 36, 0.2), inset 0 0 15px rgba(251, 191, 36, 0.05)" } : {}}
    >
      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0", isGold || rank === 1 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950" : "bg-muted")}>
        {isGold || rank === 1 ? "🥇" : rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium truncate" style={{ letterSpacing: "-0.01em" }}>{name}</div>
        <div className="text-[9px] text-muted-foreground">{meta}</div>
      </div>
      <span className="text-sm font-semibold text-purple-400 flex-shrink-0" style={{ textShadow: "0 0 12px rgba(168, 85, 247, 0.4)", letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}

function CandlestickChart({ weeklyValue, unit, change }: { weeklyValue: number; unit: string; change: number }) {
  const candles = [
    { wick1: 8, body: 20, wick2: 6, up: true },
    { wick1: 6, body: 24, wick2: 4, up: true },
    { wick1: 12, body: 14, wick2: 10, up: false },
    { wick1: 5, body: 28, wick2: 3, up: true },
    { wick1: 10, body: 18, wick2: 8, up: true },
    { wick1: 12, body: 16, wick2: 12, up: false },
    { wick1: 4, body: 30, wick2: 3, up: true },
    { wick1: 6, body: 26, wick2: 4, up: true },
  ];

  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">PERFORMANCE</div>
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-500/10 rounded-md mb-2 text-[11px]">
        <span>This week: <span className="text-emerald-400 font-semibold">{weeklyValue} {unit}</span> • +{change}%</span>
      </div>
      <div className="flex-1 flex items-center justify-around">
        {candles.map((candle, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-0.5 bg-muted-foreground" style={{ height: `${candle.wick1}px` }} />
            <div className={cn("w-3.5 rounded-sm cursor-pointer", candle.up ? "bg-emerald-400" : "bg-red-500")} style={{ height: `${candle.body}px`, boxShadow: candle.up ? "0 0 8px rgba(16, 185, 129, 0.5)" : "0 0 8px rgba(239, 68, 68, 0.5)" }} />
            <div className="w-0.5 bg-muted-foreground" style={{ height: `${candle.wick2}px` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CumulativeProgress({ percent, finishDate, weeksEarly }: { percent: number; finishDate: string; weeksEarly: number }) {
  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">YEAR TO DATE</div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 rounded-md border border-emerald-500 w-fit mb-2" style={{ boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)" }}>
        <span className="text-lg font-semibold text-emerald-400" style={{ textShadow: "0 0 10px rgba(16, 185, 129, 0.5)", letterSpacing: "-0.02em" }}>+{percent}%</span>
        <span className="text-[10px] text-emerald-400">ahead</span>
      </div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id="cum-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" y1="55" x2="200" y2="5" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4,2" />
          <path d="M0,55 Q50,48 100,30 T200,10 L200,60 L0,60 Z" fill="url(#cum-fill)" />
          <path d="M0,55 Q50,48 100,30 T200,10" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="200" cy="10" r="4" fill="#06b6d4" />
        </svg>
      </div>
      <div className="text-[10px] text-amber-400 text-center mt-1" style={{ textShadow: "0 0 10px rgba(251, 191, 36, 0.4)" }}>✨ {finishDate} finish ({weeksEarly} weeks early!)</div>
    </div>
  );
}

function ElevationChart() {
  return (
    <div className="col-span-2 glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">CLIMBING</div>
      <div className="text-sm font-medium mb-2" style={{ letterSpacing: "-0.02em" }}>Monthly Elevation</div>
      <div className="flex-1 relative">
        <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id="mtn-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity="0.7" /><stop offset="100%" stopColor="#f97316" stopOpacity="0.1" /></linearGradient></defs>
          <path d="M0,40 L33,32 L66,24 L100,5 L133,16 L166,28 L200,34 L200,50 L0,50 Z" fill="url(#mtn-grad)" />
          <path d="M0,40 L33,32 L66,24 L100,5 L133,16 L166,28 L200,34" fill="none" stroke="#f97316" strokeWidth="2" />
          <circle cx="100" cy="5" r="4" fill="#f97316" />
        </svg>
        <div className="absolute right-2 bottom-2 text-right">
          <div className="text-sm font-semibold text-orange-500" style={{ textShadow: "0 0 12px rgba(249, 115, 22, 0.5)", letterSpacing: "-0.02em" }}>12.4k</div>
          <div className="text-[9px] text-muted-foreground">Nov</div>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ total, unit, segments, primaryColor = "cyan" }: { total: string; unit: string; segments: { label: string; value: number; color: string }[]; primaryColor?: "cyan" | "purple" | "orange" }) {
  const colors = { cyan: "#06b6d4", purple: "#a855f7", orange: "#f97316" };
  const circumference = 2 * Math.PI * 32;
  let offset = 0;

  return (
    <div className="glass-card rounded-2xl p-4 flex gap-3 bg-card/70 backdrop-blur-xl">
      <div className="w-20 h-20 relative flex-shrink-0" style={{ filter: `drop-shadow(0 0 10px ${segments[0].color}50) drop-shadow(0 0 10px ${segments[1].color}40) drop-shadow(0 0 10px ${segments[2].color}40)` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const dash = (seg.value / 100) * circumference;
            const currentOffset = offset;
            offset -= dash;
            return <circle key={i} cx="50" cy="50" r="32" fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={currentOffset} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold" style={{ color: colors[primaryColor], textShadow: `0 0 10px ${colors[primaryColor]}60`, letterSpacing: "-0.02em" }}>{total}</div>
          <div className="text-[7px] text-muted-foreground">{unit}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
            {seg.label} {seg.value}%
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendCell({ value, percent, label, color = "green" }: { value: string; percent: number; label: string; color?: "green" | "purple" | "orange" }) {
  const colors = {
    green: { gradient: "linear-gradient(135deg, #10b981, #059669)", shadow: "rgba(16, 185, 129, 0.4)", fill: "#10b981" },
    purple: { gradient: "linear-gradient(135deg, #a855f7, #9333ea)", shadow: "rgba(168, 85, 247, 0.4)", fill: "#a855f7" },
    orange: { gradient: "linear-gradient(135deg, #f97316, #ea580c)", shadow: "rgba(249, 115, 22, 0.4)", fill: "#f97316" },
  };
  const c = colors[color];

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</div>
      <div className="text-2xl font-semibold" style={{ background: c.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: `drop-shadow(0 0 15px ${c.shadow}) drop-shadow(0 0 30px ${c.shadow.replace("0.4", "0.2")})`, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: c.fill, textShadow: `0 0 8px ${c.shadow}` }}>(+{percent}%) 🔥</div>
      <div className="flex-1 mt-2">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="w-full h-full">
          <defs><linearGradient id={`spd-fill-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.fill} stopOpacity="0.4" /><stop offset="100%" stopColor={c.fill} stopOpacity="0" /></linearGradient></defs>
          <path d="M0,35 Q30,32 60,24 T120,5 L120,40 L0,40 Z" fill={`url(#spd-fill-${color})`} />
          <path d="M0,35 Q30,32 60,24 T120,5" fill="none" stroke={c.fill} strokeWidth="2" />
          <circle cx="120" cy="5" r="3" fill={c.fill} />
        </svg>
      </div>
    </div>
  );
}

function RecentStats({ today, week, avg }: { today: string; week: string; avg: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col bg-card/70 backdrop-blur-xl">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-2">RECENT</div>
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Today</span><span className="font-semibold">{today}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">This week</span><span className="font-semibold">{week}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Avg/week</span><span className="font-semibold">{avg}</span></div>
      </div>
    </div>
  );
}
