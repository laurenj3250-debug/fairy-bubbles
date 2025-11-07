import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, ChevronUp, Link as LinkIcon, X } from "lucide-react";
import type { Habit, Goal } from "@shared/schema";

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

const QUICK_HABITS = [
  { title: "Exercise", icon: "💪", difficulty: "medium" as const },
  { title: "Read", icon: "📚", difficulty: "easy" as const },
  { title: "Meditate", icon: "🧘", difficulty: "easy" as const },
  { title: "Learn German", icon: "🇩🇪", difficulty: "medium" as const },
  { title: "Climb", icon: "🧗", difficulty: "hard" as const },
  { title: "Drink Water", icon: "💧", difficulty: "easy" as const },
  { title: "Journal", icon: "✍️", difficulty: "easy" as const },
  { title: "Code", icon: "💻", difficulty: "medium" as const },
];

const ALL_ICONS = ["💪", "📚", "🧘", "💧", "🥗", "😴", "🏋️", "🍎", "🚴", "🏊", "⚽", "🎨", "🎵", "🎯", "🔥", "⭐", "✨", "🌱", "🇩🇪", "💻", "✍️", "🧗"];

const COLOR_OPTIONS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

export function HabitDialogNew({ open, onClose, habit }: HabitDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(habit?.title || "");
  const [icon, setIcon] = useState(habit?.icon || "⭐");
  const [color, setColor] = useState(habit?.color || COLOR_OPTIONS[0]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (habit?.difficulty as "easy" | "medium" | "hard") || "medium"
  );
  const [cadence, setCadence] = useState<"daily" | "weekly">(habit?.cadence || "daily");
  const [targetPerWeek, setTargetPerWeek] = useState(habit?.targetPerWeek || 3);
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(habit?.linkedGoalId || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: open,
  });

  const activeGoals = goals.filter(g => g.currentValue < g.targetValue);
  const linkedGoal = activeGoals.find(g => g.id === linkedGoalId);

  if (!open) return null;

  const applyTemplate = (template: typeof QUICK_HABITS[0]) => {
    setTitle(template.title);
    setIcon(template.icon);
    setDifficulty(template.difficulty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const data = {
        userId: user.id,
        title,
        description: "",
        difficulty,
        icon,
        color,
        cadence,
        targetPerWeek: cadence === "weekly" ? targetPerWeek : null,
        linkedGoalId: linkedGoalId || null,
      };

      if (habit) {
        await apiRequest(`/api/habits/${habit.id}`, "PATCH", data);
      } else {
        await apiRequest("/api/habits", "POST", data);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      onClose();
    } catch (error: any) {
      alert("Failed to save habit: " + (error?.message || "Unknown error"));
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
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "#000" }}>
          {habit ? "Edit Habit" : "Create New Habit"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Quick Templates */}
          {!habit && (
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666", letterSpacing: "0.5px" }}>
                QUICK START
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {QUICK_HABITS.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: "12px 8px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#8B5CF6";
                      e.currentTarget.style.background = "#faf5ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{template.icon}</span>
                    <span style={{ fontSize: "11px", fontWeight: "500", color: "#666" }}>{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Icon */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
              What habit?
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "28px",
                  minWidth: "60px",
                  height: "60px",
                }}
              >
                {icon}
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Exercise, Read, Meditate"
                required
                autoFocus
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "16px",
                  outline: "none",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
              />
            </div>
          </div>

          {/* Link to Goal */}
          {activeGoals.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                <LinkIcon style={{ width: "14px", height: "14px", display: "inline", marginRight: "4px" }} />
                Link to goal (optional)
              </label>

              {linkedGoalId ? (
                <div
                  style={{
                    padding: "12px",
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    borderRadius: "12px",
                    border: "2px solid #3b82f6",
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setLinkedGoalId(null)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "4px",
                      border: "none",
                      background: "white",
                      borderRadius: "50%",
                      cursor: "pointer",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
                  </button>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e40af", marginBottom: "4px" }}>
                    🎯 {linkedGoal?.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                    +1 to goal on each completion
                  </div>
                  {linkedGoal && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", gap: "4px", fontSize: "12px", color: "#3b82f6", marginBottom: "4px" }}>
                        <span>{linkedGoal.currentValue} / {linkedGoal.targetValue} {linkedGoal.unit}</span>
                      </div>
                      <div style={{ height: "6px", background: "#dbeafe", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            background: "#3b82f6",
                            width: `${Math.min((linkedGoal.currentValue / linkedGoal.targetValue) * 100, 100)}%`,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <select
                  value={linkedGoalId || ""}
                  onChange={(e) => setLinkedGoalId(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#8B5CF6"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                >
                  <option value="">Choose a goal to link...</option>
                  {activeGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({goal.currentValue}/{goal.targetValue} {goal.unit})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Frequency & Difficulty */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                How often?
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setCadence("daily")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: cadence === "daily" ? "2px solid #8B5CF6" : "2px solid #e5e7eb",
                    borderRadius: "12px",
                    background: cadence === "daily" ? "#faf5ff" : "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setCadence("weekly")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: cadence === "weekly" ? "2px solid #8B5CF6" : "2px solid #e5e7eb",
                    borderRadius: "12px",
                    background: cadence === "weekly" ? "#faf5ff" : "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Difficulty
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: "easy" as const, label: "Easy", coins: 5 },
                  { value: "medium" as const, label: "Med", coins: 10 },
                  { value: "hard" as const, label: "Hard", coins: 15 },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      border: difficulty === option.value ? "2px solid #8B5CF6" : "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: difficulty === option.value ? "#faf5ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>{option.label}</div>
                    <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "500" }}>{option.coins}🪙</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {cadence === "weekly" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#000" }}>
                Times per week: <span style={{ color: "#8B5CF6" }}>{targetPerWeek}x</span>
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  outline: "none",
                  background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(targetPerWeek / 7) * 100}%, #e5e7eb ${(targetPerWeek / 7) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>
          )}

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: "100%",
              padding: "10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              color: "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: showAdvanced ? "16px" : "0",
            }}
          >
            {showAdvanced ? <ChevronUp style={{ width: "16px" }} /> : <ChevronDown style={{ width: "16px" }} />}
            {showAdvanced ? "Hide" : "Show"} icon & color options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                  ICON
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {ALL_ICONS.map((emojiIcon) => (
                    <button
                      key={emojiIcon}
                      type="button"
                      onClick={() => setIcon(emojiIcon)}
                      style={{
                        padding: "12px",
                        fontSize: "24px",
                        border: icon === emojiIcon ? "2px solid #8B5CF6" : "2px solid #e5e7eb",
                        borderRadius: "12px",
                        background: icon === emojiIcon ? "#faf5ff" : "white",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {emojiIcon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                  COLOR
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                  {COLOR_OPTIONS.map((colorOption) => (
                    <button
                      key={colorOption}
                      type="button"
                      onClick={() => setColor(colorOption)}
                      style={{
                        height: "40px",
                        border: color === colorOption ? "3px solid #000" : "2px solid #e5e7eb",
                        borderRadius: "12px",
                        background: colorOption,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
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
                fontSize: "15px",
                fontWeight: "600",
                color: "#6b7280",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2,
                padding: "14px",
                border: "none",
                borderRadius: "12px",
                background: submitting ? "#9ca3af" : "#8B5CF6",
                color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                boxShadow: submitting ? "none" : "0 4px 12px rgba(139, 92, 246, 0.3)",
              }}
            >
              {submitting ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
