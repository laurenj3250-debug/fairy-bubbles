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
  const [fadingOutTodos, setFadingOutTodos] = useState<Set<number>>(new Set());
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
    onSuccess: (data: any, id: number) => {
      const todo = todos.find(t => t.id === id);
      // If completing a task, trigger fade-out animation
      if (todo && !todo.completed) {
        setFadingOutTodos((prev) => new Set(prev).add(id));
        // Remove from DOM after animation completes (400ms)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
        }, 400);
      } else {
        // If uncompleting, just refresh normally
        queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      }
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
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-muted-foreground" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-primary" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "text-[hsl(var(--accent))]" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: "text-primary" };
    } else {
      return { text: due.toLocaleDateString(), color: "text-muted-foreground" };
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

  // Format week range for display
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const weekStart = formatDateKey(weekDates[0]);
    const weekEnd = formatDateKey(weekDates[6]);

    const weekTodos = todos.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate >= weekStart && t.dueDate <= weekEnd;
    });

    const completed = weekTodos.filter(t => t.completed).length;
    const pending = weekTodos.filter(t => !t.completed).length;
    const totalTokens = weekTodos
      .filter(t => t.completed)
      .reduce((sum, t) => sum + getTaskGrade(t.difficulty).points, 0);

    return { completed, pending, totalTokens, total: weekTodos.length };
  };

  const weeklyStats = getWeeklyStats();

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
      <div className={cn("mx-auto mb-6", view === "week" ? "max-w-[1600px]" : "max-w-4xl")}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <ListTodo className="w-8 h-8 text-primary" />
              Expedition Tasks
            </h1>
            <p className="text-muted-foreground text-sm">
              {pendingCount} pending, {completedCount} completed
            </p>
          </div>
          <Button
            onClick={() => setTodoDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
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
                  ? "bg-primary/20 text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
                  ? "bg-primary/20 text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Week
            </button>
          </div>

          {/* Filters (only in list view) */}
          {view === "list" && (
            <>
              <div className="w-px bg-border" />
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "all"
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                All ({todos.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "pending"
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "completed"
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
                <div className="inline-block w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
              </div>
            ) : sortedTodos.length === 0 ? (
              <div className="card p-12">
                <div className="relative z-10 text-center">
                  <ListTodo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {filter === "all" && "No tasks yet. Create your first one!"}
                    {filter === "pending" && "No pending tasks. Great job!"}
                    {filter === "completed" && "No completed tasks yet."}
                  </p>
                  {filter === "all" && (
                    <Button
                      onClick={() => setTodoDialogOpen(true)}
                      variant="outline"
                      className="border-card-border"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTodos.map((todo) => {
                  const dueDateInfo = formatDueDate(todo.dueDate);
                  const gradeInfo = getTaskGrade(todo.difficulty);

                  const subtasks: Subtask[] = JSON.parse(todo.subtasks || "[]");
                  const completedSubtasks = subtasks.filter(st => st.completed).length;
                  const isFadingOut = fadingOutTodos.has(todo.id);

                  return (
                    <div
                      key={todo.id}
                      className={cn(
                        "card transition-all",
                        isFadingOut && "animate-fade-out",
                        todo.completed && !isFadingOut && "opacity-60"
                      )}
                    >
                      <div className="relative z-10 flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodoMutation.mutate(todo.id)}
                          disabled={toggleTodoMutation.isPending}
                          className={cn(
                            "mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                            todo.completed
                              ? "bg-green-500 border-green-400 text-white"
                              : "border-card-border hover:border-primary hover:bg-primary/20"
                          )}
                        >
                          {todo.completed && <CheckCircle className="w-5 h-5" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={cn(
                              "text-foreground font-semibold mb-1",
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
                                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
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
                                <p className="text-xs text-muted-foreground mt-1">
                                  {completedSubtasks}/{subtasks.length} completed
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {dueDateInfo && (
                              <Badge className="bg-muted/50 text-foreground border-0">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                              </Badge>
                            )}
                            {todo.difficulty && (
                              <Badge className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-0">
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
                          className="flex-shrink-0 p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-all"
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
            {/* Enhanced Week Header Bar */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900/85 via-slate-900/75 to-slate-900/85 border border-white/10 px-6 py-4 mb-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="h-8 w-8 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-orange-200/80 mb-1">
                      Expedition week
                    </div>
                    <div className="text-lg font-semibold tracking-wide">
                      {formatWeekRange()}
                    </div>

                    {/* Ridge tracker - 7 dots */}
                    <div className="mt-2 flex gap-1">
                      {weekDates.map((d) => {
                        const dateKey = formatDateKey(d);
                        const isToday = formatDateKey(new Date()) === dateKey;
                        const dayTodos = todos.filter(t => t.dueDate === dateKey);
                        const hasCompleted = dayTodos.some(t => t.completed);

                        return (
                          <span
                            key={dateKey}
                            className={cn(
                              "h-1.5 w-4 rounded-full transition",
                              isToday
                                ? "bg-orange-400"
                                : hasCompleted
                                ? "bg-emerald-400/60"
                                : "bg-white/10 hover:bg-white/20"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-300/80">
                    {weeklyStats.pending} pending · <span className="text-emerald-300/90">{weeklyStats.completed} completed</span>
                  </span>
                  <span className="hidden md:inline-block text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200/90">
                    {weeklyStats.totalTokens} tokens this week
                  </span>
                  <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="h-8 w-8 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {/* Unscheduled Tasks Card */}
              <div className="min-w-[230px] flex-shrink-0 rounded-2xl bg-gradient-to-b from-slate-900/85 to-slate-900/80 border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl p-4">
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-300/80">
                        Unscheduled
                      </div>
                      <div className="font-semibold">Basecamp Tasks</div>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 border border-white/10 text-xs">
                      🧺
                    </span>
                  </div>

                  {todos.filter(t => !t.dueDate && !t.completed).length === 0 ? (
                    <p className="text-xs text-slate-400 mt-1">
                      Drop ideas here to sort them into the week later.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {todos.filter(t => !t.dueDate && !t.completed).map((todo) => {
                        const gradeInfo = getTaskGrade(todo.difficulty);
                        return (
                          <button
                            key={todo.id}
                            onClick={() => toggleTodoMutation.mutate(todo.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-500/40 text-[11px] hover:bg-slate-700/80 transition-colors"
                          >
                            <span className="truncate max-w-[140px]">{todo.title}</span>
                            <span className="flex items-center gap-0.5 text-emerald-300/90">
                              ⛰
                              <span>{gradeInfo.points}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Day Cards - Horizontal Scroll */}
              {weekDates.map((date) => {
                const dateKey = formatDateKey(date);
                const dayTodos = todos.filter(t => t.dueDate === dateKey && !t.completed);
                const isToday = formatDateKey(new Date()) === dateKey;
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-w-[170px] flex-shrink-0 rounded-2xl border shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl p-4 flex flex-col gap-3 transition-all",
                      isToday
                        ? "bg-gradient-to-b from-orange-500/35 via-orange-400/20 to-slate-900/85 border-orange-400/60"
                        : "bg-gradient-to-b from-slate-900/85 via-slate-900/80 to-slate-900/85 border-white/10 hover:border-orange-400/50 hover:-translate-y-0.5"
                    )}
                  >
                    <div className="relative z-10">
                      {/* Day header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
                            {dayNames[date.getDay()]}
                          </div>
                          <div className="text-2xl font-semibold leading-none">
                            {date.getDate()}
                          </div>
                        </div>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-orange-500/20 border border-orange-400/60 text-orange-100">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Tasks pills */}
                      <div className="flex-1 mt-3 space-y-2 min-h-[120px]">
                        {dayTodos.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            Rest day · no tasks ✨
                          </p>
                        ) : (
                          <>
                            {dayTodos.slice(0, 3).map((todo) => {
                              const gradeInfo = getTaskGrade(todo.difficulty);
                              return (
                                <button
                                  key={todo.id}
                                  onClick={() => toggleTodoMutation.mutate(todo.id)}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-600/50 text-xs hover:bg-slate-700/80 transition-colors w-full"
                                >
                                  <span className="truncate">{todo.title}</span>
                                  <span className="flex items-center gap-0.5 text-emerald-300/90 text-[11px] shrink-0 ml-1">
                                    ⛰<span>{gradeInfo.points}</span>
                                  </span>
                                </button>
                              );
                            })}
                            {dayTodos.length > 3 && (
                              <div className="text-[11px] text-slate-400">
                                +{dayTodos.length - 3} more…
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Add task button */}
                      <button
                        onClick={() => {
                          const title = prompt('Enter task name:');
                          if (title?.trim()) {
                            quickAddTodoMutation.mutate({ title: title.trim(), dueDate: dateKey });
                          }
                        }}
                        className="mt-1 inline-flex items-center justify-center gap-1 rounded-full text-xs px-3 py-1.5 bg-slate-800/80 border border-slate-500/60 text-slate-100 hover:bg-orange-500/70 hover:border-orange-400 hover:text-slate-900 transition-colors w-full"
                      >
                        <span className="text-sm">＋</span>
                        Add task
                      </button>
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
