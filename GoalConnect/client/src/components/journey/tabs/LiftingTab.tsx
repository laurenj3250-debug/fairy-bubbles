import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Dumbbell, Plus, Trophy, Upload, Weight, Flame, TrendingUp, Trash2 } from "lucide-react";
import { EditableGoal } from "../shared";
import { useLiftingLog, LiftingWorkout, LiftingSet } from "@/hooks/useLiftingLog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { calculateLiftingAbsurdComparisons } from "@/lib/liftingAbsurdComparisons";
import { LiftingFactsTicker } from "../LiftingFactsTicker";
import { WorkoutCalendar } from "../WorkoutCalendar";
import { MuscleDistribution } from "../MuscleDistribution";

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

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toLocaleString();
}

export function LiftingTab({ yearlyWorkoutsGoal, onUpdateGoal, isUpdating }: LiftingTabProps) {
  const { toast } = useToast();
  const {
    exercises,
    workouts,
    stats,
    calendarWorkouts,
    isLoading,
    seedExercises,
    isSeedingExercises,
    logSet,
    saveWorkout,
    isLoggingSet,
    importLiftosaur,
    isImportingLiftosaur,
    resetData,
    isResettingData,
  } = useLiftingLog();

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
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

      if (!data.history) {
        toast({ title: "Invalid file", description: "This doesn't look like a Liftosaur export. Expected { history: [...] }", variant: "destructive" });
        return;
      }

      const result = await importLiftosaur({ history: data.history });
      toast({
        title: "Import successful!",
        description: `Imported ${result.imported.workouts} workouts, ${result.imported.sets} sets, ${result.imported.exercises} new exercises`,
      });
    } catch (error) {
      toast({ title: "Import failed", description: "Could not parse the file. Make sure it's a valid Liftosaur JSON export.", variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = async () => {
    if (!confirm("This will delete ALL your lifting data (workouts, sets, exercises). Are you sure?")) {
      return;
    }
    try {
      await resetData();
      toast({
        title: "Data cleared",
        description: "All lifting data has been deleted. You can now re-import.",
      });
    } catch (error) {
      toast({ title: "Reset failed", description: "Could not clear lifting data.", variant: "destructive" });
    }
  };

  const ytdWorkouts = stats?.ytdWorkouts || 0;
  const ytdVolume = stats?.ytdVolume || 0;
  const bestLift = stats?.bestLift || 0;
  const totalSets = stats?.totalSets || 0;
  const muscleVolumes = stats?.muscleVolumes || [];

  const progressPercent = yearlyWorkoutsGoal > 0 ? Math.round((ytdWorkouts / yearlyWorkoutsGoal) * 100) : 0;
  const workoutsRemaining = Math.max(0, yearlyWorkoutsGoal - ytdWorkouts);
  const weeksLeft = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const workoutsPerWeek = (workoutsRemaining / weeksLeft).toFixed(1);

  // Calculate absurd comparisons
  const absurdComparisons = calculateLiftingAbsurdComparisons(ytdVolume, bestLift);

  const handleLogSet = async () => {
    if (!selectedExercise || !weight || !reps) return;

    const today = new Date().toISOString().split("T")[0];
    const numSets = parseInt(sets) || 1;

    await saveWorkout({ workoutDate: today });

    for (let i = 0; i < numSets; i++) {
      await logSet({
        exerciseId: parseInt(selectedExercise),
        workoutDate: today,
        setNumber: i + 1,
        reps: parseInt(reps),
        weightLbs: parseFloat(weight),
      });
    }

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
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Dumbbell className="w-12 h-12 text-purple-500" />
        </motion.div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Temple of Gains</h3>
          <p className="text-muted-foreground max-w-sm">
            Import your workout history from Liftosaur, or start fresh with a library of common exercises.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImportingLiftosaur}
            variant="default"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* ═══════════ ROW 1: Hero Stats & Absurd Facts ═══════════ */}

      {/* HERO - YTD Stats with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 glass-card rounded-xl p-4 flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-card/80 to-orange-900/20 backdrop-blur-xl"
        style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-400" />
            Year to Date
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              {ytdWorkouts}
            </span>
            <span className="text-muted-foreground text-sm">workouts</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <div className="text-lg font-bold text-orange-400">{formatVolume(ytdVolume)}</div>
              <div className="text-xs text-muted-foreground">lbs lifted</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{totalSets}</div>
              <div className="text-xs text-muted-foreground">total sets</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ABSURD FACTS TICKER */}
      <div className="col-span-4">
        <LiftingFactsTicker absurd={absurdComparisons} className="h-full" />
      </div>

      {/* ═══════════ ROW 2: Main Content ═══════════ */}

      {/* MUSCLE DISTRIBUTION + CALENDAR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-4 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <Dumbbell className="w-3 h-3 text-purple-400" />
            Your Lifting Journey
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
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-purple-500/30 hover:bg-purple-500/10">
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
                    className="w-full bg-gradient-to-r from-purple-500 to-orange-500"
                  >
                    {isLoggingSet ? "Logging..." : "Log Set"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Two-column layout: Muscle Distribution + Calendar */}
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <MuscleDistribution muscleVolumes={muscleVolumes} />
          <WorkoutCalendar workouts={calendarWorkouts} />
        </div>
      </motion.div>

      {/* GOAL PROGRESS + PRs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 row-span-1 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl"
      >
        {/* Goal Ring */}
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Goal Progress
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#progress-gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(progressPercent, 100) * 2.51} 251`}
              />
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                {progressPercent}%
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm flex items-center gap-1">
              <span className="font-semibold">{ytdWorkouts}</span> /
              <EditableGoal value={yearlyWorkoutsGoal} unit="" goalKey="yearly_workouts" onUpdate={onUpdateGoal} isUpdating={isUpdating} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{workoutsRemaining} remaining</div>
            <div className="text-xs text-emerald-400">{workoutsPerWeek}/week to go</div>
          </div>
        </div>

        {/* Recent PRs */}
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          Recent PRs
        </div>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {stats?.recentPRs && stats.recentPRs.length > 0 ? (
            stats.recentPRs.slice(0, 4).map((pr, i) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                    {pr.exerciseName}
                  </span>
                </div>
                <span className="text-sm font-bold text-amber-400">{Number(pr.weightLbs)} lbs</span>
              </motion.div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              Hit new PRs to see them here
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════ ROW 3: Bottom Stats ═══════════ */}

      {/* ALL-TIME PRs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-3 glass-card rounded-xl p-4 flex flex-col bg-card/80 backdrop-blur-xl"
      >
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
          <Weight className="w-3 h-3 text-purple-400" />
          Top Lifts
        </div>
        <div className="flex-1 flex items-center justify-around">
          {stats?.prs && stats.prs.length > 0 ? (
            stats.prs.slice(0, 3).map((pr, i) => (
              <motion.div
                key={pr.exerciseId}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="text-2xl font-bold text-purple-400">{pr.weight} lbs</div>
                <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {pr.exerciseName}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Log sets to track PRs</div>
          )}
        </div>
      </motion.div>

      {/* QUICK STATS + ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="col-span-3 glass-card rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-purple-900/20 via-card/80 to-orange-900/20 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            size="sm"
            disabled={isImportingLiftosaur}
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            {isImportingLiftosaur ? "..." : "Import"}
          </Button>
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            disabled={isResettingData}
            className="text-xs text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            {isResettingData ? "..." : "Reset"}
          </Button>
        </div>
        <div className="flex items-center justify-around flex-1">
        {[
          { label: "Workouts", value: ytdWorkouts.toString(), color: "from-purple-400 to-purple-500", icon: Dumbbell },
          { label: "Best Lift", value: `${bestLift}`, unit: "lbs", color: "from-orange-400 to-orange-500", icon: Weight },
          { label: "PRs", value: (stats?.prs?.length || 0).toString(), color: "from-amber-400 to-amber-500", icon: Trophy },
          { label: "Goal", value: `${progressPercent}%`, color: "from-emerald-400 to-emerald-500", icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <div className={cn("text-xl font-bold flex items-center justify-center gap-1 bg-gradient-to-r bg-clip-text text-transparent", stat.color)}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color.includes("purple") ? "#a855f7" : stat.color.includes("orange") ? "#f97316" : stat.color.includes("amber") ? "#f59e0b" : "#10b981" }} />
              {stat.value}{stat.unit && <span className="text-xs ml-0.5">{stat.unit}</span>}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
        </div>
      </motion.div>
    </div>
  );
}
