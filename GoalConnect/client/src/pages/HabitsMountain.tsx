import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Mountain, TrendingUp, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar, Zap } from "lucide-react";
import { HabitDialogNew as HabitDialog } from "@/components/HabitDialogNew";
import { getToday, formatDateInput } from "@/lib/utils";

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

  // Fetch habits with streak, progress, and history
  const { data: habits = [], isLoading } = useQuery<HabitWithData[]>({
    queryKey: ["/api/habits", "with-data"],
    queryFn: async () => {
      const habitsData = await apiRequest<Habit[]>("/api/habits");

      const habitsWithData = await Promise.all(
        habitsData.map(async (habit) => {
          const [streak, weeklyProgress, history] = await Promise.all([
            apiRequest<HabitStreak>(`/api/habits/${habit.id}/streak`),
            habit.cadence === 'weekly'
              ? apiRequest<WeeklyProgress>(`/api/habits/${habit.id}/weekly-progress`)
              : Promise.resolve(null),
            apiRequest<CompletionHistory>(`/api/habits/${habit.id}/completion-history`)
          ]);

          return {
            ...habit,
            streak,
            weeklyProgress,
            history
          };
        })
      );

      return habitsWithData;
    }
  });

  // Fetch logs for selected date
  const { data: logsData } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", "by-date", selectedDate],
    queryFn: () => apiRequest(`/api/habit-logs/date/${selectedDate}`),
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      setCompletingHabit(habitId);

      const existingLog = logsData?.find(
        (log) => log.habitId === habitId && log.date === selectedDate
      );

      if (existingLog) {
        await apiRequest(`/api/habit-logs/${existingLog.id}`, {
          method: "DELETE",
        });
      } else {
        await apiRequest("/api/habit-logs", {
          method: "POST",
          body: JSON.stringify({
            habitId,
            date: selectedDate,
            completed: true,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/climbing/stats"] });
      setTimeout(() => setCompletingHabit(null), 500);
    },
    onError: () => {
      setCompletingHabit(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="space-y-4 w-full max-w-5xl mx-auto p-6">
          <div className="h-40 bg-slate-800/50 rounded-2xl animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="relative z-10 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Mountain className="w-9 h-9 text-blue-400" />
                Training Camp
              </h1>
              <p className="text-sm text-slate-400">
                {habits.length} {habits.length === 1 ? 'habit' : 'habits'} building your expedition strength
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="rounded-xl px-6 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border border-blue-500/50 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">New Habit</span>
            </Button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <button
              onClick={goToPreviousDay}
              className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all border border-slate-600/50"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-bold text-white">
                  {selectedDateDisplay}
                </span>
              </div>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                >
                  Jump to Today
                </button>
              )}
              {isFuture && (
                <span className="text-xs text-slate-400">
                  Future Date
                </span>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all border border-slate-600/50"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-700/50">
            <Mountain className="w-16 h-16 mx-auto mb-6 text-blue-400" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Your Ascent
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Build habits to strengthen your expedition and unlock new mountains
            </p>
            <Button
              onClick={handleCreateNew}
              className="rounded-xl px-8 py-6 text-lg bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-500/50 shadow-lg"
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
      className={`bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden transition-all duration-500 border ${
        completed ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : 'border-slate-700/50'
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
          <h3 className="text-2xl font-bold text-white mb-2">
            {habit.title}
          </h3>

          {/* Streak & Energy Display */}
          <div className="flex items-center gap-3 mb-3">
            {streak && streak.streak > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/40">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span className="text-white font-bold text-xs">
                  {streak.streak} day{streak.streak > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Energy Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-white font-bold text-xs">
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
                          ? 'border-blue-400/50 shadow-lg'
                          : 'border-slate-600/50'
                      }`}
                      style={{
                        background: isCompleted ? color.bg : 'rgba(71, 85, 105, 0.3)',
                        color: 'white',
                        transform: isCompleted ? 'scale(1)' : 'scale(0.9)',
                        boxShadow: isCompleted ? `0 4px 15px ${color.border}60` : 'none',
                      }}
                    >
                      {isCompleted && '✓'}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-slate-400 font-semibold">
                {progress}/{target} this week {weeklyProgress?.isComplete && (
                  <span className="ml-2 text-blue-400">
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
                <p className="text-xs text-slate-500">
                  Last 7 days
                </p>
                <span className="text-xs text-slate-400 font-bold">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70
                      ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                      : completionRate >= 40
                      ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                      : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Details */}
          <p className="text-xs text-slate-500">
            {isWeekly ? `${target}× per week` : 'Daily habit'} • {habit.difficulty || 'medium'}
          </p>
        </div>

        {/* Right side: Completion Button */}
        <div className="flex flex-col gap-3 items-end relative">
          <button
            onClick={handleToggleWithFeedback}
            disabled={isCompleting}
            className={`px-6 py-4 rounded-xl font-bold text-white transition-all duration-500 border-2 ${
              completed
                ? 'border-blue-500/50'
                : 'border-slate-600/50 hover:border-slate-500/50'
            }`}
            style={{
              background: completed
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(71, 85, 105, 0.4)',
              cursor: isCompleting ? 'not-allowed' : 'pointer',
              transform: isCompleting ? 'scale(1.05)' : 'scale(1)',
              boxShadow: completed
                ? '0 4px 20px rgba(59, 130, 246, 0.4)'
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
              className="absolute -top-20 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl shadow-lg border-2 border-blue-400/50 animate-bounce z-50"
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
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
