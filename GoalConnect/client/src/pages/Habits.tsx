import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { HabitCreateDialog as HabitDialog } from "@/components/HabitCreateDialog";
import { getToday, formatDateInput } from "@/lib/utils";

// REMOVED: MagicalCanvas - No longer needed for mountain aesthetic

// Mountain-themed color palette for habits
const habitColors = [
  { bg: "hsl(var(--card))", name: "Granite Gray" },
  { bg: "hsl(32 25% 45%)", name: "Rock Brown" },
  { bg: "hsl(210 40% 35%)", name: "Dusk Blue" },
  { bg: "hsl(15 30% 40%)", name: "Clay Red" },
  { bg: "hsl(140 20% 40%)", name: "Pine Green" },
  { bg: "hsl(25 35% 50%)", name: "Dawn Orange" },
  { bg: "hsl(200 30% 30%)", name: "Storm Gray" },
  { bg: "hsl(45 25% 45%)", name: "Sandstone" },
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

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [completingHabit, setCompletingHabit] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits-with-data"],
  });

  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", selectedDate],
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: selectedDate,
      });
    },
    onMutate: (habitId) => {
      setCompletingHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      setTimeout(() => setCompletingHabit(null), 800);
    },
    onError: () => {
      setCompletingHabit(null);
    },
  });

  // Date navigation functions
  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateInput(date));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateInput(date));
  };

  const goToToday = () => {
    setSelectedDate(getToday());
  };

  const isToday = selectedDate === getToday();
  const isFuture = selectedDate > getToday();

  // Format the selected date for display
  const selectedDateDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleDelete = (id: number) => {
    if (confirm("Archive this habit?")) {
      deleteHabitMutation.mutate(id);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingHabit(undefined);
    setHabitDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setHabitDialogOpen(false);
    setEditingHabit(undefined);
  };

  const isCompletedToday = (habitId: number) => {
    return todayLogs.some(log => log.habitId === habitId && log.completed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 max-w-5xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern h-40 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-6 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Your Training
                </h1>
                <p className="text-sm text-muted-foreground">
                  {habits.length} {habits.length === 1 ? 'habit' : 'habits'} in progress
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-6 py-6 bg-primary hover:bg-primary/90 text-white shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">New Habit</span>
              </Button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between gap-4 bg-muted/30 backdrop-blur-sm rounded-2xl p-4 border border-card-border">
              <button
                onClick={goToPreviousDay}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all border border-card-border"
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
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
                  >
                    Jump to Today
                  </button>
                )}
                {isFuture && (
                  <span className="text-xs text-[hsl(var(--accent))]">
                    Future Date
                  </span>
                )}
              </div>

              <button
                onClick={goToNextDay}
                className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all border border-card-border"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-12 text-center relative">
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                No Training Scheduled
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Track your daily training habits
              </p>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                Start New Training
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

// Minutes Tracker Component
function MinutesTracker({ minutes, onMinutesChange }: { minutes: number; onMinutesChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-card-border">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMinutesChange(-5)}
          className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all border border-card-border"
          disabled={minutes <= 0}
        >
          <ChevronDown className="w-4 h-4 text-foreground" />
        </button>
        <span className="text-foreground font-bold text-lg min-w-[60px] text-center">
          {minutes} min
        </span>
        <button
          onClick={() => onMinutesChange(5)}
          className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-all border border-card-border"
        >
          <ChevronUp className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}

// Individual Habit Card Component (Redesigned with unique visuals)
function HabitCard({ habit, completed, color, isCompleting, onToggle, onEdit, onDelete }: {
  habit: HabitWithData;
  completed: boolean;
  color: { bg: string; name: string };
  isCompleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [minutes, setMinutes] = useState(0);
  const [showMinutes] = useState(false); // TODO: Add this to habit settings
  const [showPointsFeedback, setShowPointsFeedback] = useState(false);

  // Data now comes from the habit prop (batch fetched)
  const streak = habit.streak;
  const weeklyProgress = habit.weeklyProgress;
  const completionHistory = habit.history;

  const isWeekly = habit.cadence === 'weekly';
  const progress = weeklyProgress?.progress || 0;
  const target = weeklyProgress?.targetPerWeek || 3;
  const progressPercentage = isWeekly ? Math.round((progress / target) * 100) : 0;

  const handleMinutesChange = (delta: number) => {
    setMinutes(Math.max(0, minutes + delta));
  };

  // Calculate points earned based on difficulty and streak
  const calculatePointsEarned = () => {
    const difficultyPoints = {
      'easy': 5,
      'medium': 10,
      'hard': 15
    };
    const basePoints = difficultyPoints[habit.difficulty as keyof typeof difficultyPoints] || 10;
    const streakValue = streak?.streak || 0;

    let multiplier = 1.0;
    if (streakValue >= 30) multiplier = 3.0;
    else if (streakValue >= 14) multiplier = 2.0;
    else if (streakValue >= 7) multiplier = 1.5;
    else if (streakValue >= 3) multiplier = 1.2;

    return {
      points: Math.round(basePoints * multiplier),
      multiplier: multiplier,
      basePoints: basePoints
    };
  };

  // Show points feedback when completing
  const handleToggleWithFeedback = () => {
    if (!completed) {
      setShowPointsFeedback(true);
      setTimeout(() => setShowPointsFeedback(false), 2000);
    }
    onToggle();
  };

  const pointsInfo = calculatePointsEarned();

  // Calculate 7-day completion rate for progress bar
  const completionRate = completionHistory
    ? Math.round((completionHistory.history.filter(d => d.completed).length / completionHistory.history.length) * 100)
    : 0;

  return (
    <div
      className={`bg-card/80 backdrop-blur-sm border border-card-border rounded-2xl shadow-lg topo-pattern p-6 relative overflow-hidden transition-all duration-500 ${
        isCompleting ? 'scale-98' : 'scale-100 hover:scale-102'
      }`}
      style={{
        transform: isCompleting ? 'scale(0.98)' : undefined,
      }}
    >
      {/* Accent bar for visual differentiation */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: color.bg,
        }}
      />

      <div className="flex items-start gap-5 relative z-10">
        {/* Left side: Large Icon for visual differentiation */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border-2 border-card-border"
          style={{
            background: color.bg,
          }}
        >
          {habit.icon}
        </div>

        {/* Middle: Main content */}
        <div className="flex-1">
          {/* Habit Name */}
          <h3 className="text-2xl font-extrabold text-foreground mb-2 leading-tight">
            {habit.title}
          </h3>

          {/* Streak Display - ENHANCED for visibility */}
          <div className="flex items-center gap-3 mb-3">
            {streak && streak.streak > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/30 shadow-lg transition-all hover:scale-105 animate-pulse-subtle">
                <span className="text-2xl drop-shadow-glow">🔥</span>
                <span className="text-foreground font-extrabold text-sm">
                  {streak.streak} day{streak.streak > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Points Badge - ENHANCED with glow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/40 shadow-lg transition-all hover:scale-105">
              <span className="text-2xl drop-shadow-glow">🪙</span>
              <span className="text-foreground font-extrabold text-sm">
                {pointsInfo.points} tokens
              </span>
            </div>
          </div>

          {/* Weekly Progress Circles - ENHANCED with pulse animation */}
          {isWeekly && (
            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                {Array.from({ length: target }).map((_, i) => {
                  const isCompleted = i < progress;
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 border-2 ${
                        isCompleted
                          ? 'border-[hsl(var(--accent))]/70 shadow-lg animate-pulse-subtle'
                          : 'border-card-border'
                      }`}
                      style={{
                        background: isCompleted ? color.bg : 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
                        boxShadow: isCompleted ? '0 0 12px hsla(var(--accent), 0.4)' : 'none',
                      }}
                    >
                      {isCompleted && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground font-semibold">
                {progress}/{target} this week {weeklyProgress?.isComplete && (
                  <span className="ml-2 text-[hsl(var(--accent))] font-extrabold animate-pulse">
                    ✨ Complete!
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
                <span className="text-xs text-foreground font-bold">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70
                      ? 'hsl(var(--primary))'
                      : completionRate >= 40
                      ? 'hsl(var(--accent))'
                      : 'hsl(32 70% 50%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Minutes Tracker (if enabled) */}
          {showMinutes && (
            <div className="mb-3">
              <MinutesTracker minutes={minutes} onMinutesChange={handleMinutesChange} />
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
            className={`px-6 py-4 rounded-2xl font-bold transition-all duration-500 border-2 ${
              completed
                ? 'bg-primary text-white border-primary/50'
                : 'bg-muted text-foreground border-card-border hover:border-primary/50 hover:bg-primary/10'
            }`}
            style={{
              cursor: isCompleting ? 'not-allowed' : 'pointer',
              transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
              minWidth: '100px',
            }}
          >
            {isCompleting ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Done!</span>
              </div>
            ) : completed ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Done</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Mark</span>
              </div>
            )}
          </button>

          {/* Points Earned Feedback - AMPLIFIED CELEBRATION */}
          {showPointsFeedback && (
            <div className="absolute -top-24 right-0 bg-gradient-to-br from-[hsl(var(--accent))] to-primary text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-[hsl(var(--accent))]/80 animate-bounce z-50 min-w-[200px] text-center transform scale-110">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-3xl animate-spin-slow">✨</span>
                <div className="text-3xl font-extrabold drop-shadow-lg">+{pointsInfo.points}</div>
                <span className="text-3xl">🪙</span>
              </div>
              <div className="text-sm font-bold tracking-wide uppercase opacity-95">Tokens Earned!</div>
              {pointsInfo.multiplier > 1 && (
                <div className="text-sm font-semibold mt-1 bg-white/20 rounded-full px-3 py-1 inline-block">
                  {pointsInfo.basePoints} × {pointsInfo.multiplier}x streak bonus!
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Completion animation overlay */}
      {isCompleting && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
            animation: 'pulse 0.8s ease-out',
          }}
        />
      )}
    </div>
  );
}
