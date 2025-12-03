import { Activity } from "lucide-react";
import { EditableGoal } from "../shared";

interface LiftingTabProps {
  yearlyWorkoutsGoal: number;
  totalLiftGoal: number;
  stravaStats: {
    isConnected?: boolean;
    localActivities?: number;
    localDurationMinutes?: number;
    localCalories?: number;
  } | null;
  onUpdateGoal: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

export function LiftingTab({ yearlyWorkoutsGoal, totalLiftGoal, stravaStats, onUpdateGoal, isUpdating }: LiftingTabProps) {
  // Use Strava data if available - zeros if not connected
  const isStravaConnected = stravaStats?.isConnected ?? false;
  const localActivities = stravaStats?.localActivities ?? 0;
  const localDurationMinutes = stravaStats?.localDurationMinutes ?? 0;
  const localCalories = stravaStats?.localCalories ?? 0;

  const progressPercent = yearlyWorkoutsGoal > 0 ? Math.round((localActivities / yearlyWorkoutsGoal) * 100) : 0;
  const workoutsRemaining = Math.max(0, yearlyWorkoutsGoal - localActivities);
  const weeksLeft = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const workoutsPerWeek = (workoutsRemaining / weeksLeft).toFixed(1);

  // Show coming soon message - Liftosaur integration not yet available
  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Strava Stats if connected */}
      {isStravaConnected && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center bg-card/80 backdrop-blur-xl">
            <div className="text-3xl font-bold text-purple-400">{localActivities}</div>
            <div className="text-xs text-muted-foreground">Total Activities</div>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col items-center bg-card/80 backdrop-blur-xl">
            <div className="text-3xl font-bold text-orange-400">{Math.round(localDurationMinutes / 60)}h</div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col items-center bg-card/80 backdrop-blur-xl">
            <div className="text-3xl font-bold text-emerald-400">{localCalories.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
        </div>
      )}

      {/* Workout Goal Progress */}
      <div className="glass-card rounded-xl p-6 flex items-center gap-6 bg-card/80 backdrop-blur-xl">
        <div className="w-24 h-24 relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.min(progressPercent, 100) * 2.51} 251`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-bold text-purple-400">{progressPercent}%</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Annual Workout Goal</div>
          <div className="text-lg flex items-center gap-2">
            <span className="font-semibold">{localActivities}</span> /
            <EditableGoal value={yearlyWorkoutsGoal} unit="" goalKey="yearly_workouts" onUpdate={onUpdateGoal} isUpdating={isUpdating} /> workouts
          </div>
          <div className="text-sm text-emerald-400 mt-1">Need {workoutsPerWeek}/week to finish</div>
          <div className="text-xs text-muted-foreground">{workoutsRemaining} workouts remaining</div>
        </div>
      </div>

      {/* Coming Soon - Liftosaur */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
          <Activity className="w-12 h-12 text-purple-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Liftosaur Integration Coming Soon</h3>
          <p className="text-muted-foreground max-w-sm">
            Track your PRs, volume, and workout programs by connecting Liftosaur.
            For now, your Strava weight training activities are counted toward your workout goals.
          </p>
        </div>
        {!isStravaConnected && (
          <a
            href="/import"
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
          >
            Connect Strava
          </a>
        )}
      </div>
    </div>
  );
}
