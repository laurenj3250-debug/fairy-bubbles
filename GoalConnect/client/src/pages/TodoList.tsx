import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FAB } from "@/components/FAB";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Calendar, Trash2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TodoDialog } from "@/components/TodoDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TodoList() {
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);

  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const completeTodoMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/todos/${id}/complete`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/todos/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleFabClick = () => {
    setTodoDialogOpen(true);
  };

  const handleCompleteTodo = (id: number) => {
    completeTodoMutation.mutate(id);
  };

  const handleDeleteTodo = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTodoMutation.mutate(id);
    }
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  if (todosLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader userName="Alex" />
        <main className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <FAB onClick={handleFabClick} />
        <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader userName="Alex" />
        <main className="max-w-4xl mx-auto p-4">
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Add your first todo and start getting things done"
            actionLabel="Create Task"
            onAction={handleFabClick}
          />
        </main>
        <FAB onClick={handleFabClick} />
        <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
      </div>
    );
  }

  const renderTodoCard = (todo: Todo) => {
    const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
    const daysUntil = todo.dueDate
      ? Math.ceil((new Date(todo.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <Card
        key={todo.id}
        className={cn(
          "hover-elevate transition-all",
          todo.completed && "opacity-60"
        )}
        data-testid={`todo-card-${todo.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8 mt-0.5"
              onClick={() => handleCompleteTodo(todo.id)}
              disabled={todo.completed || completeTodoMutation.isPending}
              data-testid={`button-complete-todo-${todo.id}`}
            >
              {todo.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-medium",
                      todo.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {todo.description}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 w-8 h-8"
                  onClick={() => handleDeleteTodo(todo.id)}
                  data-testid={`button-delete-todo-${todo.id}`}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {todo.dueDate && (
                  <Badge
                    variant={isOverdue ? "destructive" : "secondary"}
                    className="flex items-center gap-1.5"
                  >
                    <Calendar className="w-3 h-3" />
                    {formatDate(todo.dueDate)}
                    {daysUntil !== null && !todo.completed && (
                      <span className="ml-1">
                        ({daysUntil < 0 ? "overdue" : `${daysUntil}d left`})
                      </span>
                    )}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {todo.points} pts
                </Badge>
                {todo.completed && todo.completedAt && (
                  <span className="text-xs text-muted-foreground">
                    Completed {formatDate(todo.completedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader userName="Alex" />

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {activeTodos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold tracking-tight">Active Tasks</h2>
              <span className="text-sm text-muted-foreground">
                {activeTodos.length} task{activeTodos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-3">
              {activeTodos.map(renderTodoCard)}
            </div>
          </div>
        )}

        {completedTodos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-muted-foreground">
                Completed
              </h2>
              <span className="text-sm text-muted-foreground">
                {completedTodos.length} task{completedTodos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-3">
              {completedTodos.map(renderTodoCard)}
            </div>
          </div>
        )}
      </main>

      <FAB onClick={handleFabClick} />
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
    </div>
  );
}
