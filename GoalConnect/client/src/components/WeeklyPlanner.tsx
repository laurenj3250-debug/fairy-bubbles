import { useQuery, useMutation } from "@tanstack/react-query";
import type { Todo, Goal } from "@shared/schema";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  Plus,
  Target,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfWeek, addDays, addWeeks, isSameDay, isToday, parseISO } from "date-fns";
import { TodoDialogEnhanced } from "@/components/TodoDialogEnhanced";

interface WeeklyPlannerProps {
  className?: string;
}

interface TodoWithGoal extends Todo {
  goal?: Goal | null;
}

export function WeeklyPlanner({ className }: WeeklyPlannerProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate week start (Monday)
  const weekStart = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday = 1
    return addWeeks(start, weekOffset);
  }, [weekOffset]);

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Fetch todos
  const { data: todos = [] } = useQuery<TodoWithGoal[]>({
    queryKey: ["/api/todos"],
  });

  // Fetch goals for linking display
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped: Record<string, TodoWithGoal[]> = {};

    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      grouped[dateStr] = [];
    });

    todos.forEach((todo) => {
      if (todo.dueDate && grouped[todo.dueDate]) {
        // Attach goal info if linked
        const todoWithGoal: TodoWithGoal = {
          ...todo,
          goal: todo.goalId ? goals.find((g) => g.id === todo.goalId) : null,
        };
        grouped[todo.dueDate].push(todoWithGoal);
      }
    });

    // Sort tasks in each day by priority, then by position
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        // Completed tasks at the bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Higher priority (lower number) first
        if (a.priority !== b.priority) return (a.priority || 4) - (b.priority || 4);
        // Then by position
        return (a.position || 0) - (b.position || 0);
      });
    });

    return grouped;
  }, [todos, goals, weekDays]);

  // Toggle todo completion
  const toggleTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}/complete`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleToggle = (e: React.MouseEvent, todoId: number) => {
    e.stopPropagation();
    toggleTodoMutation.mutate(todoId);
  };

  const handleAddTask = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setQuickAddOpen(true);
  };

  // Format week range for header
  const weekRangeText = useMemo(() => {
    const endOfWeek = addDays(weekStart, 6);
    const startMonth = format(weekStart, "MMM");
    const endMonth = format(endOfWeek, "MMM");
    const startDay = format(weekStart, "d");
    const endDay = format(endOfWeek, "d");

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }, [weekStart]);

  return (
    <div className={cn("glass-card interactive-glow p-6 rounded-3xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Week of {weekRangeText}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayTodos = todosByDate[dateStr] || [];
          const isCurrentDay = isToday(day);
          const isPast = day < new Date() && !isCurrentDay;
          const completedCount = dayTodos.filter((t) => t.completed).length;
          const totalCount = dayTodos.length;

          return (
            <div
              key={dateStr}
              className={cn(
                "min-h-[200px] rounded-xl p-3 flex flex-col transition-all",
                isCurrentDay
                  ? "bg-primary/10 ring-2 ring-primary/50"
                  : "bg-card/50 hover:bg-card/80",
                isPast && "opacity-60"
              )}
            >
              {/* Day Header */}
              <div className="text-center mb-3">
                <div
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    isCurrentDay ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    isCurrentDay ? "text-primary" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                {totalCount > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {completedCount}/{totalCount}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {dayTodos.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "group flex items-start gap-2 p-2 rounded-lg text-xs transition-all cursor-pointer",
                      todo.completed
                        ? "bg-muted/30 text-muted-foreground"
                        : "bg-card hover:bg-card-hover"
                    )}
                    onClick={(e) => handleToggle(e, todo.id)}
                  >
                    <button
                      className="flex-shrink-0 mt-0.5"
                      onClick={(e) => handleToggle(e, todo.id)}
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "line-clamp-2 break-words",
                          todo.completed && "line-through"
                        )}
                      >
                        {todo.title}
                      </span>
                      {todo.goal && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/70">
                          <Target className="w-3 h-3" />
                          <span className="truncate">{todo.goal.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {dayTodos.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayTodos.length - 5} more
                  </div>
                )}
              </div>

              {/* Add Task Button */}
              <button
                onClick={() => handleAddTask(day)}
                className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>add</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Add Dialog */}
      <TodoDialogEnhanced
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultDueDate={selectedDate || undefined}
      />
    </div>
  );
}
