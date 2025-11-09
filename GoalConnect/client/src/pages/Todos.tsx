import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoDialog } from "@/components/TodoDialog";
import { Plus, Trash2, Calendar, CheckCircle, ListTodo, Filter, Circle, CheckCircle2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getTaskGrade } from "@/lib/climbingRanks";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export default function Todos() {
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [view, setView] = useState<"list" | "week">("list");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = last week
  const { toast } = useToast();

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

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ todoId, subtaskId }: { todoId: number; subtaskId: string }) => {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const subtasks: Subtask[] = JSON.parse(todo.subtasks || "[]");
      const updatedSubtasks = subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      return await apiRequest(`/api/todos/${todoId}`, "PATCH", {
        subtasks: JSON.stringify(updatedSubtasks),
      });
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

    // Parse date as YYYY-MM-DD in local timezone (avoid UTC shift)
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-slate-400" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-cyan-400" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "text-yellow-400" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: "text-blue-400" };
    } else {
      return { text: due.toLocaleDateString(), color: "text-white/60" };
    }
  };

  // Get the week dates based on offset
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateKey = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const weekDates = getWeekDates();

  // Quick add todo mutation
  const quickAddTodoMutation = useMutation({
    mutationFn: async ({ title, dueDate }: { title: string; dueDate: string }) => {
      return await apiRequest("/api/todos", "POST", {
        title,
        difficulty: "medium",
        dueDate,
        subtasks: "[]",
        completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({ title: "Added!", description: "Task added successfully" });
    },
  });

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 relative">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3" style={{ fontFamily: "'Comfortaa', cursive" }}>
              <ListTodo className="w-8 h-8 text-blue-300" />
              Expedition Tasks
            </h1>
            <p className="text-white/60 text-sm">
              {pendingCount} pending, {completedCount} completed
            </p>
          </div>
          <Button
            onClick={() => setTodoDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* View and Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                view === "list"
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              <ListTodo className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                view === "week"
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Week
            </button>
          </div>

          {/* Filters (only in list view) */}
          {view === "list" && (
            <>
              <div className="w-px bg-white/20" />
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
            </>
          )}
        </div>

        {/* List View */}
        {view === "list" && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : sortedTodos.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <ListTodo className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 mb-4">
                  {filter === "all" && "No tasks yet. Create your first one!"}
                  {filter === "pending" && "No pending tasks. Great job!"}
                  {filter === "completed" && "No completed tasks yet."}
                </p>
                {filter === "all" && (
                  <Button
                    onClick={() => setTodoDialogOpen(true)}
                    variant="outline"
                    className="border-white/30 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTodos.map((todo) => {
                  const dueDateInfo = formatDueDate(todo.dueDate);
                  const gradeInfo = getTaskGrade(todo.difficulty);

                  const subtasks: Subtask[] = JSON.parse(todo.subtasks || "[]");
                  const completedSubtasks = subtasks.filter(st => st.completed).length;

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

                          {/* Subtasks */}
                          {subtasks.length > 0 && (
                            <div className="mt-2 mb-2 space-y-1">
                              {subtasks.map((subtask) => (
                                <button
                                  key={subtask.id}
                                  onClick={() => toggleSubtaskMutation.mutate({ todoId: todo.id, subtaskId: subtask.id })}
                                  disabled={toggleSubtaskMutation.isPending}
                                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-full text-left"
                                >
                                  {subtask.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 flex-shrink-0" />
                                  )}
                                  <span className={cn(subtask.completed && "line-through opacity-60")}>
                                    {subtask.title}
                                  </span>
                                </button>
                              ))}
                              {subtasks.length > 0 && (
                                <p className="text-xs text-white/50 mt-1">
                                  {completedSubtasks}/{subtasks.length} completed
                                </p>
                              )}
                            </div>
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
                                {gradeInfo.label} • {gradeInfo.points} tokens
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (confirm("Delete this task?")) {
                              deleteTodoMutation.mutate(todo.id);
                            }
                          }}
                          disabled={deleteTodoMutation.isPending}
                          className="flex-shrink-0 p-2 text-slate-400 hover:bg-slate-500/20 rounded-lg transition-all"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Week View */}
        {view === "week" && (
          <div>
            {/* Week Navigation */}
            <div className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div className="text-center">
                <p className="text-white font-semibold">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {weekOffset === 0 && <p className="text-xs text-white/60">This week</p>}
                {weekOffset > 0 && <p className="text-xs text-white/60">{weekOffset} week{weekOffset > 1 ? 's' : ''} ahead</p>}
                {weekOffset < 0 && <p className="text-xs text-white/60">{Math.abs(weekOffset)} week{Math.abs(weekOffset) > 1 ? 's' : ''} ago</p>}
              </div>

              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-3">
              {weekDates.map((date, index) => {
                const dateKey = formatDateKey(date);
                const dayTodos = todos.filter(t => t.dueDate === dateKey);
                const isToday = formatDateKey(new Date()) === dateKey;
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                return (
                  <div key={dateKey} className={cn("glass-card rounded-2xl p-3", isToday && "ring-2 ring-blue-400")}>
                    {/* Day Header */}
                    <div className="text-center mb-3">
                      <p className="text-xs text-white/60 font-medium">{dayNames[date.getDay()]}</p>
                      <p className={cn("text-lg font-bold", isToday ? "text-blue-300" : "text-white")}>
                        {date.getDate()}
                      </p>
                    </div>

                    {/* Quick Add */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem(`todo-${dateKey}`) as HTMLInputElement;
                        const title = input.value.trim();
                        if (title) {
                          quickAddTodoMutation.mutate({ title, dueDate: dateKey });
                          input.value = '';
                        }
                      }}
                      className="mb-3"
                    >
                      <input
                        type="text"
                        name={`todo-${dateKey}`}
                        placeholder="Add task..."
                        className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </form>

                    {/* Todos for this day */}
                    <div className="space-y-2">
                      {dayTodos.map((todo) => {
                        const gradeInfo = getTaskGrade(todo.difficulty);
                        return (
                          <div
                            key={todo.id}
                            className={cn(
                              "bg-white/5 rounded-lg p-2 text-xs",
                              todo.completed && "opacity-50"
                            )}
                          >
                            <button
                              onClick={() => toggleTodoMutation.mutate(todo.id)}
                              className="flex items-start gap-2 w-full text-left"
                            >
                              {todo.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-white break-words", todo.completed && "line-through")}>
                                  {todo.title}
                                </p>
                                <p className="text-yellow-300/70 mt-0.5">{gradeInfo.points} tokens</p>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                      {dayTodos.length === 0 && (
                        <p className="text-white/30 text-xs text-center py-2">No tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Todo Dialog */}
      <TodoDialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen} />
    </div>
  );
}
