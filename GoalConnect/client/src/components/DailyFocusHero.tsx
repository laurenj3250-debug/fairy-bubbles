import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";

interface Habit {
  id: number;
  name: string;
  category: string;
  completed: boolean;
}

/**
 * DailyFocusHero - The main "What do I need to do today?" section
 *
 * This is the LARGEST section of the dashboard - makes it crystal clear
 * what you need to accomplish today.
 */
export function DailyFocusHero() {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's habits
  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ['/api/habits/today', today],
  });

  // Calculate completion
  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isFullyComplete = completedCount === totalCount && totalCount > 0;

  const remainingHabits = habits.filter(h => !h.completed);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`card animate-fade-in ${isFullyComplete ? 'animate-celebration' : ''}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Today's Focus</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Completion Circle */}
          <div
            className="completion-circle"
            style={{ '--progress': `${completionPercentage}%` } as React.CSSProperties}
          >
            <div className="completion-circle-inner">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">
                  {completionPercentage}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {completedCount}/{totalCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Message */}
        <div className="bg-secondary/50 rounded-lg p-4">
          {isFullyComplete ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="font-semibold text-success">All done for today!</p>
                <p className="text-sm text-muted-foreground">You crushed it! Take a well-deserved break.</p>
              </div>
            </div>
          ) : remainingHabits.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Circle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {remainingHabits.length} {remainingHabits.length === 1 ? 'habit' : 'habits'} remaining
                </p>
                <p className="text-sm text-muted-foreground">
                  Next up: {remainingHabits[0]?.name}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">No habits scheduled for today</p>
          )}
        </div>

        {/* Habits Checklist */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>

          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitChecklistItem key={habit.id} habit={habit} />
            ))}
          </div>

          {habits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No habits configured yet.</p>
              <p className="text-sm mt-2">Add habits to start tracking your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HabitChecklistItemProps {
  habit: Habit;
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
          {habit.name}
        </p>
      </div>

      {/* Category badge */}
      <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
        {habit.category}
      </div>
    </button>
  );
}
