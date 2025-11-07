import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export function TodoDialog({ open, onOpenChange }: TodoDialogProps) {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateOption) {
      case "today":
        return today.toISOString().split('T')[0];
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case "this-week":
        const thisWeekEnd = new Date(today);
        thisWeekEnd.setDate(thisWeekEnd.getDate() + (7 - thisWeekEnd.getDay()));
        return thisWeekEnd.toISOString().split('T')[0];
      case "next-week":
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
      case "custom":
        return customDate;
      default:
        return null;
    }
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

      toast({ title: "Created!", description: "Todo created successfully" });
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
      toast({ title: "Error", description: "Failed to create todo", variant: "destructive" });
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
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "#000" }}>
          Create New Todo
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              What needs to be done?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finish project proposal"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Due Date Dropdown */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              When?
            </label>
            <select
              value={dateOption}
              onChange={(e) => setDateOption(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "white",
              }}
            >
              <option value="none">No due date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this-week">End of this week</option>
              <option value="next-week">Next week</option>
              <option value="custom">Pick a date...</option>
            </select>

            {dateOption === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
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

          {/* Subtasks */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Subtasks (optional)
            </label>

            {subtasks.length > 0 && (
              <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ flex: 1, color: "#000", fontSize: "14px" }}>
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                      }}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
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
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={addSubtask}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#8B5CF6",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
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
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{points} coins</div>
                  </button>
                );
              })}
            </div>
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
              {submitting ? "Creating..." : "Create Todo"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
