import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchDialog } from "@/components/PitchDialog";
import {
  Plus, Trash2, Calendar, CheckCircle, Circle, CheckCircle2,
  ChevronLeft, ChevronRight, CalendarDays, GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getTaskGrade } from "@/lib/climbingRanks";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export default function PitchPlanner() {
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [view, setView] = useState<"list" | "session">("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [fadingOutPitches, setFadingOutPitches] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: pitches = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const togglePitchMutation = useMutation({
    mutationFn: async (id: number) => {
      const pitch = pitches.find(p => p.id === id);
      if (!pitch) return;

      if (pitch.completed) {
        return await apiRequest(`/api/todos/${id}`, "PATCH", { completed: false, completedAt: null });
      } else {
        return await apiRequest(`/api/todos/${id}/complete`, "POST");
      }
    },
    onSuccess: (data: any, id: number) => {
      const pitch = pitches.find(p => p.id === id);
      if (pitch && !pitch.completed) {
        setFadingOutPitches((prev) => new Set(prev).add(id));
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
        }, 400);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      }
    },
  });

  const deletePitchMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/todos/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ todoId, subtaskId }: { todoId: number; subtaskId: string }) => {
      const pitch = pitches.find(p => p.id === todoId);
      if (!pitch) return;

      const subtasks: Subtask[] = JSON.parse(pitch.subtasks || "[]");
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

  // Filter pitches
  const filteredPitches = pitches.filter(pitch => {
    if (filter === "pending") return !pitch.completed;
    if (filter === "completed") return pitch.completed;
    return true;
  });

  // Sort by due date (null dates last), then by created date
  const sortedPitches = [...filteredPitches].sort((a, b) => {
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = pitches.filter(p => !p.completed).length;
  const completedCount = pitches.filter(p => p.completed).length;

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-destructive" };
    } else if (diffDays === 0) {
      return { text: "Send today", color: "text-primary" };
    } else if (diffDays === 1) {
      return { text: "Send tomorrow", color: "text-[hsl(var(--accent))]" };
    } else if (diffDays <= 7) {
      return { text: `Send in ${diffDays} days`, color: "text-primary" };
    } else {
      return { text: due.toLocaleDateString(), color: "text-muted-foreground" };
    }
  };

  // Get the week dates based on offset
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
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

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getWeeklyStats = () => {
    const weekStart = formatDateKey(weekDates[0]);
    const weekEnd = formatDateKey(weekDates[6]);

    const weekPitches = pitches.filter(p => {
      if (!p.dueDate) return false;
      return p.dueDate >= weekStart && p.dueDate <= weekEnd;
    });

    const completed = weekPitches.filter(p => p.completed).length;
    const pending = weekPitches.filter(p => !p.completed).length;
    const totalTokens = weekPitches
      .filter(p => p.completed)
      .reduce((sum, p) => sum + getTaskGrade(p.difficulty).points, 0);

    return { completed, pending, totalTokens, total: weekPitches.length };
  };

  const weeklyStats = getWeeklyStats();

  const quickAddPitchMutation = useMutation({
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
      toast({ title: "Pitch added!", description: "Ready to climb" });
    },
  });

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 relative">
      {/* Header */}
      <div className={cn("mx-auto mb-6", view === "session" ? "max-w-[1600px]" : "max-w-4xl")}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              🧗 Daily Pitches
            </h1>
            <p className="text-muted-foreground text-sm">
              {pendingCount} to send, {completedCount} sent
            </p>
          </div>
          <Button
            onClick={() => setPitchDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Pitch
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
              <GripVertical className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("session")}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                view === "session"
                  ? "bg-primary/20 text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Session
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
                All ({pitches.length})
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
                Sent ({completedCount})
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
            ) : sortedPitches.length === 0 ? (
              <div className="card p-12">
                <div className="relative z-10 text-center">
                  <GripVertical className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {filter === "all" && "No pitches yet. Add your first!"}
                    {filter === "pending" && "No pitches to send. Rest day!"}
                    {filter === "completed" && "No pitches sent yet."}
                  </p>
                  {filter === "all" && (
                    <Button
                      onClick={() => setPitchDialogOpen(true)}
                      variant="outline"
                      className="border-card-border"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pitch
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPitches.map((pitch) => {
                  const dueDateInfo = formatDueDate(pitch.dueDate);
                  const gradeInfo = getTaskGrade(pitch.difficulty);

                  const subtasks: Subtask[] = JSON.parse(pitch.subtasks || "[]");
                  const completedSubtasks = subtasks.filter(st => st.completed).length;
                  const isFadingOut = fadingOutPitches.has(pitch.id);

                  return (
                    <div
                      key={pitch.id}
                      className={cn(
                        "card transition-all",
                        isFadingOut && "animate-fade-out",
                        pitch.completed && !isFadingOut && "opacity-60"
                      )}
                    >
                      <div className="relative z-10 flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => togglePitchMutation.mutate(pitch.id)}
                          disabled={togglePitchMutation.isPending}
                          className={cn(
                            "mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                            pitch.completed
                              ? "bg-green-500 border-green-400 text-white"
                              : "border-card-border hover:border-primary hover:bg-primary/20"
                          )}
                        >
                          {pitch.completed && <CheckCircle className="w-5 h-5" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={cn(
                              "text-foreground font-semibold mb-1",
                              pitch.completed && "line-through opacity-60"
                            )}
                          >
                            {pitch.title}
                          </h3>

                          {/* Subtasks */}
                          {subtasks.length > 0 && (
                            <div className="mt-2 mb-2 space-y-1">
                              {subtasks.map((subtask) => (
                                <button
                                  key={subtask.id}
                                  onClick={() => toggleSubtaskMutation.mutate({ todoId: pitch.id, subtaskId: subtask.id })}
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
                            {pitch.difficulty && (
                              <Badge className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-0">
                                {gradeInfo.label} • {gradeInfo.points} tokens
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (confirm("Delete this pitch?")) {
                              deletePitchMutation.mutate(pitch.id);
                            }
                          }}
                          disabled={deletePitchMutation.isPending}
                          className="flex-shrink-0 p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-all"
                          title="Delete pitch"
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

        {/* Session View (Week) - Coming next! */}
        {view === "session" && (
          <div className="card p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Session View</h3>
            <p className="text-muted-foreground">
              Building climbing session view with pitch markers...
            </p>
          </div>
        )}
      </div>

      {/* Pitch Dialog */}
      <PitchDialog open={pitchDialogOpen} onOpenChange={setPitchDialogOpen} />
    </div>
  );
}
