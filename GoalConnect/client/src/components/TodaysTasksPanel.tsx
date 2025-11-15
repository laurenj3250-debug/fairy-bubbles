import { useQuery, useMutation } from "@tanstack/react-query";
import type { Todo } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, ListTodo } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

interface TodaysTasksPanelProps {
  className?: string;
}

export function TodaysTasksPanel({ className }: TodaysTasksPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("tasksPanelCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("tasksPanelCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Filter for today's tasks and overdue tasks (uncompleted only)
  const todaysTasks = useMemo(() => {
    return todos
      .filter((todo) => {
        if (todo.completed) return false;

        // No due date = not urgent
        if (!todo.dueDate) return false;

        // Due today or overdue
        return todo.dueDate <= today;
      })
      .sort((a, b) => {
        // Sort by due date (earliest first)
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        return 0;
      })
      .slice(0, 5); // Limit to 5 tasks
  }, [todos, today]);

  const toggleTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}/complete`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleToggle = (event: React.MouseEvent, todoId: number) => {
    event.stopPropagation();
    toggleTodoMutation.mutate(todoId);
  };

  if (isCollapsed) {
    return (
      <div className={cn("glass-card interactive-glow p-6", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative z-10"
          aria-label="Expand Tasks Panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("glass-card interactive-glow p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            Today's Tasks
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Due today & overdue
          </p>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse Tasks Panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3 relative z-10">
        {todaysTasks.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No urgent tasks!
              <br />
              You're all caught up for today.
            </p>
          </div>
        )}

        {todaysTasks.map((todo) => {
          const isOverdue = todo.dueDate && todo.dueDate < today;

          return (
            <div
              key={todo.id}
              className="glass-card interactive-glow p-3 cursor-pointer"
              onClick={(e) => handleToggle(e, todo.id)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={(e) => handleToggle(e, todo.id)}
                  disabled={toggleTodoMutation.isPending}
                  className="mt-0.5 flex-shrink-0"
                >
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-[hsl(var(--accent))] transition-colors" />
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                    {todo.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "font-medium",
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {isOverdue ? "Overdue" : "Due today"}
                    </span>
                    {todo.difficulty && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-muted-foreground capitalize">
                          {todo.difficulty}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link to full page */}
      {todaysTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-card-border relative z-10">
          <Link href="/todos">
            <a className="text-sm text-[hsl(var(--accent))] hover:underline font-medium">
              View all tasks →
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
