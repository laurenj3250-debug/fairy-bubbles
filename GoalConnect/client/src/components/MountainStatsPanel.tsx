import { Mountain, TrendingUp, Flag, Tent } from "lucide-react";

interface MountainStatsPanelProps {
  totalHabitsCompleted: number;
  totalGoalsCompleted: number;
  longestStreak: number;
  currentAltitude: number;
}

export function MountainStatsPanel({
  totalHabitsCompleted,
  totalGoalsCompleted,
  longestStreak,
  currentAltitude,
}: MountainStatsPanelProps) {
  // Calculate mountain metaphors
  const campsEstablished = Math.floor(totalHabitsCompleted / 10);
  const peaksSummited = totalGoalsCompleted;
  const verticalGain = Math.floor(totalHabitsCompleted * 100); // Each habit = 100m vertical gain

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg topo-pattern">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Mountain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Expedition Stats</h3>
          <p className="text-xs text-muted-foreground">Your climbing journey</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Camps Established */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Tent className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-muted-foreground">Camps</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{campsEstablished}</div>
          <div className="text-xs text-blue-400 mt-1">Established</div>
        </div>

        {/* Peaks Summited */}
        <div className="bg-gradient-to-br from-[hsl(var(--accent))]/10 to-[hsl(var(--accent))]/5 rounded-xl p-4 border border-[hsl(var(--accent))]/20">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-5 h-5 text-[hsl(var(--accent))]" />
            <span className="text-xs text-muted-foreground">Peaks</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{peaksSummited}</div>
          <div className="text-xs text-[hsl(var(--accent))] mt-1">Summited</div>
        </div>

        {/* Vertical Gain */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-muted-foreground">Vertical</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{verticalGain.toLocaleString()}m</div>
          <div className="text-xs text-orange-400 mt-1">Total Gain</div>
        </div>

        {/* Current Season */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Season</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{longestStreak}</div>
          <div className="text-xs text-primary mt-1">Day Streak</div>
        </div>
      </div>

      {/* Altitude Progress Bar */}
      <div className="mt-4 p-3 bg-muted/10 rounded-xl border border-border/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Today's Altitude</span>
          <span className="text-sm font-bold text-foreground">{currentAltitude}m</span>
        </div>
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-[hsl(var(--accent))] to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(currentAltitude / 10, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Base Camp</span>
          <span>Summit (1000m)</span>
        </div>
      </div>

      {/* Fun facts */}
      {verticalGain >= 8849 && (
        <div className="mt-3 p-2 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 rounded-lg text-center">
          <p className="text-xs font-bold text-[hsl(var(--accent))]">
            You've climbed the equivalent of Mt. Everest! (8,849m)
          </p>
        </div>
      )}
    </div>
  );
}
