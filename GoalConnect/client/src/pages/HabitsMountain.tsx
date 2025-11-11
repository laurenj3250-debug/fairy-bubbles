import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Mountain, TrendingUp, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar, Zap } from "lucide-react";
import { HabitCreateDialog as HabitDialog } from "@/components/HabitCreateDialog";
import { getToday, formatDateInput } from "@/lib/utils";
import { getWeatherFromStreak, WEATHER_INFO } from "@/lib/weatherEffects";
import { WeatherOverlay } from "@/components/WeatherOverlay";
import { Badge } from "@/components/ui/badge";

// Mountain-themed color palette based on terrain and elevation
const habitColors = [
  { bg: "linear-gradient(135deg, #475569 0%, #334155 100%)", name: "Stone Peak", border: "#64748b" },
  { bg: "linear-gradient(135deg, #64748b 0%, #475569 100%)", name: "Granite Ridge", border: "#94a3b8" },
  { bg: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", name: "Forest Base", border: "#14b8a6" },
  { bg: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", name: "Glacier Ice", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0e7490 0%, #155e75 100%)", name: "Deep Ice", border: "#06b6d4" },
  { bg: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", name: "Sky Ridge", border: "#3b82f6" },
  { bg: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", name: "Snowmelt Stream", border: "#22d3ee" },
  { bg: "linear-gradient(135deg, #78716c 0%, #57534e 100%)", name: "Rocky Cliff", border: "#a8a29e" },
];

// Get consistent color for a habit based on its ID
const getHabitColor = (id: number) => {
  return habitColors[id % habitColors.length];
};

interface WeeklyProgress {
  progress: number;
  targetPerWeek: number;
  isComplete: boolean;
}

interface HabitStreak {
  streak: number;
}

interface CompletionHistory {
  habitId: number;
  history: Array<{
    date: string;
    completed: boolean;
    dayOfWeek: string;
  }>;
}

interface HabitWithData extends Habit {
  streak: HabitStreak;
  weeklyProgress: WeeklyProgress | null;
  history: CompletionHistory;
}

export default function HabitsMountain() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(() => getToday());
  const [completingHabit, setCompletingHabit] = useState<number | null>(null);

  // Fetch habits with streak, progress, and history using batch endpoint
  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Fetch logs for selected date
  const { data: logsData } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", selectedDate],
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      console.log('[HabitsMountain] Toggling habit', habitId, 'on date', selectedDate);
      setCompletingHabit(habitId);

      const existingLog = logsData?.find(
        (log) => log.habitId === habitId && log.date === selectedDate
      );

      console.log('[HabitsMountain] Existing log:', existingLog);

      if (existingLog) {
        console.log('[HabitsMountain] Deleting log', existingLog.id);
        await apiRequest(`/api/habit-logs/${existingLog.id}`, "DELETE");
      } else {
        console.log('[HabitsMountain] Creating new log');
        await apiRequest("/api/habit-logs", "POST", {
          habitId,
          date: selectedDate,
          completed: true,
        });
      }
    },
    onSuccess: () => {
      // Only invalidate specific queries to avoid 404 errors
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", selectedDate], exact: true });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/climbing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      setTimeout(() => setCompletingHabit(null), 500);
    },
    onError: () => {
      setCompletingHabit(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const isCompletedToday = (habitId: number) => {
    return logsData?.some(
      (log) => log.habitId === habitId && log.date === selectedDate && log.completed
    ) || false;
  };

  const handleCreateNew = () => {
    setEditingHabit(undefined);
    setHabitDialogOpen(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setHabitDialogOpen(false);
    setEditingHabit(undefined);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this habit?")) {
      deleteMutation.mutate(id);
    }
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateInput(date));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateInput(date));
  };

  const goToToday = () => {
    setSelectedDate(getToday());
  };

  const isToday = selectedDate === getToday();
  const selectedDateDisplay = (() => {
    const date = new Date(selectedDate + "T00:00:00");
    const today = new Date(getToday() + "T00:00:00");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === yesterday.getTime()) return "Yesterday";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  const isFuture = new Date(selectedDate) > new Date(getToday());

  // Calculate weather based on streaks
  const longestStreak = habits.reduce((max, habit) => {
    const streak = habit.streak?.streak || 0;
    return Math.max(max, streak);
  }, 0);

  // Calculate missed days (approximate based on incomplete habits)
  const completedToday = habits.filter(h => isCompletedToday(h.id)).length;
  const missedDaysThisWeek = habits.length > 0
    ? Math.min(Math.floor((habits.length - completedToday) / habits.length * 7), 7)
    : 0;

  const weather = getWeatherFromStreak(longestStreak, missedDaysThisWeek);
  const weatherInfo = WEATHER_INFO[weather];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24 bg-background">
        <div className="space-y-4 w-full max-w-5xl mx-auto p-6">
          <div className="h-40 bg-card/80 rounded-2xl animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card/80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background" data-weather={weather}>
      {/* Weather overlay with animated effects */}
      <WeatherOverlay weather={weather} />

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-6 mb-6 shadow-lg topo-pattern">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Mountain className="w-9 h-9 text-[hsl(var(--accent))]" />
                Training Camp
              </h1>
              <p className="text-sm text-muted-foreground">
                {habits.length} {habits.length === 1 ? 'habit' : 'habits'} building your expedition strength
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-xl px-6 py-6 bg-primary hover:bg-primary/90 text-primary-foreground border border-card-border shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">New Habit</span>
            </Button>
          </div>

          {/* Weather Conditions Display */}
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl border border-border mb-4 relative z-10">
            <span className="text-2xl">{weatherInfo.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground">{weatherInfo.name}</div>
              <div className="text-xs text-muted-foreground">{weatherInfo.description}</div>
            </div>
            {longestStreak >= 7 && (
              <Badge className="bg-muted/80 text-[hsl(var(--accent))] border-border">
                Perfect Conditions
              </Badge>
            )}
            {missedDaysThisWeek >= 3 && (
              <Badge className="bg-muted/80 text-destructive border-border">
                Storm Warning
              </Badge>
            )}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-between gap-4 bg-muted/50 rounded-xl p-4 border border-border relative z-10">
            <button
              onClick={goToPreviousDay}
              className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-all border border-border"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">
                  {selectedDateDisplay}
                </span>
              </div>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs text-[hsl(var(--accent))] hover:text-primary transition-colors font-semibold"
                >
                  Jump to Today
                </button>
              )}
              {isFuture && (
                <span className="text-xs text-muted-foreground">
                  Future Date
                </span>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-all border border-border"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl p-12 text-center shadow-lg topo-pattern">
            <div className="relative z-10">
              <Mountain className="w-16 h-16 mx-auto mb-6 text-[hsl(var(--accent))]" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Start Your Ascent
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Build habits to strengthen your expedition and unlock new mountains
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-xl px-8 py-6 text-lg bg-muted hover:bg-muted/80 text-foreground border border-card-border shadow-lg"
              >
                Create First Habit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {habits.map((habit) => {
              const completed = isCompletedToday(habit.id);
              const color = getHabitColor(habit.id);
              const isCompleting = completingHabit === habit.id;

              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={completed}
                  color={color}
                  isCompleting={isCompleting}
                  onToggle={() => toggleHabitMutation.mutate(habit.id)}
                  onEdit={() => handleEdit(habit)}
                  onDelete={() => handleDelete(habit.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <HabitDialog
        open={habitDialogOpen}
        onClose={handleCloseDialog}
        habit={editingHabit}
      />
    </div>
  );
}

// Mountain-themed Habit Card Component
function HabitCard({ habit, completed, color, isCompleting, onToggle, onEdit, onDelete }: {
  habit: HabitWithData;
  completed: boolean;
  color: { bg: string; name: string; border: string };
  isCompleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showEnergyFeedback, setShowEnergyFeedback] = useState(false);

  const streak = habit.streak;
  const weeklyProgress = habit.weeklyProgress;
  const completionHistory = habit.history;

  const isWeekly = habit.cadence === 'weekly';
  const progress = weeklyProgress?.progress || 0;
  const target = weeklyProgress?.targetPerWeek || 3;

  // Calculate energy earned (renamed from points)
  const calculateEnergyEarned = () => {
    const difficultyEnergy = {
      'easy': 5,
      'medium': 10,
      'hard': 15
    };
    const baseEnergy = difficultyEnergy[habit.difficulty as keyof typeof difficultyEnergy] || 10;
    const streakValue = streak?.streak || 0;

    let multiplier = 1.0;
    if (streakValue >= 30) multiplier = 3.0;
    else if (streakValue >= 14) multiplier = 2.0;
    else if (streakValue >= 7) multiplier = 1.5;
    else if (streakValue >= 3) multiplier = 1.2;

    return {
      energy: Math.round(baseEnergy * multiplier),
      multiplier: multiplier,
      baseEnergy: baseEnergy
    };
  };

  const handleToggleWithFeedback = () => {
    if (!completed) {
      setShowEnergyFeedback(true);
      setTimeout(() => setShowEnergyFeedback(false), 2000);
    }
    onToggle();
  };

  const energyInfo = calculateEnergyEarned();

  // Calculate 7-day completion rate
  const completionRate = completionHistory
    ? Math.round((completionHistory.history.filter(d => d.completed).length / completionHistory.history.length) * 100)
    : 0;

  return (
    <div
      className={`bg-card/80 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden transition-all duration-500 border shadow-lg topo-pattern ${
        completed ? 'border-[hsl(var(--accent))] shadow-[hsl(var(--accent))]/20' : 'border-card-border'
      } ${isCompleting ? 'scale-98' : 'scale-100 hover:scale-[1.02]'}`}
    >
      {/* Gradient background accent */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: color.bg,
        }}
      />

      <div className="flex items-start gap-5 relative z-10">
        {/* Left side: Elevation Icon */}
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 border-2"
          style={{
            background: `linear-gradient(135deg, ${color.border}40 0%, ${color.border}20 100%)`,
            borderColor: color.border,
            boxShadow: `0 4px 20px ${color.border}40`,
          }}
        >
          {habit.icon}
        </div>

        {/* Middle: Main content */}
        <div className="flex-1">
          {/* Habit Name */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {habit.title}
          </h3>

          {/* Streak & Energy Display */}
          <div className="flex items-center gap-3 mb-3">
            {streak && streak.streak > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/50 border-border">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--accent))]" />
                <span className="text-foreground font-bold text-xs">
                  {streak.streak} day{streak.streak > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Energy Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/50 border-border">
              <Zap className="w-4 h-4 text-[hsl(var(--accent))]" />
              <span className="text-foreground font-bold text-xs">
                {energyInfo.energy} energy
              </span>
            </div>
          </div>

          {/* Weekly Progress Circles */}
          {isWeekly && (
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                {Array.from({ length: target }).map((_, i) => {
                  const isCompleted = i < progress;
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-500 border-2 ${
                        isCompleted
                          ? 'border-[hsl(var(--accent))]/50 shadow-lg'
                          : 'border-border'
                      }`}
                      style={{
                        background: isCompleted ? color.bg : 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
                        boxShadow: isCompleted ? `0 4px 15px ${color.border}60` : 'none',
                      }}
                    >
                      {isCompleted && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground font-semibold">
                {progress}/{target} this week {weeklyProgress?.isComplete && (
                  <span className="ml-2 text-[hsl(var(--accent))]">
                    ✓ Complete!
                  </span>
                )}
              </p>
            </div>
          )}

          {/* 7-Day Progress Bar */}
          {completionHistory && completionHistory.history.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
                <span className="text-xs text-muted-foreground font-bold">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70
                      ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                      : completionRate >= 40
                      ? 'hsl(var(--accent))'
                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 0 8px hsl(var(--accent) / 0.5)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Details */}
          <p className="text-xs text-muted-foreground">
            {isWeekly ? `${target}× per week` : 'Daily habit'} • {habit.difficulty || 'medium'}
          </p>
        </div>

        {/* Right side: Completion Button */}
        <div className="flex flex-col gap-3 items-end relative">
          <button
            onClick={handleToggleWithFeedback}
            disabled={isCompleting}
            className={`px-6 py-4 rounded-xl font-bold text-foreground transition-all duration-500 border-2 ${
              completed
                ? 'border-[hsl(var(--accent))]/50'
                : 'border-border hover:border-border/80'
            }`}
            style={{
              background: completed
                ? 'hsl(var(--accent))'
                : 'hsl(var(--muted))',
              cursor: isCompleting ? 'not-allowed' : 'pointer',
              transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
              boxShadow: completed
                ? '0 4px 20px hsl(var(--accent) / 0.4)'
                : '0 2px 10px rgba(0,0,0,0.2)',
              minWidth: '100px',
            }}
          >
            {isCompleting ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 animate-pulse" />
                <span>Done!</span>
              </div>
            ) : completed ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Done</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mountain className="w-5 h-5" />
                <span>Mark</span>
              </div>
            )}
          </button>

          {/* Energy Earned Feedback */}
          {showEnergyFeedback && (
            <div
              className="absolute -top-20 right-0 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg border-2 border-card-border animate-bounce z-50"
              style={{
                minWidth: '150px',
                textAlign: 'center',
                animation: 'fadeInUp 0.5s ease-out, fadeOut 0.5s ease-out 1.5s',
              }}
            >
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                +{energyInfo.energy}
              </div>
              {energyInfo.multiplier > 1 && (
                <div className="text-xs opacity-90">
                  {energyInfo.baseEnergy} × {energyInfo.multiplier}x streak!
                </div>
              )}
            </div>
          )}

          {/* Mini actions */}
          <button
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
