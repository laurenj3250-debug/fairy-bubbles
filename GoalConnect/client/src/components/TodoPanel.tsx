import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { celebrateXpEarned } from "@/lib/celebrate";
import { XP_CONFIG } from "@shared/xp-config";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: number;
  dueDate?: string;
}

export function TodoPanel() {
  const queryClient = useQueryClient();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      const response = await fetch(`/api/todos/${todo.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      celebrateXpEarned(XP_CONFIG.todo, "Task completed");
    },
  });

  const addMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, priority: 4 }),
      });
      if (!response.ok) throw new Error("Failed to add todo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodoTitle("");
      setIsAdding(false);
    },
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      addMutation.mutate(newTodoTitle.trim());
    }
  };

  // Sort: incomplete first, then by priority
  const sortedTodos = [...todos]
    .filter((t) => !t.completed)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 10);

  const completedCount = todos.filter((t) => t.completed).length;

  const priorityColors: Record<number, string> = {
    1: "#FF6B6B", // P1 - Red
    2: "#FBBF24", // P2 - Amber
    3: "#60A5FA", // P3 - Blue
    4: "#9CA3AF", // P4 - Gray
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">To-Do</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{todos.length}
          </span>
          <button
            onClick={() => setIsAdding(true)}
            className="w-6 h-6 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Add Todo Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddTodo}
            className="mb-3"
          >
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add a task..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onBlur={() => {
                if (!newTodoTitle.trim()) setIsAdding(false);
              }}
            />
          </motion.form>
        )}
      </AnimatePresence>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Check className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">All done!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTodos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMutation.mutate(todo)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <Circle
                      className="w-5 h-5 transition-colors"
                      style={{
                        color: priorityColors[todo.priority] || priorityColors[4],
                      }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{todo.title}</p>
                    {todo.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(todo.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer link */}
      <a
        href="/todos"
        className="mt-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        View all tasks →
      </a>
    </div>
  );
}
