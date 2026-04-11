import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useYearlyGoals } from "@/hooks/useYearlyGoals";
import { YEARLY_GOAL_CATEGORY_ORDER, YEARLY_GOAL_CATEGORY_LABELS } from "@shared/schema";
import type { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";

interface YearlyGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: YearlyGoalWithProgress;
  defaultYear?: string;
}

type GoalType = "binary" | "count" | "compound";

export function YearlyGoalDialog({
  open,
  onOpenChange,
  goal,
  defaultYear = new Date().getFullYear().toString(),
}: YearlyGoalDialogProps) {
  const isEdit = !!goal;
  const { toast } = useToast();
  const { createGoal, updateGoal, isCreating, isUpdating } = useYearlyGoals(defaultYear);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("residency");
  const [goalType, setGoalType] = useState<GoalType>("count");
  const [targetValue, setTargetValue] = useState<number>(10);
  const [xpReward, setXpReward] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>("");

  // Reset form on open
  useEffect(() => {
    if (open) {
      setTitle(goal?.title ?? "");
      setDescription(goal?.description ?? "");
      setCategory(goal?.category ?? "residency");
      setGoalType((goal?.goalType as GoalType) ?? "count");
      setTargetValue(goal?.targetValue ?? 10);
      setXpReward(goal?.xpReward ?? 100);
      setDueDate(goal?.dueDate ?? "");
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    try {
      if (isEdit && goal) {
        await updateGoal({
          id: goal.id,
          title,
          description: description || null,
          targetValue,
          xpReward,
          dueDate: dueDate || null,
        });
        toast({ title: "Goal updated" });
      } else {
        await createGoal({
          year: defaultYear,
          title,
          description,
          category,
          goalType,
          targetValue,
          xpReward,
          dueDate: dueDate || undefined,
        });
        toast({ title: "Goal created" });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: isEdit ? "Failed to update goal" : "Failed to create goal",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const submitting = isCreating || isUpdating;

  const labelCls =
    "block text-xs font-medium uppercase tracking-wider mb-1.5";
  const labelStyle = { color: "var(--sd-text-muted)" };
  const inputCls =
    "w-full rounded-lg px-3 py-2.5 text-sm bg-[rgba(15,10,8,0.5)] border border-[rgba(225,164,92,0.15)] focus:outline-none focus:border-[rgba(225,164,92,0.5)] transition-colors";
  const inputStyle = { color: "var(--sd-text-primary)" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md border-[rgba(225,164,92,0.2)]"
        style={{
          background: "linear-gradient(180deg, rgba(30,15,20,0.97) 0%, rgba(20,10,15,0.97) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-lg font-heading"
            style={{ color: "var(--sd-text-primary)" }}
          >
            {isEdit ? "Edit Yearly Goal" : "New Yearly Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read 24 books"
              className={inputCls}
              style={inputStyle}
              autoFocus
              required
              data-testid="yearly-goal-title-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this matter?"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Category (create only — cannot change on edit per schema) */}
          {!isEdit && (
            <div>
              <label className={labelCls} style={labelStyle}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer`}
                style={inputStyle}
              >
                {YEARLY_GOAL_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat} style={{ background: "#1e0f14", color: "#f5e6d3" }}>
                    {YEARLY_GOAL_CATEGORY_LABELS[cat] ?? cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Goal type (create only) */}
          {!isEdit && (
            <div>
              <label className={labelCls} style={labelStyle}>
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["binary", "count", "compound"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGoalType(t)}
                    className="rounded-lg px-3 py-2 text-xs font-medium transition-all border"
                    style={{
                      background:
                        goalType === t
                          ? "rgba(225,164,92,0.2)"
                          : "rgba(15,10,8,0.4)",
                      borderColor:
                        goalType === t
                          ? "rgba(225,164,92,0.5)"
                          : "rgba(225,164,92,0.1)",
                      color:
                        goalType === t
                          ? "var(--sd-text-accent)"
                          : "var(--sd-text-muted)",
                    }}
                  >
                    {t === "binary" ? "Done / Not" : t === "count" ? "Count" : "Sub-items"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target value (count/compound) */}
          {(isEdit || goalType !== "binary") && (
            <div>
              <label className={labelCls} style={labelStyle}>
                Target
              </label>
              <input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          )}

          {/* XP reward */}
          <div>
            <label className={labelCls} style={labelStyle}>
              XP Reward
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Due date */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors"
              style={{
                background: "rgba(15,10,8,0.5)",
                borderColor: "rgba(225,164,92,0.15)",
                color: "var(--sd-text-muted)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: submitting
                  ? "rgba(225,164,92,0.3)"
                  : "linear-gradient(145deg, rgba(255,210,140,0.4), rgba(200,131,73,0.5))",
                color: "rgba(30,15,10,0.95)",
                border: "1px solid rgba(255,200,140,0.3)",
                boxShadow: "0 0 16px rgba(225,164,92,0.2)",
              }}
              data-testid="yearly-goal-submit"
            >
              {submitting ? "Saving..." : isEdit ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
