import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo, Project, Label } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TodoDialogEnhanced } from "@/components/TodoDialogEnhanced";
import { QuickAddModal } from "@/components/QuickAddModal";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { SortableTaskList } from "@/components/SortableTaskList";
import { Plus, Trash2, Calendar, CheckCircle, ListTodo, Filter, Circle, CheckCircle2, ChevronLeft, ChevronRight, CalendarDays, Edit, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getTaskGrade } from "@/lib/climbingRanks";
import { useFocusManagement, FOCUS_RING_STYLES } from "@/hooks/useFocusManagement";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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

export default function Todos() {
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoWithMetadata | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [view, setView] = useState<"list" | "week">("list");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = last week
  const [fadingOutTodos, setFadingOutTodos] = useState<Set<number>>(new Set());

  // New filters for projects, labels, and priorities
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null);
  const [filterLabelId, setFilterLabelId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState<number | null>(null);

  // Keyboard shortcuts modals
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Manual sort (drag & drop) toggle
  const [isManualSort, setIsManualSort] = useState(false);

  const { toast } = useToast();

  const handleEditTodo = (todo: TodoWithMetadata) => {
    setEditingTodo(todo);
    setTodoDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setTodoDialogOpen(open);
    if (!open) {
      setEditingTodo(null);
    }
  };

  const { data: todos = [], isLoading } = useQuery<TodoWithMetadata[]>({
    queryKey: ["/api/todos-with-metadata"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
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

  // Reorder todos mutation (drag & drop)
  const reorderTodosMutation = useMutation({
    mutationFn: async ({ activeId, overId }: { activeId: number; overId: number }) => {
      return await apiRequest("/api/todos/reorder", "PATCH", { activeId, overId });
    },
    onMutate: async ({ activeId, overId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/todos-with-metadata"] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(["/api/todos-with-metadata"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/todos-with-metadata"], (old: TodoWithMetadata[] | undefined) => {
        if (!old) return old;

        const activeIndex = old.findIndex(t => t.id === activeId);
        const overIndex = old.findIndex(t => t.id === overId);

        if (activeIndex === -1 || overIndex === -1) return old;

        const newTodos = [...old];
        const [movedItem] = newTodos.splice(activeIndex, 1);
        newTodos.splice(overIndex, 0, movedItem);

        return newTodos;
      });

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodos) {
        queryClient.setQueryData(["/api/todos-with-metadata"], context.previousTodos);
      }
      toast({
        title: "Error",
        description: "Failed to reorder tasks. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos-with-metadata"] });
    },
  });

  const handleReorder = (activeId: number, overId: number) => {
    reorderTodosMutation.mutate({ activeId, overId });
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    // Status filter
    if (filter === "pending" && todo.completed) return false;
    if (filter === "completed" && !todo.completed) return false;

    // Project filter
    if (filterProjectId !== null && todo.projectId !== filterProjectId) return false;

    // Label filter
    if (filterLabelId !== null && !todo.labels?.some(l => l.id === filterLabelId)) return false;

    // Priority filter
    if (filterPriority !== null && todo.priority !== filterPriority) return false;

    return true;
  });

  // Sort by manual position (if enabled), or by due date (null dates last), then by created date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (isManualSort) {
      // Sort by position field when in manual sort mode
      return (a.position || 0) - (b.position || 0);
    }

    // Default sorting: by due date, then created date
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  // Focus management for keyboard navigation (must come after sortedTodos)
  const { focusedTask, focusedIndex, focusNext, focusPrevious } = useFocusManagement(sortedTodos);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      meta: true,
      description: 'Quick add task',
      action: () => setQuickAddOpen(true),
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShortcutsHelpOpen(true),
    },
    {
      key: 'ArrowDown',
      description: 'Navigate to next task',
      action: () => focusNext(),
    },
    {
      key: 'ArrowUp',
      description: 'Navigate to previous task',
      action: () => focusPrevious(),
    },
    {
      key: 'Enter',
      description: 'Open focused task',
      action: () => {
        if (focusedTask && view === 'list') {
          handleEditTodo(focusedTask);
        }
      },
    },
    {
      key: 'e',
      description: 'Edit focused task',
      action: () => {
        if (focusedTask && view === 'list') {
          handleEditTodo(focusedTask);
        }
      },
    },
    {
      key: ' ',
      description: 'Toggle complete/incomplete',
      action: () => {
        if (focusedTask && view === 'list') {
          toggleTodoMutation.mutate(focusedTask.id);
        }
      },
    },
    {
      key: 'Delete',
      description: 'Delete focused task',
      action: () => {
        if (focusedTask && view === 'list') {
          if (confirm(`Delete "${focusedTask.title}"?`)) {
            deleteTodoMutation.mutate(focusedTask.id);
          }
        }
      },
    },
    {
      key: 'Backspace',
      description: 'Delete focused task',
      action: () => {
        if (focusedTask && view === 'list') {
          if (confirm(`Delete "${focusedTask.title}"?`)) {
            deleteTodoMutation.mutate(focusedTask.id);
          }
        }
      },
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: view === 'list' });

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
        <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-6 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 60%)`
            }}
          />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Expedition Tasks
              </h1>
              <p className="text-sm text-foreground/60">
                {pendingCount} pending, {completedCount} completed
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setQuickAddOpen(true)}
                className="rounded-full px-6 py-3 shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
                title="Quick add task (⌘K)"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
                <span className="ml-2 text-xs opacity-75">⌘K</span>
              </Button>
              <Button
                onClick={() => setShortcutsHelpOpen(true)}
                className="rounded-full px-4 py-3 shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
                title="Keyboard shortcuts (?)"
              >
                ?
              </Button>
            </div>
          </div>
        </div>

        {/* View and Filters */}
        <div className="bg-background/30 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-2 mb-6 inline-flex gap-2 flex-wrap">
          {/* View Toggle */}
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
              view === "list"
                ? "text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            style={view === "list" ? {
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            } : {}}
          >
            <ListTodo className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setView("week")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
              view === "week"
                ? "text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            style={view === "week" ? {
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
            } : {}}
          >
            <CalendarDays className="w-4 h-4" />
            Week
          </button>

          {/* Filters (only in list view) */}
          {view === "list" && (
            <>
              <div className="w-px bg-foreground/10" />
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "all"
                    ? "text-white shadow-lg"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
                style={filter === "all" ? {
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
                } : {}}
              >
                All ({todos.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "pending"
                    ? "text-white shadow-lg"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
                style={filter === "pending" ? {
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
                } : {}}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all",
                  filter === "completed"
                    ? "text-white shadow-lg"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
                style={filter === "completed" ? {
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
                } : {}}
              >
                Completed ({completedCount})
              </button>

              {/* New Filters: Project, Label, Priority */}
              {projects.length > 0 && (
                <>
                  <div className="w-px bg-foreground/10" />
                  <select
                    value={filterProjectId || ""}
                    onChange={(e) => setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-4 py-2 rounded-xl bg-background/60 border border-foreground/10 text-foreground text-sm font-medium transition-all hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon} {project.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {labels.length > 0 && (
                <select
                  value={filterLabelId || ""}
                  onChange={(e) => setFilterLabelId(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 rounded-xl bg-background/60 border border-foreground/10 text-foreground text-sm font-medium transition-all hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">All Labels</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      #{label.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterPriority || ""}
                onChange={(e) => setFilterPriority(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 rounded-xl bg-background/60 border border-foreground/10 text-foreground text-sm font-medium transition-all hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Priorities</option>
                <option value="1">🚩 P1 - Urgent</option>
                <option value="2">🚩 P2 - High</option>
                <option value="3">🚩 P3 - Medium</option>
                <option value="4">🏳️ P4 - Low</option>
              </select>

              {/* Manual Sort Toggle */}
              <div className="w-px bg-foreground/10" />
              <button
                onClick={() => setIsManualSort(!isManualSort)}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                  isManualSort
                    ? "text-white shadow-lg"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
                style={isManualSort ? {
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
                } : {}}
                title="Enable drag & drop to manually reorder tasks"
              >
                <GripVertical className="w-4 h-4" />
                Manual Sort
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
              <div className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl p-12 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, hsl(var(--primary) / 0.3), transparent 70%)`
                  }}
                />
                <div className="relative z-10 text-center">
                  <ListTodo className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--primary) / 0.6)' }} />
                  <p className="text-foreground/60 mb-4">
                    {filter === "all" && "No tasks yet. Create your first one!"}
                    {filter === "pending" && "No pending tasks. Great job!"}
                    {filter === "completed" && "No completed tasks yet."}
                  </p>
                  {filter === "all" && (
                    <Button
                      onClick={() => setTodoDialogOpen(true)}
                      className="rounded-full px-6 py-3 shadow-lg transition-all duration-300 hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                        color: 'white'
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <SortableTaskList
                todos={sortedTodos}
                isDraggable={isManualSort && view === "list"}
                onReorder={handleReorder}
                onToggle={(id) => toggleTodoMutation.mutate(id)}
                onToggleSubtask={(todoId, subtaskId) => toggleSubtaskMutation.mutate({ todoId, subtaskId })}
                onEdit={handleEditTodo}
                onDelete={(id) => deleteTodoMutation.mutate(id)}
                fadingOutTodos={fadingOutTodos}
                isToggling={toggleTodoMutation.isPending}
                isDeletingDisabled={deleteTodoMutation.isPending}
              />
            )}
          </>
        )}


        {/* Week View */}
        {view === "week" && (
          <div>
            {/* Enhanced Week Header Bar */}
            <div className="rounded-2xl bg-background/40 backdrop-blur-xl border border-foreground/10 px-6 py-4 mb-6 shadow-xl relative overflow-hidden">
              {/* Soft gradient overlay */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at left, hsl(var(--secondary) / 0.3), transparent 70%)`
                }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="h-8 w-8 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground/10 transition"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] mb-1" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                      Expedition week
                    </div>
                    <div className="text-lg font-semibold tracking-wide text-foreground">
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
                            className="h-1.5 w-4 rounded-full transition"
                            style={{
                              background: isToday
                                ? 'hsl(var(--primary))'
                                : hasCompleted
                                ? 'hsl(var(--accent) / 0.6)'
                                : 'hsl(var(--foreground) / 0.1)'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-foreground/80">
                    {weeklyStats.pending} pending · <span style={{ color: 'hsl(var(--accent))' }}>{weeklyStats.completed} completed</span>
                  </span>
                  <span className="hidden md:inline-block text-xs px-3 py-1 rounded-full border" style={{
                    background: 'hsl(var(--accent) / 0.15)',
                    borderColor: 'hsl(var(--accent) / 0.3)',
                    color: 'hsl(var(--accent))'
                  }}>
                    {weeklyStats.totalTokens} tokens this week
                  </span>
                  <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="h-8 w-8 rounded-full border border-foreground/20 flex items-center justify-center hover:bg-foreground/10 transition"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              {/* Unscheduled Tasks Card */}
              <div className="min-w-[230px] flex-shrink-0 rounded-2xl bg-background/40 backdrop-blur-xl border border-foreground/10 shadow-lg p-4 relative overflow-hidden">
                {/* Soft gradient overlay */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at top, hsl(var(--accent) / 0.3), transparent 70%)`
                  }}
                />

                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-foreground/60">
                        Unscheduled
                      </div>
                      <div className="font-semibold text-foreground">Basecamp Tasks</div>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs" style={{
                      background: 'hsl(var(--accent) / 0.15)',
                      borderColor: 'hsl(var(--accent) / 0.3)'
                    }}>
                      🧺
                    </span>
                  </div>

                  {todos.filter(t => !t.dueDate && !t.completed).length === 0 ? (
                    <p className="text-xs text-foreground/60 mt-1">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] hover:bg-foreground/5 transition-colors text-foreground"
                            style={{
                              background: 'hsl(var(--background) / 0.6)',
                              borderColor: 'hsl(var(--accent) / 0.4)'
                            }}
                          >
                            <span className="truncate max-w-[140px]">{todo.title}</span>
                            <span className="flex items-center gap-0.5" style={{ color: 'hsl(var(--accent))' }}>
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
                    className="min-w-[170px] flex-shrink-0 rounded-2xl border shadow-lg hover:shadow-xl backdrop-blur-xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 relative overflow-hidden"
                    style={{
                      background: 'hsl(var(--background) / 0.4)',
                      borderColor: isToday ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--foreground) / 0.1)',
                      boxShadow: isToday ? '0 4px 20px hsl(var(--primary) / 0.2)' : undefined
                    }}
                  >
                    {/* Soft gradient overlay for today */}
                    {isToday && (
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at top, hsl(var(--primary) / 0.4), transparent 70%)`
                        }}
                      />
                    )}

                    <div className="relative z-10">
                      {/* Day header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">
                            {dayNames[date.getDay()]}
                          </div>
                          <div className="text-2xl font-semibold leading-none text-foreground">
                            {date.getDate()}
                          </div>
                        </div>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] border text-white" style={{
                            background: 'hsl(var(--primary) / 0.3)',
                            borderColor: 'hsl(var(--primary) / 0.5)'
                          }}>
                            Today
                          </span>
                        )}
                      </div>

                      {/* Tasks pills */}
                      <div className="flex-1 mt-3 space-y-2 min-h-[120px]">
                        {dayTodos.length === 0 ? (
                          <p className="text-[11px] text-foreground/60">
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
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-colors w-full text-foreground"
                                  style={{
                                    background: 'hsl(var(--primary) / 0.15)',
                                    borderColor: 'hsl(var(--primary) / 0.3)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'hsl(var(--primary) / 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)';
                                  }}
                                >
                                  <span className="truncate">{todo.title}</span>
                                  <span className="flex items-center gap-0.5 text-[11px] shrink-0 ml-1" style={{ color: 'hsl(var(--accent))' }}>
                                    ⛰<span>{gradeInfo.points}</span>
                                  </span>
                                </button>
                              );
                            })}
                            {dayTodos.length > 3 && (
                              <div className="text-[11px] text-foreground/60">
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
                        className="mt-1 inline-flex items-center justify-center gap-1 rounded-full text-xs px-3 py-1.5 border text-foreground transition-colors w-full"
                        style={{
                          background: 'hsl(var(--primary) / 0.15)',
                          borderColor: 'hsl(var(--primary) / 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--primary) / 0.25)';
                          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)';
                          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)';
                        }}
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
      <TodoDialogEnhanced
        open={todoDialogOpen}
        onOpenChange={handleCloseDialog}
        editTodo={editingTodo}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </div>
  );
}
