import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface GoalDialogNewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATES = [
  { emoji: "📚", title: "Read", unit: "books", target: 12, category: "Learning" },
  { emoji: "💪", title: "Exercise", unit: "times", target: 100, category: "Health" },
  { emoji: "💰", title: "Save", unit: "dollars", target: 1000, category: "Finance" },
  { emoji: "🎯", title: "Practice", unit: "hours", target: 100, category: "Skills" },
  { emoji: "📝", title: "Write", unit: "articles", target: 24, category: "Creativity" },
  { emoji: "🏃", title: "Run", unit: "miles", target: 100, category: "Fitness" },
];

export function GoalDialogNew({ open, onOpenChange }: GoalDialogNewProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState(12);
  const [unit, setUnit] = useState("books");
  const [deadline, setDeadline] = useState<string>("this-year");
  const [customDeadline, setCustomDeadline] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setTitle(template.title);
    setTargetValue(template.target);
    setUnit(template.unit);
    setCategory(template.category);
  };

  const getDeadlineDate = () => {
    if (deadline === "custom") {
      return customDeadline || null;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    let targetDate: Date;

    switch (deadline) {
      case "this-month":
        // End of current month
        targetDate = new Date(year, month + 1, 0);
        break;
      case "this-quarter":
        // End of current quarter
        const quarterMonth = Math.floor(month / 3) * 3 + 3;
        targetDate = new Date(year, quarterMonth, 0);
        break;
      case "this-year":
        targetDate = new Date(year, 11, 31);
        break;
      case "six-months":
        targetDate = new Date(year, month + 6, day);
        break;
      default:
        return null;
    }

    // Format as YYYY-MM-DD
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiRequest("/api/goals", "POST", {
        userId: 1,
        title: `${title} ${targetValue} ${unit}`,
        description: "",
        targetValue,
        currentValue: 0,
        unit,
        deadline: getDeadlineDate(),
        category: category || "Personal",
        difficulty,
      });

      toast({ title: "Created!", description: "Goal created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });

      // Reset form
      setTitle("");
      setTargetValue(12);
      setUnit("books");
      setDeadline("this-year");
      setCustomDeadline("");
      setDifficulty("medium");
      setCategory("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 999998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          zIndex: 999999,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "#000" }}>
          Create New Goal
        </h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
          Set a measurable goal to track your progress
        </p>

        {/* Quick Templates */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000", fontSize: "14px" }}>
            Quick Start
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {TEMPLATES.map((template) => (
              <button
                key={template.title}
                type="button"
                onClick={() => applyTemplate(template)}
                style={{
                  padding: "12px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8B5CF6";
                  e.currentTarget.style.background = "#f5f3ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#ddd";
                  e.currentTarget.style.background = "white";
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{template.emoji}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{template.title}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Goal Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              What do you want to achieve?
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Read / Exercise / Save"
                required
                autoFocus
                style={{
                  flex: "0 0 120px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value))}
                required
                min="1"
                style={{
                  flex: "0 0 80px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="books / times / dollars"
                required
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              />
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Example: "Read 12 books" or "Exercise 100 times"
            </div>
          </div>

          {/* Deadline Dropdown */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              By when?
            </label>
            <select
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "white",
              }}
            >
              <option value="this-month">End of this month</option>
              <option value="this-quarter">End of this quarter</option>
              <option value="six-months">In 6 months</option>
              <option value="this-year">End of this year</option>
              <option value="custom">Pick a date...</option>
            </select>

            {deadline === "custom" && (
              <input
                type="date"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "16px",
                  marginTop: "8px",
                }}
              />
            )}
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Difficulty
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const points = diff === 'easy' ? 5 : diff === 'medium' ? 10 : 15;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      border: `2px solid ${difficulty === diff ? '#8B5CF6' : '#ddd'}`,
                      borderRadius: "12px",
                      background: difficulty === diff ? 'rgba(139, 92, 246, 0.1)' : 'white',
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontWeight: difficulty === diff ? "700" : "500",
                    }}
                  >
                    <div style={{ fontSize: "14px", textTransform: "capitalize", color: "#000" }}>{diff}</div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{points} coins per milestone</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Category */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000", fontSize: "14px" }}>
              Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Learning, Health, Finance..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "32px" }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                padding: "12px 24px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                background: "#8B5CF6",
                color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "500",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
