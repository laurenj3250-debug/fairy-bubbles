import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Mountain, TrendingUp, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar, Zap, ArrowLeft } from "lucide-react";
import { HabitCreateDialog as HabitDialog } from "@/components/HabitCreateDialog";
import { getToday, formatDateInput } from "@/lib/utils";
import { getWeatherFromStreak, WEATHER_INFO } from "@/lib/weatherEffects";
import { WeatherOverlay } from "@/components/WeatherOverlay";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { RouteStatsPanel } from "@/components/RouteStatsPanel";
import { StreakFlame } from "@/components/StreakFlame";
import { TokenReward } from "@/components/TokenReward";

// Mountain-themed color palette based on terrain and elevation
const habitColors = [
  { bg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))", name: "Stone Peak", border: "hsl(var(--primary) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--secondary)))", name: "Granite Ridge", border: "hsl(var(--accent) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))", name: "Forest Base", border: "hsl(var(--secondary) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", name: "Glacier Ice", border: "hsl(var(--primary) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))", name: "Deep Ice", border: "hsl(var(--accent) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))", name: "Sky Ridge", border: "hsl(var(--secondary) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8))", name: "Snowmelt Stream", border: "hsl(var(--primary) / 0.4)" },
  { bg: "linear-gradient(135deg, hsl(var(--accent) / 0.7), hsl(var(--secondary) / 0.7))", name: "Rocky Cliff", border: "hsl(var(--accent) / 0.4)" },
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

      // Use the same toggle endpoint as TodaysPitch
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: selectedDate,
      });
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", selectedDate] });
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

  // Calculate stats for the panel and weather
  const completedToday = habits.filter(h => isCompletedToday(h.id)).length;
  const inProgress = habits.filter(h => !isCompletedToday(h.id)).length;
  const missedDaysThisWeek = habits.length > 0
    ? Math.min(Math.floor((habits.length - completedToday) / habits.length * 7), 7)
    : 0;

  const weather = getWeatherFromStreak(longestStreak, missedDaysThisWeek);
  const weatherInfo = WEATHER_INFO[weather];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="space-y-4 w-full max-w-5xl mx-auto p-6">
          <div className="h-40 bg-card/40 rounded-2xl animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card/40 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/weekly-hub">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Today
            </Button>
          </Link>
        </div>

        {/* Hero Header - Soft glass */}
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-8 mb-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 60%)`
            }}
          />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Daily Routes
              </h1>

              <p className="text-sm text-foreground/60">
                {habits.length} {habits.length === 1 ? 'route' : 'routes'} • {completedToday} sent today
              </p>
            </div>

            {/* Date Navigator - soft glass */}
            <div className="flex items-center gap-2 bg-background/30 backdrop-blur-xl border border-foreground/10 rounded-2xl p-2 shadow-lg">
              <button
                onClick={goToPreviousDay}
                className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
              </button>

              <div className="px-3 text-sm font-medium text-foreground min-w-[120px] text-center">
                {selectedDateDisplay}
              </div>

              <button
                onClick={goToNextDay}
                className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="mb-8">
          <RouteStatsPanel
            sent={completedToday}
            inProgress={inProgress}
            total={habits.length}
          />
        </div>

        {/* New Habit Button */}
        <div className="mb-6">
          <Button
            onClick={handleCreateNew}
            className="rounded-full px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-semibold">New Route</span>
          </Button>
        </div>

        {/* Weather Badge - Compact */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-3 bg-background/40 backdrop-blur-xl rounded-xl border border-foreground/10 shadow-lg relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at left, hsl(var(--accent) / 0.3), transparent 70%)`
              }}
            />
            <span className="text-2xl relative z-10">{weatherInfo.emoji}</span>
            <div className="relative z-10">
              <div className="text-sm font-bold text-foreground">{weatherInfo.name}</div>
              <div className="text-xs text-foreground/60">{weatherInfo.description}</div>
            </div>
            {longestStreak >= 7 && (
              <Badge className="relative z-10" style={{
                background: 'hsl(var(--accent) / 0.2)',
                color: 'hsl(var(--accent))',
                border: '1px solid hsl(var(--accent) / 0.3)'
              }}>
                Perfect Conditions
              </Badge>
            )}
            {missedDaysThisWeek >= 3 && (
              <Badge className="relative z-10" style={{
                background: 'hsl(var(--destructive) / 0.2)',
                color: 'hsl(var(--destructive))',
                border: '1px solid hsl(var(--destructive) / 0.3)'
              }}>
                Storm Warning
              </Badge>
            )}
          </div>
        </div>

        {/* Habits/Routes */}
        {habits.length === 0 ? (
          <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, hsl(var(--accent) / 0.3), transparent 70%)`
              }}
            />
            <div className="relative z-10">
              <Mountain className="w-16 h-16 mx-auto mb-6" style={{ color: 'hsl(var(--accent))' }} />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Start Your Ascent
              </h2>
              <p className="text-foreground/60 mb-8 text-lg">
                Build habits to strengthen your expedition and unlock new mountains
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-xl px-8 py-6 text-lg shadow-xl hover:scale-105 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
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
      className={`bg-background/40 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden transition-all duration-500 border shadow-lg ${
        completed ? 'border-foreground/20 shadow-xl' : 'border-foreground/10'
      } ${isCompleting ? 'scale-98' : 'scale-100 hover:scale-[1.02]'}`}
    >
      {/* Soft gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, hsl(var(--accent) / 0.3), transparent 70%)`
        }}
      />

      <div className="flex items-start gap-5 relative z-10">
        {/* Left side: Elevation Icon */}
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 border shadow-lg"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))`,
            borderColor: 'hsl(var(--foreground) / 0.15)',
            boxShadow: '0 4px 20px hsl(var(--accent) / 0.15)',
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-sm"
                style={{
                  background: 'hsl(var(--accent) / 0.15)',
                  borderColor: 'hsl(var(--accent) / 0.3)'
                }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                <span className="text-foreground font-bold text-xs">
                  {streak.streak} day{streak.streak > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Energy Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-sm"
              style={{
                background: 'hsl(var(--accent) / 0.15)',
                borderColor: 'hsl(var(--accent) / 0.3)'
              }}
            >
              <Zap className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
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
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-500 border ${
                        isCompleted
                          ? 'shadow-lg'
                          : ''
                      }`}
                      style={{
                        background: isCompleted
                          ? `linear-gradient(135deg, hsl(var(--accent) / 0.8), hsl(var(--primary) / 0.6))`
                          : 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
                        boxShadow: isCompleted ? '0 4px 15px hsl(var(--accent) / 0.3)' : 'none',
                        borderColor: isCompleted ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--foreground) / 0.1)',
                      }}
                    >
                      {isCompleted && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground font-semibold">
                {progress}/{target} this week {weeklyProgress?.isComplete && (
                  <span className="ml-2" style={{ color: 'hsl(var(--accent))' }}>
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
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--foreground) / 0.08)' }}>
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70
                      ? `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`
                      : completionRate >= 40
                      ? `linear-gradient(90deg, hsl(var(--accent)), hsl(var(--secondary)))`
                      : `linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--accent)))`,
                    boxShadow: '0 0 8px hsl(var(--accent) / 0.4)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Details */}
          <p className="text-xs text-foreground/60">
            {isWeekly ? `${target}× per week` : 'Daily habit'} • {habit.difficulty || 'medium'}
          </p>
        </div>

        {/* Right side: Completion Button */}
        <div className="flex flex-col gap-3 items-end relative">
          <button
            onClick={handleToggleWithFeedback}
            disabled={isCompleting}
            className={`px-6 py-4 rounded-xl font-bold transition-all duration-500 border shadow-lg hover:shadow-xl ${
              completed
                ? 'text-white'
                : 'text-foreground'
            }`}
            style={{
              background: completed
                ? `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))`
                : 'hsl(var(--background) / 0.6)',
              cursor: isCompleting ? 'not-allowed' : 'pointer',
              transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
              boxShadow: completed
                ? '0 4px 20px hsl(var(--accent) / 0.3)'
                : '0 2px 10px hsl(var(--foreground) / 0.1)',
              minWidth: '100px',
              borderColor: completed ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--foreground) / 0.15)',
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
            className="text-xs px-2 py-1 transition-colors hover:bg-foreground/5 rounded-lg"
            style={{ color: 'hsl(var(--foreground) / 0.6)' }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 transition-colors hover:bg-foreground/5 rounded-lg"
            style={{ color: 'hsl(var(--foreground) / 0.6)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
