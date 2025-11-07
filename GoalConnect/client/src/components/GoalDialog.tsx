import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { X, Target, TrendingUp, AlertCircle } from "lucide-react";
import type { Goal } from "@shared/schema";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
}

const formatDateInput = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export function GoalDialog({ open, onClose, goal }: GoalDialogProps) {
  const { user } = useAuth();
  const isEdit = !!goal;

  const [title, setTitle] = useState(goal?.title || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [targetValue, setTargetValue] = useState(goal?.targetValue || 100);
  const [currentValue, setCurrentValue] = useState(goal?.currentValue || 0);
  const [unit, setUnit] = useState(goal?.unit || "");
  const [deadline, setDeadline] = useState(
    goal?.deadline || formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [category, setCategory] = useState(goal?.category || "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (goal?.difficulty as "easy" | "medium" | "hard") || "medium"
  );
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    (goal?.priority as "high" | "medium" | "low") || "medium"
  );
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const data = {
        userId: user.id,
        title,
        description,
        targetValue,
        currentValue,
        unit,
        deadline,
        category,
        difficulty,
        priority,
      };

      if (isEdit) {
        await apiRequest(`/api/goals/${goal?.id}`, "PATCH", data);
      } else {
        await apiRequest("/api/goals", "POST", data);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/goals"], exact: false });
      onClose();
    } catch (error: any) {
      alert("Failed to save goal: " + (error?.message || "Unknown error"));
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 999998,
        }}
      />

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#000" }}>
            {isEdit ? "Edit Goal" : "Create New Goal"}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: "20px", height: "20px", color: "#666" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Read 12 Books This Year"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Read at least one book per month"
              rows={2}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Current & Target Values */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Current Value
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Target Value
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Unit & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="books"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Learning"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Priority Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Priority (affects point multipliers)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["high", "medium", "low"] as const).map((p) => {
                const selected = priority === p;
                const multiplier = p === "high" ? "1.5x" : p === "medium" ? "1.0x" : "0.75x";
                const bgColor = p === "high" ? "#fee2e2" : p === "medium" ? "#e0e7ff" : "#f3f4f6";
                const borderColor = p === "high" ? "#ef4444" : p === "medium" ? "#6366f1" : "#9ca3af";
                const textColor = p === "high" ? "#991b1b" : p === "medium" ? "#3730a3" : "#4b5563";

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: "12px",
                      border: `2px solid ${selected ? borderColor : "#e5e7eb"}`,
                      borderRadius: "12px",
                      background: selected ? bgColor : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = borderColor;
                        e.currentTarget.style.background = bgColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: selected ? "700" : "500",
                        textTransform: "capitalize",
                        color: selected ? textColor : "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {p === "high" && <TrendingUp style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p === "medium" && <Target style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p === "low" && <AlertCircle style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />}
                      {p}
                    </div>
                    <div style={{ fontSize: "12px", color: selected ? textColor : "#999" }}>{multiplier} points</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              Difficulty (affects points earned)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {(["easy", "medium", "hard"] as const).map((diff) => {
                const points = diff === "easy" ? 5 : diff === "medium" ? 10 : 15;
                const selected = difficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    style={{
                      padding: "12px",
                      border: `2px solid ${selected ? "#8B5CF6" : "#e5e7eb"}`,
                      borderRadius: "12px",
                      background: selected ? "#f5f3ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#8B5CF6";
                        e.currentTarget.style.background = "#faf5ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.background = "white";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: selected ? "700" : "500",
                        textTransform: "capitalize",
                        color: selected ? "#6b21a8" : "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {diff}
                    </div>
                    <div style={{ fontSize: "12px", color: selected ? "#7c3aed" : "#999" }}>{points} coins</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Preview */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              borderRadius: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#666" }}>Progress Preview</span>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "#000" }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#d1d5db", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #8B5CF6 0%, #6366f1 100%)",
                  width: `${Math.min(progress, 100)}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                background: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                color: "#666",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#9ca3af";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#666";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "14px",
                border: "none",
                borderRadius: "12px",
                background: submitting ? "#9ca3af" : "linear-gradient(135deg, #8B5CF6 0%, #6366f1 100%)",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                color: "white",
                transition: "all 0.2s",
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {submitting ? "Saving..." : isEdit ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
