import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import { GlowingOrbHabits } from "./GlowingOrbHabits";
import { useMountainTheme } from "@/hooks/useMountainTheme";

interface Habit {
  id: number;
  title: string;
  category: string;
  icon: string;
}

interface HabitWithStatus extends Habit {
  completed: boolean;
  logId?: number;
}

interface HabitLog {
  id: number;
  habitId: number;
  completed: boolean;
  habit: Habit;
}

/**
 * DailyFocusHero - The main "What do I need to do today?" section
 *
 * This is the LARGEST section of the dashboard - makes it crystal clear
 * what you need to accomplish today.
 */
export function DailyFocusHero() {
  const { theme } = useMountainTheme();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch all habits
  const { data: allHabits = [] } = useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });

  // Fetch today's habit logs
  const { data: habitLogs = [], isLoading } = useQuery<HabitLog[]>({
    queryKey: [`/api/habit-logs/${today}`],
  });

  // Combine habits with their completion status
  const habitsWithStatus = allHabits.map(habit => {
    const log = habitLogs.find(l => l.habitId === habit.id);
    return {
      ...habit,
      completed: log?.completed || false,
      logId: log?.id
    };
  });

  // Calculate completion
  const completedCount = habitsWithStatus.filter(h => h.completed).length;
  const totalCount = habitsWithStatus.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isFullyComplete = completedCount === totalCount && totalCount > 0;

  const remainingHabits = habitsWithStatus.filter(h => !h.completed);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`glass-card interactive-glow p-8 animate-fade-in ${isFullyComplete ? 'animate-celebration' : ''}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-glow">{format(new Date(), 'EEEE, MMMM d')}</h1>
            {theme && (
              <p className="text-xs text-muted-foreground mt-1">
                Expedition: {theme.mountainName}
              </p>
            )}
          </div>

          <a
            href="/habits"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 4v16m8-8H4" />
            </svg>
            Manage
          </a>
        </div>

        {/* Habits displayed as climbing holds */}
        <div>
          {isFullyComplete ? (
            <div className="hidden"></div>
          ) : remainingHabits.length > 0 ? (
            <div className="hidden"></div>
          ) : (
            <p className="text-muted-foreground text-center hidden">No habits scheduled for today</p>
          )}
        </div>

        {/* Glowing Orbs - NEW! */}
        <GlowingOrbHabits />
      </div>
    </div>
  );
}

interface HabitChecklistItemProps {
  habit: HabitWithStatus;
}

function HabitChecklistItem({ habit }: HabitChecklistItemProps) {
  const toggleHabit = async () => {
    // Toggle habit completion
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: habit.id,
          date: today,
          completed: !habit.completed
        }),
        credentials: 'include'
      });

      // Invalidate query to refetch
      window.location.reload(); // TODO: Use queryClient.invalidateQueries instead
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const categoryColors: Record<string, string> = {
    mind: 'bg-purple-500/10 text-purple-700 border-purple-200',
    foundation: 'bg-blue-500/10 text-blue-700 border-blue-200',
    adventure: 'bg-orange-500/10 text-orange-700 border-orange-200',
    training: 'bg-green-500/10 text-green-700 border-green-200',
  };

  const categoryColor = categoryColors[habit.category.toLowerCase()] || 'bg-muted text-muted-foreground';

  return (
    <button
      onClick={toggleHabit}
      className={`
        w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left
        ${habit.completed
          ? 'bg-success/5 border-success/30 hover:bg-success/10'
          : 'bg-card border-border hover:border-primary/50'
        }
      `}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {habit.completed ? (
          <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success-foreground" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg border-2 border-border bg-card"></div>
        )}
      </div>

      {/* Habit info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${habit.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {habit.title}
        </p>
      </div>

      {/* Category badge */}
      <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
        {habit.category}
      </div>
    </button>
  );
}
