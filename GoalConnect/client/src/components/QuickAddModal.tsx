import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * QuickAddModal - Lightweight task creation modal for keyboard-first workflow
 *
 * Features:
 * - Minimal UI with just title, due date, and difficulty
 * - Opens with ⌘K/Ctrl+K
 * - Keyboard-first (Tab, Enter, Escape)
 * - Smart defaults (today's date, medium difficulty)
 * - Fast creation workflow
 */
export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (open && titleInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDueDate("");
      setDifficulty("medium");
      setSubmitting(false);
    }
  }, [open]);

  // Set default due date to today when modal opens
  useEffect(() => {
    if (open && !dueDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [open, dueDate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest("/api/todos", "POST", {
        title: title.trim(),
        difficulty,
        dueDate: dueDate || null,
        subtasks: "[]",
        completed: false,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });

      toast({
        title: "Task created!",
        description: "Your task has been added successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (if not in textarea)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Close on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, hsl(var(--primary) / 0.3), transparent 60%)`
            }}
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Quick Add Task</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="quick-title" className="block text-sm font-medium text-foreground/80 mb-2">
                Task Title
              </label>
              <input
                ref={titleInputRef}
                id="quick-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 bg-background/60 border border-foreground/10 rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                autoComplete="off"
              />
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="quick-date" className="block text-sm font-medium text-foreground/80 mb-2">
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Due Date
              </label>
              <input
                ref={dueDateInputRef}
                id="quick-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-background/60 border border-foreground/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {[
                  { value: "easy", label: "Easy", color: "hsl(var(--accent))" },
                  { value: "medium", label: "Medium", color: "hsl(var(--primary))" },
                  { value: "hard", label: "Hard", color: "#ef4444" },
                ].map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value as "easy" | "medium" | "hard")}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-medium transition-all",
                      difficulty === diff.value
                        ? "text-white shadow-lg"
                        : "text-foreground/60 bg-background/60 border border-foreground/10 hover:bg-foreground/5"
                    )}
                    style={
                      difficulty === diff.value
                        ? { background: diff.color }
                        : undefined
                    }
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-6 py-3 rounded-xl font-medium bg-background/60 border border-foreground/10 text-foreground/60 hover:bg-foreground/5 transition-all"
              >
                Cancel
                <span className="ml-2 text-xs text-foreground/40">Esc</span>
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex-1 px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  color: 'white'
                }}
              >
                {submitting ? "Creating..." : "Create Task"}
                <span className="ml-2 text-xs opacity-80">↵</span>
              </button>
            </div>
          </form>

          {/* Keyboard hint */}
          <p className="relative z-10 text-xs text-foreground/40 text-center mt-4">
            Press <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded">Tab</kbd> to navigate,{" "}
            <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded">Enter</kbd> to create,{" "}
            <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </>
  );
}
