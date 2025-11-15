import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog, Todo } from "@shared/schema";

interface TodayCardProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  todos: Todo[];
  onToggleHabit: (habitId: number) => void;
  onToggleTodo: (todoId: number) => void;
}

/**
 * TodayCard - Shows today's habits and tasks
 *
 * Features:
 * - Large habit pills with icons
 * - Task checklist
 * - Completion states with theme colors
 */
export function TodayCard({
  habits,
  habitLogs,
  todos,
  onToggleHabit,
  onToggleTodo
}: TodayCardProps) {
  // Filter to only today's incomplete todos
  const todayTodos = todos.filter(todo => !todo.completed);

  return (
    <GlassCard className="h-full">
      <GlassCardHeader>
        <GlassCardTitle>Today</GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent className="space-y-6">
        {/* Habits Section */}
        <div className="space-y-3">
          {habits.map((habit) => {
            const log = habitLogs.find(l => l.habitId === habit.id);
            const isCompleted = log?.completed ?? false;

            return (
              <button
                key={habit.id}
                onClick={() => onToggleHabit(habit.id)}
                aria-pressed={isCompleted}
                aria-label={`${habit.title} habit ${isCompleted ? 'completed' : 'not completed'}`}
                className={cn(
                  "w-full px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  "flex items-center gap-3",
                  "border-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isCompleted
                    ? "bg-primary/20 border-primary text-primary shadow-md"
                    : "bg-white/50 border-border hover:border-primary/50 hover:shadow-md"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-2xl",
                  isCompleted ? "bg-primary/30" : "bg-muted"
                )}>
                  {habit.icon}
                </div>

                {/* Title */}
                <span className={cn(
                  "flex-1 text-left uppercase tracking-wide text-sm",
                  isCompleted ? "font-bold" : "font-semibold"
                )}>
                  {habit.title}
                </span>

                {/* Checkmark */}
                {isCompleted && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tasks Section */}
        {todayTodos.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-border/30">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tasks
            </h4>
            {todayTodos.map((todo) => (
              <button
                key={todo.id}
                onClick={() => onToggleTodo(todo.id)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors text-left"
              >
                <Checkbox
                  checked={todo.completed}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className={cn(
                    "text-sm",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {todo.title}
                  </p>
                  {todo.dueDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {todo.dueDate}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {habits.length === 0 && todayTodos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No habits or tasks for today</p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
