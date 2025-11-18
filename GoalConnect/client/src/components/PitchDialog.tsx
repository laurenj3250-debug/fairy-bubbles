import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface PitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export function PitchDialog({ open, onOpenChange }: PitchDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dateOption, setDateOption] = useState<string>("none");
  const [customDate, setCustomDate] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      await apiRequest("/api/todos", "POST", {
        title,
        difficulty,
        dueDate: getDueDate(),
        subtasks: JSON.stringify(subtasks),
        completed: false,
      });

      toast({ title: "Pitch added!", description: "Ready to climb" });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });

      // Reset form
      setTitle("");
      setDateOption("none");
      setCustomDate("");
      setDifficulty("medium");
      setSubtasks([]);
      setNewSubtaskTitle("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add pitch", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const gradeLabels = {
    easy: "5.6",
    medium: "5.9",
    hard: "5.12"
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999998]"
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 card max-w-[500px] w-[90%] max-h-[90vh] overflow-auto z-[999999]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Add New Pitch
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-5">
              <label className="block mb-2 font-medium text-foreground">
                What pitch are you climbing?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Finish project proposal"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Due Date Dropdown */}
            <div className="mb-5">
              <label className="block mb-2 font-medium text-foreground">
                When to send?
              </label>
              <select
                value={dateOption}
                onChange={(e) => setDateOption(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background/50 text-foreground focus:outline-none focus:border-primary transition"
              >
                <option value="none">No deadline</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="in-3-days">In 3 days</option>
                <option value="this-week">End of this week</option>
                <option value="next-week">Next Monday</option>
                <option value="in-1-week">In 1 week</option>
                <option value="in-2-weeks">In 2 weeks</option>
                <option value="end-of-month">End of this month</option>
                <option value="custom">Pick a date...</option>
              </select>

              {dateOption === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-3 w-full px-4 py-3 rounded-xl border border-card-border bg-background/50 text-foreground focus:outline-none focus:border-primary transition"
                />
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-5">
              <label className="block mb-2 font-medium text-foreground">
                Pitches (optional rope sections)
              </label>

              {subtasks.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg"
                    >
                      <span className="flex-1 text-foreground text-sm">
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(subtask.id)}
                        className="p-1 hover:bg-destructive/20 rounded transition text-destructive"
                      >
                        <X className="w-4 h-4" />
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
                  placeholder="Add a pitch section..."
                  className="flex-1 px-3 py-2 rounded-lg border border-card-border bg-background/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <label className="block mb-2 font-medium text-foreground">
                Grade
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'medium', 'hard'] as const).map((diff) => {
                  const points = diff === 'easy' ? 5 : diff === 'medium' ? 10 : 15;
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-card-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      <div className="text-sm font-bold text-foreground capitalize">
                        {gradeLabels[diff]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {points} tokens
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-card-border hover:bg-muted/30 transition text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 transition text-primary-foreground font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add Pitch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
