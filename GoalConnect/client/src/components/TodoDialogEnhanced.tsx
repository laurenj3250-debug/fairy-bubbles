import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Sparkles, ListChecks } from "lucide-react";
import { ProjectSelector } from "./ProjectSelector";
import { LabelPicker } from "./LabelPicker";
import { PriorityPicker } from "./PriorityPicker";
import { SmartTaskInput } from "./SmartTaskInput";
import { TaskInputAutocomplete } from "./TaskInputAutocomplete";
import { RecurrencePicker } from "./RecurrencePicker";
import { useQuery } from "@tanstack/react-query";
import type { ParsedTask } from "@/lib/nlp/taskParser";
import type { Todo, Project, Label } from "@shared/schema";
import type { RecurrencePattern } from "../../../shared/lib/recurrenceEngine";
import { calculateNextOccurrence } from "../../../shared/lib/recurrenceEngine";

interface TodoWithMetadata extends Todo {
  project: Project | null;
  labels: Label[];
}

interface TodoDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTodo?: TodoWithMetadata | null;
  defaultDueDate?: string; // YYYY-MM-DD format for pre-filling the date
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export function TodoDialogEnhanced({ open, onOpenChange, editTodo = null, defaultDueDate }: TodoDialogEnhancedProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dateOption, setDateOption] = useState<string>(defaultDueDate ? "custom" : "none");
  const [customDate, setCustomDate] = useState(defaultDueDate || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New fields
  const [projectId, setProjectId] = useState<number | null>(null);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [priority, setPriority] = useState<number>(4); // Default P4 (low)
  const [notes, setNotes] = useState("");
  const [recurringPattern, setRecurringPattern] = useState<RecurrencePattern | null>(null);

  // Smart input mode
  const [useSmartInput, setUseSmartInput] = useState(true);
  const [smartInputValue, setSmartInputValue] = useState("");

  // Fetch projects and labels for smart input
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: labels = [] } = useQuery<any[]>({
    queryKey: ["/api/labels"],
  });

  // Handle smart input parsed changes
  const handleSmartInputParsed = (parsed: ParsedTask) => {
    setTitle(parsed.title);

    // Set due date
    if (parsed.dueDate) {
      setDateOption("custom");
      setCustomDate(parsed.dueDate);
    } else {
      setDateOption("none");
      setCustomDate("");
    }

    // Set project
    if (parsed.projectName) {
      const project = projects.find(
        (p) => p.name.toLowerCase() === parsed.projectName?.toLowerCase()
      );
      setProjectId(project?.id || null);
    } else {
      setProjectId(null);
    }

    // Set labels
    if (parsed.labelNames && parsed.labelNames.length > 0) {
      const matchedLabelIds = parsed.labelNames
        .map((name) => {
          const label = labels.find(
            (l) => l.name.toLowerCase() === name.toLowerCase()
          );
          return label?.id;
        })
        .filter((id): id is number => id !== undefined);
      setLabelIds(matchedLabelIds);
    } else {
      setLabelIds([]);
    }

    // Set priority
    setPriority(parsed.priority || 4);

    // Set notes
    setNotes(parsed.notes || "");
  };

  // Populate form when editing or opening with default date
  useEffect(() => {
    if (editTodo && open) {
      setTitle(editTodo.title);
      setDifficulty(editTodo.difficulty as "easy" | "medium" | "hard");
      setProjectId(editTodo.projectId);
      setLabelIds(editTodo.labels?.map(l => l.id) || []);
      setPriority(editTodo.priority || 4);
      setNotes(editTodo.notes || "");
      setSubtasks(editTodo.subtasks ? JSON.parse(editTodo.subtasks) : []);
      setRecurringPattern(editTodo.recurringPattern ? JSON.parse(editTodo.recurringPattern) : null);
      setUseSmartInput(false); // Switch to classic form when editing

      // Handle due date
      if (editTodo.dueDate) {
        setDateOption("custom");
        setCustomDate(editTodo.dueDate);
      } else {
        setDateOption("none");
        setCustomDate("");
      }
    } else if (open && !editTodo && defaultDueDate) {
      // Opening with a default date (e.g., from WeeklyPlanner)
      setDateOption("custom");
      setCustomDate(defaultDueDate);
    } else if (!open) {
      // Reset when closing without editing
      if (!editTodo) {
        setTitle("");
        setDateOption(defaultDueDate ? "custom" : "none");
        setCustomDate(defaultDueDate || "");
        setDifficulty("medium");
        setSubtasks([]);
        setProjectId(null);
        setLabelIds([]);
        setPriority(4);
        setNotes("");
        setRecurringPattern(null);
        setSmartInputValue("");
        setUseSmartInput(true);
      }
    }
  }, [editTodo, open, defaultDueDate]);

  if (!open) return null;

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const getDueDate = () => {
    if (dateOption === "custom") {
      return customDate || null;
    }

    if (dateOption === "none") {
      return null;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    let targetDate: Date;

    switch (dateOption) {
      case "today":
        targetDate = new Date(year, month, day);
        break;
      case "tomorrow":
        targetDate = new Date(year, month, day + 1);
        break;
      case "in-3-days":
        targetDate = new Date(year, month, day + 3);
        break;
      case "this-week":
        const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
        targetDate = new Date(year, month, day + daysUntilSunday);
        break;
      case "next-week":
        const daysUntilMonday = today.getDay() === 0 ? 1 : 8 - today.getDay();
        targetDate = new Date(year, month, day + daysUntilMonday);
        break;
      case "in-1-week":
        targetDate = new Date(year, month, day + 7);
        break;
      case "in-2-weeks":
        targetDate = new Date(year, month, day + 14);
        break;
      case "end-of-month":
        targetDate = new Date(year, month + 1, 0);
        break;
      default:
        return null;
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculate next recurrence date if pattern is set
      const nextRecurrence = recurringPattern
        ? calculateNextOccurrence(recurringPattern, getDueDate() || new Date())
        : null;

      if (editTodo) {
        // Update existing task
        await apiRequest(`/api/todos/${editTodo.id}`, "PATCH", {
          title,
          difficulty,
          dueDate: getDueDate(),
          subtasks: JSON.stringify(subtasks),
          projectId,
          priority,
          notes: notes.trim() || null,
          recurringPattern: recurringPattern ? JSON.stringify(recurringPattern) : null,
          nextRecurrence: nextRecurrence ? nextRecurrence.toISOString().split('T')[0] : null,
        });

        // Get current labels
        const currentLabelIds = editTodo.labels?.map(l => l.id) || [];

        // Remove labels that were deselected
        const labelsToRemove = currentLabelIds.filter(id => !labelIds.includes(id));
        await Promise.all(
          labelsToRemove.map((labelId) =>
            apiRequest(`/api/tasks/${editTodo.id}/labels/${labelId}`, "DELETE")
          )
        );

        // Add new labels
        const labelsToAdd = labelIds.filter(id => !currentLabelIds.includes(id));
        await Promise.all(
          labelsToAdd.map((labelId) =>
            apiRequest(`/api/tasks/${editTodo.id}/labels`, "POST", { labelId })
          )
        );

        toast({ title: "Updated!", description: "Task updated successfully" });
      } else {
        // Create new task
        const newTodo = await apiRequest("/api/todos", "POST", {
          title,
          difficulty,
          dueDate: getDueDate(),
          subtasks: JSON.stringify(subtasks),
          completed: false,
          projectId,
          priority,
          notes: notes.trim() || null,
          recurringPattern: recurringPattern ? JSON.stringify(recurringPattern) : null,
          nextRecurrence: nextRecurrence ? nextRecurrence.toISOString().split('T')[0] : null,
        });

        // Add labels if any selected
        if (labelIds.length > 0 && newTodo.id) {
          await Promise.all(
            labelIds.map((labelId) =>
              apiRequest(`/api/tasks/${newTodo.id}/labels`, "POST", { labelId })
            )
          );
        }

        toast({ title: "Created!", description: "Task created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos-with-metadata"] });

      // Reset form
      setTitle("");
      setDateOption("none");
      setCustomDate("");
      setDifficulty("medium");
      setSubtasks([]);
      setNewSubtaskTitle("");
      setProjectId(null);
      setLabelIds([]);
      setPriority(4);
      setNotes("");
      setRecurringPattern(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating todo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create task";
      toast({
        title: "Error",
        description: errorMessage.includes("401") ? "Please log in again" : errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/70 z-[999998]"
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl p-8 w-[90%] max-w-[600px] max-h-[90vh] overflow-auto z-[999999] shadow-2xl border border-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {editTodo ? "Edit Task" : "Create New Task"}
          </h2>

          {/* Toggle Smart Input / Classic Form */}
          {!editTodo && (
            <div className="flex gap-2 bg-foreground/5 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setUseSmartInput(true)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  useSmartInput
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Smart Input
              </button>
              <button
                type="button"
                onClick={() => setUseSmartInput(false)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  !useSmartInput
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Classic Form
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Smart Input Mode */}
          {useSmartInput && !editTodo ? (
            <div>
              <label className="block mb-2 font-medium text-foreground text-sm">
                Describe your task
              </label>
              <SmartTaskInput
                value={smartInputValue}
                onChange={setSmartInputValue}
                onParsedChange={handleSmartInputParsed}
                autoFocus
              />
            </div>
          ) : (
            /* Classic Form Mode */
            <>
              {/* Title */}
              <div>
                <label className="block mb-2 font-medium text-foreground text-sm">
                  What needs to be done?
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Finish project proposal"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}

          {/* Project Selector */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Project
            </label>
            <ProjectSelector
              selectedProjectId={projectId}
              onSelect={setProjectId}
            />
          </div>

          {/* Priority Picker */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Priority
            </label>
            <PriorityPicker
              priority={priority}
              onChange={setPriority}
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Labels
            </label>
            <LabelPicker
              selectedLabelIds={labelIds}
              onLabelsChange={setLabelIds}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Due Date
            </label>
            <select
              value={dateOption}
              onChange={(e) => setDateOption(e.target.value)}
              className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">No due date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="in-3-days">In 3 days</option>
              <option value="this-week">End of this week</option>
              <option value="next-week">Next week</option>
              <option value="in-1-week">In 1 week</option>
              <option value="in-2-weeks">In 2 weeks</option>
              <option value="end-of-month">End of month</option>
              <option value="custom">Custom date...</option>
            </select>

            {dateOption === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground mt-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Difficulty
            </label>
            <div className="flex gap-3">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const points = diff === 'easy' ? 5 : diff === 'medium' ? 10 : 15;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                      difficulty === diff
                        ? 'border-primary bg-primary/10 font-bold'
                        : 'border-foreground/20 hover:border-foreground/40'
                    }`}
                  >
                    <div className="text-sm capitalize text-foreground">{diff}</div>
                    <div className="text-xs text-foreground/60 mt-1">{points} tokens</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Subtasks (optional)
            </label>

            {subtasks.length > 0 && (
              <div className="mb-3 space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-3 bg-foreground/5 rounded-lg"
                  >
                    <span className="flex-1 text-foreground text-sm">
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      className="p-1 hover:bg-foreground/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 border border-foreground/20 rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 font-medium text-foreground text-sm">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-4 py-3 border border-foreground/20 rounded-xl bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Recurrence */}
          <div>
            <RecurrencePicker
              value={recurringPattern}
              onChange={setRecurringPattern}
              startDate={getDueDate() ? new Date(getDueDate()!) : new Date()}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 border border-foreground/20 rounded-xl bg-background hover:bg-foreground/5 text-foreground font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? (editTodo ? "Updating..." : "Creating...")
                : (editTodo ? "Update Task" : "Create Task")
              }
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
