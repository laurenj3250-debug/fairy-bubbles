import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Todo } from "@shared/schema";
import { Plus, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { EnhancedTodoDialog } from "./EnhancedTodoDialog";

interface TaskListProps {
  variant?: "dashboard" | "full";
}

export function TaskList({ variant = "full" }: TaskListProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Fetch todos
  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
    queryFn: () => apiRequest("/api/todos"),
  });

  // Complete todo mutation
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/todos/${id}/complete`, "POST");
    },
    onMutate: (id) => {
      setCompletingId(id);
    },
    onSuccess: (data: Todo) => {
      // Fire confetti!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB'],
      });

      // Show points earned
      const points = data.difficulty === 'easy' ? 5 : data.difficulty === 'hard' ? 15 : 10;
      toast({
        title: "Task Complete! 🎉",
        description: `+${points} coins earned`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });

      setTimeout(() => setCompletingId(null), 800);
    },
    onError: () => {
      setCompletingId(null);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  // Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/todos/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Filter todos
  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  // Dashboard view - only show upcoming tasks
  if (variant === "dashboard") {
    const todaysTasks = incompleteTodos.slice(0, 3);

    return (
      <div className="space-y-3">
        {todaysTasks.map((todo) => (
          <TaskCard
            key={todo.id}
            todo={todo}
            isCompleting={completingId === todo.id}
            onComplete={() => completeMutation.mutate(todo.id)}
            onDelete={() => deleteMutation.mutate(todo.id)}
            compact
          />
        ))}

        {incompleteTodos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>All tasks complete! 🎉</p>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Incomplete tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tasks ({incompleteTodos.length})</h2>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        <div className="space-y-3">
          {incompleteTodos.map((todo) => (
            <TaskCard
              key={todo.id}
              todo={todo}
              isCompleting={completingId === todo.id}
              onComplete={() => completeMutation.mutate(todo.id)}
              onDelete={() => deleteMutation.mutate(todo.id)}
            />
          ))}

          {incompleteTodos.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">All caught up!</p>
              <p className="text-sm">Create a new task to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed tasks */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-3">
            Completed ({completedTodos.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedTodos.slice(0, 5).map((todo) => (
              <TaskCard
                key={todo.id}
                todo={todo}
                isCompleting={false}
                onComplete={() => {}}
                onDelete={() => deleteMutation.mutate(todo.id)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      <EnhancedTodoDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}

interface TaskCardProps {
  todo: Todo;
  isCompleting: boolean;
  onComplete: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function TaskCard({ todo, isCompleting, onComplete, onDelete, compact }: TaskCardProps) {
  const points = todo.difficulty === 'easy' ? 5 : todo.difficulty === 'hard' ? 15 : 10;
  const difficultyColor = {
    easy: 'bg-green-500/20 text-green-600 dark:text-green-400',
    medium: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    hard: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  }[todo.difficulty];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-4 rounded-xl border bg-card transition-all duration-300",
        isCompleting && "scale-98 opacity-50",
        !todo.completed && "hover:border-primary/50 hover:shadow-md",
        todo.completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={todo.completed ? undefined : onComplete}
        disabled={todo.completed || isCompleting}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all flex-shrink-0",
          todo.completed
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary hover:scale-110"
        )}
      >
        {todo.completed && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              "font-medium truncate",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.title}
          </h3>

          {!compact && (
            <>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", difficultyColor)}>
                {todo.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">🪙 {points}</span>
            </>
          )}
        </div>

        {todo.description && !compact && (
          <p className="text-sm text-muted-foreground truncate">{todo.description}</p>
        )}

        {todo.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>{todo.dueDate}</span>
          </div>
        )}
      </div>

      {/* Delete button */}
      {!todo.completed && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      )}

      {/* Completing animation */}
      {isCompleting && (
        <div className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-2xl animate-bounce">✨</div>
        </div>
      )}
    </div>
  );
}
