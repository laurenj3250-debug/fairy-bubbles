import { useQuery, useMutation } from "@tanstack/react-query";
import type { Todo, Project, Label } from "@shared/schema";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, ListTodo, Plus, Sparkles, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoDialogEnhanced } from "@/components/TodoDialogEnhanced";

interface TodaysTasksPanelProps {
  className?: string;
}

interface TodoWithMetadata extends Todo {
  project: Project | null;
  labels: Label[];
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return '#ef4444'; // Red
    case 2: return '#f97316'; // Orange
    case 3: return '#3b82f6'; // Blue
    default: return '#6b7280'; // Gray
  }
};

export function TodaysTasksPanel({ className }: TodaysTasksPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("tasksPanelCollapsed");
    return saved === "true";
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("tasksPanelCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Use enhanced query to get todos with metadata
  const { data: todos = [] } = useQuery<TodoWithMetadata[]>({
    queryKey: ["/api/todos-with-metadata"],
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
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Today's Tasks
            </h2>
            {todaysTasks.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                  color: 'white',
                  border: 'none'
                }}
              >
                {todaysTasks.length}
              </Badge>
            )}
          </div>
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

      {/* Quick Add Button */}
      <Button
        onClick={() => setQuickAddOpen(true)}
        className="w-full mb-4 hover-elevate relative z-10"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          color: 'white'
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Quick Add Task
        <Zap className="w-3 h-3 ml-2 opacity-75" />
      </Button>

      {/* Tasks List */}
      <div className="space-y-3 relative z-10">
        {todaysTasks.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-[hsl(var(--accent))] mb-3 animate-pulse" />
            <p className="text-foreground font-semibold text-sm mb-1">
              All clear! 🎉
            </p>
            <p className="text-muted-foreground text-xs">
              No urgent tasks for today.
              <br />
              Click "Quick Add" to create one!
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
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className={cn(
                      "font-medium",
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {isOverdue ? "Overdue" : "Due today"}
                    </span>

                    {/* Priority Badge */}
                    {todo.priority && todo.priority < 4 && (
                      <Badge
                        variant="outline"
                        className="border-0 text-[10px] px-1.5 py-0"
                        style={{
                          background: `${getPriorityColor(todo.priority)}20`,
                          color: getPriorityColor(todo.priority),
                        }}
                      >
                        P{todo.priority}
                      </Badge>
                    )}

                    {/* Project Badge */}
                    {todo.project && (
                      <Badge
                        variant="outline"
                        className="border-0 text-[10px] px-1.5 py-0"
                        style={{
                          background: `${todo.project.color}15`,
                          color: todo.project.color,
                        }}
                      >
                        {todo.project.icon} {todo.project.name}
                      </Badge>
                    )}

                    {/* Label Badges */}
                    {todo.labels?.slice(0, 2).map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="border-0 text-[10px] px-1.5 py-0"
                        style={{
                          background: `${label.color}15`,
                          color: label.color,
                        }}
                      >
                        #{label.name}
                      </Badge>
                    ))}

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
            <a className="text-sm text-[hsl(var(--accent))] hover:underline font-medium flex items-center justify-center gap-1">
              View all tasks →
              <span className="text-xs opacity-60">(Press T)</span>
            </a>
          </Link>
        </div>
      )}

      {/* Quick Add Dialog */}
      <TodoDialogEnhanced
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
    </div>
  );
}
