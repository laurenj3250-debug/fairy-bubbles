import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoDialog } from "@/components/TodoDialog";
import { Plus, Trash2, Calendar, CheckCircle, ListTodo, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Todos() {
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      if (todo.completed) {
        return await apiRequest(`/api/todos/${id}`, "PATCH", { completed: false, completedAt: null });
      } else {
        return await apiRequest(`/api/todos/${id}/complete`, "POST");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  // Sort by due date (null dates last), then by created date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-red-400" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-orange-400" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "text-yellow-400" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: "text-blue-400" };
    } else {
      return { text: date.toLocaleDateString(), color: "text-white/60" };
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 relative">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3" style={{ fontFamily: "'Comfortaa', cursive" }}>
              <ListTodo className="w-8 h-8 text-blue-300" />
              To-Do List
            </h1>
            <p className="text-white/60 text-sm">
              {pendingCount} pending, {completedCount} completed
            </p>
          </div>
          <Button
            onClick={() => setTodoDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Todo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              filter === "all"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              filter === "pending"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              filter === "completed"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Todos List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <ListTodo className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 mb-4">
              {filter === "all" && "No todos yet. Create your first one!"}
              {filter === "pending" && "No pending todos. Great job!"}
              {filter === "completed" && "No completed todos yet."}
            </p>
            {filter === "all" && (
              <Button
                onClick={() => setTodoDialogOpen(true)}
                variant="outline"
                className="border-white/30 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Todo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTodos.map((todo) => {
              const dueDateInfo = formatDueDate(todo.dueDate);
              const points = todo.difficulty === "easy" ? 5 : todo.difficulty === "hard" ? 15 : 10;

              return (
                <div
                  key={todo.id}
                  className={cn(
                    "glass-card rounded-2xl p-4 transition-all",
                    todo.completed && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodoMutation.mutate(todo.id)}
                      disabled={toggleTodoMutation.isPending}
                      className={cn(
                        "mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                        todo.completed
                          ? "bg-green-500 border-green-400 text-white"
                          : "border-white/30 hover:border-blue-400 hover:bg-blue-500/20"
                      )}
                    >
                      {todo.completed && <CheckCircle className="w-5 h-5" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "text-white font-semibold mb-1",
                          todo.completed && "line-through opacity-60"
                        )}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-white/60 text-sm mb-2">{todo.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {dueDateInfo && (
                          <Badge className="bg-white/10 text-white/80 border-0">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                          </Badge>
                        )}
                        {todo.difficulty && (
                          <Badge className="bg-yellow-400/20 text-yellow-200 border-0">
                            {todo.difficulty} • {points} coins
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm("Delete this todo?")) {
                          deleteTodoMutation.mutate(todo.id);
                        }
                      }}
                      disabled={deleteTodoMutation.isPending}
                      className="flex-shrink-0 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Delete todo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Todo Dialog */}
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
    </div>
  );
}
