import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Activity, Dumbbell, Flame, Plus, Timer, TrendingUp, Trophy, Upload, Weight, Zap } from "lucide-react";
import { EditableGoal } from "../shared";
import { useLiftingLog, LiftingWorkout, LiftingSet } from "@/hooks/useLiftingLog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toLocaleString();
}

function groupSetsByExercise(sets: LiftingSet[]): Record<string, LiftingSet[]> {
  return sets.reduce((acc, set) => {
    const name = set.exercise?.name || set.exerciseName || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push(set);
    return acc;
  }, {} as Record<string, LiftingSet[]>);
}

export function LiftingTab({ yearlyWorkoutsGoal, stravaStats, onUpdateGoal, isUpdating }: LiftingTabProps) {
  const { toast } = useToast();
  const {
    exercises,
    workouts,
    stats,
    isLoading,
    seedExercises,
    isSeedingExercises,
    logSet,
    saveWorkout,
    isLoggingSet,
    importLiftosaur,
    isImportingLiftosaur,
  } = useLiftingLog();

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [sets, setSets] = useState<string>("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Liftosaur exports have a "history" array
      if (!data.history) {
        toast({ title: "Invalid file", description: "This doesn't look like a Liftosaur export. Expected { history: [...] }", variant: "destructive" });
        return;
      }

      const result = await importLiftosaur({ history: data.history });
      toast({
        title: "Import successful!",
        description: `Imported ${result.imported.workouts} workouts, ${result.imported.sets} sets, ${result.imported.exercises} new exercises`,
      });
      setIsImportDialogOpen(false);
    } catch (error) {
      toast({ title: "Import failed", description: "Could not parse the file. Make sure it's a valid Liftosaur JSON export.", variant: "destructive" });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const ytdWorkouts = stats?.ytdWorkouts || 0;
  const thisMonthWorkouts = stats?.thisMonthWorkouts || 0;
  const ytdVolume = stats?.ytdVolume || 0;
  const thisMonthVolume = stats?.thisMonthVolume || 0;

  const progressPercent = yearlyWorkoutsGoal > 0 ? Math.round((ytdWorkouts / yearlyWorkoutsGoal) * 100) : 0;
  const workoutsRemaining = Math.max(0, yearlyWorkoutsGoal - ytdWorkouts);
  const weeksLeft = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const workoutsPerWeek = (workoutsRemaining / weeksLeft).toFixed(1);

  const handleLogSet = async () => {
    if (!selectedExercise || !weight || !reps) return;

    const today = new Date().toISOString().split("T")[0];
    const numSets = parseInt(sets) || 1;

    // Create/update workout for today
    await saveWorkout({ workoutDate: today });

    // Log each set
    for (let i = 0; i < numSets; i++) {
      await logSet({
        exerciseId: parseInt(selectedExercise),
        workoutDate: today,
        setNumber: i + 1,
        reps: parseInt(reps),
        weightLbs: parseFloat(weight),
      });
    }

    // Reset form
    setSelectedExercise("");
    setWeight("");
    setReps("");
    setSets("1");
    setIsLogDialogOpen(false);
  };

  // Show setup if no exercises
  if (!isLoading && exercises.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
          <Dumbbell className="w-12 h-12 text-purple-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Set Up Lifting Log</h3>
          <p className="text-muted-foreground max-w-sm">
            Import your workout history from Liftosaur, or start fresh with a library of common exercises.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImportingLiftosaur}
            variant="default"
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImportingLiftosaur ? "Importing..." : "Import from Liftosaur"}
          </Button>
          <Button
            onClick={() => seedExercises()}
            disabled={isSeedingExercises}
            variant="outline"
            className="px-6 py-3"
          >
            {isSeedingExercises ? "Setting up..." : "Start Fresh"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm">
          In Liftosaur, go to Settings → Export Data → Export as JSON, then upload the file here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-6 grid-rows-[auto_1fr_auto] gap-3 min-h-0">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />
      {/* ═══════════ ROW 1: Hero Stats ═══════════ */}

      {/* HERO - YTD Workouts */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-xl" style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              YTD Workouts
            </div>
            <div className="text-5xl font-bold mt-1 text-purple-500">{ytdWorkouts}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {workoutsPerWeek}/week to hit goal
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">{formatVolume(ytdVolume)}</div>
            <div className="text-xs text-muted-foreground">lbs lifted</div>
          </div>
        </div>
      </div>

      {/* GOAL PROGRESS */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Goal Progress
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.min(progressPercent, 100) * 2.51} 251`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-purple-400">{progressPercent}%</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm flex items-center gap-1">
              <span className="font-semibold">{ytdWorkouts}</span> /
              <EditableGoal value={yearlyWorkoutsGoal} unit="" goalKey="yearly_workouts" onUpdate={onUpdateGoal} isUpdating={isUpdating} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{workoutsRemaining} workouts remaining</div>
            <div className="text-xs text-emerald-400">Need {workoutsPerWeek}/week</div>
          </div>
        </div>
      </div>

      {/* THIS MONTH */}
      <div className="col-span-2 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          This Month
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{thisMonthWorkouts}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{formatVolume(thisMonthVolume)}</div>
            <div className="text-xs text-muted-foreground">Volume (lbs)</div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: Recent Workouts & PRs ═══════════ */}

      {/* RECENT WORKOUTS */}
      <div className="col-span-4 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Recent Workouts
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImportingLiftosaur}
            >
              <Upload className="w-3 h-3" />
              {isImportingLiftosaur ? "..." : "Import"}
            </Button>
            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" />
                  Log Set
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Exercise Set</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Exercise</Label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id.toString()}>
                          {ex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Weight (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="135"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleLogSet}
                  disabled={!selectedExercise || !weight || !reps || isLoggingSet}
                  className="w-full"
                >
                  {isLoggingSet ? "Logging..." : "Log Set"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Loading workouts...
            </div>
          ) : workouts.length > 0 ? (
            workouts.slice(0, 5).map((workout) => {
              const groupedSets = workout.sets ? groupSetsByExercise(workout.sets) : {};
              const exerciseNames = Object.keys(groupedSets);
              const hasPR = workout.sets?.some((s) => s.isPR);

              return (
                <div
                  key={workout.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30",
                    hasPR
                      ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30"
                      : "bg-white/[0.02] border-border/20"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {workout.name || formatDate(workout.workoutDate)}
                      </span>
                      {hasPR && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                          PR
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {exerciseNames.length > 0
                        ? exerciseNames.slice(0, 3).join(", ") + (exerciseNames.length > 3 ? ` +${exerciseNames.length - 3} more` : "")
                        : "No exercises logged"}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-semibold text-purple-400">
                      {formatVolume(workout.totalVolume)} lbs
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workout.sets?.length || 0} sets
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Dumbbell className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <div className="text-sm text-muted-foreground">No workouts logged yet</div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                Use the "Log Set" button to start tracking
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PERSONAL RECORDS */}
      <div className="col-span-2 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          Personal Records
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {stats?.prs && stats.prs.length > 0 ? (
            stats.prs.slice(0, 5).map((pr) => (
              <div key={pr.exerciseId} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Weight className="w-3 h-3 text-purple-500" />
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                    {pr.exerciseName}
                  </span>
                </div>
                <span className="text-sm font-bold text-purple-400">{pr.weight} lbs</span>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              Log sets to track PRs
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ ROW 3: Bottom Stats ═══════════ */}

      {/* RECENT PRs */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          Recent PRs
        </div>
        <div className="flex-1 flex items-center justify-around">
          {stats?.recentPRs && stats.recentPRs.length > 0 ? (
            stats.recentPRs.slice(0, 3).map((pr) => (
              <div key={pr.id} className="text-center">
                <div className="text-xl font-bold text-amber-400">{Number(pr.weightLbs)} lbs</div>
                <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {pr.exerciseName}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No recent PRs</div>
          )}
        </div>
      </div>

      {/* YTD SUMMARY */}
      <div className="col-span-3 glass-card rounded-xl p-4 flex items-center justify-around bg-card/80 backdrop-blur-xl">
        {[
          { label: "Workouts", value: ytdWorkouts.toString(), color: "#a855f7", icon: Dumbbell },
          { label: "Volume", value: formatVolume(ytdVolume), color: "#f97316", icon: Weight },
          { label: "PRs", value: (stats?.prs?.length || 0).toString(), color: "#eab308", icon: Trophy },
          { label: "Goal", value: `${progressPercent}%`, color: "#10b981", icon: TrendingUp },
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
