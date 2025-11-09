import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { HabitDialogNew as HabitDialog } from "@/components/HabitDialogNew";
import { getToday, formatDateInput } from "@/lib/utils";

// Magical Canvas Component (matching Dashboard)
function MagicalCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('habitsCanvas');
    if (!canvas) return;

    // Create fairy lights
    const colors = ['#a7f3d0', '#fbbf24', '#a78bfa', '#fca5a5', '#93c5fd'];
    for (let i = 0; i < 30; i++) {
      const light = document.createElement('div');
      light.className = 'absolute rounded-full float-fairy blur-sm';
      light.style.background = colors[Math.floor(Math.random() * colors.length)];
      light.style.width = Math.random() * 4 + 2 + 'px';
      light.style.height = light.style.width;
      light.style.left = Math.random() * 100 + '%';
      light.style.top = Math.random() * 100 + '%';
      light.style.animationDelay = Math.random() * 8 + 's';
      light.style.animationDuration = (Math.random() * 4 + 6) + 's';
      canvas.appendChild(light);
    }

    // Create twinkling stars
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'absolute w-0.5 h-0.5 bg-white rounded-full twinkle';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.boxShadow = '0 0 3px white, 0 0 6px white';
      canvas.appendChild(star);
    }

    return () => {
      if (canvas) {
        canvas.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      id="habitsCanvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}

// Color palette for habits
const habitColors = [
  { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", name: "Cosmic Purple" },
  { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", name: "Sunset Pink" },
  { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", name: "Ocean Blue" },
  { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", name: "Fresh Mint" },
  { bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", name: "Peachy" },
  { bg: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", name: "Deep Sea" },
  { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", name: "Cotton Candy" },
  { bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", name: "Rose Quartz" },
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
      <div className="min-h-screen enchanted-bg">
        <MagicalCanvas />
        <div className="relative z-10 max-w-5xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-3xl h-40 magical-glow animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen enchanted-bg pb-24">
      <MagicalCanvas />

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Enchanted Header */}
        <div className="glass-card rounded-3xl p-6 mb-6 magical-glow shimmer-effect relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1
                  className="text-4xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 20px rgba(167, 139, 250, 0.8)' }}
                >
                  Your Habits
                </h1>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {habits.length} {habits.length === 1 ? 'habit' : 'habits'} growing strong
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                className="rounded-full px-6 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-2 border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">New Habit</span>
              </Button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
              <button
                onClick={goToPreviousDay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-lg font-bold text-white" style={{ fontFamily: "'Comfortaa', cursive" }}>
                    {selectedDateDisplay}
                  </span>
                </div>
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="text-xs text-yellow-300 hover:text-yellow-200 transition-colors font-semibold"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Jump to Today
                  </button>
                )}
                {isFuture && (
                  <span className="text-xs text-orange-300" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    Future Date
                  </span>
                )}
              </div>

              <button
                onClick={goToNextDay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="glass-card-blue rounded-3xl p-12 text-center magical-glow">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-cyan-300" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' }} />
            <h2
              className="text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "'Comfortaa', cursive", textShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}
            >
              Begin Your Journey
            </h2>
            <p className="text-white/80 mb-8 text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Create your first habit and watch the magic unfold
            </p>
            <Button
              onClick={handleCreateNew}
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-2 border-white/30 shadow-lg"
            >
              Create First Habit
            </Button>
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
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/20">
      <Clock className="w-4 h-4 text-white/70" />
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMinutesChange(-5)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
          disabled={minutes <= 0}
        >
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        <span className="text-white font-bold text-lg min-w-[60px] text-center" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          {minutes} min
        </span>
        <button
          onClick={() => onMinutesChange(5)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
        >
          <ChevronUp className="w-4 h-4 text-white" />
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
      className={`glass-card rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${
        completed ? 'magical-glow' : ''
      } ${isCompleting ? 'scale-98' : 'scale-100 hover:scale-102'}`}
      style={{
        transform: isCompleting ? 'scale(0.98)' : undefined,
      }}
    >
      {/* Large gradient background with icon - makes each habit unique */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: color.bg,
        }}
      />

      <div className="flex items-start gap-5 relative z-10">
        {/* Left side: Large Icon for visual differentiation */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border-2 border-white/30"
          style={{
            background: color.bg,
            boxShadow: `0 4px 20px ${color.bg}80`,
          }}
        >
          {habit.icon}
        </div>

        {/* Middle: Main content */}
        <div className="flex-1">
          {/* Habit Name */}
          <h3
            className="text-2xl font-extrabold text-white mb-2"
            style={{
              fontFamily: "'Comfortaa', cursive",
              textShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
              lineHeight: '1.2',
            }}
          >
            {habit.title}
          </h3>

          {/* Streak Display - more compact */}
          <div className="flex items-center gap-3 mb-3">
            {streak && streak.streak > 0 && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-lg">🔥</span>
                <span className="text-white font-bold text-xs" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {streak.streak} day{streak.streak > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Points Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30"
              style={{
                background: 'rgba(251, 191, 36, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span className="text-lg">🪙</span>
              <span className="text-white font-bold text-xs" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                {pointsInfo.points} coins
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 border-2 ${
                        isCompleted
                          ? 'border-white/50 shadow-lg'
                          : 'border-white/20'
                      }`}
                      style={{
                        background: isCompleted ? color.bg : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
                        boxShadow: isCompleted ? `0 4px 15px ${color.bg}80` : 'none',
                      }}
                    >
                      {isCompleted && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-white/80 font-semibold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                {progress}/{target} this week {weeklyProgress?.isComplete && (
                  <span className="ml-2 text-yellow-300" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.8))' }}>
                    ✨ Complete!
                  </span>
                )}
              </p>
            </div>
          )}

          {/* 7-Day Progress Bar - REPLACING HISTORY CIRCLES */}
          {completionHistory && completionHistory.history.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-white/60" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  Last 7 days
                </p>
                <span className="text-xs text-white/80 font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-xl">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70
                      ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                      : completionRate >= 40
                      ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
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
          <p className="text-xs text-white/60" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            {isWeekly ? `${target}× per week` : 'Daily habit'} • {habit.difficulty || 'medium'}
          </p>
        </div>

        {/* Right side: New Completion Button - NOT A CIRCLE */}
        <div className="flex flex-col gap-3 items-end relative">
          {/* NEW: Gradient button instead of circle */}
          <button
            onClick={handleToggleWithFeedback}
            disabled={isCompleting}
            className={`px-6 py-4 rounded-2xl font-bold text-white transition-all duration-500 border-2 ${
              completed
                ? 'border-white/50'
                : 'border-white/30 hover:border-white/50'
            }`}
            style={{
              background: completed
                ? color.bg
                : 'rgba(255, 255, 255, 0.1)',
              cursor: isCompleting ? 'not-allowed' : 'pointer',
              transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
              boxShadow: completed
                ? `0 4px 20px ${color.bg}80, 0 0 30px ${color.bg}60`
                : '0 2px 10px rgba(0,0,0,0.2)',
              minWidth: '100px',
              fontFamily: "'Quicksand', sans-serif",
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

          {/* Points Earned Feedback */}
          {showPointsFeedback && (
            <div
              className="absolute -top-20 right-0 bg-gradient-to-r from-cyan-400 to-teal-400 text-white px-4 py-3 rounded-2xl shadow-lg border-2 border-white/50 animate-bounce z-50"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                minWidth: '150px',
                textAlign: 'center',
                animation: 'fadeInUp 0.5s ease-out, fadeOut 0.5s ease-out 1.5s',
              }}
            >
              <div className="text-2xl font-bold">+{pointsInfo.points} coins</div>
              {pointsInfo.multiplier > 1 && (
                <div className="text-xs opacity-90">
                  {pointsInfo.basePoints} × {pointsInfo.multiplier}x streak!
                </div>
              )}
            </div>
          )}

          {/* Mini actions */}
          <button
            onClick={onEdit}
            className="text-xs text-white/60 hover:text-white/90 transition-colors px-2 py-1"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
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
            background: `radial-gradient(circle, ${color.bg}40 0%, transparent 70%)`,
            animation: 'pulse 0.8s ease-out',
          }}
        />
      )}
    </div>
  );
}
