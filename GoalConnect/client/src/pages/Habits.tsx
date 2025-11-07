import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit, HabitLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { HabitDialog } from "@/components/HabitDialog";
import { getToday } from "@/lib/utils";

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

export default function Habits() {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [completingHabit, setCompletingHabit] = useState<number | null>(null);

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", getToday()],
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/habits/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: getToday(),
      });
    },
    onMutate: (habitId) => {
      setCompletingHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      setTimeout(() => setCompletingHabit(null), 800);
    },
    onError: () => {
      setCompletingHabit(null);
    },
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
      <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl" style={{ background: '#fff' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-1" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Your Habits ✨
            </h1>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>{habits.length} active</p>
          </div>
          <button
            onClick={handleCreateNew}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '100px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            <Plus className="w-5 h-5" />
            New Habit
          </button>
        </div>

        {habits.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Sparkles style={{ width: '64px', height: '64px', margin: '0 auto 20px', color: '#667eea' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#000' }}>
              Start Your Journey
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '24px' }}>
              Create your first habit and watch yourself grow 🌱
            </p>
            <button onClick={handleCreateNew} style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '100px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              Create First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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

// Individual Habit Card Component
function HabitCard({ habit, completed, color, isCompleting, onToggle, onEdit, onDelete }: {
  habit: Habit;
  completed: boolean;
  color: { bg: string; name: string };
  isCompleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: streak } = useQuery<HabitStreak>({
    queryKey: [`/api/habits/${habit.id}/streak`],
    queryFn: async () => {
      const res = await fetch(`/api/habits/${habit.id}/streak`, { credentials: 'include' });
      return res.json();
    },
  });

  const { data: weeklyProgress } = useQuery<WeeklyProgress>({
    queryKey: [`/api/habits/${habit.id}/weekly-progress`],
    queryFn: async () => {
      const res = await fetch(`/api/habits/${habit.id}/weekly-progress`, { credentials: 'include' });
      return res.json();
    },
    enabled: habit.cadence === 'weekly',
  });

  const isWeekly = habit.cadence === 'weekly';
  const progress = weeklyProgress?.progress || 0;
  const target = weeklyProgress?.targetPerWeek || 3;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: completed ? '0 8px 30px rgba(102, 126, 234, 0.2)' : '0 4px 20px rgba(0,0,0,0.08)',
        border: completed ? '2px solid rgba(102, 126, 234, 0.3)' : '2px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isCompleting ? 'scale(0.98)' : 'scale(1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: color.bg,
      }} />

      <div style={{ display: 'flex', alignItems: 'start', gap: '20px' }}>
        {/* Left side: Main content */}
        <div style={{ flex: 1 }}>
          {/* Habit Name - BIG & BOLD */}
          <h3 style={{
            fontSize: '28px',
            fontWeight: '800',
            marginBottom: '8px',
            color: '#000',
            lineHeight: '1.2',
          }}>
            {habit.title}
          </h3>

          {/* Visual Progress for Weekly Habits */}
          {isWeekly && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {Array.from({ length: target }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: i < progress ? color.bg : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      transition: 'all 0.4s ease',
                      transform: i < progress ? 'scale(1)' : 'scale(0.9)',
                      boxShadow: i < progress ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                    }}
                  >
                    {i < progress && '✓'}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: '#6c757d', fontWeight: '600' }}>
                {progress}/{target} this week {weeklyProgress?.isComplete ? '🎉' : ''}
              </p>
            </div>
          )}

          {/* Streak Display */}
          {streak && streak.streak > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '16px' }}>🔥</span>
              {streak.streak} day streak
            </div>
          )}

          {/* Details - Small and tucked away */}
          <p style={{ fontSize: '12px', color: '#adb5bd' }}>
            {isWeekly ? `${target}× per week` : 'Daily'}
          </p>
        </div>

        {/* Right side: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Complete Button */}
          <button
            onClick={onToggle}
            disabled={isCompleting}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: completed ? color.bg : '#f8f9fa',
              color: completed ? 'white' : '#adb5bd',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: completed ? '0 4px 15px rgba(102, 126, 234, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
              transform: isCompleting ? 'scale(1.1) rotate(10deg)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!completed && !isCompleting) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (!completed && !isCompleting) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#f8f9fa';
              }
            }}
          >
            {completed ? '✓' : '○'}
          </button>

          {/* Mini actions */}
          <button
            onClick={onEdit}
            style={{
              background: 'none',
              border: 'none',
              color: '#adb5bd',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#dee2e6',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Completion animation overlay */}
      {isCompleting && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse 0.6s ease-out',
        }} />
      )}
    </div>
  );
}
